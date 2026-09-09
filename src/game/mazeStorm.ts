import type { MazePuzzle, MazeRun } from './maze';

export const STORM_GRACE_MS = 15_000;

export type StormPhase = 'clear' | 'overcast' | 'dark' | 'rain' | 'grace' | 'expired' | 'untimed';

export function stormBudgetMs(puzzle: MazePuzzle, run?: Pick<MazeRun, 'stormBonusMs'>) {
  const base = puzzle.stormSeconds ? puzzle.stormSeconds * 1000 : 0;
  return base + Math.max(0, run?.stormBonusMs ?? 0);
}

export function originalStormBudgetMs(puzzle: MazePuzzle) {
  return puzzle.stormSeconds ? puzzle.stormSeconds * 1000 : 0;
}

export function stormPhase(puzzle: MazePuzzle, run: MazeRun): StormPhase {
  const budget = stormBudgetMs(puzzle, run);
  if (!budget) return 'clear';
  if (run.stormUntimed) return 'untimed';
  if (run.stormExpired) return 'expired';
  const t = run.elapsedActiveMs / budget;
  if (t < 0.5) return 'overcast';
  if (t < 0.8) return 'dark';
  if (run.elapsedActiveMs < budget) return 'rain';
  if (run.elapsedActiveMs < budget + STORM_GRACE_MS) return 'grace';
  return 'expired';
}

export function stormRemainingMs(puzzle: MazePuzzle, run: MazeRun) {
  const budget = stormBudgetMs(puzzle, run);
  if (!budget || run.stormUntimed) return 0;
  const end = budget + STORM_GRACE_MS;
  return Math.max(0, end - run.elapsedActiveMs);
}

export function tickStorm(puzzle: MazePuzzle, run: MazeRun): MazeRun {
  if (!puzzle.stormSeconds || run.stormUntimed || run.completed) return run;
  if (stormPhase(puzzle, run) === 'expired' && !run.stormExpired) return { ...run, stormExpired: true };
  return run;
}

export function continueStormUntimed(run: MazeRun): MazeRun {
  return { ...run, stormExpired: false, stormUntimed: true };
}

export function canEarnStormRibbon(puzzle: MazePuzzle, run: MazeRun) {
  const original = originalStormBudgetMs(puzzle);
  if (!original || run.stormUntimed) return false;
  return run.elapsedActiveMs <= original + STORM_GRACE_MS && !run.stormExpired;
}
