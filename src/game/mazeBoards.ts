import { cellKey, type MazeCell, type MazeLandmark } from './maze';

type Grid = string[][];

function blank(width: number, height: number): Grid {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => '#'));
}

function inInterior(grid: Grid, col: number, row: number) {
  return row > 0 && col > 0 && row < grid.length - 1 && col < grid[0].length - 1;
}

function carve(grid: Grid, col: number, row: number) {
  if (inInterior(grid, col, row)) grid[row][col] = '.';
}

function hline(grid: Grid, row: number, a: number, b: number) {
  for (let col = Math.min(a, b); col <= Math.max(a, b); col += 1) carve(grid, col, row);
}

function vline(grid: Grid, col: number, a: number, b: number) {
  for (let row = Math.min(a, b); row <= Math.max(a, b); row += 1) carve(grid, col, row);
}

function court(grid: Grid, col: number, row: number, size = 3) {
  for (let r = 0; r < size; r += 1) for (let c = 0; c < size; c += 1) carve(grid, col + c, row + r);
  if (size >= 3 && inInterior(grid, col + 1, row + 1)) grid[row + 1][col + 1] = '#';
}

function toAscii(grid: Grid, spawn: MazeCell) {
  grid[spawn.row][spawn.col] = 'S';
  return grid.map(row => row.join('')).join('\n');
}

export function carveCampaignTopology(width: number, height: number, topology: string): { ascii: string; landmarks: MazeLandmark[] } {
  const grid = blank(width, height);
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const landmarks: MazeLandmark[] = [];
  const spawn = { col: cx, row: height - 3 };

  if (topology === 'hub' || topology === 'legacy') {
    court(grid, cx - 1, cy - 1);
    vline(grid, cx, 2, height - 3);
    hline(grid, cy, 2, width - 3);
    landmarks.push({ id: 'well', name: 'Well', origin: { col: cx, row: cy } });
  } else if (topology === 'fork') {
    vline(grid, cx, 2, height - 3);
    hline(grid, cy, 2, width - 3);
    hline(grid, Math.max(2, cy - 3), 2, cx);
    hline(grid, Math.min(height - 3, cy + 3), cx, width - 3);
    vline(grid, Math.max(2, cx - 4), 2, cy);
    vline(grid, Math.min(width - 3, cx + 4), cy, height - 3);
  } else if (topology === 'loop') {
    hline(grid, 2, 2, width - 3);
    hline(grid, height - 3, 2, width - 3);
    vline(grid, 2, 2, height - 3);
    vline(grid, width - 3, 2, height - 3);
    hline(grid, cy, 2, width - 3);
    vline(grid, cx, 2, height - 3);
  } else if (topology === 'sectors') {
    const lx = Math.max(2, Math.floor(width / 4));
    const rx = Math.min(width - 5, width - Math.floor(width / 4) - 1);
    const ty = Math.max(2, Math.floor(height / 4));
    const by = Math.min(height - 5, height - Math.floor(height / 4) - 1);
    court(grid, lx, ty);
    court(grid, rx, ty);
    court(grid, lx, by);
    court(grid, rx, by);
    court(grid, cx - 1, cy - 1);
    hline(grid, ty + 1, lx + 1, rx + 1);
    hline(grid, by + 1, lx + 1, rx + 1);
    vline(grid, lx + 1, ty + 1, by + 1);
    vline(grid, rx + 1, ty + 1, by + 1);
    hline(grid, cy, 2, width - 3);
    vline(grid, cx, 2, height - 3);
    landmarks.push({ id: 'windmill', name: 'Windmill', origin: { col: lx + 1, row: ty + 1 } });
    landmarks.push({ id: 'trough', name: 'Trough', origin: { col: rx + 1, row: ty + 1 } });
    landmarks.push({ id: 'hay', name: 'Hay', origin: { col: lx + 1, row: by + 1 } });
    landmarks.push({ id: 'cart', name: 'Cart', origin: { col: rx + 1, row: by + 1 } });
  } else if (topology === 'double-loop' || topology === 'branches') {
    const left = Math.max(2, Math.floor(cx / 2) + 1);
    const right = Math.min(width - 3, cx + Math.floor((width - cx) / 2));
    hline(grid, 2, 2, cx);
    hline(grid, height - 3, 2, cx);
    vline(grid, 2, 2, height - 3);
    vline(grid, cx, 2, height - 3);
    hline(grid, 2, cx, width - 3);
    hline(grid, height - 3, cx, width - 3);
    vline(grid, width - 3, 2, height - 3);
    hline(grid, cy, 2, width - 3);
    landmarks.push({ id: 'west-loop', name: 'West loop', origin: { col: left, row: cy } });
    landmarks.push({ id: 'east-loop', name: 'East loop', origin: { col: right, row: cy } });
  } else {
    const courts = [
      { id: 'windmill', name: 'Windmill', col: 2, row: 2 },
      { id: 'trough', name: 'Trough', col: width - 5, row: 2 },
      { id: 'hay', name: 'Hay', col: 2, row: height - 5 },
      { id: 'cart', name: 'Cart', col: width - 5, row: height - 5 },
    ];
    for (const item of courts) {
      court(grid, item.col, item.row);
      landmarks.push({ id: item.id, name: item.name, origin: { col: item.col + 1, row: item.row + 1 } });
    }
    hline(grid, 3, 3, width - 4);
    hline(grid, height - 4, 3, width - 4);
    vline(grid, 3, 3, height - 4);
    vline(grid, width - 4, 3, height - 4);
    hline(grid, cy, 3, width - 4);
    vline(grid, cx, 3, height - 4);
  }

  carve(grid, spawn.col, spawn.row);
  if (grid[spawn.row][spawn.col] !== '.') {
    hline(grid, spawn.row, 2, width - 3);
    vline(grid, spawn.col, cy, spawn.row);
  }
  return { ascii: toAscii(grid, spawn), landmarks };
}

export function pathCellCount(ascii: string) {
  return [...ascii].filter(ch => ch === '.' || ch === 'S').length;
}
