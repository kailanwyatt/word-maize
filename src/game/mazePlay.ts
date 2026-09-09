import { markNearbyVisits, movePlayer, type MazePuzzle, type MazeRun } from './maze';
import { collectMazeFinds } from './mazeFinds';
import { tickStorm } from './mazeStorm';
import { markExplored } from './mazeVisibility';
import { tickWildlife } from './mazeWildlife';

export function advanceMazePlay(puzzle: MazePuzzle, run: MazeRun, vx: number, vy: number, dt: number): MazeRun {
  if (run.completed || !run.solved || !run.started || run.stormExpired) return run;
  const before = run.player;
  let next = movePlayer(puzzle, {
    ...run,
    elapsedActiveMs: run.elapsedActiveMs + dt * 1000,
  }, vx, vy, dt);
  next = {
    ...next,
    traveledDistance: run.traveledDistance + Math.hypot(next.player.x - before.x, next.player.y - before.y),
  };
  next = collectMazeFinds(puzzle, next).run;
  next = markExplored(puzzle, next);
  next = markNearbyVisits(puzzle, next);
  next = tickWildlife(puzzle, next);
  next = tickStorm(puzzle, next);
  return next;
}
