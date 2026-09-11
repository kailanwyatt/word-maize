import { Inventory, LevelProgress, TOOL_IDS, type ToolId } from '../game/types';
import type { ObstacleState } from '../game/obstacles';
import type { MazeRun } from '../game/maze';
import { PLAYABLE_MAZE_IDS } from '../data/mazeLevels';
import { isMazeFarmerId, sanitizeFarmerName, type MazeFarmerId } from '../data/mazeFarmers';
import { migrateMazeUnlocks } from '../game/mazeCampaign';
import { isLocale, type Locale } from '../i18n/locales';
import { defaultFreePlayPrefs, migrateFreePlayPrefs, type FreePlayPrefs } from '../game/mazeFreePlay';
import {
  migrateMazePendingSync,
  migrateMazeScores,
  type MazeFieldScore,
} from '../game/mazeScores';

export type Settings = {
  music: boolean;
  sfx: boolean;
  haptics: boolean;
  notifications: boolean;
  reducedMotion: boolean;
  skipStory: boolean;
  devUnlock: boolean;
  showMazePad: boolean;
  mazeFarmer: MazeFarmerId;
  farmerName: string;
  language: Locale;
  freePlay: FreePlayPrefs;
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
  firstWordMs?: number | null;
  playMs?: number;
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
  scores: Record<string, MazeFieldScore>;
  pendingSync: MazeFieldScore[];
  freePlay: { puzzleId: string; run: MazeRun; prefs?: FreePlayPrefs } | null;
};

export function mergeMazeSave(maze: MazeSave | undefined, patch: Partial<MazeSave> = {}): MazeSave {
  return {
    runs: maze?.runs ?? {},
    rewardedIds: maze?.rewardedIds ?? [],
    unlockedIds: maze?.unlockedIds ?? ['sunny-acres-corn'],
    ribbons: maze?.ribbons ?? {},
    scores: maze?.scores ?? {},
    pendingSync: maze?.pendingSync ?? [],
    freePlay: maze?.freePlay ?? null,
    ...patch,
  };
}

export type PopAWordBest = {
  score: number;
  wordsCompleted: number;
  elapsedMs: number;
  accuracy: number;
  bestCombo: number;
  at: number;
};

export type FairSave = {
  rewardedIds: string[];
  popAWordBest: PopAWordBest | null;
};

export type ModeHelpId = 'maize' | 'cob' | 'crossword' | 'twist' | 'endless';
export type SeenModeHelp = Record<ModeHelpId, boolean>;

export const MODE_HELP_IDS: ModeHelpId[] = ['maize', 'cob', 'crossword', 'twist', 'endless'];

export function defaultSeenModeHelp(): SeenModeHelp {
  return { maize: false, cob: false, crossword: false, twist: false, endless: false };
}

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
  seenOnboarding: boolean;
  seenModeHelp: SeenModeHelp;
  seenLevelIntros: number[];
  activeLevelRun: ActiveLevelRun | null;
  adFree: boolean;
  claimedRestorations: string[];
  endlessHarvest: EndlessHarvestState;
  maze: MazeSave;
  fair: FairSave;
  seenStoryBeatIds: string[];
  seenToolHelp: ToolId[];
};

export const SAVE_KEY = 'word-maize.save.v1';
export const COB_PUZZLE_SAVE_KEY = 'word-maize-cob-prototypes-v1';
export const SAVE_VERSION = 13;

export const defaultSave = (): GameSave => ({
  version: SAVE_VERSION,
  coins: 0,
  energy: 5,
  energyUpdatedAt: Date.now(),
  inventory: { scarecrow: 2, butterBrush: 2, cornPicker: 1, mower: 1, tractor: 0, lantern: 0, raincoat: 0, huskClip: 0 },
  currentLevelId: 1,
  levels: {},
  settings: { music: true, sfx: true, haptics: true, notifications: false, reducedMotion: false, skipStory: false, devUnlock: false, showMazePad: false, mazeFarmer: 'may', farmerName: '', language: 'en', freePlay: defaultFreePlayPrefs() },
  daily: { lastClaimDate: null, claimedDay: 0 },
  seenTutorial: false,
  seenOnboarding: false,
  seenModeHelp: defaultSeenModeHelp(),
  seenLevelIntros: [],
  activeLevelRun: null,
  adFree: false,
  claimedRestorations: [],
  endlessHarvest: { bestStage: 0, active: null },
  maze: { runs: {}, rewardedIds: [], unlockedIds: ['sunny-acres-corn'], ribbons: {}, scores: {}, pendingSync: [], freePlay: null },
  fair: { rewardedIds: [], popAWordBest: null },
  seenStoryBeatIds: [],
  seenToolHelp: [],
});

export function migrateSeenModeHelp(value: unknown): SeenModeHelp {
  const next = defaultSeenModeHelp();
  if (!value || typeof value !== 'object') return next;
  const saved = value as Partial<SeenModeHelp>;
  for (const id of MODE_HELP_IDS) next[id] = saved[id] === true;
  return next;
}

export function migrateSeenToolHelp(value: unknown): ToolId[] {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is ToolId => typeof id === 'string' && TOOL_IDS.includes(id as ToolId));
}

export function migratePopAWordBest(value: unknown): PopAWordBest | null {
  if (!value || typeof value !== 'object') return null;
  const saved = value as Partial<PopAWordBest>;
  const score = Math.max(0, Math.floor(Number(saved.score) || 0));
  const wordsCompleted = Math.max(0, Math.floor(Number(saved.wordsCompleted) || 0));
  const elapsedMs = Math.max(0, Math.floor(Number(saved.elapsedMs) || 0));
  const accuracy = Math.min(1, Math.max(0, Number(saved.accuracy) || 0));
  const bestCombo = Math.max(0, Math.floor(Number(saved.bestCombo) || 0));
  const at = Number.isFinite(saved.at) ? Number(saved.at) : 0;
  if (!score && !wordsCompleted) return null;
  return { score, wordsCompleted, elapsedMs, accuracy, bestCombo, at };
}

export function migrateFairSave(value: unknown): FairSave {
  const saved = value && typeof value === 'object' ? value as Partial<FairSave> : {};
  return {
    rewardedIds: Array.isArray(saved.rewardedIds) ? saved.rewardedIds.filter(id => typeof id === 'string') : [],
    popAWordBest: migratePopAWordBest(saved.popAWordBest),
  };
}

export function isBetterPopAWordRun(next: PopAWordBest, best: PopAWordBest | null) {
  if (!best) return true;
  if (next.score !== best.score) return next.score > best.score;
  if (next.wordsCompleted !== best.wordsCompleted) return next.wordsCompleted > best.wordsCompleted;
  return next.elapsedMs > best.elapsedMs;
}

function hadPriorPlay(saved: Partial<GameSave>): boolean {
  if (saved.seenOnboarding === true || saved.seenTutorial === true) return true;
  if (typeof saved.settings?.farmerName === 'string' && saved.settings.farmerName.trim()) return true;
  if (saved.coins && saved.coins > 0) return true;
  if (saved.levels && Object.keys(saved.levels).length > 0) return true;
  if (Array.isArray(saved.maze?.rewardedIds) && saved.maze.rewardedIds.length > 0) return true;
  if (Array.isArray(saved.seenStoryBeatIds) && saved.seenStoryBeatIds.length > 0) return true;
  if (Array.isArray(saved.seenLevelIntros) && saved.seenLevelIntros.length > 0) return true;
  return false;
}

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
    fair: migrateFairSave((saved as { fair?: FairSave }).fair),
    seenStoryBeatIds: Array.isArray(seenStory)
      ? seenStory.filter(id => typeof id === 'string')
      : [],
    seenToolHelp: migrateSeenToolHelp((saved as { seenToolHelp?: unknown }).seenToolHelp),
    seenOnboarding: saved.seenOnboarding === true || hadPriorPlay(saved),
    seenModeHelp: migrateSeenModeHelp(saved.seenModeHelp),
    settings: {
      ...fallback.settings,
      ...(saved.settings ?? {}),
      skipStory: saved.settings?.skipStory === true,
      devUnlock: saved.settings?.devUnlock === true,
      showMazePad: saved.settings?.showMazePad === true,
      mazeFarmer: isMazeFarmerId(saved.settings?.mazeFarmer) ? saved.settings.mazeFarmer : fallback.settings.mazeFarmer,
      farmerName: sanitizeFarmerName(saved.settings?.farmerName),
      language: isLocale(saved.settings?.language) ? saved.settings.language : fallback.settings.language,
      freePlay: migrateFreePlayPrefs(saved.settings?.freePlay),
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
        scores: migrateMazeScores(saved.maze && 'scores' in saved.maze ? saved.maze.scores : undefined),
        pendingSync: migrateMazePendingSync(saved.maze && 'pendingSync' in saved.maze ? saved.maze.pendingSync : undefined),
        freePlay: saved.maze?.freePlay && typeof saved.maze.freePlay === 'object'
          ? {
            puzzleId: typeof saved.maze.freePlay.puzzleId === 'string' ? saved.maze.freePlay.puzzleId : '',
            run: saved.maze.freePlay.run,
            prefs: saved.maze.freePlay.prefs ? migrateFreePlayPrefs(saved.maze.freePlay.prefs) : undefined,
          }
          : null,
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
