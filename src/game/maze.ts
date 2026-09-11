import { canMowCell, MAZE_MOWER_CUTS } from './mazeMower';
import type { Inventory, ToolId } from './types';

export type Terrain = 'path' | 'wall';
export type PresentationMode = 'shown' | 'partial' | 'clue' | 'full-word';
export type MazeFacing = 'up' | 'down' | 'left' | 'right';

export type MazeCell = { col: number; row: number };

export type MazeCob = {
  id: string;
  letter: string;
  wall: MazeCell;
  inspect: MazeCell;
};

export type MazeLandmark = {
  id: string;
  name: string;
  origin: MazeCell;
};

export type MazePuzzle = {
  id: string;
  seed: string;
  chapter: number;
  title: string;
  answer: string;
  clue: string;
  presentationMode: PresentationMode;
  cols: number;
  rows: number;
  terrain: Terrain[][];
  spawn: MazeCell;
  cobs: MazeCob[];
  revealDurationMs: number;
  displayAnswer?: string;
  contentVersion?: string;
  landmarks?: MazeLandmark[];
  givenMask?: string | null;
  visibility?: string;
  wildlife?: string;
  stormSeconds?: number | null;
  reservedHosts?: MazeCell[];
  wildlifeIntro?: boolean;
};

export type MazeHelpMarker = {
  cobId: string;
  hideAtElapsedMs: number;
};

export type MazeWildlifeKind = 'crow' | 'squirrel' | 'caterpillar';

export type MazeWildlifeEvent = {
  kind: MazeWildlifeKind;
  cobId: string;
  phase: 'warning' | 'active';
  startMs: number;
  resolveAtMs: number;
  from?: MazeCob;
  to?: { wall: MazeCell; inspect: MazeCell };
};

export type MazeRun = {
  puzzleId: string;
  player: { x: number; y: number };
  facing: MazeFacing;
  nextAnswerIndex: number;
  harvestedCobIds: string[];
  inspectedCobIds: string[];
  elapsedActiveMs: number;
  completed: boolean;
  solved: boolean;
  started: boolean;
  campaign: boolean;
  usedAnswerHelp: boolean;
  usedReminder: boolean;
  usedFindNext: boolean;
  usedMower: boolean;
  usedTractor: boolean;
  usedLantern: boolean;
  usedRaincoat: boolean;
  usedHuskClip: boolean;
  usedScarecrow: boolean;
  lanternCount: number;
  lanternActive: boolean;
  huskClipActive: boolean;
  huskClips: string[];
  stormBonusMs: number;
  barnFinds: Partial<Inventory>;
  pickedFindIds: string[];
  exploredKeys: string[];
  totalInspections: number;
  traveledDistance: number;
  cobMoves: Record<string, { wall: MazeCell; inspect: MazeCell }>;
  vacated: MazeCell[];
  wildlife: MazeWildlifeEvent | null;
  wildlifeResolved: number;
  helpMarker: MazeHelpMarker | null;
  stormUntimed: boolean;
  stormExpired: boolean;
  mowedKeys: string[];
  mowerCutsLeft: number;
};

export type MazeReveal = {
  cobId: string;
  hideAtElapsedMs: number;
};

export type MazeProgress = {
  rewarded: boolean;
};

export const MAZE_POINTS_PER_LETTER = 100;
export const MAZE_FIRST_COMPLETION_BONUS = 250;
export const MAZE_PLAYER_RADIUS = 0.24;
export const MAZE_WALK_SPEED = 3.8;
export const MAZE_STICK_DEADZONE = 0.16;
export const MAZE_AXIS_LOCK = 1.12;
export const MAZE_LANE_RATE = 26;
export const MAZE_FUNNEL_WINDOW = 0.72;
export const MAZE_CORNER_SNAP = 0.38;
export const MAZE_SETTLE_RATE = 11;
export const MAZE_INSPECT_RANGE = 0.85;
/** Adjacent-cell center is 1.0 from the husk. Stay under the far lip (~1.5) so the ear opens at the plant, not a tile away. */
export const MAZE_PLANT_REACH = 1.2;

/** Phone-size renderer contract. Collision uses cell units; these sizes are pixels only. */
export const MAZE_RENDER = {
  tile: 60,
  wallSprite: { width: 86, height: 114, footOffsetY: 18 },
  plantSprite: { width: 60, height: 88, footOffsetY: 10, art: 100 },
  farmerSprite: { width: 50, height: 70, footOffsetY: 5, art: 80 },
} as const;

/** One footfall per maze cell so a step lands as the farmer enters the next square. */
export const FARMER_STEP_TILES = 1;

/** Idle while stopped; alternate walk frames by ground covered, not wall-clock time. */
export function farmerWalkFrame(moving: boolean, reducedMotion: boolean, traveledDistance: number): 'idle' | 0 | 1 {
  if (!moving || reducedMotion) return 'idle';
  return Math.floor(traveledDistance / FARMER_STEP_TILES) % 2 === 0 ? 0 : 1;
}

const CARDINALS: MazeCell[] = [
  { col: 0, row: -1 },
  { col: 1, row: 0 },
  { col: 0, row: 1 },
  { col: -1, row: 0 },
];

export function harvestLetters(answer: string) {
  return answer.replace(/[^A-Z]/g, '');
}

export function displayProgress(displayAnswer: string, harvestedCount: number) {
  let remaining = harvestedCount;
  return [...displayAnswer].map(ch => {
    if (ch === ' ') return { ch, filled: false, space: true as const };
    const filled = remaining > 0;
    if (filled) remaining -= 1;
    return { ch, filled, space: false as const };
  });
}

export function cellKey(cell: MazeCell) {
  return `${cell.col},${cell.row}`;
}

export function inBounds(puzzle: MazePuzzle, col: number, row: number) {
  return col >= 0 && row >= 0 && col < puzzle.cols && row < puzzle.rows;
}

export function terrainAt(puzzle: MazePuzzle, col: number, row: number): Terrain {
  if (!inBounds(puzzle, col, row)) return 'wall';
  return puzzle.terrain[row][col];
}

export function isAdjacent(a: MazeCell, b: MazeCell) {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row) === 1;
}

export function needsSolvePhase(puzzle: MazePuzzle) {
  return puzzle.presentationMode === 'partial' || puzzle.presentationMode === 'clue';
}

export function createMazeRun(puzzle: MazePuzzle, campaign = true): MazeRun {
  return {
    puzzleId: puzzle.id,
    player: { x: puzzle.spawn.col + 0.5, y: puzzle.spawn.row + 0.5 },
    facing: 'down',
    nextAnswerIndex: 0,
    harvestedCobIds: [],
    inspectedCobIds: [],
    elapsedActiveMs: 0,
    completed: false,
    solved: !needsSolvePhase(puzzle),
    started: false,
    campaign,
    usedAnswerHelp: false,
    usedReminder: false,
    usedFindNext: false,
    usedMower: false,
    usedTractor: false,
    usedLantern: false,
    usedRaincoat: false,
    usedHuskClip: false,
    usedScarecrow: false,
    lanternCount: 0,
    lanternActive: false,
    huskClipActive: false,
    huskClips: [],
    stormBonusMs: 0,
    barnFinds: {},
    pickedFindIds: [],
    exploredKeys: [cellKey(puzzle.spawn)],
    totalInspections: 0,
    traveledDistance: 0,
    cobMoves: {},
    vacated: [],
    wildlife: null,
    wildlifeResolved: 0,
    helpMarker: null,
    stormUntimed: false,
    stormExpired: false,
    mowedKeys: [],
    mowerCutsLeft: 0,
  };
}

export function parseMazeAscii(input: {
  id: string;
  seed: string;
  chapter: number;
  title: string;
  answer: string;
  clue: string;
  presentationMode?: PresentationMode;
  ascii: string;
  revealDurationMs: number;
}): MazePuzzle {
  const lines = input.ascii.trim().split('\n').map(line => line.trim());
  const rows = lines.length;
  const cols = lines[0]?.length ?? 0;
  const atSpawn = lines.some(line => line.includes('@'));
  const terrain: Terrain[][] = [];
  const cobs: MazeCob[] = [];
  let spawn: MazeCell | undefined;
  let cobIndex = 0;

  for (let row = 0; row < rows; row += 1) {
    if (lines[row].length !== cols) throw new Error(`Maze row ${row} has width ${lines[row].length}, expected ${cols}`);
    terrain[row] = [];
    for (let col = 0; col < cols; col += 1) {
      const ch = lines[row][col];
      if (ch === '@' || (ch === 'S' && !atSpawn)) {
        terrain[row][col] = 'path';
        spawn = { col, row };
      } else if (ch === '.') {
        terrain[row][col] = 'path';
      } else if (ch === '#') {
        terrain[row][col] = 'wall';
      } else if (/[A-Z]/.test(ch)) {
        terrain[row][col] = 'wall';
        cobs.push({
          id: `cob-${cobIndex}-${ch}`,
          letter: ch,
          wall: { col, row },
        } as MazeCob);
        cobIndex += 1;
      } else {
        throw new Error(`Unknown maze glyph "${ch}" at ${col},${row}`);
      }
    }
  }

  if (!spawn) throw new Error('Maze is missing spawn S');

  const puzzleBase: MazePuzzle = {
    id: input.id,
    seed: input.seed,
    chapter: input.chapter,
    title: input.title,
    answer: input.answer,
    clue: input.clue,
    presentationMode: input.presentationMode ?? 'full-word',
    cols,
    rows,
    terrain,
    spawn,
    cobs,
    revealDurationMs: input.revealDurationMs,
  };

  puzzleBase.cobs = cobs.map(cob => {
    const inspect = CARDINALS
      .map(dir => ({ col: cob.wall.col + dir.col, row: cob.wall.row + dir.row }))
      .find(cell => terrainAt(puzzleBase, cell.col, cell.row) === 'path');
    if (!inspect) throw new Error(`Cob ${cob.id} has no walkable inspect cell`);
    return { ...cob, inspect };
  });

  return puzzleBase;
}

export function floodFillPaths(puzzle: MazePuzzle, origin: MazeCell) {
  return floodFillWalk(puzzle, origin);
}

/** Path tiles plus interior decorative corn the mower can cut. */
export function floodFillPathsAllowingMow(puzzle: MazePuzzle, origin: MazeCell) {
  const dummy = createMazeRun(puzzle);
  return floodFillWalk(puzzle, origin, (col, row) => canMowCell(puzzle, dummy, col, row));
}

function floodFillWalk(puzzle: MazePuzzle, origin: MazeCell, extraWalkable?: (col: number, row: number) => boolean) {
  const seen = new Set<string>();
  const queue = [origin];
  if (terrainAt(puzzle, origin.col, origin.row) !== 'path') return seen;
  seen.add(cellKey(origin));
  while (queue.length) {
    const cell = queue.shift()!;
    for (const dir of CARDINALS) {
      const next = { col: cell.col + dir.col, row: cell.row + dir.row };
      const key = cellKey(next);
      if (seen.has(key)) continue;
      const walkable = terrainAt(puzzle, next.col, next.row) === 'path' || extraWalkable?.(next.col, next.row);
      if (!walkable) continue;
      seen.add(key);
      queue.push(next);
    }
  }
  return seen;
}

export function validateMazePuzzle(puzzle: MazePuzzle): string[] {
  const issues: string[] = [];
  if (!puzzle.id) issues.push('Puzzle is missing an id');
  if (!/^[A-Z]+$/.test(puzzle.answer)) issues.push('Answer must be A-Z letters');
  if (puzzle.cols < 3 || puzzle.rows < 3) issues.push('Maze is too small');
  if (puzzle.terrain.length !== puzzle.rows) issues.push('Terrain row count mismatch');
  if (puzzle.terrain.some(row => row.length !== puzzle.cols)) issues.push('Terrain col count mismatch');
  if (terrainAt(puzzle, puzzle.spawn.col, puzzle.spawn.row) !== 'path') issues.push('Spawn is not on a path');
  if (puzzle.revealDurationMs < 1) issues.push('Reveal duration must be positive');

  const cobIds = new Set<string>();
  const wallKeys = new Set<string>();
  for (const cob of puzzle.cobs) {
    if (cobIds.has(cob.id)) issues.push(`Duplicate cob id ${cob.id}`);
    cobIds.add(cob.id);
    if (!/^[A-Z]$/.test(cob.letter)) issues.push(`Cob ${cob.id} has a bad letter`);
    if (terrainAt(puzzle, cob.wall.col, cob.wall.row) !== 'wall') issues.push(`Cob ${cob.id} is not on a wall`);
    if (terrainAt(puzzle, cob.inspect.col, cob.inspect.row) !== 'path') issues.push(`Cob ${cob.id} inspect cell is not a path`);
    if (!isAdjacent(cob.wall, cob.inspect)) issues.push(`Cob ${cob.id} inspect cell is not adjacent`);
    const wall = cellKey(cob.wall);
    if (wallKeys.has(wall)) issues.push(`Two cobs share wall ${wall}`);
    wallKeys.add(wall);
  }

  const reachable = floodFillPathsAllowingMow(puzzle, puzzle.spawn);
  for (const cob of puzzle.cobs) {
    if (!reachable.has(cellKey(cob.inspect))) issues.push(`Cob ${cob.id} inspect cell is unreachable`);
  }

  const required = requiredLetterCounts(puzzle.answer);
  const available = letterCounts(puzzle.cobs.map(cob => cob.letter));
  for (const [letter, need] of required) {
    if ((available.get(letter) ?? 0) < need) issues.push(`Need ${need} ${letter} cobs, have ${available.get(letter) ?? 0}`);
  }

  return issues;
}

export function liveCobs(puzzle: MazePuzzle, run: MazeRun) {
  return puzzle.cobs.map(cob => {
    const moved = run.cobMoves[cob.id];
    return moved ? { ...cob, wall: moved.wall, inspect: moved.inspect } : cob;
  });
}

export function remainingLetterCounts(puzzle: MazePuzzle, run: MazeRun) {
  const leftover = harvestLetters(puzzle.answer).slice(run.nextAnswerIndex);
  return requiredLetterCounts(leftover);
}

export function requiredLetterCounts(word: string) {
  return letterCounts([...word]);
}

function letterCounts(letters: string[]) {
  const counts = new Map<string, number>();
  for (const letter of letters) counts.set(letter, (counts.get(letter) ?? 0) + 1);
  return counts;
}

export function availableCobs(puzzle: MazePuzzle, run: MazeRun) {
  return liveCobs(puzzle, run).filter(cob => !run.harvestedCobIds.includes(cob.id));
}

export function currentTarget(puzzle: MazePuzzle, run: MazeRun) {
  if (!run.solved) return '';
  return harvestLetters(puzzle.answer)[run.nextAnswerIndex] ?? '';
}

export function isWalkable(puzzle: MazePuzzle, run: MazeRun, col: number, row: number) {
  return terrainAt(puzzle, col, row) === 'path' || run.mowedKeys.includes(cellKey({ col, row }));
}

export function cobApproachCells(puzzle: MazePuzzle, cob: MazeCob, run?: MazeRun) {
  return CARDINALS
    .map(dir => ({ col: cob.wall.col + dir.col, row: cob.wall.row + dir.row }))
    .filter(cell => (run ? isWalkable(puzzle, run, cell.col, cell.row) : terrainAt(puzzle, cell.col, cell.row) === 'path'));
}

function playerNearCell(player: { x: number; y: number }, cell: MazeCell, range: number) {
  if (Math.floor(player.x) === cell.col && Math.floor(player.y) === cell.row) return true;
  return Math.hypot(player.x - (cell.col + 0.5), player.y - (cell.row + 0.5)) <= range;
}

export function cobsInRange(puzzle: MazePuzzle, run: MazeRun, range = MAZE_INSPECT_RANGE) {
  return availableCobs(puzzle, run).filter(cob => {
    const reach = Math.hypot(run.player.x - (cob.wall.col + 0.5), run.player.y - (cob.wall.row + 0.5));
    if (reach > Math.max(MAZE_PLANT_REACH, range)) return false;
    return cobApproachCells(puzzle, cob, run).some(cell => playerNearCell(run.player, cell, range));
  });
}

export function cobBlockedByWildlife(run: MazeRun, cobId: string) {
  const event = run.wildlife;
  return !!event && event.cobId === cobId && event.phase === 'active';
}

/** True when the farmer has turned toward this cob, including from the far side of the plant. */
export function farmerFacesCob(run: MazeRun, cob: MazeCob) {
  const look = facingStep(run.facing);
  const dx = cob.wall.col + 0.5 - run.player.x;
  const dy = cob.wall.row + 0.5 - run.player.y;
  const along = look.x * dx + look.y * dy;
  if (along <= 0.2) return false;
  const across = Math.abs(look.x * dy - look.y * dx);
  return across <= 0.72;
}

/** Letter plants in reach, facing or not. Peek and harvest use this; the husk letter is a timed reveal. */
export function nearbyLetterCobs(puzzle: MazePuzzle, run: MazeRun) {
  if (!run.solved || !run.started) return [];
  return cobsInRange(puzzle, run).filter(cob => !cobBlockedByWildlife(run, cob.id));
}

export function mazeRevealedIds(run: MazeRun, reveal: MazeReveal | null) {
  const active = revealIfActive(reveal, run.elapsedActiveMs);
  return [...new Set([
    ...(active ? [active.cobId] : []),
    ...clippedLetterIds(run),
  ])];
}

/** FIND-letter plants in range whose husk is showing (peek or husk clip). Facing is not required. */
export function harvestReadyCobs(puzzle: MazePuzzle, run: MazeRun, revealedIds: string[]) {
  const target = currentTarget(puzzle, run);
  if (!target) return [];
  return nearbyLetterCobs(puzzle, run).filter(cob => cob.letter === target && revealedIds.includes(cob.id));
}

export function visibleLetterCobs(puzzle: MazePuzzle, run: MazeRun) {
  return nearbyLetterCobs(puzzle, run).filter(cob => farmerFacesCob(run, cob));
}

export function markNearbyVisits(puzzle: MazePuzzle, run: MazeRun): MazeRun {
  const nearby = visibleLetterCobs(puzzle, run);
  if (!nearby.length) return run;
  let inspected = run.inspectedCobIds;
  let extra = 0;
  for (const cob of nearby) {
    if (inspected.includes(cob.id)) continue;
    inspected = [...inspected, cob.id];
    extra += 1;
  }
  if (!extra) return run;
  return { ...run, inspectedCobIds: inspected, totalInspections: run.totalInspections + extra };
}

export function inspectCob(puzzle: MazePuzzle, run: MazeRun, cobId: string, elapsedActiveMs: number):
  | { ok: true; run: MazeRun; reveal: MazeReveal }
  | { ok: false; reason: 'range' | 'missing' | 'complete' | 'locked' | 'blocked' } {
  if (!run.solved) return { ok: false, reason: 'locked' };
  if (run.completed) return { ok: false, reason: 'complete' };
  if (cobBlockedByWildlife(run, cobId)) return { ok: false, reason: 'blocked' };
  const cob = availableCobs(puzzle, run).find(item => item.id === cobId);
  if (!cob) return { ok: false, reason: 'missing' };
  if (!cobsInRange(puzzle, run).some(item => item.id === cobId)) return { ok: false, reason: 'range' };
  const firstVisit = !run.inspectedCobIds.includes(cobId);
  const inspected = firstVisit ? [...run.inspectedCobIds, cobId] : run.inspectedCobIds;
  return {
    ok: true,
    run: { ...run, inspectedCobIds: inspected, elapsedActiveMs, totalInspections: run.totalInspections + (firstVisit ? 1 : 0) },
    reveal: { cobId, hideAtElapsedMs: elapsedActiveMs + peekDurationMs(puzzle, run) },
  };
}

export function revealIfActive(reveal: MazeReveal | null, elapsedActiveMs: number) {
  if (!reveal) return null;
  if (elapsedActiveMs >= reveal.hideAtElapsedMs) return null;
  return reveal;
}

export function peekDurationMs(puzzle: MazePuzzle, run: MazeRun) {
  return puzzle.revealDurationMs;
}

export function clippedLetterIds(run: MazeRun) {
  return run.huskClips.filter(id => !run.harvestedCobIds.includes(id));
}

export function clipFacingHusk(puzzle: MazePuzzle, run: MazeRun):
  | { ok: true; run: MazeRun; cobId: string }
  | { ok: false; reason: string } {
  const faced = visibleLetterCobs(puzzle, run);
  if (!faced.length) return { ok: false, reason: 'Face a letter plant to clip its husk.' };
  const cob = faced.reduce((best, item) => {
    const dist = Math.hypot(run.player.x - (item.wall.col + 0.5), run.player.y - (item.wall.row + 0.5));
    const bestDist = Math.hypot(run.player.x - (best.wall.col + 0.5), run.player.y - (best.wall.row + 0.5));
    return dist < bestDist ? item : best;
  });
  if (run.huskClips.includes(cob.id)) return { ok: false, reason: 'That husk is already clipped open.' };
  const inspected = run.inspectedCobIds.includes(cob.id) ? run.inspectedCobIds : [...run.inspectedCobIds, cob.id];
  return {
    ok: true,
    cobId: cob.id,
    run: {
      ...run,
      huskClips: [...run.huskClips, cob.id],
      huskClipActive: true,
      usedHuskClip: true,
      inspectedCobIds: inspected,
      totalInspections: run.totalInspections + (inspected.length === run.inspectedCobIds.length ? 0 : 1),
    },
  };
}

export function harvestCob(puzzle: MazePuzzle, run: MazeRun, cobId: string, _reveal: MazeReveal | null, options?: { ignoreRange?: boolean }):
  | { ok: true; run: MazeRun; completedNow: boolean }
  | { ok: false; reason: 'range' | 'missing' | 'hidden' | 'wrong' | 'complete' | 'locked' | 'blocked' } {
  if (!run.solved) return { ok: false, reason: 'locked' };
  if (run.completed) return { ok: false, reason: 'complete' };
  if (cobBlockedByWildlife(run, cobId)) return { ok: false, reason: 'blocked' };
  const cob = availableCobs(puzzle, run).find(item => item.id === cobId);
  if (!cob) return { ok: false, reason: 'missing' };
  if (!options?.ignoreRange && !cobsInRange(puzzle, run).some(item => item.id === cobId)) return { ok: false, reason: 'range' };
  const target = currentTarget(puzzle, run);
  if (cob.letter !== target) return { ok: false, reason: 'wrong' };
  const letters = harvestLetters(puzzle.answer);
  const nextIndex = run.nextAnswerIndex + 1;
  const completed = nextIndex >= letters.length;
  return {
    ok: true,
    completedNow: completed,
    run: {
      ...run,
      nextAnswerIndex: nextIndex,
      harvestedCobIds: [...run.harvestedCobIds, cobId],
      inspectedCobIds: run.inspectedCobIds.includes(cobId) ? run.inspectedCobIds : [...run.inspectedCobIds, cobId],
      completed,
      wildlife: completed ? null : run.wildlife,
    },
  };
}

export function mazeScore(puzzle: MazePuzzle, run: MazeRun, alreadyRewarded: boolean) {
  const letters = run.nextAnswerIndex * MAZE_POINTS_PER_LETTER;
  const bonus = run.completed && !alreadyRewarded && run.campaign !== false ? MAZE_FIRST_COMPLETION_BONUS : 0;
  return { letters, bonus, total: letters + bonus };
}

export function mazeUnaided(run: MazeRun) {
  return !run.usedAnswerHelp && !run.usedReminder && !run.usedFindNext
    && !run.usedMower && !run.usedTractor && !run.usedLantern && !run.usedRaincoat
    && !run.usedHuskClip && !run.usedScarecrow;
}

export function barnFindCount(run: MazeRun, tool: ToolId) {
  return Math.max(0, Math.floor(Number(run.barnFinds[tool]) || 0));
}

export function unusedBarnFinds(run: MazeRun): Partial<Inventory> {
  const leftover: Partial<Inventory> = {};
  for (const [tool, amount] of Object.entries(run.barnFinds)) {
    const count = Math.floor(Number(amount) || 0);
    if (count > 0) leftover[tool as ToolId] = count;
  }
  return leftover;
}

export function consumeBarnFind(run: MazeRun, tool: ToolId): MazeRun | null {
  const count = barnFindCount(run, tool);
  if (count < 1) return null;
  return { ...run, barnFinds: { ...run.barnFinds, [tool]: count - 1 } };
}

export function nearestCellCenter(value: number) {
  return Math.round(value - 0.5) + 0.5;
}

export function facingFromVector(vx: number, vy: number, fallback: MazeFacing): MazeFacing {
  if (Math.abs(vx) < MAZE_STICK_DEADZONE && Math.abs(vy) < MAZE_STICK_DEADZONE) return fallback;
  if (Math.abs(vx) > Math.abs(vy)) return vx > 0 ? 'right' : 'left';
  return vy > 0 ? 'down' : 'up';
}

export function steerMazeInput(vx: number, vy: number, facing: MazeFacing) {
  const magnitude = Math.hypot(vx, vy);
  if (magnitude < MAZE_STICK_DEADZONE) return { x: 0, y: 0 };
  const alongX = facing === 'left' || facing === 'right';
  const pickX = alongX
    ? Math.abs(vy) < Math.abs(vx) * MAZE_AXIS_LOCK
    : Math.abs(vx) > Math.abs(vy) * MAZE_AXIS_LOCK;
  const raw = pickX ? Math.abs(vx) : Math.abs(vy);
  const t = Math.min(1, Math.max(0, (raw - MAZE_STICK_DEADZONE) / (1 - MAZE_STICK_DEADZONE)));
  const speed = t * (0.45 + 0.55 * t);
  if (pickX) return { x: Math.sign(vx) * speed, y: 0 };
  return { x: 0, y: Math.sign(vy) * speed };
}

function isPath(puzzle: MazePuzzle, run: MazeRun, col: number, row: number) {
  return isWalkable(puzzle, run, col, row);
}

/** Lane center the farmer should slide onto to enter the opening ahead. */
function funnelLane(puzzle: MazePuzzle, run: MazeRun, x: number, y: number, dx: number, dy: number) {
  let best: number | null = null;
  let bestDist = MAZE_FUNNEL_WINDOW;
  if (dx !== 0) {
    const ahead = Math.floor(x) + (dx > 0 ? 1 : -1);
    const row = Math.floor(y);
    for (const off of [0, -1, 1]) {
      if (!isPath(puzzle, run, ahead, row + off)) continue;
      const center = row + off + 0.5;
      const dist = Math.abs(y - center);
      if (dist <= bestDist) {
        best = center;
        bestDist = dist;
      }
    }
    return best ?? nearestCellCenter(y);
  }
  const ahead = Math.floor(y) + (dy > 0 ? 1 : -1);
  const col = Math.floor(x);
  for (const off of [0, -1, 1]) {
    if (!isPath(puzzle, run, col + off, ahead)) continue;
    const center = col + off + 0.5;
    const dist = Math.abs(x - center);
    if (dist <= bestDist) {
      best = center;
      bestDist = dist;
    }
  }
  return best ?? nearestCellCenter(x);
}

function slideToward(puzzle: MazePuzzle, run: MazeRun, x: number, y: number, axis: 'x' | 'y', target: number, dt: number) {
  const current = axis === 'x' ? x : y;
  const eased = easeToward(current, target, dt, MAZE_LANE_RATE);
  return axis === 'x' ? tryAxis(puzzle, run, x, y, eased, y) : tryAxis(puzzle, run, x, y, x, eased);
}

function facingStep(facing: MazeFacing) {
  if (facing === 'left') return { col: -1, row: 0, x: -1, y: 0 };
  if (facing === 'right') return { col: 1, row: 0, x: 1, y: 0 };
  if (facing === 'up') return { col: 0, row: -1, x: 0, y: -1 };
  return { col: 0, row: 1, x: 0, y: 1 };
}

export function facingDelta(facing: MazeFacing) {
  return facingStep(facing);
}

function wallHit(puzzle: MazePuzzle, run: MazeRun, x: number, y: number) {
  const samples: MazeCell[] = [
    { col: Math.floor(x - MAZE_PLAYER_RADIUS), row: Math.floor(y - MAZE_PLAYER_RADIUS) },
    { col: Math.floor(x + MAZE_PLAYER_RADIUS), row: Math.floor(y - MAZE_PLAYER_RADIUS) },
    { col: Math.floor(x - MAZE_PLAYER_RADIUS), row: Math.floor(y + MAZE_PLAYER_RADIUS) },
    { col: Math.floor(x + MAZE_PLAYER_RADIUS), row: Math.floor(y + MAZE_PLAYER_RADIUS) },
  ];
  return samples.some(cell => !isWalkable(puzzle, run, cell.col, cell.row));
}

function clampPlayer(puzzle: MazePuzzle, x: number, y: number) {
  const min = MAZE_PLAYER_RADIUS + 0.02;
  return {
    x: Math.min(puzzle.cols - min, Math.max(min, x)),
    y: Math.min(puzzle.rows - min, Math.max(min, y)),
  };
}

function tryAxis(puzzle: MazePuzzle, run: MazeRun, x: number, y: number, nextX: number, nextY: number) {
  const movedX = !wallHit(puzzle, run, nextX, y) ? nextX : x;
  const movedY = !wallHit(puzzle, run, movedX, nextY) ? nextY : y;
  return clampPlayer(puzzle, movedX, movedY);
}

function easeToward(value: number, target: number, dt: number, rate: number) {
  const next = value + (target - value) * (1 - Math.exp(-rate * dt));
  return Math.abs(next - target) < 0.02 ? target : next;
}

function settleAxis(puzzle: MazePuzzle, run: MazeRun, x: number, y: number, axis: 'x' | 'y', dt: number, rate: number) {
  const current = axis === 'x' ? x : y;
  const eased = easeToward(current, nearestCellCenter(current), dt, rate);
  return axis === 'x' ? tryAxis(puzzle, run, x, y, eased, y) : tryAxis(puzzle, run, x, y, x, eased);
}

function movedOnStick(before: { x: number; y: number }, after: { x: number; y: number }, stick: { x: number; y: number }) {
  return (stick.x !== 0 && after.x !== before.x) || (stick.y !== 0 && after.y !== before.y);
}

function cobWallAhead(puzzle: MazePuzzle, run: MazeRun, x: number, y: number, dx: number, dy: number) {
  const aheadCol = dx !== 0 ? Math.floor(x) + Math.sign(dx) : Math.floor(x);
  const aheadRow = dy !== 0 ? Math.floor(y) + Math.sign(dy) : Math.floor(y);
  return liveCobs(puzzle, run).find(cob => cob.wall.col === aheadCol && cob.wall.row === aheadRow) ?? null;
}

function blockedWallCell(puzzle: MazePuzzle, run: MazeRun, x: number, y: number, dx: number, dy: number) {
  const probeX = x + Math.sign(dx) * (MAZE_PLAYER_RADIUS + 0.08);
  const probeY = y + Math.sign(dy) * (MAZE_PLAYER_RADIUS + 0.08);
  const col = Math.floor(dx !== 0 ? probeX : x);
  const row = Math.floor(dy !== 0 ? probeY : y);
  if (isWalkable(puzzle, run, col, row)) return null;
  return { col, row };
}

function tryMowAhead(puzzle: MazePuzzle, run: MazeRun, x: number, y: number, dx: number, dy: number): MazeRun {
  if (run.mowerCutsLeft < 1) return run;
  const blocked = blockedWallCell(puzzle, run, x, y, dx, dy);
  if (!blocked || !canMowCell(puzzle, run, blocked.col, blocked.row)) return run;
  return {
    ...run,
    mowedKeys: [...run.mowedKeys, cellKey(blocked)],
    mowerCutsLeft: run.mowerCutsLeft - 1,
  };
}

export function movePlayer(puzzle: MazePuzzle, run: MazeRun, vx: number, vy: number, dt: number): MazeRun {
  if (run.completed) return run;
  const stick = steerMazeInput(vx, vy, run.facing);
  let { x, y } = run.player;
  if (stick.x === 0 && stick.y === 0) {
    ({ x, y } = settleAxis(puzzle, run, x, y, 'x', dt, MAZE_SETTLE_RATE));
    ({ x, y } = settleAxis(puzzle, run, x, y, 'y', dt, MAZE_SETTLE_RATE));
    return { ...run, player: { x, y } };
  }
  const lane = funnelLane(puzzle, run, x, y, stick.x, stick.y);
  ({ x, y } = stick.x !== 0
    ? slideToward(puzzle, run, x, y, 'y', lane, dt)
    : slideToward(puzzle, run, x, y, 'x', lane, dt));
  const step = MAZE_WALK_SPEED * dt;
  const before = { x, y };
  let nextRun = run;
  let next = tryAxis(puzzle, nextRun, x, y, x + stick.x * step, y + stick.y * step);
  if (!movedOnStick(before, next, stick)) {
    nextRun = tryMowAhead(puzzle, nextRun, x, y, stick.x, stick.y);
    next = tryAxis(puzzle, nextRun, x, y, x + stick.x * step, y + stick.y * step);
  }
  if (!movedOnStick(before, next, stick)) {
    const offset = stick.x !== 0 ? Math.abs(y - lane) : Math.abs(x - lane);
    if (offset <= MAZE_CORNER_SNAP) {
      const snapped = stick.x !== 0
        ? tryAxis(puzzle, nextRun, x, y, x, lane)
        : tryAxis(puzzle, nextRun, x, y, lane, y);
      next = tryAxis(puzzle, nextRun, snapped.x, snapped.y, snapped.x + stick.x * step, snapped.y + stick.y * step);
    }
  }
  if (!movedOnStick(before, next, stick)) {
    const slip = facingStep(run.facing);
    const turning = (slip.x !== 0 && stick.x === 0) || (slip.y !== 0 && stick.y === 0);
    if (turning) {
      const toward = stick.y !== 0 ? Math.sign(lane - next.x) : Math.sign(lane - next.y);
      if (toward !== 0) {
        const crawl = toward * step;
        const goal = stick.y !== 0
          ? tryAxis(puzzle, nextRun, next.x, next.y, next.x + crawl, next.y)
          : tryAxis(puzzle, nextRun, next.x, next.y, next.x, next.y + crawl);
        next = stick.y !== 0
          ? tryAxis(puzzle, nextRun, next.x, next.y, toward > 0 ? Math.min(goal.x, lane) : Math.max(goal.x, lane), next.y)
          : tryAxis(puzzle, nextRun, next.x, next.y, next.x, toward > 0 ? Math.min(goal.y, lane) : Math.max(goal.y, lane));
      }
    }
  }
  const advanced = movedOnStick(before, next, stick);
  const aligned = stick.x !== 0 ? Math.abs(next.y - lane) <= MAZE_CORNER_SNAP : Math.abs(next.x - lane) <= MAZE_CORNER_SNAP;
  let facing = run.facing;
  if (advanced && aligned) {
    facing = facingFromVector(stick.x, stick.y, run.facing);
  } else if (!advanced && cobWallAhead(puzzle, nextRun, next.x, next.y, stick.x, stick.y)) {
    facing = facingFromVector(stick.x, stick.y, run.facing);
    // Stay against the husk. Snapping the approach axis back to cell center is the bounce.
    next = stick.x !== 0
      ? tryAxis(puzzle, nextRun, next.x, next.y, next.x, easeToward(next.y, nearestCellCenter(next.y), dt, MAZE_SETTLE_RATE))
      : tryAxis(puzzle, nextRun, next.x, next.y, easeToward(next.x, nearestCellCenter(next.x), dt, MAZE_SETTLE_RATE), next.y);
  }
  return { ...nextRun, player: next, facing };
}

export function restoreMazeRun(puzzle: MazePuzzle, value: unknown): MazeRun {
  const fresh = createMazeRun(puzzle);
  if (!value || typeof value !== 'object') return fresh;
  const saved = value as Partial<MazeRun>;
  if (saved.puzzleId !== puzzle.id) return fresh;
  const harvested = Array.isArray(saved.harvestedCobIds) ? saved.harvestedCobIds.filter(id => puzzle.cobs.some(cob => cob.id === id)) : [];
  const inspected = Array.isArray(saved.inspectedCobIds) ? saved.inspectedCobIds.filter(id => puzzle.cobs.some(cob => cob.id === id)) : [];
  const x = Number(saved.player?.x);
  const y = Number(saved.player?.y);
  const letters = harvestLetters(puzzle.answer);
  const nextAnswerIndex = Math.min(letters.length, Math.max(0, Math.floor(Number(saved.nextAnswerIndex) || 0)));
  const mowedKeys = Array.isArray(saved.mowedKeys)
    ? saved.mowedKeys.filter((key): key is string => typeof key === 'string')
    : [];
  const mowerCutsLeft = Math.max(0, Math.min(MAZE_MOWER_CUTS, Math.floor(Number(saved.mowerCutsLeft) || 0)));
  const restoredWalk = { ...fresh, mowedKeys, mowerCutsLeft };
  const player = Number.isFinite(x) && Number.isFinite(y) && !wallHit(puzzle, restoredWalk, x, y)
    ? { x, y }
    : fresh.player;
  const solved = needsSolvePhase(puzzle) ? saved.solved === true : true;
  const cobMoves = saved.cobMoves && typeof saved.cobMoves === 'object' ? saved.cobMoves : {};
  const exploredKeys = Array.isArray(saved.exploredKeys) ? saved.exploredKeys.filter(key => typeof key === 'string') : fresh.exploredKeys;
  const rawClips = Array.isArray((value as { huskClips?: unknown }).huskClips)
    ? (value as { huskClips: unknown[] }).huskClips
    : [];
  const huskClips = [...new Set(rawClips.map(clip => {
    if (typeof clip === 'string') return clip;
    if (clip && typeof clip === 'object' && 'cobId' in clip && typeof clip.cobId === 'string') return clip.cobId;
    return null;
  }).filter((id): id is string => !!id))];
  return {
    puzzleId: puzzle.id,
    player,
    facing: saved.facing === 'up' || saved.facing === 'down' || saved.facing === 'left' || saved.facing === 'right' ? saved.facing : 'down',
    nextAnswerIndex,
    harvestedCobIds: harvested,
    inspectedCobIds: inspected,
    elapsedActiveMs: Math.max(0, Math.floor(Number(saved.elapsedActiveMs) || 0)),
    completed: nextAnswerIndex >= letters.length,
    solved,
    started: saved.started === true || nextAnswerIndex > 0 || harvested.length > 0,
    campaign: saved.campaign !== false,
    usedAnswerHelp: saved.usedAnswerHelp === true,
    usedReminder: saved.usedReminder === true,
    usedFindNext: saved.usedFindNext === true,
    usedMower: saved.usedMower === true,
    usedTractor: saved.usedTractor === true,
    usedLantern: saved.usedLantern === true,
    usedRaincoat: saved.usedRaincoat === true,
    usedHuskClip: saved.usedHuskClip === true,
    usedScarecrow: saved.usedScarecrow === true,
    lanternCount: Math.min(4, Math.max(0, Math.floor(Number(saved.lanternCount) || (saved.lanternActive === true ? 1 : 0)))),
    lanternActive: (saved.lanternActive === true) || Math.floor(Number(saved.lanternCount) || 0) > 0,
    huskClipActive: saved.huskClipActive === true || huskClips.length > 0,
    huskClips,
    stormBonusMs: Math.max(0, Math.floor(Number(saved.stormBonusMs) || 0)),
    barnFinds: saved.barnFinds && typeof saved.barnFinds === 'object' ? saved.barnFinds : {},
    pickedFindIds: Array.isArray(saved.pickedFindIds) ? saved.pickedFindIds.filter(id => typeof id === 'string') : [],
    exploredKeys: exploredKeys.length ? exploredKeys : fresh.exploredKeys,
    totalInspections: Math.max(inspected.length, Math.floor(Number(saved.totalInspections) || 0)),
    traveledDistance: Math.max(0, Number(saved.traveledDistance) || 0),
    cobMoves,
    vacated: Array.isArray(saved.vacated) ? saved.vacated.filter(cell => Number.isFinite(cell?.col) && Number.isFinite(cell?.row)) : [],
    wildlife: saved.wildlife && typeof saved.wildlife === 'object' ? saved.wildlife : null,
    wildlifeResolved: Math.max(0, Math.floor(Number(saved.wildlifeResolved) || 0)),
    helpMarker: saved.helpMarker && typeof saved.helpMarker === 'object' ? saved.helpMarker : null,
    stormUntimed: saved.stormUntimed === true,
    stormExpired: saved.stormExpired === true,
    mowedKeys,
    mowerCutsLeft,
  };
}
