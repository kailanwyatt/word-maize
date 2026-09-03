import { describe, expect, it } from 'vitest';
import { areAdjacent } from '../adjacency';
import { exposedKernels, kernelId, shuffleExposedLetters } from '../board';
import { validateWord, WORD_LIST } from '../dictionary';
import { canSpendEnergy, replenishEnergy } from '../energy';
import { harvestKernels, harvestPercent } from '../harvest';
import { findDiscoverablePath } from '../powerups';
import { wrapColumn, signedColumnOffset, snapRotation } from '../rotation';
import { coinsForWord, starsForLevel } from '../scoring';
import { extendSelection } from '../selection';
import { ENERGY_REGEN_MS, Kernel } from '../types';
import { LEVELS } from '../../data/levels';
import { nextDailyDay } from '../../store/types';

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

describe('selection', () => {
  const a = k('a', 0, 0), b = k('b', 0, 1), c = k('c', 0, 2);
  it('extends adjacent paths and prevents duplicates', () => {
    expect(extendSelection([a], b, 8)).toEqual([a, b]);
    expect(extendSelection([a, b], a, 8)).toEqual([a]);
    expect(extendSelection([a, b], b, 8)).toEqual([a, b]);
  });
  it('rejects non-adjacent extensions', () => expect(extendSelection([a], c, 8)).toEqual([a]));
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

describe('levels and powerup search', () => {
  it('ships fifteen Sweet Corn Fields boards', () => {
    expect(LEVELS).toHaveLength(15);
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
  it('shuffles only exposed letters', () => {
    const level = LEVELS[0];
    const shuffled = shuffleExposedLetters(level.kernels, () => 0.2);
    expect(shuffled.map(k => k.id)).toEqual(level.kernels.map(k => k.id));
    expect(kernelId(0, 0, 0)).toBe('0-0-0');
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
