import { describe, expect, it } from 'vitest';
import { areAdjacent } from '../adjacency';
import { exposedKernels, kernelId, resetLevel, shuffleExposedLetters } from '../board';
import { validateWord, WORD_LIST } from '../dictionary';
import { canSpendEnergy, replenishEnergy } from '../energy';
import { CHAPTER_TITLES, chapterHarvests, chapterIndexForLevel, chapterStarCount, chapterSummary, farmQuote, isChapterUnlocked, secondaryObjective } from '../campaign';
import { farmerPhrase, farmerTalkName, personalizeFarmerCopy } from '../farmerCopy';
import { SHOP_PRODUCTS, COIN_TOOL_OFFERS, TOOL_INFO, validateShopProducts, validateCoinOffers } from '../../data/shop';
import { EMPTY_INVENTORY, addToInventory, clampInventoryAmount, completionReward, fairPuzzleCoins, mazeClearCoins, purchaseCoinOffer } from '../economy';
import { hitKernel } from '../../components/CornCob/layout';
import { classifyMovement, fieldDoubleTap, fieldPointerRelease, fieldWalkStick, resolvePointerRelease } from '../gestures';
import { harvestKernels, harvestPercent } from '../harvest';
import { findDiscoverablePath } from '../powerups';
import { wrapColumn, signedColumnOffset, snapRotation, rotationFromDrag, finishRotation, nearestRotationTarget, stepRotation, degreesPerColumn } from '../rotation';
import { coinsForWord, starsForLevel } from '../scoring';
import { canSubmitSelection, evaluateSubmission, tapKernel } from '../selection';
import { ENERGY_REGEN_MS, Kernel, MAZE_TOOL_IDS } from '../types';
import { CORN_EDUCATIONAL_FACTS, cornMechanicCountForLevel, isLevelUnlocked, LEVELS } from '../../data/levels';
import { migrateSave, nextDailyDay, SAVE_VERSION } from '../../store/types';
import { validateLevels } from '../levelValidation';
import { evaluateLevelStars, objectiveComplete, starGoalComplete } from '../scoring';
import { advanceObstacles, blockedKernelIds, clearObstacle, initializeObstacles } from '../obstacles';
import { weatherCoinBonus, weatherLabel, windStep } from '../weather';
import { claimableRestorationMilestone, completedRestorationStage, nextRestorationMilestone, RESTORATION_MILESTONES } from '../restoration';
import { endlessDifficulty, generateEndlessLevel } from '../endless';
import { advancePopCharge, dormantKernelIds, festivalCoinBonus, isMoonlitHidden, reducePopCharge, resolveFlintHarvest, restoreCornVarietyState, restoreFlintState, restorePopCharge, wakeDormantNeighbors } from '../cornVarieties';

const k = (id: string, row: number, column: number, layer = 0): Kernel => ({
  id, row, column, layer, letter: id[0].toUpperCase(), harvested: false, variety: 'sweet',
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

describe("Frankland's Corn Fields progression", () => {
  it('keeps all ten authored boards deterministic and valid', () => {
    const chapter = LEVELS.slice(0, 10);
    expect(chapter).toHaveLength(10);
    expect(chapter[0].shuffleOnStart).toBe(false);
    expect(chapter.slice(1).every(level => level.shuffleOnStart)).toBe(true);
    expect(chapter[1].tutorial.join(' ')).toMatch(/rotate/i);
    expect(chapter[4].starGoals.some(goal => goal.kind === 'firstWordWithinSeconds')).toBe(true);
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

  it('awards the sun-clock star only when the first word beats the clock', () => {
    const level = LEVELS[4];
    const clock = level.starGoals.find(goal => goal.kind === 'firstWordWithinSeconds')!;
    const base = { percent: 70, words: ['ORCHARD'], toolsUsed: 0, layersRevealed: 0 };
    expect(starGoalComplete(clock, { ...base, firstWordMs: 12_000 })).toBe(true);
    expect(starGoalComplete(clock, { ...base, firstWordMs: 50_000 })).toBe(false);
    expect(starGoalComplete(clock, { ...base, firstWordMs: null })).toBe(false);
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

describe('field drag versus tap', () => {
  it('keeps a short press as a plant tap and a swipe as a walk', () => {
    expect(fieldPointerRelease(4, 6, 120)).toBe('tap');
    expect(fieldPointerRelease(40, 8, 120)).toBe('walk');
    expect(fieldPointerRelease(2, 2, 400)).toBe('walk');
  });

  it('turns a field drag into a stick once it clears the slop', () => {
    expect(fieldWalkStick(4, 0)).toEqual({ x: 0, y: 0 });
    const right = fieldWalkStick(48, 0);
    expect(right.x).toBeGreaterThan(0.9);
    expect(right.y).toBe(0);
  });

  it('counts a second nearby tap as a harvest double-tap', () => {
    expect(fieldDoubleTap(10, 10, 200, { x: 12, y: 11, at: 40 })).toBe(true);
    expect(fieldDoubleTap(10, 10, 200, { x: 80, y: 11, at: 40 })).toBe(false);
    expect(fieldDoubleTap(10, 10, 500, { x: 12, y: 11, at: 40 })).toBe(false);
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
  it('accepts curated, farm, and common English words', () => {
    expect(validateWord('corn').valid).toBe(true);
    expect(validateWord('harvest').valid).toBe(true);
    expect(WORD_LIST.has('MAIZE')).toBe(true);
    expect(validateWord('barley').valid).toBe(true);
    expect(validateWord('oats').valid).toBe(true);
    expect(validateWord('rye').valid).toBe(true);
    expect(validateWord('popcorn').valid).toBe(true);
    expect(validateWord('tomato').valid).toBe(true);
    expect(validateWord('sunflower').valid).toBe(true);
    expect(validateWord('watermelon').valid).toBe(true);
    expect(WORD_LIST.size).toBeGreaterThan(20000);
  });
  it('rejects unknown and short words', () => {
    expect(validateWord('xyz').valid).toBe(false);
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
    expect(coinsForWord('HAY')).toBe(15);
    expect(coinsForWord('HARVEST')).toBeGreaterThan(coinsForWord('CORN'));
  });
});

describe('economy policy', () => {
  it('awards authored and performance bonuses only on the first clear', () => {
    const first = completionReward({ wordCoins: 90, levelReward: 100, harvestPercent: 55, harvestTarget: 45, firstClear: true });
    const replay = completionReward({ wordCoins: 90, levelReward: 100, harvestPercent: 55, harvestTarget: 45, firstClear: false });
    expect(first).toMatchObject({ wordCoins: 90, firstClearCoins: 100, performanceCoins: 70, total: 260 });
    expect(replay).toMatchObject({ wordCoins: 90, firstClearCoins: 0, performanceCoins: 0, total: 90 });
  });

  it('doubles the eligible payout exactly once', () => {
    expect(completionReward({ wordCoins: 40, levelReward: 100, harvestPercent: 45, harvestTarget: 45, firstClear: true, doubled: true }).total).toBe(380);
  });

  it('pays maze first-clear coins by chapter and storm ribbon', () => {
    expect(mazeClearCoins(1)).toBe(50);
    expect(mazeClearCoins(4)).toBe(70);
    expect(mazeClearCoins(6)).toBe(90);
    expect(mazeClearCoins(8, true)).toBe(140);
    expect(fairPuzzleCoins(true)).toBe(40);
    expect(fairPuzzleCoins(false)).toBe(20);
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
  it('assigns the six corn varieties in their planned campaign ranges', () => {
    expect(LEVELS.map(level => level.cornType).filter((type, index, all) => index === 0 || type !== all[index - 1]))
      .toEqual(['sweet', 'white', 'flint', 'popcorn', 'blue', 'golden']);
    expect(LEVELS.find(level => level.id === 12)?.cornType).toBe('sweet');
    expect(LEVELS.find(level => level.id === 13)?.cornType).toBe('white');
    expect(LEVELS.find(level => level.id === 21)?.cornType).toBe('flint');
    expect(LEVELS.find(level => level.id === 31)?.cornType).toBe('popcorn');
    expect(LEVELS.find(level => level.id === 41)?.cornType).toBe('blue');
    expect(LEVELS.find(level => level.id === 51)?.cornType).toBe('golden');
    LEVELS.forEach(level => expect(level.kernels.every(kernel => kernel.variety === level.cornType)).toBe(true));
  });
  it('unlocks the next field after a completed harvest', () => {
    expect(isLevelUnlocked(1, [])).toBe(true);
    expect(isLevelUnlocked(2, [])).toBe(false);
    expect(isLevelUnlocked(2, [1])).toBe(true);
    expect(isLevelUnlocked(60, [], true)).toBe(true);
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

describe('tutorial clarity and campaign balance', () => {
  it('introduces each special corn with one short fact and its mechanic', () => {
    const introductions = [
      [1, /sweet corn/i],
      [13, /white corn/i],
      [21, /flint corn/i],
      [31, /popcorn/i],
      [41, /blue corn/i],
      [51, /golden-yellow corn/i],
    ] as const;
    introductions.forEach(([id, factPattern]) => {
      const level = LEVELS.find(item => item.id === id)!;
      expect(level.educationalFact).toBe(CORN_EDUCATIONAL_FACTS[id]);
      expect(level.educationalFact).toMatch(factPattern);
      expect(level.tutorial.length).toBeGreaterThan(0);
    });
    expect(LEVELS.find(level => level.id === 41)?.educationalFact).toMatch(/indigo-purple|anthocyanin/i);
  });

  it('introduces one obstacle family at a time before combining them', () => {
    const firstObstacleLevel = (kind: string) => LEVELS.find(level => level.obstacles.some(obstacle => obstacle.kind === kind))?.id;
    expect(firstObstacleLevel('caterpillar')).toBe(8);
    expect(firstObstacleLevel('rot')).toBe(9);
    expect(firstObstacleLevel('crow')).toBe(16);
    expect(firstObstacleLevel('squirrel')).toBe(20);
    expect(firstObstacleLevel('weed')).toBe(32);
    expect(firstObstacleLevel('web')).toBe(36);
    expect(firstObstacleLevel('frost')).toBe(48);
    expect(LEVELS.find(level => level.id === 31)?.obstacles).toHaveLength(0);
    expect(LEVELS.find(level => level.id === 32)?.tutorial.join(' ')).toMatch(/Butter Brush/i);
  });

  it('teaches every tool before or when its specialized counter appears', () => {
    expect(LEVELS.find(level => level.id === 3)?.tutorial.join(' ')).toMatch(/Corn Picker/i);
    expect(LEVELS.find(level => level.id === 6)?.tutorial.join(' ')).toMatch(/Scarecrow/i);
    expect(LEVELS.find(level => level.id === 8)?.tutorial.join(' ')).toMatch(/Butter Brush/i);
    expect(TOOL_INFO.scarecrow.blurb).toMatch(/crow/i);
    expect(TOOL_INFO.butterBrush.blurb).toMatch(/weeds|pests|webs|frost/i);
    expect(TOOL_INFO.cornPicker.blurb).toMatch(/kernel/i);
  });

  it('gives special-corn introductions a forgiving goal before difficulty rises', () => {
    for (const [intro, followup] of [[21, 25], [31, 35], [41, 45], [51, 55]] as const) {
      const first = LEVELS.find(level => level.id === intro)!;
      const later = LEVELS.find(level => level.id === followup)!;
      expect(first.objective.harvestPercent).toBeLessThanOrEqual(later.objective.harvestPercent);
      expect(first.objective.minLongestWord ?? 0).toBeLessThanOrEqual(5);
    }
  });

  it('keeps first-clear rewards and coin tool prices inside the intended economy bands', () => {
    const lateRewards = LEVELS.filter(level => level.id >= 11).map(level => level.rewardCoins);
    expect(Math.min(...lateRewards)).toBeGreaterThanOrEqual(200);
    expect(Math.max(...lateRewards)).toBeLessThanOrEqual(450);
    expect(COIN_TOOL_OFFERS.slice(0, 3).map(offer => offer.coins)).toEqual([220, 280, 340]);
    expect(COIN_TOOL_OFFERS[3].coins).toBeLessThan(220 + 280 + 340);
  });
});

describe('White Corn neighbor reveal', () => {
  const white = (id: string, row: number, column: number, dormant = false): Kernel => ({
    ...k(id, row, column), variety: 'white', dormant,
  });

  it('wakes vertically and cylindrically adjacent sleeping kernels', () => {
    const harvested = { ...white('a', 2, 0), harvested: true };
    const above = white('b', 1, 0, true);
    const acrossSeam = white('c', 2, 7, true);
    const far = white('d', 4, 4, true);
    const next = wakeDormantNeighbors([harvested, above, acrossSeam, far], ['a'], 8);
    expect(dormantKernelIds(next)).toEqual(new Set(['d']));
  });

  it('restores awakened state from harvested positions in a saved run', () => {
    const harvested = { ...white('a', 2, 0), harvested: true };
    const sleeping = white('b', 2, 1, true);
    expect(dormantKernelIds(restoreCornVarietyState([harvested, sleeping], 8))).toEqual(new Set());
  });

  it('ramps sleeping kernels gradually across White Corn levels', () => {
    const whiteLevels = LEVELS.filter(level => level.cornType === 'white');
    expect(whiteLevels.map(level => dormantKernelIds(level.kernels).size)).toEqual([1, 2, 2, 3, 3, 3, 3, 3]);
    expect(LEVELS.filter(level => level.cornType !== 'white').every(level => dormantKernelIds(level.kernels).size === 0)).toBe(true);
    expect(LEVELS.find(level => level.id === 13)?.tutorial.join(' ')).toMatch(/sleeping kernels/i);
  });
});

describe('Flint Corn armor', () => {
  const flint = (id: string, row: number, column: number, armored = false, cracked = false): Kernel => ({
    ...k(id, row, column), variety: 'flint', armored, cracked,
  });

  it('cracks armor on first use while harvesting ordinary kernels', () => {
    const armored = flint('a', 0, 0, true);
    const ordinary = flint('b', 0, 1);
    const result = resolveFlintHarvest([armored, ordinary], ['a', 'b']);
    expect(result.newlyCrackedIds).toEqual(['a']);
    expect(result.harvestIds).toEqual(['b']);
    expect(result.kernels.find(kernel => kernel.id === 'a')?.cracked).toBe(true);
  });

  it('harvests an armored kernel on its second accepted-word use', () => {
    const cracked = flint('a', 0, 0, true, true);
    const result = resolveFlintHarvest([cracked], ['a']);
    expect(result.newlyCrackedIds).toEqual([]);
    expect(result.harvestIds).toEqual(['a']);
  });

  it('restores cracked armor and ramps Flint difficulty', () => {
    expect(restoreFlintState([flint('a', 0, 0, true)], ['a'])[0].cracked).toBe(true);
    const flintLevels = LEVELS.filter(level => level.cornType === 'flint');
    expect(flintLevels.map(level => level.kernels.filter(kernel => kernel.armored).length)).toEqual([2, 3, 3, 4, 4, 4, 5, 5, 5, 5]);
    expect(LEVELS.find(level => level.id === 21)?.tutorial.join(' ')).toMatch(/armored kernels/i);
  });
});

describe('Popcorn charge', () => {
  const popcorn = (id: string, row: number, column: number, charge = 0, marked = true): Kernel => ({
    ...k(id, row, column), variety: 'popcorn', popKernel: marked, popCharge: charge,
  });

  it('charges marked kernels on accepted words and pops at three', () => {
    const charged = advancePopCharge([popcorn('a', 1, 2, 1)], 8);
    expect(charged.kernels[0].popCharge).toBe(2);
    expect(charged.poppedIds).toEqual([]);
    const popped = advancePopCharge(charged.kernels, 8);
    expect(popped.kernels[0].popCharge).toBe(0);
    expect(popped.poppedIds).toEqual(['a']);
  });

  it('pops the next cylindrical neighbor and reduces charge after a miss', () => {
    const marked = popcorn('a', 2, 7, 2);
    const seamNeighbor = popcorn('b', 2, 0, 0, false);
    const popped = advancePopCharge([marked, seamNeighbor], 8);
    expect(new Set(popped.poppedIds)).toEqual(new Set(['a', 'b']));
    expect(reducePopCharge([popcorn('c', 1, 1, 2)])[0].popCharge).toBe(1);
  });

  it('restores charge and ramps Popcorn difficulty', () => {
    expect(restorePopCharge([popcorn('a', 0, 0)], { a: 2 })[0].popCharge).toBe(2);
    const popcornLevels = LEVELS.filter(level => level.cornType === 'popcorn');
    expect(popcornLevels.map(level => level.kernels.filter(kernel => kernel.popKernel).length)).toEqual([2, 3, 3, 3, 4, 4, 4, 4, 4, 4]);
    expect(LEVELS.find(level => level.id === 31)?.tutorial.join(' ')).toMatch(/charge after every valid word/i);
  });
});

describe('Blue Corn moonlit letters', () => {
  const moonlit: Kernel = { ...k('m', 2, 2), variety: 'blue', moonlit: true };

  it('hides marked letters at the side and reveals them in the center or with a hint', () => {
    expect(isMoonlitHidden(moonlit, 0.8)).toBe(true);
    expect(isMoonlitHidden(moonlit, 0.2)).toBe(false);
    expect(isMoonlitHidden(moonlit, 0.8, true)).toBe(false);
    expect(isMoonlitHidden({ ...moonlit, moonlit: false }, 0.8)).toBe(false);
  });

  it('ramps moonlit kernels across Blue Corn levels', () => {
    const blueLevels = LEVELS.filter(level => level.cornType === 'blue');
    expect(blueLevels.map(level => level.kernels.filter(kernel => kernel.moonlit).length)).toEqual([2, 4, 4, 4, 6, 6, 6, 6, 6, 6]);
    expect(LEVELS.find(level => level.id === 41)?.tutorial.join(' ')).toMatch(/bright center/i);
  });
});

describe('Golden Corn festival kernels', () => {
  const festival = (id: string, marked = true): Kernel => ({ ...k(id, 0, 0), variety: 'golden', festival: marked });

  it('rewards marked kernels only in words of five or more letters', () => {
    const kernels = [festival('a'), festival('b'), festival('c', false)];
    expect(festivalCoinBonus(kernels, ['a', 'b', 'c'], 'CORN')).toBe(0);
    expect(festivalCoinBonus(kernels, ['a', 'b', 'c'], 'GRAIN')).toBe(10);
    expect(festivalCoinBonus(kernels, ['c'], 'GRAIN')).toBe(0);
  });

  it('ramps festival kernels across Golden Corn levels', () => {
    const goldenLevels = LEVELS.filter(level => level.cornType === 'golden');
    expect(goldenLevels.map(level => level.kernels.filter(kernel => kernel.festival).length)).toEqual([2, 3, 3, 3, 4, 4, 4, 5, 5, 5]);
    expect(LEVELS.find(level => level.id === 51)?.tutorial.join(' ')).toMatch(/gold star/i);
  });

  it('exposes the authored mechanic intensity used by level validation and generation', () => {
    expect([12, 13, 16, 21, 27, 31, 35, 41, 45, 51, 58, 60].map(cornMechanicCountForLevel))
      .toEqual([0, 1, 3, 2, 5, 2, 4, 2, 6, 2, 5, 5]);
  });
});

describe('Endless Harvest generation', () => {
  it('generates the same validated cob for the same seed and stage', () => {
    const first = generateEndlessLevel('harvest-2026', 7, LEVELS);
    const second = generateEndlessLevel('harvest-2026', 7, LEVELS);
    expect(first).toEqual(second);
    expect(validateLevels([first])).toEqual([]);
  });

  it('cycles through every corn variety and remains valid across a long run', () => {
    const generated = Array.from({ length: 36 }, (_, index) => generateEndlessLevel('test-run', index + 1, LEVELS));
    expect(generated.slice(0, 6).map(level => level.cornType)).toEqual(['sweet', 'white', 'flint', 'popcorn', 'blue', 'golden']);
    expect(validateLevels(generated)).toEqual([]);
  });

  it('raises difficulty every three cobs while keeping a safe cap', () => {
    expect(endlessDifficulty(1).harvestPercent).toBe(58);
    expect(endlessDifficulty(3).harvestPercent).toBe(58);
    expect(endlessDifficulty(4).harvestPercent).toBe(60);
    expect(endlessDifficulty(100).harvestPercent).toBe(86);
  });
});

describe('farm obstacles', () => {
  it('introduces caterpillars in chapter one with a story beat', () => {
    const seven = LEVELS.find(level => level.id === 7)!;
    const eight = LEVELS.find(level => level.id === 8)!;
    expect(seven.obstacles).toHaveLength(0);
    expect(eight.obstacles.some(obstacle => obstacle.kind === 'caterpillar')).toBe(true);
    expect(eight.story?.title).toBe('Hungry Visitors');
    expect(eight.tutorial.join(' ')).toMatch(/Caterpillar/i);
    const nine = LEVELS.find(level => level.id === 9)!;
    expect(nine.obstacles).toEqual([expect.objectContaining({ kind: 'rot', countdown: 30 })]);
    expect(nine.tutorial.join(' ')).toMatch(/going bad|falls off/i);
  });

  it('counts down crows and blocks their kernel when they swoop', () => {
    let states = initializeObstacles([{ id: 'bug-1', kind: 'crow', kernelId: '0-0-0', countdown: 2 }]);
    states = advanceObstacles(states, []);
    expect(states[0]).toMatchObject({ turnsRemaining: 1, status: 'active' });
    states = advanceObstacles(states, []);
    expect(states[0]).toMatchObject({ turnsRemaining: 2, status: 'triggered' });
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

  it('treats webs as blockers while frost remains selectable in words', () => {
    const states = initializeObstacles([
      { id: 'web-1', kind: 'web', kernelId: '2-1-0', countdown: 0 },
      { id: 'frost-1', kind: 'frost', kernelId: '2-2-0', countdown: 0 },
    ]);
    expect(blockedKernelIds(states).has('2-1-0')).toBe(true);
    expect(blockedKernelIds(states).has('2-2-0')).toBe(false);
  });

  it('authors web and frost introductions on their planned levels', () => {
    expect(LEVELS.find(level => level.id === 36)?.obstacles.some(obstacle => obstacle.kind === 'web')).toBe(true);
    expect(LEVELS.find(level => level.id === 36)?.tutorial.join(' ')).toMatch(/spider web/i);
    expect(LEVELS.find(level => level.id === 48)?.obstacles.some(obstacle => obstacle.kind === 'frost')).toBe(true);
    expect(LEVELS.find(level => level.id === 48)?.tutorial.join(' ')).toMatch(/Frost coats one kernel/i);
  });
});

describe('turn-based weather', () => {
  it('alternates deterministic wind steps at its configured interval', () => {
    const weather = { kind: 'wind' as const, interval: 2 };
    expect(windStep(weather, 1)).toBe(0);
    expect(windStep(weather, 2)).toBe(1);
    expect(windStep(weather, 4)).toBe(-1);
  });

  it('awards rain coins by word length and exposes a player-facing label', () => {
    const weather = { kind: 'rain' as const, interval: 2, coinBonusPerLetter: 1 };
    expect(weatherCoinBonus(weather, 'HARVEST')).toBe(7);
    expect(weatherLabel(weather)).toBe('RAIN BONUS');
  });

  it('rewards long drought words and gives storms deterministic rotation beats', () => {
    const drought = { kind: 'drought' as const, interval: 1 };
    const storm = { kind: 'storm' as const, interval: 2 };
    expect(weatherCoinBonus(drought, 'CORN')).toBe(0);
    expect(weatherCoinBonus(drought, 'FIELD')).toBe(5);
    expect(weatherLabel(drought)).toMatch(/DROUGHT/);
    expect(windStep(storm, 1)).toBe(0);
    expect(windStep(storm, 2)).toBe(1);
    expect(weatherLabel(storm)).toMatch(/STORM/);
  });

  it('declares weather in authored level data before gameplay', () => {
    expect(LEVELS.find(level => level.id === 38)?.weather?.kind).toBe('rain');
    expect(LEVELS.find(level => level.id === 47)?.weather?.kind).toBe('wind');
    expect(LEVELS.find(level => level.id === 37)?.weather?.kind).toBe('drought');
    expect(LEVELS.find(level => level.id === 54)?.weather?.kind).toBe('storm');
    expect(LEVELS.find(level => level.id === 47)?.tutorial.join(' ')).toMatch(/Wind rotates/i);
  });

  it('keeps mastery levels readable with no more than two obstacle families', () => {
    const mastery = LEVELS.filter(level => level.id >= 46);
    expect(mastery.every(level => new Set(level.obstacles.map(obstacle => obstacle.kind)).size <= 2)).toBe(true);
    expect(LEVELS.find(level => level.id === 54)?.obstacles.map(obstacle => obstacle.kind)).toEqual(['crow', 'frost']);
    expect(LEVELS.find(level => level.id === 59)?.obstacles.map(obstacle => obstacle.kind)).toEqual(['crow', 'web']);
    expect(LEVELS.find(level => level.id === 60)?.weather?.kind).toBe('storm');
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

describe('farm restoration progression', () => {
  it('unlocks projects at deterministic level milestones', () => {
    expect(completedRestorationStage([1, 2])).toBe(0);
    expect(claimableRestorationMilestone([1, 2, 3], [])?.id).toBe('lower-field');
    expect(completedRestorationStage([3, 6, 10, 12, 15])).toBe(5);
    expect(RESTORATION_MILESTONES.some(milestone => milestone.requiredLevel === 30)).toBe(true);
    expect(RESTORATION_MILESTONES.some(milestone => milestone.requiredLevel === 60)).toBe(true);
  });

  it('advances to the next unclaimed project without duplicating rewards', () => {
    expect(nextRestorationMilestone([3, 6], ['lower-field'])?.id).toBe('farm-road');
    expect(claimableRestorationMilestone([3, 6], ['lower-field'])?.id).toBe('farm-road');
    expect(claimableRestorationMilestone([3, 6], ['lower-field', 'farm-road'])).toBeUndefined();
  });
});

describe('store catalog', () => {
  it('has unique purchasable products with valid grants and display prices', () => {
    expect(validateShopProducts()).toEqual([]);
    expect(SHOP_PRODUCTS.some(product => product.entitlement === 'ad_free')).toBe(true);
    expect(SHOP_PRODUCTS.filter(product => product.tools).length).toBeGreaterThanOrEqual(3);
  });

  it('lets harvested coins buy tools and refuses a short purse', () => {
    expect(validateCoinOffers()).toEqual([]);
    const offer = COIN_TOOL_OFFERS[0];
    const inventory = addToInventory(EMPTY_INVENTORY, { scarecrow: 1, mower: 2 });
    expect(purchaseCoinOffer(20, inventory, offer.coins, offer.tools).ok).toBe(false);
    expect(purchaseCoinOffer(offer.coins, inventory, offer.coins, offer.tools)).toEqual({
      ok: true,
      coins: 0,
      inventory: addToInventory(EMPTY_INVENTORY, { scarecrow: 2, mower: 2 }),
    });
  });

  it('buys a mower without wiping cob tools', () => {
    const offer = COIN_TOOL_OFFERS.find(item => item.id === 'coin-mower')!;
    const inventory = addToInventory(EMPTY_INVENTORY, { scarecrow: 3, butterBrush: 1, cornPicker: 2 });
    expect(purchaseCoinOffer(offer.coins, inventory, offer.coins, offer.tools)).toEqual({
      ok: true,
      coins: 0,
      inventory: addToInventory(EMPTY_INVENTORY, { scarecrow: 3, butterBrush: 1, cornPicker: 2, mower: 1 }),
    });
  });

  it('sells maze helpers, coin packs, and a field kit', () => {
    expect(SHOP_PRODUCTS.some(product => product.id === 'coin_sack' && product.coins === 500)).toBe(true);
    expect(SHOP_PRODUCTS.some(product => product.id === 'field_kit' && product.tools?.tractor === 1)).toBe(true);
    expect(TOOL_INFO.lantern.title).toBe('Lantern');
    expect(COIN_TOOL_OFFERS.some(offer => offer.tools.raincoat === 1 && offer.coins === 260)).toBe(true);
    expect(MAZE_TOOL_IDS.every(tool => COIN_TOOL_OFFERS.some(offer => offer.tools[tool] === 1 && Object.keys(offer.tools).length === 1))).toBe(true);
  });
});

describe('campaign hub and late harvests', () => {
  it("names the farm from the current chapter, not always Frankland's Corn Fields", () => {
    expect(chapterIndexForLevel(1)).toBe(0);
    expect(chapterIndexForLevel(16)).toBe(1);
    expect(chapterIndexForLevel(46)).toBe(3);
    expect(CHAPTER_TITLES[1]).toBe('CHAPTER TWO');
    expect(chapterHarvests([16, 17, 18], 1).clears).toBe(3);
    expect(isChapterUnlocked(0, [])).toBe(true);
    expect(isChapterUnlocked(1, [])).toBe(false);
    expect(isChapterUnlocked(1, [15])).toBe(true);
    expect(isChapterUnlocked(2, [15])).toBe(false);
    expect(isChapterUnlocked(2, [30])).toBe(true);
    expect(isChapterUnlocked(3, [], true)).toBe(true);
    expect(chapterStarCount({ 1: { stars: 3 }, 16: { stars: 2 } }, 0)).toBe(3);
    expect(chapterStarCount({ 1: { stars: 3 }, 16: { stars: 2 } }, 1)).toBe(2);
    expect(farmQuote({ levelId: 16, world: 'Cayon Creek', chapterComplete: false })).toMatch(/creek/i);
    expect(farmQuote({ levelId: 15, world: "Frankland's Corn Fields", chapterComplete: true })).toMatch(/Cayon Creek/);
    expect(farmQuote({ levelId: 1, world: "Frankland's Corn Fields", chapterComplete: false })).toContain("Farmer May's");
    expect(farmQuote({ levelId: 1, world: "Frankland's Corn Fields", chapterComplete: false, farmerName: 'Kurt' })).toContain("Kurt's");
    expect(chapterSummary(0)).toContain("Farmer May's");
    expect(chapterSummary(0, 'Kurt')).toBe("Wake Kurt's first farm.");
    expect(chapterSummary(0, 'Alexandria-Louise')).toBe('Wake your first farm.');
  });

  it('uses a profile name in Farmer May copy when it fits, and generic words when it does not', () => {
    expect(farmerPhrase('', 'nameplate')).toBe('FARMER MAY');
    expect(farmerPhrase('Kurt', 'nameplate')).toBe('KURT');
    expect(farmerPhrase('Alexandria-Louise', 'nameplate')).toBe('THE FARMER');
    expect(farmerPhrase('Kurt', 'speaker')).toBe('KURT');
    expect(farmerPhrase('Alexandria-Louise', 'speaker')).toBe('YOU');
    expect(farmerPhrase('Kurt', 'shop')).toBe("KURT'S");
    expect(farmerPhrase('Alexandria-Louise', 'shop')).toBe('YOUR');
    expect(farmerPhrase('James', 'possessive')).toBe("James'");
    expect(personalizeFarmerCopy("Farmer May’s first crop has gone quiet.", 'Kurt')).toBe("Kurt's first crop has gone quiet.");
    expect(personalizeFarmerCopy("Fresh rows begin growing beside Farmer May’s barn.", 'Alexandria-Louise')).toBe('Fresh rows begin growing beside your barn.');
    expect(farmerTalkName('', 'sprout')).toBe('SPROUT');
    expect(farmerTalkName('Kurt', 'nia')).toBe('KURT');
    expect(farmerTalkName('Alexandria-Louise', 'reed')).toBe('YOU');
  });

  it('gives levels 16-60 more than one kind of harvest goal', () => {
    const late = LEVELS.filter(level => level.id >= 16);
    const kinds = new Set(late.map(level => {
      if (level.objective.minLayersRevealed) return 'layers';
      if (level.objective.minWords && level.objective.minLongestWord) return 'combo';
      if (level.objective.minWords) return 'words';
      return 'longest';
    }));
    expect(kinds.size).toBeGreaterThanOrEqual(4);
    expect(new Set(late.map(level => level.objective.harvestPercent)).size).toBeGreaterThan(6);
    expect(late.some(level => !level.shuffleOnStart)).toBe(true);
    expect(secondaryObjective(LEVELS.find(level => level.id === 18)!).label).toBeTruthy();
  });
});

describe('save migration', () => {
  it('preserves progress while filling fields introduced by newer builds', () => {
    const migrated = migrateSave({ coins: 275, currentLevelId: 4, inventory: { scarecrow: 9 } });
    expect(migrated.version).toBe(SAVE_VERSION);
    expect(migrated.coins).toBe(275);
    expect(migrated.currentLevelId).toBe(4);
    expect(migrated.claimedRestorations).toEqual([]);
    expect(migrated.inventory).toEqual(addToInventory(EMPTY_INVENTORY, { scarecrow: 9, butterBrush: 2, cornPicker: 1, mower: 1 }));
    expect(migrated.seenLevelIntros).toEqual([]);
    expect(migrated.endlessHarvest).toEqual({ bestStage: 0, active: null });
    expect(migrated.maze).toEqual({ runs: {}, rewardedIds: [], unlockedIds: ['sunny-acres-corn'], ribbons: {}, scores: {}, pendingSync: [], freePlay: null });
    expect(migrated.fair).toEqual({ rewardedIds: [], popAWordBest: null });
    expect(migrated.seenStoryBeatIds).toEqual([]);
    expect(migrated.seenToolHelp).toEqual([]);
    expect(migrated.settings.skipStory).toBe(false);
    expect(migrated.settings.devUnlock).toBe(false);
    expect(migrated.settings.showMazePad).toBe(false);
    expect(migrated.settings.mazeFarmer).toBe('may');
    expect(migrated.settings.farmerName).toBe('');
    expect(migrated.settings.language).toBe('en');
    expect(migrated.settings.freePlay).toEqual({ difficulty: 'easy', storms: true, mist: true, wildlife: true });
    expect(migrated.seenOnboarding).toBe(true);
    expect(migrated.seenModeHelp).toEqual({ maize: false, cob: false, crossword: false, twist: false, endless: false });
  });

  it('keeps a chosen farmer and a personal name, and rejects unknown farmer ids', () => {
    expect(migrateSave({ settings: { mazeFarmer: 'reed' } }).settings.mazeFarmer).toBe('reed');
    expect(migrateSave({ settings: { mazeFarmer: 'nia' } }).settings.mazeFarmer).toBe('nia');
    expect(migrateSave({ settings: { mazeFarmer: 'not-a-farmer' } }).settings.mazeFarmer).toBe('may');
    expect(migrateSave({ settings: { farmerName: '  Kurt!!  ' } }).settings.farmerName).toBe('Kurt');
  });

  it('preserves a valid endless harvest and sanitizes its counters', () => {
    const migrated = migrateSave({ endlessHarvest: { bestStage: 8.9, active: { seed: 'field-a', stage: 4.7, startedAt: 123 } } });
    expect(migrated.endlessHarvest).toEqual({ bestStage: 8, active: { seed: 'field-a', stage: 4, startedAt: 123 } });
  });

  it('recovers safely from unusable save data', () => {
    const migrated = migrateSave('damaged');
    expect(migrated.version).toBe(SAVE_VERSION);
    expect(migrated.currentLevelId).toBe(1);
    expect(migrated.levels).toEqual({});
    expect(migrated.seenOnboarding).toBe(false);
  });

  it('shows onboarding on a blank save and skips it when the farmer already played', () => {
    expect(migrateSave({}).seenOnboarding).toBe(false);
    expect(migrateSave({ seenTutorial: true }).seenOnboarding).toBe(true);
    expect(migrateSave({ settings: { farmerName: 'Kurt' } }).seenOnboarding).toBe(true);
    expect(migrateSave({ maze: { rewardedIds: ['sunny-acres-corn'] } }).seenOnboarding).toBe(true);
    const oldMaze = migrateSave({ maze: { rewardedIds: ['sunny-acres-corn'] } }).maze;
    expect(oldMaze.scores).toEqual({});
    expect(oldMaze.pendingSync).toEqual([]);
    expect(oldMaze.rewardedIds).toEqual(['sunny-acres-corn']);
  });

  it('keeps language and first-play help flags, and rejects unknown locales', () => {
    expect(migrateSave({ settings: { language: 'en' } }).settings.language).toBe('en');
    expect(migrateSave({ settings: { language: 'zz' } }).settings.language).toBe('en');
    expect(migrateSave({ seenModeHelp: { maize: true, cob: 'yes' } }).seenModeHelp).toEqual({
      maize: true, cob: false, crossword: false, twist: false, endless: false,
    });
    expect(migrateSave({ seenToolHelp: ['mower', 'nope'] }).seenToolHelp).toEqual(['mower']);
    expect(migrateSave({ fair: { rewardedIds: ['pop'], popAWordBest: { score: 120, wordsCompleted: 3, elapsedMs: 52_000, accuracy: 0.8, bestCombo: 4, at: 9 } } }).fair.popAWordBest).toEqual({
      score: 120, wordsCompleted: 3, elapsedMs: 52_000, accuracy: 0.8, bestCombo: 4, at: 9,
    });
  });
});
