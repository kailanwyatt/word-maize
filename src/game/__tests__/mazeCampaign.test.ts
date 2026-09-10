import { describe, expect, it } from 'vitest';
import { MAZE_CAMPAIGN_TARGETS, validateMazeCampaignTargets } from '../../data/mazeCatalog';
import { MAZE_PUZZLES, validateMazeLevels } from '../../data/mazeLevels';
import { cellKey, createMazeRun, displayProgress, harvestCob, inspectCob } from '../maze';
import { isFreePlayUnlocked, isMazeLevelUnlocked, LEGACY_MAZE_IDS, mazeDistances, migrateMazeUnlocks, nextMazeLevel } from '../mazeCampaign';

describe('maze campaign catalog', () => {
  it('imports 80 unique targets without changing the original ten ids', () => {
    expect(validateMazeCampaignTargets()).toEqual([]);
    expect(MAZE_CAMPAIGN_TARGETS).toHaveLength(80);
    expect(LEGACY_MAZE_IDS.every(id => MAZE_CAMPAIGN_TARGETS.some(target => target.id === id))).toBe(true);
    expect(MAZE_CAMPAIGN_TARGETS[0].id).toBe('sunny-acres-corn');
    expect(MAZE_CAMPAIGN_TARGETS[5].id).toBe('maze-06-barn');
    expect(MAZE_CAMPAIGN_TARGETS[10].id).toBe('green-plant');
  });
});

describe('maze campaign boards', () => {
  it('ships eighty validated playable boards with durable original identities', () => {
    expect(validateMazeLevels()).toEqual([]);
    expect(MAZE_PUZZLES).toHaveLength(80);
    expect(MAZE_PUZZLES.map(level => level.order)).toEqual(Array.from({ length: 80 }, (_, i) => i + 1));
    expect(MAZE_PUZZLES[0].id).toBe('sunny-acres-corn');
    expect(MAZE_PUZZLES[10].id).toBe('green-plant');
    expect(MAZE_PUZZLES[20].id).toBe('maze-21-cat');
    expect(new Set(MAZE_PUZZLES.map(level => level.id)).size).toBe(80);
  });

  for (const puzzle of MAZE_PUZZLES) {
    for (const reverse of [false, true]) it(`${puzzle.displayAnswer} can finish using ${reverse ? 'last' : 'first'} available duplicate`, () => {
      let run = { ...createMazeRun(puzzle), solved: true, started: true };
      const cobs = reverse ? [...puzzle.cobs].reverse() : puzzle.cobs;
      for (const letter of puzzle.answer) {
        const cob = cobs.find(c => c.letter === letter && !run.harvestedCobIds.includes(c.id))!;
        expect(cob).toBeDefined();
        expect(mazeDistances(puzzle, puzzle.spawn).has(cellKey(cob.inspect))).toBe(true);
        run = { ...run, player: { x: cob.inspect.col + .5, y: cob.inspect.row + .5 } };
        const peek = inspectCob(puzzle, run, cob.id, run.elapsedActiveMs);
        expect(peek.ok).toBe(true);
        if (!peek.ok) throw new Error('Uninspectable cob');
        const result = harvestCob(puzzle, peek.run, cob.id, peek.reveal);
        expect(result.ok).toBe(true);
        if (!result.ok) throw new Error('Unharvestable cob');
        run = result.run;
      }
      expect(run.completed).toBe(true);
      expect(new Set(run.harvestedCobIds).size).toBe(puzzle.answer.length);
    });
  }

  it('puts a later letter nearer home in return-trip lessons', () => {
    for (const level of MAZE_PUZZLES.filter(l => l.lesson === 'return' && l.order <= 15 && LEGACY_MAZE_IDS.includes(l.id as typeof LEGACY_MAZE_IDS[number]))) {
      const distances = mazeDistances(level, level.spawn);
      expect(distances.get(cellKey(level.cobs[1].inspect))!).toBeLessThan(distances.get(cellKey(level.cobs[0].inspect))!);
    }
  });

  it('treats phrase spaces as visual only', () => {
    const bean = MAZE_PUZZLES.find(level => level.id === 'maze-20-green-bean')!;
    expect(bean.answer).toBe('GREENBEAN');
    expect(bean.displayAnswer).toBe('GREEN BEAN');
    const slots = displayProgress(bean.displayAnswer, 5);
    expect(slots.filter(slot => !slot.space).map(slot => slot.filled)).toEqual([true, true, true, true, true, false, false, false, false]);
  });

  it('keeps Green Fields unlocked after new Sunny Acres levels are inserted', () => {
    const playable = MAZE_PUZZLES.map(level => level.id);
    const completed = ['sunny-acres-corn', 'sunny-hen', 'sunny-gate', 'sunny-apple', 'sunny-sheep'];
    const unlocked = migrateMazeUnlocks(completed, [], playable);
    expect(unlocked).toContain('green-plant');
    expect(unlocked).toContain('maze-06-barn');
    expect(isMazeLevelUnlocked(MAZE_PUZZLES, 'green-plant', completed, unlocked)).toBe(true);
    expect(nextMazeLevel(MAZE_PUZZLES, completed, unlocked)?.id).toBe('maze-06-barn');
  });

  it('keeps Sunny Acres and Green Fields as daytime walks with no storm clock', () => {
    const early = MAZE_PUZZLES.filter(level => level.chapter <= 2);
    expect(early).toHaveLength(20);
    expect(early.every(level => !level.stormSeconds && (level.visibility ?? 'day') === 'day')).toBe(true);
    expect(early.every(level => level.revealDurationMs >= 3000)).toBe(true);
    expect(early.every(level => level.cols >= 11 && level.rows >= 11)).toBe(true);
  });

  it('opens every field and Free Play when developer unlock is on', () => {
    expect(isMazeLevelUnlocked(MAZE_PUZZLES, 'green-plant', [], [], true)).toBe(true);
    expect(isMazeLevelUnlocked(MAZE_PUZZLES, MAZE_PUZZLES[79].id, [], [], true)).toBe(true);
    expect(isFreePlayUnlocked([], true)).toBe(true);
    expect(isFreePlayUnlocked([])).toBe(false);
    expect(isFreePlayUnlocked(Array.from({ length: 79 }, (_, i) => `field-${i}`))).toBe(false);
    expect(isFreePlayUnlocked(Array.from({ length: 80 }, (_, i) => `field-${i}`))).toBe(true);
  });
});
