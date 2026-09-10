import { landmarkArtPlacements } from '../components/maze/sceneLayout';
import { cellKey, facingDelta, inBounds, terrainAt, type MazePuzzle, type MazeRun } from './maze';

export const MAZE_MOWER_CUTS = 3;
export const MAZE_MOWER_LINE = 7;

export function canMowCell(puzzle: MazePuzzle, run: MazeRun, col: number, row: number) {
  if (!inBounds(puzzle, col, row)) return false;
  if (col <= 0 || row <= 0 || col >= puzzle.cols - 1 || row >= puzzle.rows - 1) return false;
  if (terrainAt(puzzle, col, row) !== 'wall') return false;
  if (run.mowedKeys.includes(cellKey({ col, row }))) return false;
  const cobWall = puzzle.cobs.some(cob => {
    const wall = run.cobMoves[cob.id]?.wall ?? cob.wall;
    return wall.col === col && wall.row === row;
  });
  if (cobWall) return false;
  if (run.vacated.some(cell => cell.col === col && cell.row === row)) return false;
  return !landmarkArtPlacements(puzzle).some(item => item.artCell.col === col && item.artCell.row === row);
}

/** One charge cuts a facing line of decorative corn. Stops at plants, landmarks, or the border. */
export function cutMowerLine(puzzle: MazePuzzle, run: MazeRun): { ok: true; run: MazeRun; tiles: { col: number; row: number }[] } | { ok: false; reason: 'complete' | 'none' } {
  if (run.completed) return { ok: false, reason: 'complete' };
  const step = facingDelta(run.facing);
  let col = Math.floor(run.player.x) + step.col;
  let row = Math.floor(run.player.y) + step.row;
  const keys: string[] = [];
  for (let i = 0; i < MAZE_MOWER_LINE; i += 1) {
    if (!canMowCell(puzzle, { ...run, mowedKeys: [...run.mowedKeys, ...keys] }, col, row)) break;
    keys.push(cellKey({ col, row }));
    col += step.col;
    row += step.row;
  }
  if (!keys.length) return { ok: false, reason: 'none' };
  const tiles = keys.map(key => {
    const [col, row] = key.split(',').map(Number);
    return { col, row };
  });
  return {
    ok: true,
    run: {
      ...run,
      mowedKeys: [...run.mowedKeys, ...keys],
      mowerCutsLeft: 0,
      usedMower: true,
    },
    tiles,
  };
}

export function activateMower(run: MazeRun): { ok: true; run: MazeRun; fresh: boolean } | { ok: false; reason: 'complete' } {
  if (run.completed) return { ok: false, reason: 'complete' };
  if (run.mowerCutsLeft > 0) return { ok: true, run, fresh: false };
  return { ok: true, run: { ...run, mowerCutsLeft: MAZE_MOWER_CUTS, usedMower: true }, fresh: true };
}
