import { describe, expect, it } from 'vitest';
import { exposedKernels, kernelsFromRows, underKernels } from '../board';
import { harvestPercent } from '../harvest';
import { advanceObstacles, blockedKernelIds, clearHarvestObstacles, frostProtectedIds, initializeObstacles, regrowEatenKernels, releaseWebAnchors, restoreObstacles, tickCaterpillars } from '../obstacles';

const kernels = kernelsFromRows(['CATS', 'RAIL', 'NOTE']);
const context = (wordIds: string[] = []) => ({ kernels, columns: 4, wordIds });

describe('distinct obstacle mechanics', () => {
  it('runs staggered caterpillar clocks independently of accepted words', () => {
    const initial = initializeObstacles([
      { id: 'a', kind: 'caterpillar', kernelId: '0-0-0', countdown: 20 },
      { id: 'b', kind: 'caterpillar', kernelId: '0-1-0', countdown: 27 },
    ]);
    expect(advanceObstacles(initial, [], context())[0].secondsRemaining).toBe(20);
    const tick = tickCaterpillars(initial, kernels, 20);
    expect(tick.eatenIds).toEqual(['0-0-0']);
    expect(tick.obstacles[1].secondsRemaining).toBe(7);
    expect(harvestPercent(tick.kernels)).toBe(0);
    expect(tickCaterpillars(tick.obstacles, tick.kernels, 30).eatenIds).toEqual(['0-1-0']);
    expect(initial[0].secondsRemaining).toBe(20);
  });

  it('eats only an exposed layer, reveals the next, and stops after one bite', () => {
    const layered = [...kernels, ...underKernels([{ row: 0, column: 0, letter: 'E' }])];
    const initial = initializeObstacles([{ id: 'a', kind: 'caterpillar', kernelId: '0-0-0', countdown: 1 }]);
    const tick = tickCaterpillars(initial, layered, 1);
    expect(exposedKernels(tick.kernels).some(k => k.id === '0-0-1')).toBe(true);
    expect(tickCaterpillars(tick.obstacles, tick.kernels, 100).eatenIds).toEqual([]);
    const hidden = initializeObstacles([{ id: 'b', kind: 'caterpillar', kernelId: '0-0-1', countdown: 1 }]);
    expect(tickCaterpillars(hidden, layered, 100).eatenIds).toEqual([]);
  });

  it('saves a caterpillar target harvested before expiry', () => {
    const initial = initializeObstacles([{ id: 'a', kind: 'caterpillar', kernelId: '0-0-0', countdown: 1 }]);
    const saved = advanceObstacles(initial, ['0-0-0'], context(['0-0-0']));
    expect(tickCaterpillars(saved, kernels, 100).eatenIds).toEqual([]);
  });

  it('drops a rotting kernel permanently without free regrow', () => {
    const initial = initializeObstacles([{ id: 'r', kind: 'rot', kernelId: '0-0-0', countdown: 30 }]);
    expect(initial[0].secondsRemaining).toBe(30);
    const saved = advanceObstacles(initial, ['0-0-0'], context(['0-0-0']));
    expect(tickCaterpillars(saved, kernels, 100).fallenIds).toEqual([]);
    const tick = tickCaterpillars(initial, kernels, 30);
    expect(tick.fallenIds).toEqual(['0-0-0']);
    expect(tick.eatenIds).toEqual([]);
    expect(tick.kernels.find(k => k.id === '0-0-0')).toMatchObject({ harvested: true });
    expect(tick.kernels.find(k => k.id === '0-0-0')?.eaten).toBeFalsy();
    expect(regrowEatenKernels(tick.kernels).find(k => k.id === '0-0-0')?.harvested).toBe(true);
    expect(harvestPercent(tick.kernels)).toBeGreaterThan(0);
  });

  it('returns crow targets after two further valid words', () => {
    let states = initializeObstacles([{ id: 'c', kind: 'crow', kernelId: '0-0-0', countdown: 2 }]);
    states = advanceObstacles(advanceObstacles(states, []), []);
    expect(blockedKernelIds(states).has('0-0-0')).toBe(true);
    states = advanceObstacles(states, []);
    expect(blockedKernelIds(states).has('0-0-0')).toBe(true);
    states = advanceObstacles(states, []);
    expect(blockedKernelIds(states).size).toBe(0);
  });

  it('releases exactly one squirrel target per long word', () => {
    const states = initializeObstacles([
      { id: 'a', kind: 'squirrel', kernelId: '0-0-0', countdown: 0 },
      { id: 'b', kind: 'squirrel', kernelId: '0-1-0', countdown: 0 },
    ]);
    expect(blockedKernelIds(advanceObstacles(states, [], context(['1', '2', '3', '4']))).size).toBe(2);
    expect(blockedKernelIds(advanceObstacles(states, [], context(['1', '2', '3', '4', '5']))).size).toBe(1);
  });

  it('cuts weeds across the cylindrical seam and limits total growth', () => {
    const initial = initializeObstacles([{ id: 'w', kind: 'weed', kernelId: '0-0-0', countdown: 3 }]);
    expect(advanceObstacles(initial, ['0-3-0'], context())[0].status).toBe('cleared');
    let grown = initial;
    for (let turn = 0; turn < 15; turn++) grown = advanceObstacles(grown, [], context());
    expect(grown).toHaveLength(3);
    expect(new Set(grown.map(s => s.kernelId)).size).toBe(3);
    expect(initial).toHaveLength(1);
    expect(initial[0].turnsRemaining).toBe(3);
  });

  it('releases web targets only after all anchors are harvested, including picker harvests', () => {
    const initial = initializeObstacles([{ id: 'w', kind: 'web', kernelId: '1-0-0', countdown: 0, anchorIds: ['0-0-0', '0-1-0'] }]);
    const partial = advanceObstacles(initial, ['0-0-0'], context());
    expect(partial[0].anchorIds).toEqual(['0-1-0']);
    expect(blockedKernelIds(partial).size).toBe(1);
    expect(blockedKernelIds(releaseWebAnchors(partial, ['0-1-0'])).size).toBe(0);
  });

  it('keeps frost selectable and protects its kernel until enough successful uses', () => {
    let states = initializeObstacles([{ id: 'f', kind: 'frost', kernelId: '0-0-0', countdown: 0, strength: 2 }]);
    expect(blockedKernelIds(states).size).toBe(0);
    expect(frostProtectedIds(states).has('0-0-0')).toBe(true);
    states = advanceObstacles(states, [], context(['0-0-0', '0-1-0', '0-2-0']));
    expect(states[0].strength).toBe(1);
    states = advanceObstacles(states, [], context(['0-0-0', '0-1-0', '0-2-0']));
    expect(frostProtectedIds(states).size).toBe(0);
  });

  it('regrows eaten letters without resetting genuinely harvested kernels', () => {
    const initial = initializeObstacles([{ id: 'a', kind: 'caterpillar', kernelId: '0-0-0', countdown: 1 }]);
    const tick = tickCaterpillars(initial, kernels.map(k => k.id === '0-1-0' ? { ...k, harvested: true } : k), 1);
    const restored = regrowEatenKernels(tick.kernels);
    expect(restored.find(k => k.id === '0-0-0')).toMatchObject({ harvested: false, eaten: false });
    expect(restored.find(k => k.id === '0-1-0')?.harvested).toBe(true);
    expect(harvestPercent(restored)).toBe(harvestPercent(tick.kernels));
  });

  it('picker harvests cut nearby weeds without advancing crow turns', () => {
    const initial = initializeObstacles([
      { id: 'w', kind: 'weed', kernelId: '0-0-0', countdown: 3 },
      { id: 'c', kind: 'crow', kernelId: '1-0-0', countdown: 2 },
    ]);
    const cleared = clearHarvestObstacles(initial, ['0-3-0'], kernels, 4);
    expect(cleared[0].status).toBe('cleared');
    expect(cleared[1].turnsRemaining).toBe(2);
  });

  it('preserves saved timers and migrates old metadata', () => {
    const authored = [{ id: 'a', kind: 'caterpillar' as const, kernelId: '0-0-0', countdown: 20 }];
    const saved = tickCaterpillars(initializeObstacles(authored), kernels, 7).obstacles;
    expect(restoreObstacles(authored, JSON.parse(JSON.stringify(saved)))[0].secondsRemaining).toBe(13);
    expect(restoreObstacles(authored, [{ ...authored[0], countdown: 3, turnsRemaining: 1, status: 'active' }])[0].secondsRemaining).toBe(20);
  });
});
