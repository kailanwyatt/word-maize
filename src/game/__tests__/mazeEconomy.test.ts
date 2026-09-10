import { describe, expect, it } from 'vitest';
import { MAZE_PUZZLES } from '../../data/mazeLevels';
import { EMPTY_INVENTORY } from '../economy';
import {
  createMazeRun,
  mazeUnaided,
  parseMazeAscii,
  peekDurationMs,
  unusedBarnFinds,
  clippedLetterIds,
} from '../maze';
import { collectMazeFinds, mazeFindsFor } from '../mazeFinds';
import { nextStoryBeat, STORY_BEATS } from '../mazeStory';
import { canEarnStormRibbon, stormRemainingMs } from '../mazeStorm';
import { applyMazeTool, RAINCOAT_BONUS_MS } from '../mazeTools';
import { driveTractor } from '../mazeTractor';
import { LANTERN_SIGHT_BONUS, lanternSightBonus, parseMazeVisibility, tileVisible } from '../mazeVisibility';
import { tickWildlife } from '../mazeWildlife';

const mist = MAZE_PUZZLES.find(level => level.id === 'maze-61-mist')!;
const stormLevel = MAZE_PUZZLES.find(level => level.stormSeconds === 180)!;
const crowLevel = MAZE_PUZZLES.find(level => level.wildlife === 'crow-1')!;
const inventory = { ...EMPTY_INVENTORY, lantern: 1, raincoat: 1, huskClip: 1, tractor: 1, scarecrow: 1, mower: 1 };

describe('maze field finds', () => {
  it('keeps the first three Sunny Acres fields crate-free and later finds deterministic', () => {
    expect(mazeFindsFor(MAZE_PUZZLES[0])).toEqual([]);
    expect(mazeFindsFor(MAZE_PUZZLES[1])).toEqual([]);
    expect(mazeFindsFor(MAZE_PUZZLES[2])).toEqual([]);
    const later = MAZE_PUZZLES.filter(level => level.order > 3);
    const counts = new Set(later.map(level => mazeFindsFor(level).length));
    expect([...counts].every(count => count <= 2)).toBe(true);
    const sample = later.find(level => mazeFindsFor(level).length > 0)!;
    expect(mazeFindsFor(sample)).toEqual(mazeFindsFor(sample));
    const find = mazeFindsFor(sample)[0];
    const picked = collectMazeFinds(sample, { ...createMazeRun(sample), player: { x: find.cell.col + 0.5, y: find.cell.row + 0.5 } });
    expect(picked.found?.tool).toBe(find.tool);
    expect(picked.run.barnFinds[find.tool]).toBe(1);
    expect(unusedBarnFinds(picked.run)[find.tool]).toBe(1);
  });
});

describe('maze barn tools', () => {
  it('enlarges mist light around the farmer without painting far unexplored tiles', () => {
    const run = createMazeRun(mist);
    const radius = parseMazeVisibility(mist.visibility).radius ?? 4;
    const dist = (col: number, row: number) => Math.hypot(run.player.x - (col + 0.5), run.player.y - (row + 0.5));
    const cells: { col: number; row: number; dist: number }[] = [];
    for (let row = 0; row < mist.rows; row += 1) {
      for (let col = 0; col < mist.cols; col += 1) cells.push({ col, row, dist: dist(col, row) });
    }
    const justOut = cells.find(cell => cell.dist > radius + 1.2 && cell.dist < radius + LANTERN_SIGHT_BONUS)!;
    const beyondLamp = cells.filter(cell => cell.dist > radius + LANTERN_SIGHT_BONUS + 1.2);
    expect(tileVisible(mist, run, justOut.col, justOut.row)).toBe(false);
    const lit = applyMazeTool(mist, run, 'lantern', inventory);
    expect(lit.ok).toBe(true);
    if (!lit.ok) return;
    expect(lit.run.usedLantern).toBe(true);
    expect(lit.run.lanternCount).toBe(1);
    expect(mazeUnaided(lit.run)).toBe(false);
    expect(lit.run.exploredKeys).toEqual(run.exploredKeys);
    expect(tileVisible(mist, lit.run, justOut.col, justOut.row)).toBe(true);
    if (beyondLamp[0]) expect(tileVisible(mist, lit.run, beyondLamp[0].col, beyondLamp[0].row)).toBe(false);
  });

  it('stacks lanterns to brighten the field 25% each, up to four', () => {
    const pack = { ...inventory, lantern: 4 };
    let current = createMazeRun(mist);
    const first = applyMazeTool(mist, current, 'lantern', pack);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.toast).toMatch(/25%/);
    current = first.run;
    const second = applyMazeTool(mist, current, 'lantern', { ...pack, lantern: 3 });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.run.lanternCount).toBe(2);
    expect(second.toast).toMatch(/50%/);
    expect(lanternSightBonus(2)).toBeGreaterThan(lanternSightBonus(1));
    current = second.run;
    for (let n = 3; n <= 4; n += 1) {
      const next = applyMazeTool(mist, current, 'lantern', { ...pack, lantern: 5 - n });
      expect(next.ok).toBe(true);
      if (!next.ok) return;
      current = next.run;
    }
    expect(current.lanternCount).toBe(4);
    expect(applyMazeTool(mist, current, 'lantern', pack).ok).toBe(false);
  });

  it('adds storm time without buying the storm ribbon', () => {
    const run = { ...createMazeRun(stormLevel), started: true, solved: true, elapsedActiveMs: 170_000 };
    expect(canEarnStormRibbon(stormLevel, run)).toBe(true);
    const coated = applyMazeTool(stormLevel, run, 'raincoat', inventory);
    expect(coated.ok).toBe(true);
    if (!coated.ok) return;
    expect(coated.run.stormBonusMs).toBe(RAINCOAT_BONUS_MS);
    expect(stormRemainingMs(stormLevel, coated.run)).toBeGreaterThan(stormRemainingMs(stormLevel, run));
    const late = { ...coated.run, elapsedActiveMs: 180_000 + 20_000 };
    expect(canEarnStormRibbon(stormLevel, late)).toBe(false);
  });

  it('clips a facing plant so the letter stays open for the rest of the field', () => {
    const maze = parseMazeAscii({
      id: 'clip-husk',
      seed: 'clip-husk',
      chapter: 1,
      title: 'Clip',
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
    const away = {
      ...createMazeRun(maze),
      started: true,
      solved: true,
      player: { x: cob.wall.col + 0.5, y: cob.wall.row + 1.5 },
      facing: 'up' as const,
    };
    expect(applyMazeTool(maze, { ...away, facing: 'down' }, 'huskClip', inventory).ok).toBe(false);
    const clipped = applyMazeTool(maze, away, 'huskClip', inventory);
    expect(clipped.ok).toBe(true);
    if (!clipped.ok) return;
    expect(clipped.run.usedHuskClip).toBe(true);
    expect(clippedLetterIds(clipped.run)).toEqual([cob.id]);
    expect(peekDurationMs(maze, clipped.run)).toBe(maze.revealDurationMs);
    expect(clippedLetterIds({ ...clipped.run, elapsedActiveMs: 120_000 })).toEqual([cob.id]);
    expect(applyMazeTool(maze, clipped.run, 'huskClip', inventory).ok).toBe(false);
    expect(clippedLetterIds({ ...clipped.run, harvestedCobIds: [cob.id] })).toEqual([]);
  });

  it('shoos maze wildlife from anywhere', () => {
    const warned = tickWildlife(crowLevel, {
      ...createMazeRun(crowLevel),
      solved: true,
      started: true,
      harvestedCobIds: [crowLevel.cobs[0].id],
      elapsedActiveMs: 30_000,
      player: { x: crowLevel.spawn.col + 0.5, y: crowLevel.spawn.row + 0.5 },
    });
    const active = tickWildlife(crowLevel, { ...warned, elapsedActiveMs: warned.wildlife!.resolveAtMs });
    expect(active.wildlife?.phase).toBe('active');
    const shoo = applyMazeTool(crowLevel, active, 'scarecrow', inventory);
    expect(shoo.ok).toBe(true);
    if (!shoo.ok) return;
    expect(shoo.run.wildlife).toBeNull();
    expect(shoo.run.usedScarecrow).toBe(true);
  });

  it('harvests spelling-order letters across the swath and leaves the last letter', () => {
    const maze = parseMazeAscii({
      id: 'tractor-row',
      seed: 'tractor-row',
      chapter: 1,
      title: 'Tractor',
      answer: 'ABCDE',
      clue: 'ABCDE',
      ascii: `
########
#S.....#
#.ABCDE#
########
      `,
      revealDurationMs: 1000,
    });
    const drive = driveTractor(maze, { ...createMazeRun(maze), solved: true, started: true, facing: 'right' });
    expect(drive.ok).toBe(true);
    if (!drive.ok) return;
    expect(drive.harvested).toBe(4);
    expect(drive.path.length).toBeGreaterThan(1);
    expect(drive.run.nextAnswerIndex).toBe(4);
    expect(drive.run.completed).toBe(false);
    expect(drive.run.usedTractor).toBe(true);
  });

  it('mows a 3-by-4 decorative corn block and drives the center column', () => {
    const maze = parseMazeAscii({
      id: 'tractor-swath',
      seed: 'tractor-swath',
      chapter: 1,
      title: 'Swath',
      answer: 'A',
      clue: 'A',
      ascii: `
#########
#.......#
#..S....#
#.###...#
#.###...#
#.###...#
#.###...#
#.......#
#########
      `,
      revealDurationMs: 1000,
    });
    const drive = driveTractor(maze, { ...createMazeRun(maze), solved: true, started: true, facing: 'down' });
    expect(drive.ok).toBe(true);
    if (!drive.ok) return;
    expect(drive.mowed).toHaveLength(12);
    expect(drive.path).toEqual([
      { col: 3, row: 2 },
      { col: 3, row: 3 },
      { col: 3, row: 4 },
      { col: 3, row: 5 },
      { col: 3, row: 6 },
    ]);
    expect(drive.run.mowedKeys).toHaveLength(12);
  });

  it('clips a narrower corridor and still harvests letters in the span', () => {
    const maze = parseMazeAscii({
      id: 'tractor-clip',
      seed: 'tractor-clip',
      chapter: 1,
      title: 'Clip',
      answer: 'ABCD',
      clue: 'ABCD',
      ascii: `
##########
#...A....#
#..SBC...#
#...D....#
#........#
##########
      `,
      revealDurationMs: 1000,
    });
    const drive = driveTractor(maze, { ...createMazeRun(maze), solved: true, started: true, facing: 'right' });
    expect(drive.ok).toBe(true);
    if (!drive.ok) return;
    expect(drive.harvested).toBe(3);
    expect(drive.run.nextAnswerIndex).toBe(3);
    expect(drive.run.completed).toBe(false);
  });
});

describe('maze story beats', () => {
  const base = {
    campaign: true,
    skipStory: false,
    seen: [] as string[],
    puzzleId: 'sunny-acres-corn',
    chapter: 1,
    chapterLevel: 1,
    started: false,
    solved: true,
    needsClue: false,
    mist: false,
    storm: false,
    wildlife: false,
    completed: false,
    chapterDone: false,
    finale: false,
  };

  it('fires sparse skippable beats and stays out of Free Play', () => {
    expect(nextStoryBeat(base)?.id).toBe(STORY_BEATS.firstField.id);
    expect(nextStoryBeat({ ...base, skipStory: true })).toBeNull();
    expect(nextStoryBeat({ ...base, campaign: false })).toBeNull();
    expect(nextStoryBeat({ ...base, puzzleId: 'green-plant', chapter: 2, chapterLevel: 1 })?.id).toBe('chapter:2');
    expect(nextStoryBeat({ ...base, started: true, wildlife: true })?.id).toBe(STORY_BEATS.wildlife.id);
    expect(nextStoryBeat({ ...base, completed: true, chapterDone: true, chapter: 3 })?.id).toBe('complete:3');
    expect(nextStoryBeat({ ...base, completed: true, finale: true })?.id).toBe(STORY_BEATS.finale.id);
    expect(nextStoryBeat({ ...base, seen: [STORY_BEATS.firstField.id] })).toBeNull();
  });
});
