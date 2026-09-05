import { Inventory, LevelProgress } from '../game/types';

export type Settings = {
  music: boolean;
  sfx: boolean;
  haptics: boolean;
  notifications: boolean;
};

export type DailyState = {
  lastClaimDate: string | null;
  claimedDay: number;
};

export type GameSave = {
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
  adFree: boolean;
};

export const SAVE_KEY = 'word-maize.save.v1';

export const defaultSave = (): GameSave => ({
  coins: 0,
  energy: 5,
  energyUpdatedAt: Date.now(),
  inventory: { scarecrow: 3, butterBrush: 2, cornPicker: 3 },
  currentLevelId: 1,
  levels: {},
  settings: { music: true, sfx: true, haptics: true, notifications: false },
  daily: { lastClaimDate: null, claimedDay: 0 },
  seenTutorial: false,
  seenLevelIntros: [],
  adFree: false,
});

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
