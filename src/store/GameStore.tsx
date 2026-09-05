import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DAILY_REWARDS } from '../data/shop';
import { LEVELS } from '../data/levels';
import { replenishEnergy } from '../game/energy';
import { clampInventoryAmount } from '../game/economy';
import { ENERGY_MAX, Inventory, LevelProgress, ToolId } from '../game/types';
import { ActiveLevelRun, defaultSave, GameSave, localDateString, migrateSave, nextDailyDay, SAVE_KEY } from './types';

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
  markLevelIntroSeen: (id: number) => void;
  resetProgress: () => void;
  unlockChapterOne: () => void;
  saveLevelRun: (run: ActiveLevelRun) => void;
  clearLevelRun: () => void;
  setAdFree: (value: boolean) => void;
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
      inventory: {
        scarecrow: clampInventoryAmount(prev.inventory.scarecrow + (tools.scarecrow ?? 0)),
        butterBrush: clampInventoryAmount(prev.inventory.butterBrush + (tools.butterBrush ?? 0)),
        cornPicker: clampInventoryAmount(prev.inventory.cornPicker + (tools.cornPicker ?? 0)),
      },
    }));
  }, [patch]);

  const consumeTool = useCallback((tool: ToolId) => {
    if (save.inventory[tool] < 1) return false;
    setSave(prev => {
      if (prev.inventory[tool] < 1) return prev;
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
  const markLevelIntroSeen = useCallback((id: number) => patch(prev => ({
    ...prev,
    seenLevelIntros: prev.seenLevelIntros.includes(id) ? prev.seenLevelIntros : [...prev.seenLevelIntros, id],
  })), [patch]);
  const setAdFree = useCallback((value: boolean) => patch(prev => ({ ...prev, adFree: value })), [patch]);
  const resetProgress = useCallback(() => setSave(defaultSave()), []);
  const unlockChapterOne = useCallback(() => patch(prev => ({
    ...prev,
    currentLevelId: 10,
    levels: {
      ...prev.levels,
      ...Object.fromEntries(LEVELS.slice(0, 9).map(level => [level.id, {
        stars: 3 as const,
        completed: true,
        bestPercent: 100,
        bestWordsFound: level.objective.minWords ?? 1,
        bestLongestWord: level.guaranteedWords.reduce((best, word) => word.length > best.length ? word : best, ''),
        completedGoalIds: level.starGoals.map(goal => goal.id),
      }])),
    },
    seenLevelIntros: LEVELS.slice(0, 10).map(level => level.id),
  })), [patch]);
  const saveLevelRun = useCallback((run: ActiveLevelRun) => patch(prev => ({ ...prev, activeLevelRun: run })), [patch]);
  const clearLevelRun = useCallback(() => patch(prev => ({ ...prev, activeLevelRun: null })), [patch]);

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
        inventory: {
          scarecrow: clampInventoryAmount(prev.inventory.scarecrow + (grant.tools?.scarecrow ?? 0)),
          butterBrush: clampInventoryAmount(prev.inventory.butterBrush + (grant.tools?.butterBrush ?? 0)),
          cornPicker: clampInventoryAmount(prev.inventory.cornPicker + (grant.tools?.cornPicker ?? 0)),
        },
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
    completeLevel, setCurrentLevel, setSetting, claimDaily, markTutorialSeen, markLevelIntroSeen, resetProgress, unlockChapterOne, saveLevelRun, clearLevelRun, setAdFree,
    completedIds, currentLevelId: save.currentLevelId,
  }), [ready, save, energyNow, spendEnergy, addEnergy, addCoins, addTools, consumeTool, completeLevel, setCurrentLevel, setSetting, claimDaily, markTutorialSeen, markLevelIntroSeen, resetProgress, unlockChapterOne, saveLevelRun, clearLevelRun, setAdFree, completedIds]);

  return <GameStoreContext.Provider value={value}>{children}</GameStoreContext.Provider>;
}

export function useGameStore() {
  const value = useContext(GameStoreContext);
  if (!value) throw new Error('useGameStore must be used within GameStoreProvider');
  return value;
}
