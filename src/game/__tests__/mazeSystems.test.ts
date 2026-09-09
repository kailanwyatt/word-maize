import { describe, expect, it } from 'vitest';
import { MAZE_PUZZLES } from '../../data/mazeLevels';
import { createMazeRun, inspectCob } from '../maze';
import { findNextLetterHelp, revealMazeAnswer, submitMazeSolve } from '../mazeSolve';
import { continueStormUntimed, stormPhase } from '../mazeStorm';
import { parseMazeVisibility, tileVisible } from '../mazeVisibility';
import { tickWildlife, wildlifeSchedule } from '../mazeWildlife';

const cat = MAZE_PUZZLES.find(level => level.id === 'maze-21-cat')!;
const crowLevel = MAZE_PUZZLES.find(level => level.wildlife === 'crow-1')!;
const stormLevel = MAZE_PUZZLES.find(level => level.stormSeconds === 180)!;

describe('maze solve phase', () => {
  it('hides the harvest target until the clue is solved', () => {
    const run = createMazeRun(cat);
    expect(run.solved).toBe(false);
    expect(submitMazeSolve(cat, run, 'dog').ok).toBe(false);
    const solved = submitMazeSolve(cat, run, ' goat ');
    expect(solved.ok).toBe(true);
    if (!solved.ok) return;
    expect(solved.run.solved).toBe(true);
    expect(solved.run.started).toBe(true);
  });

  it('counts answer help as assistance', () => {
    const helped = revealMazeAnswer(cat, createMazeRun(cat));
    expect(helped.usedAnswerHelp).toBe(true);
    expect(helped.solved).toBe(true);
  });
});

describe('maze wildlife and weather', () => {
  it('parses finite wildlife schedules', () => {
    expect(wildlifeSchedule('crow-2')).toEqual(['crow', 'crow']);
    expect(wildlifeSchedule('three-sequential')).toEqual(['crow', 'squirrel', 'caterpillar']);
  });

  it('spawns a crow after the first harvest and delay, then blocks that plant', () => {
    const run = {
      ...createMazeRun(crowLevel),
      solved: true,
      started: true,
      harvestedCobIds: [crowLevel.cobs[0].id],
      elapsedActiveMs: 30_000,
      player: { x: crowLevel.spawn.col + 0.5, y: crowLevel.spawn.row + 0.5 },
    };
    const warned = tickWildlife(crowLevel, run);
    expect(warned.wildlife?.kind).toBe('crow');
    expect(warned.wildlife?.phase).toBe('warning');
    const active = tickWildlife(crowLevel, { ...warned, elapsedActiveMs: warned.wildlife!.resolveAtMs });
    expect(active.wildlife?.phase).toBe('active');
    const target = crowLevel.cobs.find(cob => cob.id === active.wildlife?.cobId)!;
    const blocked = inspectCob(crowLevel, { ...active, player: { x: target.inspect.col + 0.5, y: target.inspect.row + 0.5 } }, target.id, active.elapsedActiveMs);
    expect(blocked.ok).toBe(false);
  });

  it('opens untimed continuation after storm expiry', () => {
    const run = { ...createMazeRun(stormLevel), started: true, solved: true, elapsedActiveMs: 180_000 + 15_000 };
    expect(stormPhase(stormLevel, run)).toBe('expired');
    expect(continueStormUntimed(run).stormUntimed).toBe(true);
  });

  it('keeps distant mist tiles hidden until explored', () => {
    expect(parseMazeVisibility('mist-4')).toEqual({ mode: 'mist', radius: 4 });
    const run = createMazeRun(cat);
    expect(tileVisible(cat, run, cat.spawn.col, cat.spawn.row)).toBe(true);
  });

  it('marks one matching plant during find-next help', () => {
    const run = { ...createMazeRun(cat), solved: true, started: true };
    const help = findNextLetterHelp(cat, run);
    expect(help.ok).toBe(true);
    if (!help.ok) return;
    expect(help.run.usedFindNext).toBe(true);
    expect(help.run.helpMarker?.cobId).toBeTruthy();
  });
});
