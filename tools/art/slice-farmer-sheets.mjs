import { PNG } from 'pngjs';
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const SRC = '/Users/kurt/.cursor/projects/Users-kurt-Documents-mobile-apps-word-maize/assets';
const OUT = 'assets/word-maize/maze/characters';
const SHEETS = [
  { id: 'may', file: 'farmer-may-cardinals.png' },
  { id: 'sprout', file: 'farmer-sprout-cardinals.png' },
  { id: 'reed', file: 'farmer-reed-cardinals.png' },
];
const COLS = 4;
const ROWS = 2;

function readPng(file) {
  const tmp = path.join(os.tmpdir(), `wm-sheet-${path.basename(file)}.png`);
  execFileSync('sips', ['-s', 'format', 'png', file, '--out', tmp]);
  return PNG.sync.read(fs.readFileSync(tmp));
}

function isInk(data, i, thresh = 32) {
  return !(data[i] <= thresh && data[i + 1] <= thresh && data[i + 2] <= thresh);
}

function cropCell(src, col, row) {
  const cellW = Math.floor(src.width / COLS);
  const cellH = Math.floor(src.height / ROWS);
  const x0 = col * cellW;
  const y0 = row * cellH;
  let minX = x0 + cellW;
  let minY = y0 + cellH;
  let maxX = x0;
  let maxY = y0;
  for (let y = y0; y < y0 + cellH; y += 1) {
    for (let x = x0; x < x0 + cellW; x += 1) {
      const i = (y * src.width + x) * 4;
      if (!isInk(src.data, i)) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < minX) return null;
  const pad = 10;
  const left = Math.max(x0, minX - pad);
  const top = Math.max(y0, minY - pad);
  const right = Math.min(x0 + cellW - 1, maxX + pad);
  const bottom = Math.min(y0 + cellH - 1, maxY + pad);
  const width = right - left + 1;
  const height = bottom - top + 1;
  const out = new PNG({ width, height });
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const from = ((top + y) * src.width + (left + x)) * 4;
      const to = (y * width + x) * 4;
      out.data[to] = src.data[from];
      out.data[to + 1] = src.data[from + 1];
      out.data[to + 2] = src.data[from + 2];
      out.data[to + 3] = src.data[from + 3];
    }
  }
  return out;
}

function knock(png) {
  const { width, height, data } = png;
  const idx = (x, y) => (y * width + x) * 4;
  const seen = new Uint8Array(width * height);
  const q = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (seen[p]) return;
    seen[p] = 1;
    if (isInk(data, idx(x, y))) return;
    q.push(p);
  };
  for (let x = 0; x < width; x += 1) { push(x, 0); push(x, height - 1); }
  for (let y = 0; y < height; y += 1) { push(0, y); push(width - 1, y); }
  while (q.length) {
    const p = q.pop();
    const x = p % width;
    const y = (p / width) | 0;
    data[idx(x, y) + 3] = 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
  return png;
}

function flipH(png) {
  const out = new PNG({ width: png.width, height: png.height });
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const from = (y * png.width + x) * 4;
      const to = (y * png.width + (png.width - 1 - x)) * 4;
      out.data[to] = png.data[from];
      out.data[to + 1] = png.data[from + 1];
      out.data[to + 2] = png.data[from + 2];
      out.data[to + 3] = png.data[from + 3];
    }
  }
  return out;
}

function write(file, png) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, PNG.sync.write(knock(png)));
  console.log('wrote', file, png.width, png.height);
}

for (const sheet of SHEETS) {
  const png = readPng(path.join(SRC, sheet.file));
  const dir = path.join(OUT, sheet.id);
  fs.mkdirSync(dir, { recursive: true });
  const idle = [];
  const walk = [];
  for (let col = 0; col < COLS; col += 1) {
    idle[col] = cropCell(png, col, 0);
    walk[col] = cropCell(png, col, 1);
  }
  const map = [
    ['up', 0],
    ['down', 1],
    ['right', 2],
  ];
  for (const [facing, col] of map) {
    if (!idle[col] || !walk[col]) throw new Error(`Missing ${sheet.id} ${facing}`);
    write(path.join(dir, `${facing}-idle.png`), idle[col]);
    write(path.join(dir, `${facing}-walk-a.png`), walk[col]);
    write(path.join(dir, `${facing}-walk-b.png`), idle[col]);
  }
  write(path.join(dir, 'left-idle.png'), flipH(idle[2]));
  write(path.join(dir, 'left-walk-a.png'), flipH(walk[2]));
  write(path.join(dir, 'left-walk-b.png'), flipH(idle[2]));
}
