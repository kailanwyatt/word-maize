import type { MazeLevel } from './mazeCampaign';

export const FREE_PLAY_CLEAR_COUNT = 80;

export type FreePlayDifficulty = 'easy' | 'medium' | 'hard';

export type FreePlayPrefs = {
  difficulty: FreePlayDifficulty;
  storms: boolean;
  mist: boolean;
  wildlife: boolean;
};

export const FREE_PLAY_BANDS: Record<FreePlayDifficulty, readonly [number, number]> = {
  easy: [1, 20],
  medium: [21, 50],
  hard: [51, 80],
};

export function defaultFreePlayPrefs(): FreePlayPrefs {
  return { difficulty: 'easy', storms: true, mist: true, wildlife: true };
}

export function isFreePlayDifficulty(value: unknown): value is FreePlayDifficulty {
  return value === 'easy' || value === 'medium' || value === 'hard';
}

export function migrateFreePlayPrefs(value: unknown): FreePlayPrefs {
  const fallback = defaultFreePlayPrefs();
  if (!value || typeof value !== 'object') return fallback;
  const saved = value as Partial<FreePlayPrefs>;
  return {
    difficulty: isFreePlayDifficulty(saved.difficulty) ? saved.difficulty : fallback.difficulty,
    storms: saved.storms !== false,
    mist: saved.mist !== false,
    wildlife: saved.wildlife !== false,
  };
}

export function isFreePlayUnlocked(rewardedIds: string[], devUnlock = false) {
  return devUnlock || rewardedIds.length >= FREE_PLAY_CLEAR_COUNT;
}

function limitedSight(tag = 'day') {
  return tag.startsWith('mist-') || tag.startsWith('evening-') || tag.startsWith('storm');
}

export function applyFreePlayPrefs<T extends { stormSeconds?: number | null; visibility?: string; wildlife?: string }>(puzzle: T, prefs: FreePlayPrefs): T {
  const visibility = puzzle.visibility ?? 'day';
  let nextSight = visibility;
  if (!prefs.mist && limitedSight(visibility)) nextSight = 'day';
  else if (!prefs.storms && visibility.startsWith('storm')) nextSight = 'day';
  return {
    ...puzzle,
    stormSeconds: prefs.storms ? puzzle.stormSeconds ?? null : null,
    visibility: nextSight,
    wildlife: prefs.wildlife ? puzzle.wildlife : 'none',
  };
}

export function pickFreePlayLevel(levels: readonly MazeLevel[], prefs: FreePlayPrefs, roll = Math.random()): MazeLevel | undefined {
  const [min, max] = FREE_PLAY_BANDS[prefs.difficulty];
  const pool = levels.filter(level => level.playable && level.order >= min && level.order <= max);
  if (!pool.length) return undefined;
  const index = Math.min(pool.length - 1, Math.max(0, Math.floor(roll * pool.length)));
  return pool[index];
}
