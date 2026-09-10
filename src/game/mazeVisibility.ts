import { cellKey, isWalkable, type MazePuzzle, type MazeRun } from './maze';

export const LANTERN_SIGHT_BONUS = 5;
export const LANTERN_BRIGHTEN_PERCENT = 25;
export const LANTERN_MAX_STACK = 4;

export type MazeSight = {
  mode: 'day' | 'evening' | 'mist' | 'storm';
  radius: number | null;
};

export function lanternCountFor(run: { lanternCount?: number; lanternActive?: boolean }) {
  const stored = Math.max(0, Math.floor(Number(run.lanternCount) || 0));
  if (stored > 0) return Math.min(LANTERN_MAX_STACK, stored);
  return run.lanternActive ? 1 : 0;
}

export function lanternBrighten(count: number) {
  return Math.min(1, Math.max(0, count) * (LANTERN_BRIGHTEN_PERCENT / 100));
}

export function lanternBrightenPercent(count: number) {
  return Math.round(lanternBrighten(count) * 100);
}

export function lanternSightBonus(count: number) {
  if (count <= 0) return 0;
  return LANTERN_SIGHT_BONUS * (1 + (count - 1) * (LANTERN_BRIGHTEN_PERCENT / 100));
}

function sightExtra(run: MazeRun, reducedMist = false) {
  return (reducedMist ? 3 : 0) + lanternSightBonus(lanternCountFor(run));
}

export function parseMazeVisibility(tag = 'day'): MazeSight {
  if (tag.startsWith('evening-')) return { mode: 'evening', radius: Number(tag.split('-')[1]) || 6 };
  if (tag.startsWith('mist-')) return { mode: 'mist', radius: Number(tag.split('-')[1]) || 4 };
  if (tag.startsWith('storm')) return { mode: 'storm', radius: tag.includes('late') ? 5 : null };
  return { mode: 'day', radius: null };
}

export function markExplored(puzzle: MazePuzzle, run: MazeRun): MazeRun {
  const keys = new Set(run.exploredKeys);
  const col = Math.floor(run.player.x);
  const row = Math.floor(run.player.y);
  for (let dr = -1; dr <= 1; dr += 1) for (let dc = -1; dc <= 1; dc += 1) {
    const nextCol = col + dc;
    const nextRow = row + dr;
    if (isWalkable(puzzle, run, nextCol, nextRow)) keys.add(cellKey({ col: nextCol, row: nextRow }));
  }
  if (keys.size === run.exploredKeys.length) return run;
  return { ...run, exploredKeys: [...keys] };
}

export function tileVisible(puzzle: MazePuzzle, run: MazeRun, col: number, row: number, reducedMist = false) {
  const sight = parseMazeVisibility(puzzle.visibility);
  const extra = sightExtra(run, reducedMist);
  const radius = sight.radius ? sight.radius + extra : null;
  const dist = Math.hypot(run.player.x - (col + 0.5), run.player.y - (row + 0.5));
  if (!radius) return true;
  if (dist <= radius + 1) return true;
  if (sight.mode === 'mist') return run.exploredKeys.includes(cellKey({ col, row }));
  return true;
}

export function detailVisible(puzzle: MazePuzzle, run: MazeRun, col: number, row: number, reducedMist = false) {
  const sight = parseMazeVisibility(puzzle.visibility);
  const extra = sightExtra(run, reducedMist);
  const radius = sight.radius ? sight.radius + extra : null;
  if (!radius) return true;
  return Math.hypot(run.player.x - (col + 0.5), run.player.y - (row + 0.5)) <= radius + 0.6;
}

export function fogVeil(puzzle: MazePuzzle, run: MazeRun, col: number, row: number, reducedMist = false) {
  if (detailVisible(puzzle, run, col, row, reducedMist)) return 1;
  if (tileVisible(puzzle, run, col, row, reducedMist)) return 0.52;
  return 0.32;
}
