import { Level, StarGoal } from './types';

export function coinsForWord(word: string): number {
  const length = word.trim().length;
  if (length < 3) return 0;
  return length * 5 + Math.max(0, length - 4) * 7;
}

export function completionBonus(percent: number, target: number): number {
  return 50 + Math.max(0, percent - target) * 2;
}

export function starsForLevel(percent: number, target: number, wordsFound: number): 0 | 1 | 2 | 3 {
  if (percent < target) return 0;
  if (percent >= Math.min(100, target + 20) || wordsFound >= 12) return 3;
  if (percent >= target + 10 || wordsFound >= 8) return 2;
  return 1;
}

export type LevelRunStats = {
  percent: number;
  words: string[];
  toolsUsed: number;
  layersRevealed: number;
  firstWordMs?: number | null;
};

export function objectiveComplete(level: Level, stats: LevelRunStats): boolean {
  const longest = stats.words.reduce((length, word) => Math.max(length, word.length), 0);
  return stats.percent >= level.objective.harvestPercent
    && stats.words.length >= (level.objective.minWords ?? 0)
    && longest >= (level.objective.minLongestWord ?? 0)
    && stats.layersRevealed >= (level.objective.minLayersRevealed ?? 0);
}

export function starGoalComplete(goal: StarGoal, stats: LevelRunStats): boolean {
  const longest = stats.words.reduce((length, word) => Math.max(length, word.length), 0);
  if (goal.kind === 'longestWord') return longest >= goal.value;
  if (goal.kind === 'maxWords') return stats.words.length <= goal.value;
  if (goal.kind === 'noTools') return stats.toolsUsed === 0;
  if (goal.kind === 'layersRevealed') return stats.layersRevealed >= goal.value;
  if (goal.kind === 'firstWordWithinSeconds') {
    return stats.firstWordMs != null && stats.firstWordMs <= goal.value * 1000;
  }
  return stats.percent >= goal.value;
}

export function evaluateLevelStars(level: Level, stats: LevelRunStats): { stars: 0 | 1 | 2 | 3; completedGoalIds: string[] } {
  if (!objectiveComplete(level, stats)) return { stars: 0, completedGoalIds: [] };
  const completedGoalIds = level.starGoals.filter(goal => starGoalComplete(goal, stats)).map(goal => goal.id);
  return { stars: Math.min(3, 1 + completedGoalIds.length) as 1 | 2 | 3, completedGoalIds };
}

export function totalStars(progress: Record<number, { stars: number }>): number {
  return Object.values(progress).reduce((sum, entry) => sum + entry.stars, 0);
}
