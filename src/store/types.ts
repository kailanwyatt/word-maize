import { Inventory, LevelProgress } from '../game/types';
import type { ObstacleState } from '../game/obstacles';

export type Settings = {
  music: boolean;
  sfx: boolean;
  haptics: boolean;
  notifications: boolean;
  reducedMotion: boolean;
};

export type DailyState = {
  lastClaimDate: string | null;
  claimedDay: number;
};

export type ActiveLevelRun = {
  levelId: number;
  harvestedIds: string[];
  foundWords: string[];
  earnedCoins: number;
  toolsUsed: number;
  obstacles?: ObstacleState[];
  acceptedTurns?: number;
  updatedAt: number;
};

export type GameSave = {
  version: number;
  coins: number;
  energy: number;
  energyUpdatedAt: number;
  inventory: Inventory;
  currentLevelId: number;
  levels: Record<number, LevelProgress>;
  settings: Settings;
  daily: DailyState;
  seenTutorial: boolean;
  seenLevelIntros: number[];
  activeLevelRun: ActiveLevelRun | null;
  adFree: boolean;
  claimedRestorations: string[];
};

export const SAVE_KEY = 'word-maize.save.v1';
export const SAVE_VERSION = 4;

export const defaultSave = (): GameSave => ({
  version: SAVE_VERSION,
  coins: 0,
  energy: 5,
  energyUpdatedAt: Date.now(),
  inventory: { scarecrow: 3, butterBrush: 2, cornPicker: 3 },
  currentLevelId: 1,
  levels: {},
  settings: { music: true, sfx: true, haptics: true, notifications: false, reducedMotion: false },
  daily: { lastClaimDate: null, claimedDay: 0 },
  seenTutorial: false,
  seenLevelIntros: [],
  activeLevelRun: null,
  adFree: false,
  claimedRestorations: [],
});

export function migrateSave(value: unknown): GameSave {
  const fallback = defaultSave();
  if (!value || typeof value !== 'object') return fallback;
  const saved = value as Partial<GameSave>;
  return {
    ...fallback,
    ...saved,
    version: SAVE_VERSION,
    inventory: { ...fallback.inventory, ...(saved.inventory ?? {}) },
    settings: { ...fallback.settings, ...(saved.settings ?? {}) },
    daily: { ...fallback.daily, ...(saved.daily ?? {}) },
    levels: saved.levels && typeof saved.levels === 'object' ? saved.levels : {},
    seenLevelIntros: Array.isArray(saved.seenLevelIntros) ? saved.seenLevelIntros.filter(Number.isFinite) : [],
    activeLevelRun: saved.activeLevelRun && typeof saved.activeLevelRun === 'object' ? saved.activeLevelRun : null,
    claimedRestorations: Array.isArray(saved.claimedRestorations) ? saved.claimedRestorations.filter(value => typeof value === 'string') : [],
  };
}

export function localDateString(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function daysBetween(from: string, to: string): number {
  const utc = (value: string) => {
    const [y, m, d] = value.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((utc(to) - utc(from)) / 86_400_000);
}

export function nextDailyDay(daily: DailyState, today = localDateString()): { day: number; alreadyClaimed: boolean } {
  if (!daily.lastClaimDate) return { day: 1, alreadyClaimed: false };
  const gap = daysBetween(daily.lastClaimDate, today);
  if (gap <= 0) return { day: daily.claimedDay || 1, alreadyClaimed: true };
  if (gap === 1) return { day: daily.claimedDay >= 7 ? 1 : daily.claimedDay + 1, alreadyClaimed: false };
  return { day: 1, alreadyClaimed: false };
}
