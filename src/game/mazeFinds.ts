import { cellKey, floodFillPaths, type MazeCell, type MazePuzzle, type MazeRun } from './maze';
import { parseMazeVisibility } from './mazeVisibility';
import type { ToolId } from './types';

export type MazeFind = { id: string; cell: MazeCell; tool: ToolId };

function hashPick(seed: string, salt: string) {
  let hash = 2166136261;
  for (const char of `${seed}:${salt}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}

function crateCount(puzzle: MazePuzzle) {
  const chapter = puzzle.chapter ?? 1;
  if (chapter <= 1 && (puzzle.id === 'sunny-acres-corn' || puzzle.id === 'sunny-hen' || puzzle.id === 'sunny-gate')) return 0;
  const roll = hashPick(puzzle.seed, 'count') % 8;
  if (puzzle.cols >= 23 && chapter >= 7 && roll === 7) return 2;
  if (roll <= 2) return 0;
  return 1;
}

function lootFor(puzzle: MazePuzzle, index: number): ToolId {
  const sight = parseMazeVisibility(puzzle.visibility);
  const roll = hashPick(puzzle.seed, `loot:${index}`) % 20;
  if (roll === 0) return 'tractor';
  if (sight.mode === 'mist' || sight.mode === 'evening') return roll < 14 ? 'lantern' : 'huskClip';
  if (puzzle.stormSeconds) return roll < 14 ? 'raincoat' : 'lantern';
  if (puzzle.wildlife && puzzle.wildlife !== 'none') return roll < 12 ? 'scarecrow' : 'mower';
  return roll < 12 ? 'mower' : 'huskClip';
}

export function mazeFindsFor(puzzle: MazePuzzle): MazeFind[] {
  const count = crateCount(puzzle);
  if (!count) return [];
  const reachable = [...floodFillPaths(puzzle, puzzle.spawn)];
  const inspect = new Set(puzzle.cobs.map(cob => cellKey(cob.inspect)));
  const blocked = new Set([cellKey(puzzle.spawn), ...inspect]);
  const candidates = reachable
    .map(key => {
      const [col, row] = key.split(',').map(Number);
      return { col, row };
    })
    .filter(cell => !blocked.has(cellKey(cell)) && Math.abs(cell.col - puzzle.spawn.col) + Math.abs(cell.row - puzzle.spawn.row) >= 3)
    .sort((a, b) => hashPick(puzzle.seed, cellKey(a)) - hashPick(puzzle.seed, cellKey(b)));
  return candidates.slice(0, count).map((cell, index) => ({
    id: `${puzzle.id}-find-${index}`,
    cell,
    tool: lootFor(puzzle, index),
  }));
}

export function remainingMazeFinds(puzzle: MazePuzzle, run: MazeRun) {
  return mazeFindsFor(puzzle).filter(find => !run.pickedFindIds.includes(find.id));
}

export function collectMazeFinds(puzzle: MazePuzzle, run: MazeRun): { run: MazeRun; found: MazeFind | null } {
  const here = cellKey({ col: Math.floor(run.player.x), row: Math.floor(run.player.y) });
  const find = remainingMazeFinds(puzzle, run).find(item => cellKey(item.cell) === here);
  if (!find) return { run, found: null };
  const current = Math.max(0, Math.floor(Number(run.barnFinds[find.tool]) || 0));
  return {
    found: find,
    run: {
      ...run,
      pickedFindIds: [...run.pickedFindIds, find.id],
      barnFinds: { ...run.barnFinds, [find.tool]: current + 1 },
    },
  };
}
