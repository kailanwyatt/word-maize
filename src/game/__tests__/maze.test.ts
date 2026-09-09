import { describe, expect, it } from 'vitest';
import { CORN_MAZE, validateMazeLevels } from '../../data/mazeLevels';
import {
  farmerWalkFrame,
  cobsInRange,
  createMazeRun,
  currentTarget,
  facingFromVector,
  harvestCob,
  isWalkable,
  cellKey,
  inspectCob,
  markNearbyVisits,
  mazeScore,
  movePlayer,
  nearestCellCenter,
  parseMazeAscii,
  remainingLetterCounts,
  restoreMazeRun,
  steerMazeInput,
  validateMazePuzzle,
  visibleLetterCobs,
  type MazeRun,
} from '../maze';
import { canMowCell, cutMowerLine } from '../mazeMower';

describe('CORN maze', () => {
  it('ships a solvable authored board with two decoys', () => {
    expect(validateMazeLevels()).toEqual([]);
    expect(CORN_MAZE.answer).toBe('CORN');
    expect(CORN_MAZE.revealDurationMs).toBe(4000);
    expect(CORN_MAZE.cobs.map(cob => cob.letter).sort().join('')).toBe('ACENOR');
    expect(validateMazePuzzle(CORN_MAZE)).toEqual([]);
  });

  it('blocks walking into corn walls and keeps the spawn reachable', () => {
    const run = createMazeRun(CORN_MAZE);
    const blocked = movePlayer(CORN_MAZE, run, 0, -1, 0.4);
    expect(blocked.player.y).toBeGreaterThan(0.4);
    const start = createMazeRun(CORN_MAZE);
    expect(start.player).toEqual({ x: CORN_MAZE.spawn.col + 0.5, y: CORN_MAZE.spawn.row + 0.5 });
  });

  it('locks analog drift to one corridor and settles onto a cell when released', () => {
    const run = createMazeRun(CORN_MAZE);
    const walking = movePlayer(CORN_MAZE, run, 1, 0.28, 0.2);
    expect(walking.facing).toBe('right');
    expect(walking.player.x).toBeGreaterThan(run.player.x);
    expect(walking.player.y).toBeCloseTo(run.player.y, 5);

    const crawl = movePlayer(CORN_MAZE, run, 0.4, 0, 0.2);
    const sprint = movePlayer(CORN_MAZE, run, 1, 0, 0.2);
    expect(sprint.player.x - run.player.x).toBeGreaterThan((crawl.player.x - run.player.x) * 2);

    const off = {
      ...run,
      player: { x: run.player.x + 0.36, y: run.player.y + 0.3 },
    };
    const settled = movePlayer(CORN_MAZE, off, 0, 0, 0.25);
    expect(Math.abs(settled.player.x - nearestCellCenter(off.player.x))).toBeLessThan(Math.abs(off.player.x - nearestCellCenter(off.player.x)));
    expect(Math.abs(settled.player.y - nearestCellCenter(off.player.y))).toBeLessThan(Math.abs(off.player.y - nearestCellCenter(off.player.y)));
  });

  it('keeps walking the current lane until the stick clearly asks for a turn', () => {
    const run = { ...createMazeRun(CORN_MAZE), facing: 'right' as const };
    const continueLane = steerMazeInput(0.55, 0.4, run.facing);
    expect(continueLane.y).toBe(0);
    expect(continueLane.x).toBeGreaterThan(0);
    const turn = steerMazeInput(0.35, 0.85, run.facing);
    expect(turn.x).toBe(0);
    expect(turn.y).toBeGreaterThan(0);
  });

  it('slides around a corner to enter a nearby lane instead of catching the wall', () => {
    const maze = parseMazeAscii({
      id: 'funnel-corner',
      seed: 'funnel',
      chapter: 1,
      title: 'Funnel',
      answer: 'A',
      clue: 'A',
      ascii: `
#####
###.#
#S..#
#####
      `,
      revealDurationMs: 1000,
    });
    let run: MazeRun = { ...createMazeRun(maze), player: { x: 3.22, y: 2.5 }, facing: 'right' };
    for (let i = 0; i < 10; i += 1) run = movePlayer(maze, run, 0, -1, 0.04);
    expect(run.player.y).toBeLessThan(2.15);
    expect(Math.abs(run.player.x - 3.5)).toBeLessThan(0.12);

    run = { ...createMazeRun(maze), player: { x: 2.92, y: 2.5 }, facing: 'right' };
    for (let i = 0; i < 16; i += 1) run = movePlayer(maze, run, 0, -1, 0.04);
    expect(run.player.y).toBeLessThan(2.15);
    expect(Math.abs(run.player.x - 3.5)).toBeLessThan(0.16);
    expect(run.player.y).toBeLessThan(2.15);
    expect(Math.abs(run.player.x - 3.5)).toBeLessThan(0.16);
  });

  it('inspects from any open side of a plant, not only the designated inspect cell', () => {
    const maze = parseMazeAscii({
      id: 'any-side',
      seed: 'any-side',
      chapter: 1,
      title: 'Any side',
      answer: 'A',
      clue: 'A',
      ascii: `
#####
#.A.#
#.S.#
#####
      `,
      revealDurationMs: 1000,
    });
    const cob = maze.cobs[0];
    expect(cob.inspect).toEqual({ col: 3, row: 1 });
    const south = { ...createMazeRun(maze), player: { x: cob.wall.col + 0.5, y: cob.wall.row + 1.5 }, facing: 'down' as const };
    expect(cobsInRange(maze, south).map(item => item.id)).toEqual([cob.id]);
    expect(inspectCob(maze, south, cob.id, 0).ok).toBe(true);

    const west = { ...south, player: { x: cob.wall.col - 0.5, y: cob.wall.row + 0.5 } };
    expect(inspectCob(maze, west, cob.id, 0).ok).toBe(true);
  });

  it('does not auto-select a plant when another cob stands opposite the farmer', () => {
    const maze = parseMazeAscii({
      id: 'opposite-cobs',
      seed: 'opposite',
      chapter: 1,
      title: 'Opposite',
      answer: 'AB',
      clue: 'AB',
      ascii: `
#####
#.A.#
#.S.#
#.B.#
#####
      `,
      revealDurationMs: 1000,
    });
    const run = createMazeRun(maze);
    expect(cobsInRange(maze, run)).toHaveLength(2);
  });

  it('reveals only the cob the farmer is facing, including from the far side', () => {
    const maze = parseMazeAscii({
      id: 'face-cobs',
      seed: 'face',
      chapter: 1,
      title: 'Face',
      answer: 'NE',
      clue: 'NE',
      ascii: `
#####
#...#
#.N.#
#.S.#
#.E.#
#...#
#####
      `,
      revealDurationMs: 1000,
    });
    const north = maze.cobs.find(cob => cob.letter === 'N')!;
    const south = maze.cobs.find(cob => cob.letter === 'E')!;
    const between = { ...createMazeRun(maze), solved: true, started: true, facing: 'up' as const };
    expect(visibleLetterCobs(maze, between).map(cob => cob.letter)).toEqual(['N']);
    expect(visibleLetterCobs(maze, { ...between, facing: 'down' }).map(cob => cob.letter)).toEqual(['E']);

    const farSide = {
      ...between,
      player: { x: south.wall.col + 0.5, y: south.wall.row + 1.5 },
      facing: 'up' as const,
    };
    expect(cobsInRange(maze, farSide).map(cob => cob.id)).toEqual([south.id]);
    expect(visibleLetterCobs(maze, farSide).map(cob => cob.letter)).toEqual(['E']);
    expect(visibleLetterCobs(maze, { ...farSide, facing: 'down' }).map(cob => cob.letter)).toEqual([]);
    expect(visibleLetterCobs(maze, { ...between, player: { x: north.wall.col + 0.5, y: north.wall.row - 0.5 }, facing: 'down' }).map(cob => cob.letter)).toEqual(['N']);
  });

  it('keeps a husk closed until the farmer turns toward the plant', () => {
    const maze = parseMazeAscii({
      id: 'turn-to-peek',
      seed: 'turn-to-peek',
      chapter: 1,
      title: 'Turn',
      answer: 'N',
      clue: 'N',
      ascii: `
#####
#...#
#.N.#
#.S.#
#####
      `,
      revealDurationMs: 1000,
    });
    const cob = maze.cobs[0];
    const beside = {
      ...createMazeRun(maze),
      solved: true,
      started: true,
      player: { x: cob.wall.col + 0.5, y: cob.wall.row - 0.5 },
      facing: 'right' as const,
    };
    expect(cobsInRange(maze, beside).map(item => item.id)).toEqual([cob.id]);
    expect(visibleLetterCobs(maze, beside)).toEqual([]);
    const approaching = { ...beside, player: { x: cob.wall.col - 0.1, y: cob.wall.row - 0.5 } };
    expect(cobsInRange(maze, approaching).map(item => item.id)).toEqual([cob.id]);
    expect(visibleLetterCobs(maze, approaching)).toEqual([]);
    expect(visibleLetterCobs(maze, { ...beside, facing: 'down' }).map(item => item.letter)).toEqual(['N']);
  });

  it('turns in place to face a side plant instead of bouncing off the husk', () => {
    const maze = parseMazeAscii({
      id: 'side-turn-peek',
      seed: 'side-turn-peek',
      chapter: 1,
      title: 'Side turn',
      answer: 'A',
      clue: 'A',
      ascii: `
#####
#S..#
#.A.#
#####
      `,
      revealDurationMs: 1000,
    });
    const cob = maze.cobs[0];
    let run: MazeRun = {
      ...createMazeRun(maze),
      solved: true,
      started: true,
      player: { x: cob.wall.col + 0.5, y: cob.wall.row - 0.5 },
      facing: 'right',
    };
    expect(cobsInRange(maze, run).map(item => item.id)).toEqual([cob.id]);
    expect(visibleLetterCobs(maze, run)).toEqual([]);
    const startY = run.player.y;
    for (let i = 0; i < 10; i += 1) run = movePlayer(maze, run, 0, 1, 0.04);
    expect(run.facing).toBe('down');
    expect(run.player.y).toBeLessThan(startY + 0.35);
    expect(Math.abs(run.player.x - (cob.wall.col + 0.5))).toBeLessThan(0.08);
    expect(visibleLetterCobs(maze, run).map(item => item.letter)).toEqual(['A']);
    expect(markNearbyVisits(maze, run).inspectedCobIds).toContain(cob.id);
  });

  it('walks up to a plant, peeks there, and does not snap back to the square center', () => {
    const maze = parseMazeAscii({
      id: 'no-husk-bounce',
      seed: 'no-husk-bounce',
      chapter: 1,
      title: 'No bounce',
      answer: 'A',
      clue: 'A',
      ascii: `
#####
#.A.#
#.S.#
#####
      `,
      revealDurationMs: 1000,
    });
    const start: MazeRun = { ...createMazeRun(maze), solved: true, started: true, facing: 'down' };
    const origin = { ...start.player };
    let run = start;
    for (let i = 0; i < 16; i += 1) run = movePlayer(maze, run, 0, -1, 0.04);
    expect(run.facing).toBe('up');
    expect(run.player.x).toBeCloseTo(origin.x, 5);
    expect(run.player.y).toBeLessThan(origin.y - 0.08);
    expect(visibleLetterCobs(maze, run).map(item => item.letter)).toEqual(['A']);
    const parked = run.player.y;
    for (let i = 0; i < 10; i += 1) run = movePlayer(maze, run, 0, -1, 0.04);
    expect(run.player.y).toBeCloseTo(parked, 3);
  });

  it('counts standing anywhere in the adjacent square as in range of a plant', () => {
    const maze = parseMazeAscii({
      id: 'square-range',
      seed: 'square-range',
      chapter: 1,
      title: 'Square',
      answer: 'A',
      clue: 'A',
      ascii: `
#####
#.A.#
#.S.#
#####
      `,
      revealDurationMs: 1000,
    });
    const cob = maze.cobs[0];
    const corner = {
      ...createMazeRun(maze),
      solved: true,
      started: true,
      player: { x: cob.wall.col + 0.08, y: cob.wall.row + 1.08 },
      facing: 'up' as const,
    };
    expect(cobsInRange(maze, corner).map(item => item.id)).toEqual([cob.id]);
    expect(visibleLetterCobs(maze, corner).map(item => item.letter)).toEqual(['A']);
    const farLip = {
      ...corner,
      player: { x: cob.wall.col + 0.5, y: cob.wall.row + 1.85 },
    };
    expect(cobsInRange(maze, farLip)).toEqual([]);
  });

  it('reveals a letter while standing beside a plant and harvests without inspect', () => {
    const cob = CORN_MAZE.cobs.find(item => item.letter === 'C')!;
    const far = { ...createMazeRun(CORN_MAZE), solved: true, started: true };
    expect(visibleLetterCobs(CORN_MAZE, far).map(item => item.id)).not.toContain(cob.id);
    expect(harvestCob(CORN_MAZE, far, cob.id, null).ok).toBe(false);
    const atPlant = { x: cob.inspect.col + 0.5, y: cob.inspect.row + 0.5 };
    const near = { ...far, player: atPlant, facing: facingFromVector(cob.wall.col + 0.5 - atPlant.x, cob.wall.row + 0.5 - atPlant.y, 'down') };
    expect(visibleLetterCobs(CORN_MAZE, near).map(item => item.id)).toEqual([cob.id]);
    const visited = markNearbyVisits(CORN_MAZE, near);
    expect(visited.inspectedCobIds).toContain(cob.id);
    const harvested = harvestCob(CORN_MAZE, visited, cob.id, null);
    expect(harvested.ok).toBe(true);
  });

  it('harvests C then O then R then N, ignores a decoy, and scores 650 once', () => {
    let run = createMazeRun(CORN_MAZE);
    const order = ['C', 'O', 'R', 'N'] as const;
    for (const letter of order) {
      const cob = CORN_MAZE.cobs.find(item => item.letter === letter && !run.harvestedCobIds.includes(item.id))!;
      run = { ...run, player: { x: cob.inspect.col + 0.5, y: cob.inspect.row + 0.5 } };
      const harvested = harvestCob(CORN_MAZE, run, cob.id, null);
      expect(harvested.ok).toBe(true);
      if (!harvested.ok) return;
      run = harvested.run;
    }
    expect(run.completed).toBe(true);
    expect(currentTarget(CORN_MAZE, run)).toBe('');
    expect(mazeScore(CORN_MAZE, run, false)).toEqual({ letters: 400, bonus: 250, total: 650 });
    expect(mazeScore(CORN_MAZE, run, true)).toEqual({ letters: 400, bonus: 0, total: 400 });

    const decoy = CORN_MAZE.cobs.find(item => item.letter === 'A')!;
    const peek = inspectCob(CORN_MAZE, { ...createMazeRun(CORN_MAZE), player: { x: decoy.inspect.col + 0.5, y: decoy.inspect.row + 0.5 } }, decoy.id, 0);
    expect(peek.ok).toBe(true);
    if (!peek.ok) return;
    expect(harvestCob(CORN_MAZE, peek.run, decoy.id, peek.reveal).ok).toBe(false);
  });

  it('keeps leftover copies after harvesting one of a repeated letter', () => {
    const fake = { ...CORN_MAZE, answer: 'ANA', cobs: CORN_MAZE.cobs.filter(cob => cob.letter === 'A' || cob.letter === 'N' || cob.letter === 'C') };
    const run = { ...createMazeRun(fake), nextAnswerIndex: 1 };
    expect(remainingLetterCounts(fake, run).get('A')).toBe(1);
    expect(remainingLetterCounts(fake, run).get('N')).toBe(1);
  });

  it('does not pick a harvest target when two plants are in range', () => {
    const first = CORN_MAZE.cobs[0];
    const second = CORN_MAZE.cobs[1];
    const mid = {
      ...createMazeRun(CORN_MAZE),
      player: {
        x: (first.inspect.col + second.inspect.col) / 2 + 0.5,
        y: (first.inspect.row + second.inspect.row) / 2 + 0.5,
      },
    };
    const nearby = cobsInRange(CORN_MAZE, mid, 8);
    expect(nearby.length).toBeGreaterThan(1);
  });

  it('restores a saved run without resurrecting harvested cobs or stale reveals', () => {
    const cob = CORN_MAZE.cobs[0];
    const restored = restoreMazeRun(CORN_MAZE, {
      puzzleId: CORN_MAZE.id,
      player: { x: cob.inspect.col + 0.5, y: cob.inspect.row + 0.5 },
      facing: 'left',
      nextAnswerIndex: 2,
      harvestedCobIds: [cob.id, 'gone'],
      inspectedCobIds: [cob.id],
      elapsedActiveMs: 8800,
      completed: false,
    });
    expect(restored.harvestedCobIds).toEqual([cob.id]);
    expect(restored.nextAnswerIndex).toBe(2);
    expect(restored.facing).toBe('left');
    expect(restoreMazeRun(CORN_MAZE, { puzzleId: 'other' }).nextAnswerIndex).toBe(0);
  });

  it('swaps farmer walk frames by distance traveled and holds idle when still', () => {
    expect(farmerWalkFrame(false, false, 9)).toBe('idle');
    expect(farmerWalkFrame(true, true, 9)).toBe('idle');
    expect(farmerWalkFrame(true, false, 0)).toBe(0);
    expect(farmerWalkFrame(true, false, 1)).toBe(1);
    expect(farmerWalkFrame(true, false, 2)).toBe(0);
  });
});

describe('maze mower', () => {
  const corridor = parseMazeAscii({
    id: 'mow-lane',
    seed: 'mow-lane',
    chapter: 1,
    title: 'Mow',
    answer: 'A',
    clue: 'A',
    ascii: `
#######
#.....#
#.###.#
#.###.#
#.###.#
#.###.#
#.S...#
#######
    `,
    revealDurationMs: 1000,
  });

  it('cuts a facing line of decorative corn in one charge', () => {
    const cut = cutMowerLine(corridor, { ...createMazeRun(corridor), solved: true, started: true, facing: 'up' as const });
    expect(cut.ok).toBe(true);
    if (!cut.ok) return;
    expect(cut.run.mowedKeys).toEqual(['2,5', '2,4', '2,3', '2,2']);
    expect(cut.run.usedMower).toBe(true);
    expect(isWalkable(corridor, cut.run, 2, 3)).toBe(true);
    const restored = restoreMazeRun(corridor, cut.run);
    expect(restored.mowedKeys).toEqual(cut.run.mowedKeys);
    expect(isWalkable(corridor, restored, 2, 4)).toBe(true);
  });

  it('does not spend a cut on letter plants, borders, or landmarks', () => {
    const maze = parseMazeAscii({
      id: 'mow-safe',
      seed: 'mow-safe',
      chapter: 1,
      title: 'Safe',
      answer: 'A',
      clue: 'A',
      ascii: `
#####
#.A.#
#.#.#
#.S.#
#####
      `,
      revealDurationMs: 1000,
    });
    const cob = maze.cobs[0];
    const run = { ...createMazeRun(maze), solved: true, started: true, facing: 'up' as const };
    expect(canMowCell(maze, run, cob.wall.col, cob.wall.row)).toBe(false);
    expect(canMowCell(maze, run, 0, 2)).toBe(false);
    expect(canMowCell(maze, run, 2, 2)).toBe(true);
    const hosted = { ...maze, landmarks: [{ id: 'well', name: 'Well', origin: { col: 2, row: 2 } }] };
    expect(canMowCell(hosted, run, 2, 2)).toBe(false);
    const cut = cutMowerLine(maze, run);
    expect(cut.ok).toBe(true);
    if (!cut.ok) return;
    expect(cut.run.mowedKeys).toEqual(['2,2']);
    expect(cut.run.mowedKeys).not.toContain(cellKey(cob.wall));
    const blocked = cutMowerLine(maze, { ...cut.run, facing: 'up' as const, player: { x: 2.5, y: 2.5 } });
    expect(blocked.ok).toBe(false);
  });
});
