import type { MazePuzzle } from '../../game/maze';

/** Place decorative landmark art on nearby solid corn, never on a walkable route or letter plant. */
export function landmarkArtPlacements(puzzle: MazePuzzle) {
  const occupied = new Set(puzzle.cobs.map(cob => `${cob.wall.col},${cob.wall.row}`));
  return (puzzle.landmarks ?? []).flatMap(landmark => {
    const candidates: { col: number; row: number; distance: number }[] = [];
    for (let row = 1; row < puzzle.rows - 1; row++) for (let col = 1; col < puzzle.cols - 1; col++) {
      const distance = Math.abs(col - landmark.origin.col) + Math.abs(row - landmark.origin.row);
      if (distance > 5 || puzzle.terrain[row][col] !== 'wall' || occupied.has(`${col},${row}`)) continue;
      if (![[0, -1], [1, 0], [0, 1], [-1, 0]].some(([dc, dr]) => puzzle.terrain[row + dr]?.[col + dc] === 'path')) continue;
      candidates.push({ col, row, distance });
    }
    candidates.sort((a, b) => a.distance - b.distance || a.row - b.row || a.col - b.col);
    const site = candidates[0];
    if (!site) return [];
    occupied.add(`${site.col},${site.row}`);
    return [{ ...landmark, artCell: { col: site.col, row: site.row } }];
  });
}
