import {
  cellKey,
  currentTarget,
  facingDelta,
  harvestCob,
  harvestLetters,
  isWalkable,
  liveCobs,
  type MazePuzzle,
  type MazeRun,
} from './maze';
import { canMowCell } from './mazeMower';

export const MAZE_TRACTOR_TILES = 6;
export const MAZE_TRACTOR_HARVEST = 3;

function adjacentTargets(puzzle: MazePuzzle, run: MazeRun, col: number, row: number) {
  return liveCobs(puzzle, run).filter(cob => {
    if (run.harvestedCobIds.includes(cob.id)) return false;
    const wall = cob.wall;
    return Math.abs(wall.col - col) + Math.abs(wall.row - row) === 1;
  });
}

/** Drive a short facing strip, mow a corridor, and harvest up to three spelling-order letters. */
export function driveTractor(puzzle: MazePuzzle, run: MazeRun): { ok: true; run: MazeRun; harvested: number } | { ok: false; reason: 'complete' } {
  if (run.completed) return { ok: false, reason: 'complete' };
  const step = facingDelta(run.facing);
  const lastLetter = harvestLetters(puzzle.answer).length - 1;
  let next = { ...run, usedTractor: true };
  let harvested = 0;
  let col = Math.floor(run.player.x);
  let row = Math.floor(run.player.y);
  for (let i = 0; i < MAZE_TRACTOR_TILES; i += 1) {
    const aheadCol = col + step.col;
    const aheadRow = row + step.row;
    const probe = { ...next, mowedKeys: next.mowedKeys };
    if (canMowCell(puzzle, probe, aheadCol, aheadRow)) {
      next = { ...next, mowedKeys: [...next.mowedKeys, cellKey({ col: aheadCol, row: aheadRow })] };
    }
    if (!isWalkable(puzzle, next, aheadCol, aheadRow)) break;
    col = aheadCol;
    row = aheadRow;
    next = { ...next, player: { x: col + 0.5, y: row + 0.5 } };
    if (harvested >= MAZE_TRACTOR_HARVEST || next.nextAnswerIndex >= lastLetter || next.completed) continue;
    const target = currentTarget(puzzle, next);
    const match = adjacentTargets(puzzle, next, col, row).find(cob => cob.letter === target);
    if (!match) continue;
    const result = harvestCob(puzzle, next, match.id, null, { ignoreRange: true });
    if (!result.ok) continue;
    next = result.run;
    harvested += 1;
  }
  return { ok: true, run: next, harvested };
}
