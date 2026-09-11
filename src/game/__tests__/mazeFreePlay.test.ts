import { describe, expect, it } from 'vitest';
import { MAZE_PUZZLES } from '../../data/mazeLevels';
import { applyFreePlayPrefs, defaultFreePlayPrefs, migrateFreePlayPrefs, pickFreePlayLevel } from '../mazeFreePlay';

describe('free play prefs', () => {
  it('defaults storms, mist, and wildlife on, and fills missing save fields', () => {
    expect(defaultFreePlayPrefs()).toEqual({ difficulty: 'easy', storms: true, mist: true, wildlife: true });
    expect(migrateFreePlayPrefs(undefined).storms).toBe(true);
    expect(migrateFreePlayPrefs({ difficulty: 'hard', storms: false, mist: false, wildlife: false })).toEqual({
      difficulty: 'hard', storms: false, mist: false, wildlife: false,
    });
    expect(migrateFreePlayPrefs({ difficulty: 'nope' }).difficulty).toBe('easy');
  });

  it('picks a board inside the chosen field band', () => {
    const easy = pickFreePlayLevel(MAZE_PUZZLES, { ...defaultFreePlayPrefs(), difficulty: 'easy' }, 0)!;
    const hard = pickFreePlayLevel(MAZE_PUZZLES, { ...defaultFreePlayPrefs(), difficulty: 'hard' }, 0)!;
    expect(easy.order).toBeGreaterThanOrEqual(1);
    expect(easy.order).toBeLessThanOrEqual(20);
    expect(hard.order).toBeGreaterThanOrEqual(51);
    expect(hard.order).toBeLessThanOrEqual(80);
  });

  it('strips storm, mist, and wildlife when those prefs are off', () => {
    const storm = MAZE_PUZZLES.find(level => level.stormSeconds)!;
    const mist = MAZE_PUZZLES.find(level => (level.visibility ?? '').startsWith('mist-'))!;
    const wildlife = MAZE_PUZZLES.find(level => level.wildlife && level.wildlife !== 'none')!;
    const off = { difficulty: 'hard' as const, storms: false, mist: false, wildlife: false };
    expect(applyFreePlayPrefs(storm, off).stormSeconds).toBeNull();
    expect(applyFreePlayPrefs(mist, off).visibility).toBe('day');
    expect(applyFreePlayPrefs(wildlife, off).wildlife).toBe('none');
    const on = defaultFreePlayPrefs();
    expect(applyFreePlayPrefs(storm, on).stormSeconds).toBe(storm.stormSeconds);
    expect(applyFreePlayPrefs(mist, on).visibility).toBe(mist.visibility);
    expect(applyFreePlayPrefs(wildlife, on).wildlife).toBe(wildlife.wildlife);
  });
});
