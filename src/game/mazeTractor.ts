import {
  cellKey,
  currentTarget,
  facingDelta,
  harvestCob,
  harvestLetters,
  inBounds,
  isWalkable,
  liveCobs,
  type MazePuzzle,
  type MazeRun,
} from './maze';
import { canMowCell } from './mazeMower';

export const MAZE_TRACTOR_WIDTH = 3;
export const MAZE_TRACTOR_DEPTH = 4;
export const MAZE_TRACTOR_HARVEST = 4;

function uniqueCells(cells: { col: number; row: number }[]) {
  const seen = new Set<string>();
  return cells.filter(cell => {
    const key = cellKey(cell);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function crossDelta(step: { col: number; row: number }) {
  return { col: -step.row, row: step.col };
}

function tractorSwath(puzzle: MazePuzzle, originCol: number, originRow: number, step: { col: number; row: number }) {
  const cross = crossDelta(step);
  const half = Math.floor(MAZE_TRACTOR_WIDTH / 2);
  const cells: { col: number; row: number }[] = [];
  for (let depth = 1; depth <= MAZE_TRACTOR_DEPTH; depth += 1) {
    const centerCol = originCol + step.col * depth;
    const centerRow = originRow + step.row * depth;
    for (let offset = -half; offset <= half; offset += 1) {
      const col = centerCol + cross.col * offset;
      const row = centerRow + cross.row * offset;
      if (inBounds(puzzle, col, row)) cells.push({ col, row });
    }
  }
  return uniqueCells(cells);
}

function cobTouchesSwath(cob: { wall: { col: number; row: number } }, swath: { col: number; row: number }[]) {
  return swath.some(cell => Math.abs(cob.wall.col - cell.col) + Math.abs(cob.wall.row - cell.row) <= 1);
}

function harvestFromSwath(puzzle: MazePuzzle, run: MazeRun, swath: { col: number; row: number }[]) {
  const lastLetter = harvestLetters(puzzle.answer).length - 1;
  let next = run;
  let harvested = 0;
  while (harvested < MAZE_TRACTOR_HARVEST && next.nextAnswerIndex < lastLetter && !next.completed) {
    const target = currentTarget(puzzle, next);
    const match = liveCobs(puzzle, next).find(cob => {
      if (next.harvestedCobIds.includes(cob.id) || cob.letter !== target) return false;
      return cobTouchesSwath(cob, swath);
    });
    if (!match) break;
    const result = harvestCob(puzzle, next, match.id, null, { ignoreRange: true });
    if (!result.ok) break;
    next = result.run;
    harvested += 1;
  }
  return { run: next, harvested };
}

/** Drive a facing 3×4 corn swath, mow decorative stalks, and harvest letters in that span. */
export function driveTractor(puzzle: MazePuzzle, run: MazeRun):
  | { ok: true; run: MazeRun; harvested: number; path: { col: number; row: number }[]; mowed: { col: number; row: number }[] }
  | { ok: false; reason: 'complete' } {
  if (run.completed) return { ok: false, reason: 'complete' };
  const step = facingDelta(run.facing);
  let col = Math.floor(run.player.x);
  let row = Math.floor(run.player.y);
  const swath = tractorSwath(puzzle, col, row, step);
  const mowedKeys: string[] = [];
  for (const cell of swath) {
    if (canMowCell(puzzle, { ...run, mowedKeys: [...run.mowedKeys, ...mowedKeys] }, cell.col, cell.row)) {
      mowedKeys.push(cellKey(cell));
    }
  }
  let next: MazeRun = {
    ...run,
    usedTractor: true,
    mowedKeys: [...run.mowedKeys, ...mowedKeys],
  };
  const path = [{ col, row }];
  for (let depth = 1; depth <= MAZE_TRACTOR_DEPTH; depth += 1) {
    const aheadCol = col + step.col;
    const aheadRow = row + step.row;
    if (!isWalkable(puzzle, next, aheadCol, aheadRow)) break;
    col = aheadCol;
    row = aheadRow;
    path.push({ col, row });
    next = { ...next, player: { x: col + 0.5, y: row + 0.5 } };
  }
  const crop = harvestFromSwath(puzzle, next, swath);
  const mowed = mowedKeys.map(key => {
    const [mowCol, mowRow] = key.split(',').map(Number);
    return { col: mowCol, row: mowRow };
  });
  return { ok: true, run: crop.run, harvested: crop.harvested, path, mowed };
}
