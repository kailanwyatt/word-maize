import { describe, expect, it } from 'vitest';
import { CROSSWORDS, TWISTS, crosswordAt, twistAt, crosswordCells, crosswordTiles, placeCrosswordTile, slotCells, solvedSlots, turnRing, twistLine, harvestTwist, undoTwist, twistRemoved, twistProgress, restoreTwistHistory, TwistHarvest, solveTwist, twistSwipeSteps, restoreTwistOffsets, TWIST_SAVE_VERSION, TWIST_VISIBLE_COLUMNS } from '../cobPuzzles';

describe('Crossword Cob', () => {
  it('wraps across words around the seam and shares intersections', () => {
    expect(slotCells(CROSSWORDS[0].slots[0], 8).map(c => c.id)).toEqual(['0:7', '0:0', '0:1']);
    for (const puzzle of CROSSWORDS) {
      const answers = new Map<string, string>();
      for (const slot of puzzle.slots) for (const cell of slotCells(slot, puzzle.columns)) {
        if (answers.has(cell.id)) expect(answers.get(cell.id)).toBe(cell.letter);
        answers.set(cell.id, cell.letter);
      }
      expect(answers.size).toBeLessThan(puzzle.slots.reduce((sum, s) => sum + s.answer.length, 0));
    }
  });
  it('has exactly enough tray letters to solve every authored crossword', () => {
    for (const puzzle of CROSSWORDS) {
      let placements = {};
      const tiles = crosswordTiles(puzzle);
      for (const cell of crosswordCells(puzzle).filter(c => !puzzle.givens.includes(c.id))) {
        const index = tiles.findIndex(t => t.letter === cell.letter);
        expect(index).toBeGreaterThanOrEqual(0);
        const [tile] = tiles.splice(index, 1);
        placements = placeCrosswordTile(puzzle, placements, tile.id, cell.id, []);
      }
      expect(tiles).toHaveLength(0);
      expect(solvedSlots(puzzle, placements)).toHaveLength(puzzle.slots.length);
    }
  });
  it('moves letters without duplication and protects given and secured cells', () => {
    const puzzle = CROSSWORDS[0];
    const tile = crosswordTiles(puzzle)[0];
    const initial = placeCrosswordTile(puzzle, {}, tile.id, '0:0', []);
    const moved = placeCrosswordTile(puzzle, initial, tile.id, '0:1', []);
    expect(Object.values(moved)).toEqual([tile.id]);
    expect(placeCrosswordTile(puzzle, moved, tile.id, '0:7', [])).toBe(moved);
    expect(placeCrosswordTile(puzzle, moved, tile.id, '1:0', ['0:1'])).toBe(moved);
    expect(placeCrosswordTile(puzzle, moved, tile.id, '9:9', [])).toBe(moved);
    expect(solvedSlots(puzzle, {})).toEqual([]);
  });
});
describe('Sequential Twist harvest', () => {
  it('reserves enough of every letter in each row plus an empty socket', () => {
    expect(TWIST_VISIBLE_COLUMNS).toBe(6);
    for (const puzzle of TWISTS) {
      expect(puzzle.rings).toHaveLength(7);
      expect(puzzle.clues.length).toBeGreaterThanOrEqual(4);
      puzzle.rings.forEach((ring, row) => {
        expect(ring).toHaveLength(12);
        expect(ring).toContain('.');
        const required = puzzle.clues.map(c => c.pattern[row]).filter(c => c !== '.');
        for (const letter of new Set(required)) expect([...ring].filter(c => c === letter).length).toBeGreaterThanOrEqual(required.filter(c => c === letter).length);
      });
    }
  });
  it('completes both sequences with first or last matching physical copies', () => {
    for (const puzzle of TWISTS) for (const reverse of [false, true]) {
      let history: TwistHarvest[] = [];
      for (let i = 0; i < puzzle.clues.length; i++) {
        const offsets = solveTwist(puzzle, history, reverse)!;
        expect(offsets).toBeDefined();
        const next = harvestTwist(puzzle, offsets, history);
        expect(next.length).toBe(i + 1);
        expect(next[i].ids.length).toBe(puzzle.clues[i].pattern.replaceAll('.', '').length);
        history = next;
        expect(twistProgress(puzzle, history).complete).toBe(i === puzzle.clues.length - 1);
      }
      const progress = twistProgress(puzzle, history);
      expect(progress.percent).toBe(progress.targetPercent);
      expect(progress.percent).toBeGreaterThan(50);
      expect(progress.percent).toBeLessThan(65);
      expect(new Set(twistRemoved(history)).size).toBe(twistRemoved(history).length);
    }
  });
  it('harvests only answer kernels and rejects words with incorrect gaps', () => {
    const puzzle = TWISTS[0];
    const offsets = solveTwist(puzzle)!;
    const history = harvestTwist(puzzle, offsets, []);
    expect(history[0].ids).toHaveLength(3);
    expect(twistLine(puzzle, offsets, 2, twistRemoved(history))).toBe('.......');
    const wrong = [...offsets];
    wrong[0] = (puzzle.rings[0].indexOf('A') - 2 + 12) % 12;
    const empty: TwistHarvest[] = [];
    expect(harvestTwist(puzzle, wrong, empty)).toBe(empty);
    expect(harvestTwist(puzzle, [], empty)).toBe(empty);
  });
  it('undo restores the exact kernels, offsets, clue index, and percentage', () => {
    const puzzle = TWISTS[0];
    const offsets = solveTwist(puzzle)!;
    const first = harvestTwist(puzzle, offsets, []);
    const secondOffsets = solveTwist(puzzle, first)!;
    const second = harvestTwist(puzzle, secondOffsets, first);
    const undo = undoTwist(second)!;
    expect(undo.history).toEqual(first);
    expect(undo.offsets).toEqual(secondOffsets);
    expect(twistLine(puzzle, undo.offsets, 2, twistRemoved(undo.history))).toBe(puzzle.clues[1].pattern);
    expect(twistProgress(puzzle, undo.history).percent).toBe(twistProgress(puzzle, first).percent);
    expect(undoTwist([])).toBeUndefined();
    expect(harvestTwist(puzzle, undo.offsets, undo.history)).toEqual(second);
  });
  it('allows undo after completion and validates saved histories by replaying them', () => {
    const puzzle = TWISTS[0];
    let history: TwistHarvest[] = [];
    while (history.length < puzzle.clues.length) history = harvestTwist(puzzle, solveTwist(puzzle, history)!, history);
    expect(restoreTwistHistory(puzzle, JSON.parse(JSON.stringify(history)))).toEqual(history);
    expect(twistProgress(puzzle, undoTwist(history)!.history).complete).toBe(false);
    expect(restoreTwistHistory(puzzle, [{ offsets: [], ids: ['fake'] }])).toEqual([]);
    expect(harvestTwist(puzzle, history[0].offsets, history)).toBe(history);
  });
  it('keeps row ownership and snap rules while wrapping and restoring', () => {
    const offsets = [0, 2, 3, 4, 5, 6, 7];
    expect(turnRing(TWISTS[0], offsets, 0, -1)).toEqual([11, 2, 3, 4, 5, 6, 7]);
    expect(turnRing(TWISTS[0], offsets, 7, 1)).toBe(offsets);
    expect(twistSwipeSteps(5, 50)).toBe(0);
    expect(twistSwipeSteps(-125, 50)).toBe(3);
    expect(restoreTwistOffsets(0, 3, offsets)).toEqual(TWISTS[0].offsets);
    expect(restoreTwistOffsets(0, TWIST_SAVE_VERSION, offsets)).toEqual(offsets);
  });
});

describe('Endless cob puzzles', () => {
  it('builds endless crossword and twist puzzles that stay solvable', () => {
    for (const index of [CROSSWORDS.length, CROSSWORDS.length + 3, 40]) {
      const puzzle = crosswordAt(index);
      let placements = {};
      const tiles = crosswordTiles(puzzle);
      for (const cell of crosswordCells(puzzle).filter(c => !puzzle.givens.includes(c.id))) {
        const tileIndex = tiles.findIndex(t => t.letter === cell.letter);
        expect(tileIndex).toBeGreaterThanOrEqual(0);
        const [tile] = tiles.splice(tileIndex, 1);
        placements = placeCrosswordTile(puzzle, placements, tile.id, cell.id, []);
      }
      expect(solvedSlots(puzzle, placements)).toHaveLength(puzzle.slots.length);
      const twist = twistAt(index);
      let history: TwistHarvest[] = [];
      for (let i = 0; i < twist.clues.length; i += 1) {
        const offsets = solveTwist(twist, history)!;
        expect(offsets).toBeDefined();
        history = harvestTwist(twist, offsets, history);
      }
      const progress = twistProgress(twist, history);
      expect(progress.complete).toBe(true);
      expect(progress.percent).toBeGreaterThan(50);
      expect(progress.percent).toBeLessThan(65);
    }
    expect(crosswordAt(24).id).not.toBe(crosswordAt(25).id);
    expect(twistAt(0)).toEqual(TWISTS[0]);
  });
});
