import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { DAILY_REWARDS, COIN_TOOL_OFFERS } from '../data/shop';
import { LEVELS } from '../data/levels';
import { replenishEnergy } from '../game/energy';
import { addToInventory, purchaseCoinOffer } from '../game/economy';
import { RESTORATION_MILESTONES } from '../game/restoration';
import { ENERGY_MAX, Inventory, LevelProgress, ToolId } from '../game/types';
import { ActiveLevelRun, COB_PUZZLE_SAVE_KEY, defaultSave, GameSave, isBetterPopAWordRun, localDateString, mergeMazeSave, migrateSave, ModeHelpId, nextDailyDay, SAVE_KEY, type PopAWordBest } from './types';
import { PLAYABLE_MAZE_IDS } from '../data/mazeLevels';
import { unlockAfterMazeComplete } from '../game/mazeCampaign';
import type { MazeRun } from '../game/maze';
import { recordMazeScore, type MazeFieldScore } from '../game/mazeScores';

type GameStoreValue = {
  ready: boolean;
  save: GameSave;
  energyNow: () => { energy: number; energyUpdatedAt: number };
  spendEnergy: () => boolean;
  addEnergy: (amount: number) => void;
  addCoins: (amount: number) => void;
  addTools: (tools: Partial<Inventory>) => void;
  consumeTool: (tool: ToolId) => boolean;
  completeLevel: (id: number, stars: 0 | 1 | 2 | 3, percent: number, coins: number, result?: { wordsFound: number; longestWord: string; completedGoalIds: string[] }) => void;
  setCurrentLevel: (id: number) => void;
  setSetting: <K extends keyof GameSave['settings']>(key: K, value: GameSave['settings'][K]) => void;
  claimDaily: () => { ok: boolean; day: number };
  markTutorialSeen: () => void;
  markOnboardingSeen: () => void;
  markModeHelpSeen: (id: ModeHelpId) => void;
  markLevelIntroSeen: (id: number) => void;
  resetProgress: () => void;
  unlockCampaign: () => void;
  saveLevelRun: (run: ActiveLevelRun) => void;
  clearLevelRun: () => void;
  setAdFree: (value: boolean) => void;
  claimRestoration: (id: string) => boolean;
  buyCoinOffer: (offerId: string) => boolean;
  startEndlessHarvest: () => { seed: string; stage: number } | null;
  completeEndlessStage: (coins: number) => void;
  abandonEndlessHarvest: () => void;
  saveMazeRun: (run: MazeRun) => void;
  recordMazeFieldScore: (score: MazeFieldScore) => void;
  markMazeRewarded: (puzzleId: string, extras?: { unaided?: boolean; storm?: boolean; coins?: number; tools?: Partial<Inventory> }) => void;
  markFairRewarded: (rewardId: string, coins: number) => boolean;
  markStoryBeatSeen: (beatId: string) => void;
  markToolHelpSeen: (tool: ToolId) => void;
  recordPopAWordBest: (run: PopAWordBest) => void;
  completedIds: number[];
  currentLevelId: number;
};

const GameStoreContext = createContext<GameStoreValue | null>(null);

async function readSave(): Promise<GameSave> {
  try {
    const raw = await AsyncStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    return migrateSave(JSON.parse(raw));
  } catch {
    return defaultSave();
  }
}

export function GameStoreProvider({ children }: PropsWithChildren) {
  const [save, setSave] = useState<GameSave>(defaultSave);
  const [ready, setReady] = useState(false);
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => {
    readSave().then(loaded => {
      const energy = replenishEnergy(loaded.energy, loaded.energyUpdatedAt);
      setSave({ ...loaded, ...energy });
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(SAVE_KEY, JSON.stringify(save)).catch(() => {});
  }, [ready, save]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (ready && state !== 'active') AsyncStorage.setItem(SAVE_KEY, JSON.stringify(saveRef.current)).catch(() => {});
    });
    return () => subscription.remove();
  }, [ready]);

  const patch = useCallback((updater: (prev: GameSave) => GameSave) => {
    setSave(prev => {
      const withEnergy = { ...prev, ...replenishEnergy(prev.energy, prev.energyUpdatedAt) };
      return updater(withEnergy);
    });
  }, []);

  const energyNow = useCallback(() => replenishEnergy(save.energy, save.energyUpdatedAt), [save.energy, save.energyUpdatedAt]);

  const spendEnergy = useCallback(() => {
    const { energy } = replenishEnergy(save.energy, save.energyUpdatedAt);
    if (energy < 1) return false;
    setSave(prev => {
      const current = { ...prev, ...replenishEnergy(prev.energy, prev.energyUpdatedAt) };
      if (current.energy < 1) return current;
      return { ...current, energy: current.energy - 1, energyUpdatedAt: Date.now() };
    });
    return true;
  }, [save.energy, save.energyUpdatedAt]);

  const addEnergy = useCallback((amount: number) => {
    patch(prev => ({ ...prev, energy: Math.min(ENERGY_MAX, prev.energy + amount) }));
  }, [patch]);

  const addCoins = useCallback((amount: number) => {
    patch(prev => ({ ...prev, coins: prev.coins + amount }));
  }, [patch]);

  const addTools = useCallback((tools: Partial<Inventory>) => {
    patch(prev => ({
      ...prev,
      inventory: addToInventory(prev.inventory, tools),
    }));
  }, [patch]);

  const consumeTool = useCallback((tool: ToolId) => {
    if ((save.inventory[tool] ?? 0) < 1) return false;
    setSave(prev => {
      if ((prev.inventory[tool] ?? 0) < 1) return prev;
      return { ...prev, inventory: { ...prev.inventory, [tool]: prev.inventory[tool] - 1 } };
    });
    return true;
  }, [save.inventory]);

  const completeLevel = useCallback((id: number, stars: 0 | 1 | 2 | 3, percent: number, coins: number, result?: { wordsFound: number; longestWord: string; completedGoalIds: string[] }) => {
    patch(prev => {
      const existing: LevelProgress = prev.levels[id] ?? { stars: 0, completed: false, bestPercent: 0 };
      const nextStars = Math.max(existing.stars, stars) as 0 | 1 | 2 | 3;
      const nextId = Math.min(LEVELS.length, Math.max(prev.currentLevelId, id + (stars > 0 ? 1 : 0)));
      return {
        ...prev,
        coins: prev.coins + coins,
        currentLevelId: nextId,
        activeLevelRun: null,
        levels: {
          ...prev.levels,
          [id]: {
            stars: nextStars,
            completed: existing.completed || stars > 0,
            bestPercent: Math.max(existing.bestPercent, percent),
            bestWordsFound: Math.max(existing.bestWordsFound ?? 0, result?.wordsFound ?? 0),
            bestLongestWord: (existing.bestLongestWord?.length ?? 0) >= (result?.longestWord.length ?? 0) ? existing.bestLongestWord : result?.longestWord,
            completedGoalIds: [...new Set([...(existing.completedGoalIds ?? []), ...(result?.completedGoalIds ?? [])])],
          },
        },
      };
    });
  }, [patch]);

  const setCurrentLevel = useCallback((id: number) => patch(prev => ({ ...prev, currentLevelId: id })), [patch]);
  const setSetting = useCallback(<K extends keyof GameSave['settings']>(key: K, value: GameSave['settings'][K]) => {
    patch(prev => ({ ...prev, settings: { ...prev.settings, [key]: value } }));
  }, [patch]);
  const markTutorialSeen = useCallback(() => patch(prev => ({ ...prev, seenTutorial: true })), [patch]);
  const markOnboardingSeen = useCallback(() => patch(prev => ({ ...prev, seenOnboarding: true })), [patch]);
  const markModeHelpSeen = useCallback((id: ModeHelpId) => patch(prev => (
    prev.seenModeHelp[id] ? prev : { ...prev, seenModeHelp: { ...prev.seenModeHelp, [id]: true } }
  )), [patch]);
  const markLevelIntroSeen = useCallback((id: number) => patch(prev => ({
    ...prev,
    seenLevelIntros: prev.seenLevelIntros.includes(id) ? prev.seenLevelIntros : [...prev.seenLevelIntros, id],
  })), [patch]);
  const setAdFree = useCallback((value: boolean) => patch(prev => ({ ...prev, adFree: value })), [patch]);
  const resetProgress = useCallback(() => {
    const next = { ...defaultSave(), adFree: saveRef.current.adFree };
    setSave(next);
    AsyncStorage.multiRemove([SAVE_KEY, COB_PUZZLE_SAVE_KEY])
      .then(() => AsyncStorage.setItem(SAVE_KEY, JSON.stringify(next)))
      .catch(() => {});
  }, []);
  const unlockCampaign = useCallback(() => patch(prev => ({
    ...prev,
    currentLevelId: 60,
    levels: {
      ...prev.levels,
      ...Object.fromEntries(LEVELS.slice(0, 59).map(level => [level.id, {
        stars: 3 as const,
        completed: true,
        bestPercent: 100,
        bestWordsFound: level.objective.minWords ?? 1,
        bestLongestWord: level.guaranteedWords.reduce((best, word) => word.length > best.length ? word : best, ''),
        completedGoalIds: level.starGoals.map(goal => goal.id),
      }])),
    },
    seenLevelIntros: LEVELS.map(level => level.id),
  })), [patch]);
  const saveLevelRun = useCallback((run: ActiveLevelRun) => patch(prev => ({ ...prev, activeLevelRun: run })), [patch]);
  const clearLevelRun = useCallback(() => patch(prev => ({ ...prev, activeLevelRun: null })), [patch]);
  const claimRestoration = useCallback((id: string) => {
    const milestone = RESTORATION_MILESTONES.find(item => item.id === id);
    if (!milestone || !save.levels[milestone.requiredLevel]?.completed || save.claimedRestorations.includes(id)) return false;
    patch(prev => {
      if (!prev.levels[milestone.requiredLevel]?.completed || prev.claimedRestorations.includes(id)) return prev;
      return {
        ...prev,
        coins: prev.coins + milestone.coins,
        claimedRestorations: [...prev.claimedRestorations, id],
        inventory: addToInventory(prev.inventory, milestone.tools),
      };
    });
    return true;
  }, [patch, save.claimedRestorations, save.levels]);

  const buyCoinOffer = useCallback((offerId: string) => {
    const offer = COIN_TOOL_OFFERS.find(item => item.id === offerId);
    if (!offer) return false;
    const preview = purchaseCoinOffer(save.coins, save.inventory, offer.coins, offer.tools);
    if (!preview.ok) return false;
    patch(prev => {
      const result = purchaseCoinOffer(prev.coins, prev.inventory, offer.coins, offer.tools);
      if (!result.ok) return prev;
      return { ...prev, coins: result.coins, inventory: result.inventory };
    });
    return true;
  }, [patch, save.coins, save.inventory]);

  const startEndlessHarvest = useCallback(() => {
    if (!save.settings.devUnlock && !save.levels[60]?.completed) return null;
    if (save.endlessHarvest.active) return save.endlessHarvest.active;
    const active = { seed: `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`, stage: 1, startedAt: Date.now() };
    patch(prev => ({ ...prev, endlessHarvest: { ...prev.endlessHarvest, active }, activeLevelRun: null }));
    return active;
  }, [patch, save.endlessHarvest.active, save.levels, save.settings.devUnlock]);

  const completeEndlessStage = useCallback((coins: number) => {
    patch(prev => {
      const active = prev.endlessHarvest.active;
      if (!active) return prev;
      const completedStage = active.stage;
      return {
        ...prev,
        coins: prev.coins + coins,
        activeLevelRun: null,
        endlessHarvest: {
          bestStage: Math.max(prev.endlessHarvest.bestStage, completedStage),
          active: { ...active, stage: completedStage + 1 },
        },
      };
    });
  }, [patch]);

  const abandonEndlessHarvest = useCallback(() => patch(prev => ({
    ...prev,
    activeLevelRun: prev.activeLevelRun?.levelId && prev.activeLevelRun.levelId >= 10_000 ? null : prev.activeLevelRun,
    endlessHarvest: { ...prev.endlessHarvest, active: null },
  })), [patch]);

  const saveMazeRun = useCallback((run: MazeRun) => patch(prev => ({
    ...prev,
    maze: mergeMazeSave(prev.maze, {
      runs: run.campaign === false ? (prev.maze?.runs ?? {}) : { ...(prev.maze?.runs ?? {}), [run.puzzleId]: run },
      freePlay: run.campaign === false ? {
        puzzleId: run.puzzleId,
        run,
        prefs: prev.maze?.freePlay?.puzzleId === run.puzzleId && prev.maze.freePlay.prefs
          ? prev.maze.freePlay.prefs
          : prev.settings.freePlay,
      } : (prev.maze?.freePlay ?? null),
    }),
  })), [patch]);

  const recordMazeFieldScore = useCallback((score: MazeFieldScore) => patch(prev => {
    const recorded = recordMazeScore(prev.maze?.scores ?? {}, prev.maze?.pendingSync ?? [], score);
    if (!recorded.recorded) return prev;
    return {
      ...prev,
      maze: mergeMazeSave(prev.maze, { scores: recorded.scores, pendingSync: recorded.pendingSync }),
    };
  }), [patch]);

  const markMazeRewarded = useCallback((puzzleId: string, extras?: { unaided?: boolean; storm?: boolean; coins?: number; tools?: Partial<Inventory> }) => patch(prev => {
    const rewardedIds = prev.maze?.rewardedIds ?? [];
    const unlockedIds = unlockAfterMazeComplete(PLAYABLE_MAZE_IDS, prev.maze?.unlockedIds ?? [], puzzleId);
    const previous = prev.maze?.ribbons?.[puzzleId];
    const ribbons = {
      ...(prev.maze?.ribbons ?? {}),
      [puzzleId]: {
        harvested: true,
        unaided: !!(previous?.unaided || extras?.unaided),
        storm: !!(previous?.storm || extras?.storm),
      },
    };
    const already = rewardedIds.includes(puzzleId);
    if (already && unlockedIds.every(id => prev.maze?.unlockedIds?.includes(id)) && previous?.harvested) return prev;
    const coins = already ? 0 : Math.max(0, Math.floor(extras?.coins ?? 0));
    return {
      ...prev,
      coins: prev.coins + coins,
      inventory: extras?.tools && !already ? addToInventory(prev.inventory, extras.tools) : prev.inventory,
      maze: mergeMazeSave(prev.maze, {
        rewardedIds: already ? rewardedIds : [...rewardedIds, puzzleId],
        unlockedIds,
        ribbons,
      }),
    };
  }), [patch]);

  const markFairRewarded = useCallback((rewardId: string, coins: number) => {
    if (save.fair.rewardedIds.includes(rewardId) || coins < 1) return false;
    patch(prev => {
      if (prev.fair.rewardedIds.includes(rewardId)) return prev;
      return {
        ...prev,
        coins: prev.coins + coins,
        fair: { ...prev.fair, rewardedIds: [...prev.fair.rewardedIds, rewardId] },
      };
    });
    return true;
  }, [patch, save.fair.rewardedIds]);

  const markStoryBeatSeen = useCallback((beatId: string) => patch(prev => (
    prev.seenStoryBeatIds.includes(beatId) ? prev : { ...prev, seenStoryBeatIds: [...prev.seenStoryBeatIds, beatId] }
  )), [patch]);

  const markToolHelpSeen = useCallback((tool: ToolId) => patch(prev => (
    prev.seenToolHelp.includes(tool) ? prev : { ...prev, seenToolHelp: [...prev.seenToolHelp, tool] }
  )), [patch]);

  const recordPopAWordBest = useCallback((run: PopAWordBest) => patch(prev => (
    isBetterPopAWordRun(run, prev.fair.popAWordBest)
      ? { ...prev, fair: { ...prev.fair, popAWordBest: run } }
      : prev
  )), [patch]);

  const claimDaily = useCallback(() => {
    const today = localDateString();
    const preview = nextDailyDay(save.daily, today);
    if (preview.alreadyClaimed) return { ok: false, day: preview.day };
    const reward = DAILY_REWARDS[preview.day - 1];
    patch(prev => {
      const status = nextDailyDay(prev.daily, today);
      if (status.alreadyClaimed) return prev;
      const grant = DAILY_REWARDS[status.day - 1];
      return {
        ...prev,
        coins: prev.coins + (grant.coins ?? 0),
        inventory: addToInventory(prev.inventory, grant.tools),
        daily: { lastClaimDate: today, claimedDay: status.day },
      };
    });
    return { ok: true, day: preview.day, reward };
  }, [patch, save.daily]);

  const completedIds = useMemo(
    () => Object.entries(save.levels).filter(([, value]) => value.completed).map(([id]) => Number(id)),
    [save.levels],
  );

  const value = useMemo<GameStoreValue>(() => ({
    ready, save, energyNow, spendEnergy, addEnergy, addCoins, addTools, consumeTool,
    completeLevel, setCurrentLevel, setSetting, claimDaily, markTutorialSeen, markOnboardingSeen, markModeHelpSeen, markLevelIntroSeen, resetProgress, unlockCampaign, saveLevelRun, clearLevelRun, setAdFree, claimRestoration, buyCoinOffer, startEndlessHarvest, completeEndlessStage, abandonEndlessHarvest, saveMazeRun, recordMazeFieldScore, markMazeRewarded, markFairRewarded, markStoryBeatSeen, markToolHelpSeen, recordPopAWordBest,
    completedIds, currentLevelId: save.currentLevelId,
  }), [ready, save, energyNow, spendEnergy, addEnergy, addCoins, addTools, consumeTool, completeLevel, setCurrentLevel, setSetting, claimDaily, markTutorialSeen, markOnboardingSeen, markModeHelpSeen, markLevelIntroSeen, resetProgress, unlockCampaign, saveLevelRun, clearLevelRun, setAdFree, claimRestoration, buyCoinOffer, startEndlessHarvest, completeEndlessStage, abandonEndlessHarvest, saveMazeRun, recordMazeFieldScore, markMazeRewarded, markFairRewarded, markStoryBeatSeen, markToolHelpSeen, recordPopAWordBest, completedIds]);

  return <GameStoreContext.Provider value={value}>{children}</GameStoreContext.Provider>;
}

export function useGameStore() {
  const value = useContext(GameStoreContext);
  if (!value) throw new Error('useGameStore must be used within GameStoreProvider');
  return value;
}
