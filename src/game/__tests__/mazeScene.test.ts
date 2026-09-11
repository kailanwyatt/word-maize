import { describe, expect, it } from 'vitest';
import { MAZE_PUZZLES } from '../../data/mazeLevels';
import { landmarkArtPlacements } from '../../components/maze/sceneLayout';

describe('maze landmark art placement', () => {
  it('keeps all existing landmark props off walkable lanes and letter plants', () => {
    for (const puzzle of MAZE_PUZZLES) {
      const placements = landmarkArtPlacements(puzzle);
      expect(placements).toHaveLength(puzzle.landmarks?.length ?? 0);
      const occupied = new Set(puzzle.cobs.map(cob => `${cob.wall.col},${cob.wall.row}`));
      for (const { artCell, origin } of placements) {
        expect(puzzle.terrain[artCell.row][artCell.col]).toBe('wall');
        const key = `${artCell.col},${artCell.row}`;
        expect(occupied.has(key)).toBe(false);
        occupied.add(key);
        expect(Math.abs(artCell.col - origin.col) + Math.abs(artCell.row - origin.row)).toBeLessThanOrEqual(5);
      }
      expect(landmarkArtPlacements(puzzle)).toEqual(placements);
    }
  });
  it('places Sandy Point memory props on decorative corn', () => {
    const puzzle = MAZE_PUZZLES[0];
    expect(puzzle.id).toBe('sunny-acres-corn');
    expect((puzzle.landmarks ?? []).map(item => item.id)).toEqual(['rock', 'signpost', 'scarecrow', 'sunflowers']);
    expect(landmarkArtPlacements(puzzle)).toHaveLength(4);
  });
  it('omits a prop when there is no safe decorative host', () => {
    const puzzle = { ...MAZE_PUZZLES[0], cols: 3, rows: 3, terrain: Array.from({length:3}, () => ['path','path','path'] as const).map(row => [...row]), cobs: [], landmarks: [{ id:'well', name:'Well', origin:{col:1,row:1} }] };
    expect(landmarkArtPlacements(puzzle)).toEqual([]);
  });
});
