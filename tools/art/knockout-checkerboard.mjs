import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

function checkerScore(r, g, b) {
  const L = (r + g + b) / 3;
  const S = Math.max(r, g, b) - Math.min(r, g, b);
  if (L < 215 || S > 28) return 0;
  return Math.min(1, (L - 215) / 30) * Math.min(1, (28 - S) / 28);
}

function floodChecker(input) {
  const { width, height, data } = input;
  const out = new PNG({ width, height });
  out.data.set(data);
  const seen = new Uint8Array(width * height);
  const queue = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (seen[idx]) return;
    seen[idx] = 1;
    queue.push(idx);
  };
  for (let x = 0; x < width; x += 1) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    push(0, y);
    push(width - 1, y);
  }
  while (queue.length) {
    const idx = queue.pop();
    const i = idx * 4;
    const score = checkerScore(out.data[i], out.data[i + 1], out.data[i + 2]);
    if (score < 0.22) continue;
    out.data[i + 3] = score > 0.55 ? 0 : Math.round(255 * (1 - score));
    const x = idx % width;
    const y = (idx / width) | 0;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }
  return out;
}

function report(label, img) {
  let trans = 0;
  for (let i = 3; i < img.data.length; i += 4) if (img.data[i] < 16) trans += 1;
  const tot = img.width * img.height;
  console.log(`${label} ${img.width}x${img.height} trans=${(trans / tot * 100).toFixed(1)}%`);
}

const files = process.argv.slice(2);
if (!files.length) {
  throw new Error('Usage: node knockout-checkerboard.mjs <png> [png...]');
}
for (const file of files) {
  const abs = path.resolve(file);
  const img = PNG.sync.read(fs.readFileSync(abs));
  const next = floodChecker(img);
  fs.writeFileSync(abs, PNG.sync.write(next));
  report(path.relative(process.cwd(), abs), next);
}
