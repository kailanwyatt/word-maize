import { Inventory, LevelProgress } from '../game/types';
import type { ObstacleState } from '../game/obstacles';
import type { MazeRun } from '../game/maze';
import { PLAYABLE_MAZE_IDS } from '../data/mazeLevels';
import { migrateMazeUnlocks } from '../game/mazeCampaign';

export type Settings = {
  music: boolean;
  sfx: boolean;
  haptics: boolean;
  notifications: boolean;
  reducedMotion: boolean;
  skipStory: boolean;
  devUnlock: boolean;
};

export type DailyState = {
  lastClaimDate: string | null;
  claimedDay: number;
};

export type ActiveLevelRun = {
  levelId: number;
  harvestedIds: string[];
  eatenIds?: string[];
  foundWords: string[];
  earnedCoins: number;
  toolsUsed: number;
  obstacles?: ObstacleState[];
  acceptedTurns?: number;
  crackedIds?: string[];
  popCharges?: Record<string, number>;
  updatedAt: number;
};

export type EndlessHarvestState = {
  bestStage: number;
  active: { seed: string; stage: number; startedAt: number } | null;
};

export type MazeRibbon = { harvested: boolean; unaided: boolean; storm: boolean };

export type MazeSave = {
  runs: Record<string, MazeRun>;
  rewardedIds: string[];
  unlockedIds: string[];
  ribbons: Record<string, MazeRibbon>;
  freePlay: { puzzleId: string; run: MazeRun } | null;
};

export type FairSave = {
  rewardedIds: string[];
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
  endlessHarvest: EndlessHarvestState;
  maze: MazeSave;
  fair: FairSave;
  seenStoryBeatIds: string[];
};

export const SAVE_KEY = 'word-maize.save.v1';
export const SAVE_VERSION = 9;

export const defaultSave = (): GameSave => ({
  version: SAVE_VERSION,
  coins: 0,
  energy: 5,
  energyUpdatedAt: Date.now(),
  inventory: { scarecrow: 2, butterBrush: 2, cornPicker: 1, mower: 1, tractor: 0, lantern: 0, raincoat: 0, huskClip: 0 },
  currentLevelId: 1,
  levels: {},
  settings: { music: true, sfx: true, haptics: true, notifications: false, reducedMotion: false, skipStory: false, devUnlock: false },
  daily: { lastClaimDate: null, claimedDay: 0 },
  seenTutorial: false,
  seenLevelIntros: [],
  activeLevelRun: null,
  adFree: false,
  claimedRestorations: [],
  endlessHarvest: { bestStage: 0, active: null },
  maze: { runs: {}, rewardedIds: [], unlockedIds: ['sunny-acres-corn'], ribbons: {}, freePlay: null },
  fair: { rewardedIds: [] },
  seenStoryBeatIds: [],
});

export function migrateSave(value: unknown): GameSave {
  const fallback = defaultSave();
  if (!value || typeof value !== 'object') return fallback;
  const saved = value as Partial<GameSave>;
  const seenStory = saved.seenStoryBeatIds;
  return {
    ...fallback,
    ...saved,
    version: SAVE_VERSION,
    inventory: { ...fallback.inventory, ...(saved.inventory ?? {}) },
    fair: {
      rewardedIds: Array.isArray((saved as { fair?: FairSave }).fair?.rewardedIds)
        ? (saved as { fair?: FairSave }).fair!.rewardedIds.filter(id => typeof id === 'string')
        : [],
    },
    seenStoryBeatIds: Array.isArray(seenStory)
      ? seenStory.filter(id => typeof id === 'string')
      : [],
    settings: {
      ...fallback.settings,
      ...(saved.settings ?? {}),
      skipStory: saved.settings?.skipStory === true,
      devUnlock: saved.settings?.devUnlock === true,
    },
    daily: { ...fallback.daily, ...(saved.daily ?? {}) },
    levels: saved.levels && typeof saved.levels === 'object' ? saved.levels : {},
    seenLevelIntros: Array.isArray(saved.seenLevelIntros) ? saved.seenLevelIntros.filter(Number.isFinite) : [],
    activeLevelRun: saved.activeLevelRun && typeof saved.activeLevelRun === 'object' ? saved.activeLevelRun : null,
    claimedRestorations: Array.isArray(saved.claimedRestorations) ? saved.claimedRestorations.filter(value => typeof value === 'string') : [],
    endlessHarvest: {
      bestStage: Math.max(0, Math.floor(saved.endlessHarvest?.bestStage ?? 0)),
      active: saved.endlessHarvest?.active && typeof saved.endlessHarvest.active.seed === 'string'
        ? {
          seed: saved.endlessHarvest.active.seed,
          stage: Math.max(1, Math.floor(saved.endlessHarvest.active.stage ?? 1)),
          startedAt: Number.isFinite(saved.endlessHarvest.active.startedAt) ? saved.endlessHarvest.active.startedAt : Date.now(),
        }
        : null,
    },
    maze: (() => {
      const rewardedIds = Array.isArray(saved.maze?.rewardedIds) ? saved.maze.rewardedIds.filter(id => typeof id === 'string') : [];
      const storedUnlocked = Array.isArray(saved.maze?.unlockedIds) ? saved.maze.unlockedIds.filter(id => typeof id === 'string') : [];
      return {
        runs: saved.maze?.runs && typeof saved.maze.runs === 'object' ? saved.maze.runs : {},
        rewardedIds,
        unlockedIds: migrateMazeUnlocks(rewardedIds, storedUnlocked, PLAYABLE_MAZE_IDS),
        ribbons: saved.maze?.ribbons && typeof saved.maze.ribbons === 'object' ? saved.maze.ribbons : {},
        freePlay: saved.maze?.freePlay && typeof saved.maze.freePlay === 'object' ? saved.maze.freePlay : null,
      };
    })(),
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
