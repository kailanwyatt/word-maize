import { describe, expect, it } from 'vitest';
import { areAdjacent } from '../adjacency';
import { exposedKernels, kernelId, resetLevel, shuffleExposedLetters } from '../board';
import { validateWord, WORD_LIST } from '../dictionary';
import { canSpendEnergy, replenishEnergy } from '../energy';
import { clampInventoryAmount, completionReward } from '../economy';
import { hitKernel } from '../../components/CornCob/layout';
import { classifyMovement, resolvePointerRelease } from '../gestures';
import { harvestKernels, harvestPercent } from '../harvest';
import { findDiscoverablePath } from '../powerups';
import { wrapColumn, signedColumnOffset, snapRotation, rotationFromDrag, finishRotation, nearestRotationTarget, stepRotation, degreesPerColumn } from '../rotation';
import { coinsForWord, starsForLevel } from '../scoring';
import { canSubmitSelection, evaluateSubmission, tapKernel } from '../selection';
import { ENERGY_REGEN_MS, Kernel } from '../types';
import { LEVELS } from '../../data/levels';
import { migrateSave, nextDailyDay, SAVE_VERSION } from '../../store/types';
import { validateLevels } from '../levelValidation';
import { evaluateLevelStars, objectiveComplete } from '../scoring';
import { advanceObstacles, blockedKernelIds, clearObstacle, initializeObstacles } from '../obstacles';

const k = (id: string, row: number, column: number, layer = 0): Kernel => ({
  id, row, column, layer, letter: id[0].toUpperCase(), harvested: false, variety: 'yellow',
});

describe('cylindrical adjacency', () => {
  it('accepts horizontal, vertical, diagonal, and seam neighbors', () => {
    const a = k('a', 2, 0);
    expect(areAdjacent(a, k('h', 2, 1), 8)).toBe(true);
    expect(areAdjacent(a, k('v', 3, 0), 8)).toBe(true);
    expect(areAdjacent(a, k('d', 3, 1), 8)).toBe(true);
    expect(areAdjacent(a, k('w', 2, 7), 8)).toBe(true);
  });
  it('rejects jumps', () => expect(areAdjacent(k('a', 0, 0), k('b', 2, 2), 8)).toBe(false));
});

describe('tap selection', () => {
  const a = k('a', 0, 0), b = k('b', 0, 1), c = k('c', 0, 2), d = k('d', 0, 3);
  const visible = (kernel: Kernel) => ({ kernel, visible: true });

  it('selects the first kernel', () => {
    expect(tapKernel([], visible(a), 8)).toEqual({ path: [a], accepted: true });
  });
  it('appends a visible kernel that is not a neighbor', () => {
    expect(tapKernel([a], visible(d), 8).path).toEqual([a, d]);
  });
  it('rejects a hidden kernel so you must rotate to hunt', () => {
    expect(tapKernel([a], { kernel: b, visible: false }, 8)).toMatchObject({ path: [a], accepted: false, reason: 'hidden' });
  });
  it('rejects a harvested kernel', () => {
    expect(tapKernel([], { kernel: { ...a, harvested: true }, visible: true }, 8)).toMatchObject({
      path: [],
      accepted: false,
      reason: 'harvested',
    });
  });
  it('prevents duplicate selection except through backtracking', () => {
    expect(tapKernel([a, b, c], visible(a), 8).path).toEqual([a]);
    expect(tapKernel([a, b], visible(c), 8).path).toEqual([a, b, c]);
  });
  it('undoes the final kernel when it is tapped again', () => {
    expect(tapKernel([a, b], visible(b), 8).path).toEqual([a]);
  });
  it('trims the path when an earlier selected kernel is tapped', () => {
    expect(tapKernel([a, b, c], visible(b), 8).path).toEqual([a, b]);
  });
  it('keeps the selected path when the cob rotates', () => {
    const path = tapKernel([a], visible(d), 8).path;
    const rotated = rotationFromDrag(1.5, 90, 0.016);
    expect(path).toEqual([a, d]);
    expect(tapKernel(path, visible(d), 8).path).toEqual([a]);
    expect(finishRotation(rotated, 8, 1)).toBeGreaterThanOrEqual(0);
  });
  it('lets a word continue onto a kernel that becomes selectable after rotation', () => {
    const front = k('f', 1, 0);
    const around = k('k', 1, 7);
    const path = tapKernel([], visible(front), 8).path;
    expect(tapKernel(path, visible(around), 8).path).toEqual([front, around]);
  });
  it('builds SEED from kernels that are not neighbors', () => {
    const s = k('s', 0, 0);
    const e1 = k('e1', 2, 4);
    const e2 = k('e2', 5, 7);
    const d = k('d', 6, 2);
    let path = tapKernel([], visible(s), 8).path;
    path = tapKernel(path, visible(e1), 8).path;
    path = tapKernel(path, visible(e2), 8).path;
    path = tapKernel(path, visible(d), 8).path;
    expect(path.map(kernel => kernel.letter).join('')).toBe('SEED');
  });
  it('keeps SEED and appends after a column step brings the next letters into view', () => {
    const s = k('s', 1, 0);
    const e1 = k('e1', 1, 1);
    const e2 = k('e2', 1, 2);
    const d = k('d', 1, 3);
    const c = k('c', 1, 4);
    const o = k('o', 1, 5);
    let path = tapKernel([], visible(s), 8).path;
    path = tapKernel(path, visible(e1), 8).path;
    path = tapKernel(path, visible(e2), 8).path;
    path = tapKernel(path, visible(d), 8).path;
    expect(path.map(kernel => kernel.letter).join('')).toBe('SEED');
    expect(stepRotation(1.5, 8, 1)).toBe(2.5);
    path = tapKernel(path, visible(c), 8).path;
    path = tapKernel(path, visible(o), 8).path;
    expect(path.map(kernel => kernel.letter).join('')).toBe('SEEDCO');
  });
  it('rejects taps on selected kernels that have rotated out of view', () => {
    expect(tapKernel([a, b], { kernel: b, visible: false }, 8)).toMatchObject({ path: [a, b], accepted: false, reason: 'hidden' });
  });
  it('ignores taps while selection is locked', () => {
    expect(tapKernel([a], visible(b), 8, { locked: true })).toMatchObject({ path: [a], accepted: false, reason: 'locked' });
  });
});

describe('Sweet Corn Fields progression', () => {
  it('keeps all ten authored boards deterministic and valid', () => {
    const chapter = LEVELS.slice(0, 10);
    expect(chapter).toHaveLength(10);
    expect(chapter.every(level => !level.shuffleOnStart)).toBe(true);
    expect(validateLevels(chapter)).toEqual([]);
  });

  it('validates every authored campaign level', () => {
    expect(validateLevels(LEVELS)).toEqual([]);
  });

  it('requires the primary objective before awarding stars', () => {
    const level = LEVELS[6];
    const incomplete = { percent: level.targetHarvestPercent, words: ['FIELD'], toolsUsed: 0, layersRevealed: 0 };
    expect(objectiveComplete(level, incomplete)).toBe(false);
    expect(evaluateLevelStars(level, incomplete).stars).toBe(0);
  });

  it('awards the completion star plus optional objective stars', () => {
    const level = LEVELS[0];
    const result = evaluateLevelStars(level, { percent: 65, words: ['SEED', 'CORN'], toolsUsed: 0, layersRevealed: 0 });
    expect(result).toEqual({ stars: 3, completedGoalIds: ['long-word-4', 'harvest-60'] });
  });
});

describe('kernel hit testing', () => {
  it('prefers the closer center when two tiles overlap', () => {
    const left = k('w', 0, 0);
    const right = k('z', 0, 1);
    const tiles = [
      { kernel: left, x: 50, y: 50, scaleX: 1, scale: 1, shade: 0 },
      { kernel: right, x: 70, y: 50, scaleX: 1, scale: 1, shade: 0 },
    ];
    expect(hitKernel({ x: 64, y: 50 }, tiles, 40, 1)?.id).toBe('z');
    expect(hitKernel({ x: 56, y: 50 }, tiles, 40, 1)?.id).toBe('w');
  });
  it('uses a tile-sized box so a tap between tiles does not grab the farther letter', () => {
    const left = k('w', 0, 0);
    const right = k('z', 0, 1);
    const tiles = [
      { kernel: left, x: 40, y: 40, scaleX: 1, scale: 1, shade: 0 },
      { kernel: right, x: 90, y: 40, scaleX: 1, scale: 1, shade: 0 },
    ];
    expect(hitKernel({ x: 65, y: 40 }, tiles, 40, 1)).toBeUndefined();
  });
  it('hits a tap on the corner of a tile that a circular radius would miss', () => {
    const letter = k('a', 0, 0);
    const tiles = [{ kernel: letter, x: 50, y: 50, scaleX: 1, scale: 1, shade: 0 }];
    expect(hitKernel({ x: 68, y: 68 }, tiles, 40, 1)?.id).toBe('a');
  });
});

describe('tap versus drag', () => {
  it('treats movement below the threshold as a tap', () => {
    expect(classifyMovement(12, 4, 18, 'pending')).toBe('pending');
    expect(resolvePointerRelease('pending', 12, 18)).toBe('tap');
  });
  it('starts rotation once horizontal movement crosses the threshold', () => {
    expect(classifyMovement(18, 2, 18, 'pending')).toBe('rotate');
    expect(resolvePointerRelease('pending', 18, 18)).toBe('rotate');
  });
  it('does not treat a vertical swipe as rotation', () => {
    expect(classifyMovement(4, 40, 18, 'pending')).toBe('pending');
    expect(resolvePointerRelease('pending', 4, 18)).toBe('tap');
  });
  it('keeps rotating after the threshold even if later movement is small', () => {
    expect(classifyMovement(2, 0, 18, 'rotate')).toBe('rotate');
    expect(resolvePointerRelease('rotate', 2, 18)).toBe('rotate');
  });
});

describe('word display submission', () => {
  const c = k('c', 0, 0), o = k('o', 0, 1), r = k('r', 0, 2), n = k('n', 0, 3);
  const x = k('x', 0, 0), y = k('y', 0, 1), z = k('z', 0, 2);

  it('pressing the word display harvests a valid word', () => {
    const result = evaluateSubmission([c, o, r, n]);
    expect(result).toMatchObject({ harvest: true, word: 'CORN' });
    if (!result.harvest) throw new Error('expected harvest');
    const next = harvestKernels([c, o, r, n], result.harvestIds);
    expect(next.filter(kernel => kernel.harvested).map(kernel => kernel.id)).toEqual(['c', 'o', 'r', 'n']);
  });
  it('prevents short-word submission', () => {
    expect(canSubmitSelection([c, o])).toBe(false);
    expect(evaluateSubmission([c, o])).toMatchObject({ harvest: false, reason: 'too-short', path: [c, o] });
  });
  it('rejects invalid words without harvesting', () => {
    const result = evaluateSubmission([x, y, z]);
    expect(result).toMatchObject({ harvest: false, path: [x, y, z], reason: 'not-found' });
    expect([x, y, z].every(kernel => !kernel.harvested)).toBe(true);
  });
  it('blocks submit while a harvest is already running', () => {
    expect(canSubmitSelection([c, o, r, n], { busy: true })).toBe(false);
    expect(evaluateSubmission([c, o, r, n], undefined, true)).toMatchObject({ harvest: false, reason: 'busy' });
  });
});

describe('harvest and layers', () => {
  const top = k('top', 0, 0, 0), under = k('under', 0, 0, 1), other = k('other', 0, 1);
  it('removes a kernel and exposes the next layer', () => {
    const next = harvestKernels([top, under, other], [top.id]);
    expect(next[0].harvested).toBe(true);
    expect(exposedKernels(next).find(x => x.id === 'under')).toBeTruthy();
  });
  it('calculates total harvest percentage', () =>
    expect(harvestPercent(harvestKernels([top, under, other], [top.id, other.id]))).toBe(67));
});

describe('dictionary', () => {
  it('accepts curated and bundled words', () => {
    expect(validateWord('corn').valid).toBe(true);
    expect(validateWord('harvest').valid).toBe(true);
    expect(WORD_LIST.has('MAIZE')).toBe(true);
  });
  it('rejects unknown and short words', () => {
    expect(validateWord('xyz')).toMatchObject({ valid: false, reason: 'not-found' });
    expect(validateWord('to')).toMatchObject({ valid: false, reason: 'too-short' });
  });
});

describe('rotation', () => {
  it('wraps columns and chooses signed offsets', () => {
    expect(wrapColumn(-1, 8)).toBe(7);
    expect(signedColumnOffset(7, 0, 8)).toBe(-1);
  });
  it('snaps to a usable column', () => expect(snapRotation(2.7, 1)).toBe(3));
  it('does not wrap while dragging so the cob can spin past the seam', () => {
    expect(rotationFromDrag(7.6, 40, 0.02)).toBeCloseTo(8.4);
  });
  it('animates snap across the seam instead of jumping backward', () => {
    expect(nearestRotationTarget(7.7, 0, 8)).toBe(8);
    expect(finishRotation(7.7, 8, 1)).toBe(8);
  });
  it('steps one column, which is 360 / columns degrees', () => {
    expect(degreesPerColumn(8)).toBe(45);
    expect(stepRotation(1.5, 8, 1)).toBe(2.5);
    expect(stepRotation(0, 8, -1)).toBe(-1);
  });
});

describe('energy and stars', () => {
  it('refuses to spend empty energy', () => expect(canSpendEnergy(0)).toBe(false));
  it('replenishes one unit after the regen window', () => {
    const now = 1_000_000;
    const next = replenishEnergy(3, now - ENERGY_REGEN_MS, now);
    expect(next.energy).toBe(4);
  });
  it('awards stars from harvest overshoot', () => {
    expect(starsForLevel(50, 70, 4)).toBe(0);
    expect(starsForLevel(70, 70, 4)).toBe(1);
    expect(starsForLevel(82, 70, 4)).toBe(2);
    expect(starsForLevel(95, 70, 4)).toBe(3);
  });
  it('pays more coins for longer words', () => {
    expect(coinsForWord('HAY')).toBe(30);
    expect(coinsForWord('HARVEST')).toBeGreaterThan(coinsForWord('CORN'));
  });
});

describe('economy policy', () => {
  it('awards authored and performance bonuses only on the first clear', () => {
    const first = completionReward({ wordCoins: 90, levelReward: 100, harvestPercent: 55, harvestTarget: 45, firstClear: true });
    const replay = completionReward({ wordCoins: 90, levelReward: 100, harvestPercent: 55, harvestTarget: 45, firstClear: false });
    expect(first).toMatchObject({ wordCoins: 90, firstClearCoins: 100, performanceCoins: 120, total: 310 });
    expect(replay).toMatchObject({ wordCoins: 90, firstClearCoins: 0, performanceCoins: 0, total: 90 });
  });

  it('doubles the eligible payout exactly once', () => {
    expect(completionReward({ wordCoins: 40, levelReward: 100, harvestPercent: 45, harvestTarget: 45, firstClear: true, doubled: true }).total).toBe(440);
  });

  it('keeps inventory grants within safe integer bounds', () => {
    expect(clampInventoryAmount(-3)).toBe(0);
    expect(clampInventoryAmount(1200)).toBe(999);
    expect(clampInventoryAmount(Number.NaN)).toBe(0);
  });
});

describe('levels and powerup search', () => {
  it('ships sixty boards across four campaign worlds', () => {
    expect(LEVELS).toHaveLength(60);
    expect(new Set(LEVELS.map(level => level.world)).size).toBe(4);
    expect(new Set(LEVELS.map(level => level.columns)).size).toBeGreaterThan(1);
    LEVELS.forEach(level => {
      expect(level.kernels.length).toBeGreaterThan(20);
      expect(level.rows).toBe(level.kernels.filter(k => k.layer === 0 && k.column === 0).length);
    });
  });
  it('finds a planted word on level 1', () => {
    const level = LEVELS[0];
    const path = findDiscoverablePath(level.kernels, level.columns, new Set(['SEED', 'CORN']), new Set(['S', 'SE', 'SEE', 'C', 'CO', 'COR']), [], level.hintPaths);
    expect(path?.map(k => k.letter).join('')).toMatch(/SEED|CORN/);
  });
  it('finds a dictionary word from scrambled letters', () => {
    const level = LEVELS[0];
    const scrambled = shuffleExposedLetters(level.kernels, () => 0.2);
    const path = findDiscoverablePath(scrambled, level.columns, new Set(['SEED', 'CORN', 'HAY']), new Set(), [], []);
    expect(path?.map(k => k.letter).join('')).toMatch(/SEED|CORN|HAY/);
  });
  it('shuffles only exposed letters', () => {
    const level = LEVELS[0];
    const shuffled = shuffleExposedLetters(level.kernels, () => 0.2);
    expect(shuffled.map(k => k.id)).toEqual(level.kernels.map(k => k.id));
    expect(kernelId(0, 0, 0)).toBe('0-0-0');
  });
  it('scrambles exposed letters when a level is reset', () => {
    const level = LEVELS[0];
    const reset = resetLevel({ ...level, shuffleOnStart: true }, () => 0.2);
    expect(reset.kernels.map(k => k.id)).toEqual(level.kernels.map(k => k.id));
    expect(reset.kernels.some((kernel, index) => kernel.letter !== level.kernels[index].letter)).toBe(true);
  });
});

describe('farm obstacles', () => {
  it('counts down moving pests and blocks their kernel when they trigger', () => {
    let states = initializeObstacles([{ id: 'bug-1', kind: 'caterpillar', kernelId: '0-0-0', countdown: 2 }]);
    states = advanceObstacles(states, []);
    expect(states[0]).toMatchObject({ turnsRemaining: 1, status: 'active' });
    states = advanceObstacles(states, []);
    expect(states[0]).toMatchObject({ turnsRemaining: 0, status: 'triggered' });
    expect(blockedKernelIds(states).has('0-0-0')).toBe(true);
  });

  it('clears an obstacle when its kernel is harvested', () => {
    const states = initializeObstacles([{ id: 'crow-1', kind: 'crow', kernelId: '1-2-0', countdown: 2 }]);
    expect(advanceObstacles(states, ['1-2-0'])[0].status).toBe('cleared');
  });

  it('blocks static obstacles until the matching tool clears them', () => {
    const states = initializeObstacles([{ id: 'weed-1', kind: 'weed', kernelId: '2-1-0', countdown: 0 }]);
    expect(blockedKernelIds(states).has('2-1-0')).toBe(true);
    expect(blockedKernelIds(clearObstacle(states, '2-1-0')).has('2-1-0')).toBe(false);
  });
});

describe('daily harvest calendar', () => {
  it('starts on day 1 and continues the next calendar day', () => {
    expect(nextDailyDay({ lastClaimDate: null, claimedDay: 0 }, '2026-09-02')).toEqual({ day: 1, alreadyClaimed: false });
    expect(nextDailyDay({ lastClaimDate: '2026-09-02', claimedDay: 1 }, '2026-09-02').alreadyClaimed).toBe(true);
    expect(nextDailyDay({ lastClaimDate: '2026-09-02', claimedDay: 1 }, '2026-09-03')).toEqual({ day: 2, alreadyClaimed: false });
    expect(nextDailyDay({ lastClaimDate: '2026-09-01', claimedDay: 3 }, '2026-09-03')).toEqual({ day: 1, alreadyClaimed: false });
  });
});

describe('save migration', () => {
  it('preserves progress while filling fields introduced by newer builds', () => {
    const migrated = migrateSave({ coins: 275, currentLevelId: 4, inventory: { scarecrow: 9 } });
    expect(migrated.version).toBe(SAVE_VERSION);
    expect(migrated.coins).toBe(275);
    expect(migrated.currentLevelId).toBe(4);
    expect(migrated.inventory).toEqual({ scarecrow: 9, butterBrush: 2, cornPicker: 3 });
    expect(migrated.seenLevelIntros).toEqual([]);
  });

  it('recovers safely from unusable save data', () => {
    const migrated = migrateSave('damaged');
    expect(migrated.version).toBe(SAVE_VERSION);
    expect(migrated.currentLevelId).toBe(1);
    expect(migrated.levels).toEqual({});
  });
});
