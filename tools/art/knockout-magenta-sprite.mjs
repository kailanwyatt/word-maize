import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const KEY = [255, 0, 255];
const HARD = 78;
const SOFT = 148;

function chromaDist(r, g, b) {
  return Math.hypot(r - KEY[0], g - KEY[1], b - KEY[2]);
}

function magentaScore(r, g, b) {
  return Math.min(r, b) - g;
}

function knockout(input) {
  const output = new PNG({ width: input.width, height: input.height });
  for (let i = 0; i < input.data.length; i += 4) {
    const r = input.data[i];
    const g = input.data[i + 1];
    const b = input.data[i + 2];
    const dist = chromaDist(r, g, b);
    const score = magentaScore(r, g, b);
    let alpha = 255;
    if (dist <= HARD || score >= 140) alpha = 0;
    else if (dist < SOFT && score > 40) {
      alpha = Math.round(255 * (dist - HARD) / (SOFT - HARD));
    }
    let nr = r;
    let ng = g;
    let nb = b;
    if (alpha < 255) {
      const spill = Math.max(0, Math.min(r, b) - g) / 255;
      nr = Math.max(0, Math.round(r - spill * (r - g) * 0.85));
      nb = Math.max(0, Math.round(b - spill * (b - g) * 0.85));
    }
    output.data[i] = nr;
    output.data[i + 1] = ng;
    output.data[i + 2] = nb;
    output.data[i + 3] = alpha;
  }
  return output;
}

function floodEdges(img) {
  const { width, height, data } = img;
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
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    const dist = chromaDist(r, g, b);
    const score = magentaScore(r, g, b);
    if (a > 40 && dist > SOFT && score < 70) continue;
    data[i + 3] = 0;
    const x = idx % width;
    const y = (idx / width) | 0;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }
}

function resize(src, size) {
  const out = new PNG({ width: size, height: size });
  const scale = src.width / size;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const x0 = Math.floor(x * scale);
      const y0 = Math.floor(y * scale);
      const x1 = Math.max(x0 + 1, Math.min(src.width, Math.floor((x + 1) * scale)));
      const y1 = Math.max(y0 + 1, Math.min(src.height, Math.floor((y + 1) * scale)));
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let n = 0;
      for (let yy = y0; yy < y1; yy += 1) {
        for (let xx = x0; xx < x1; xx += 1) {
          const i = (yy * src.width + xx) * 4;
          const w = src.data[i + 3];
          r += src.data[i] * w;
          g += src.data[i + 1] * w;
          b += src.data[i + 2] * w;
          a += w;
          n += 1;
        }
      }
      const o = (y * size + x) * 4;
      if (a < 1) continue;
      out.data[o] = Math.round(r / a);
      out.data[o + 1] = Math.round(g / a);
      out.data[o + 2] = Math.round(b / a);
      out.data[o + 3] = Math.round(a / n);
    }
  }
  return out;
}

const sourceDir = process.argv[2];
const destDir = process.argv[3];
if (!sourceDir || !destDir) {
  throw new Error('Usage: node knockout-magenta-sprite.mjs <sourceDir> <destDir> [--plants|--setdressing|--npc-plants]');
}

const jobs = fs.readdirSync(sourceDir)
  .map(name => {
    const v3 = name.match(/^maze-farmer-(up|down|left|right)-(idle|walk-[ab])-v3\.png$/);
    if (v3) return { name, dest: `farmer-${v3[1]}-${v3[2]}-v2.png` };
    const v2 = name.match(/^maze-farmer-(up|down|left|right)-(idle|walk-[ab])-v2\.png$/);
    if (v2) return { name, dest: `farmer-${v2[1]}-${v2[2]}-v2.png` };
    return null;
  })
  .filter(Boolean)
  .sort((a, b) => a.dest.localeCompare(b.dest) || a.name.localeCompare(b.name));

const latest = new Map();
for (const job of jobs) latest.set(job.dest, job);

fs.mkdirSync(destDir, { recursive: true });

if (process.argv.includes('--npc-plants')) {
  const plants = [
    ['maze-plant-closed-npc-v1.png', 'closed-v3.png'],
    ['maze-plant-open-npc-v2.png', 'open-v3.png'],
    ['maze-plant-empty-npc-v1.png', 'empty-v3.png'],
  ];
  for (const [name, dest] of plants) {
    const source = PNG.sync.read(fs.readFileSync(path.join(sourceDir, name)));
    const keyed = knockout(source);
    floodEdges(keyed);
    const out = resize(keyed, 256);
    fs.writeFileSync(path.join(destDir, dest), PNG.sync.write(out));
    let opaque = 0;
    for (let i = 3; i < out.data.length; i += 4) if (out.data[i] > 12) opaque += 1;
    console.log(`${dest} from ${name} ${out.width}x${out.height} opaque=${opaque}`);
  }
} else if (process.argv.includes('--setdressing')) {
  const jobs = [
    ['maze-plant-open-v4.png', 'open-v2.png'],
    ['maze-wall-corn-v3.png', 'wall-v2.png'],
    ['maze-wall-corn-v3b.png', 'wall-b-v2.png'],
  ];
  for (const [name, dest] of jobs) {
    const source = PNG.sync.read(fs.readFileSync(path.join(sourceDir, name)));
    const keyed = knockout(source);
    floodEdges(keyed);
    const out = resize(keyed, 256);
    fs.writeFileSync(path.join(destDir, dest), PNG.sync.write(out));
    let opaque = 0;
    for (let i = 3; i < out.data.length; i += 4) if (out.data[i] > 12) opaque += 1;
    console.log(`${dest} from ${name} ${out.width}x${out.height} opaque=${opaque}`);
  }
} else if (!process.argv.includes('--plants')) {
  for (const { name, dest } of latest.values()) {
    const source = PNG.sync.read(fs.readFileSync(path.join(sourceDir, name)));
    const keyed = knockout(source);
    floodEdges(keyed);
    const out = resize(keyed, 256);
    fs.writeFileSync(path.join(destDir, dest), PNG.sync.write(out));
    let opaque = 0;
    for (let i = 3; i < out.data.length; i += 4) if (out.data[i] > 12) opaque += 1;
    console.log(`${dest} from ${name} ${out.width}x${out.height} opaque=${opaque}`);
  }
} else {
  const plants = [
    ['maze-plant-closed-v2.png', 'closed-v2.png'],
    ['maze-plant-open-v2.png', 'open-v2.png'],
    ['maze-plant-empty-v2.png', 'empty-v2.png'],
  ];
  for (const [name, dest] of plants) {
    const source = PNG.sync.read(fs.readFileSync(path.join(sourceDir, name)));
    const magenta = Math.min(source.data[0], source.data[2]) - source.data[1] > 80;
    const keyed = magenta ? knockout(source) : knockoutStudio(source);
    if (magenta) floodEdges(keyed);
    const out = resize(keyed, 256);
    fs.writeFileSync(path.join(destDir, dest), PNG.sync.write(out));
    let opaque = 0;
    for (let i = 3; i < out.data.length; i += 4) if (out.data[i] > 12) opaque += 1;
    console.log(`${dest} from ${name} ${out.width}x${out.height} opaque=${opaque}`);
  }
}

function knockoutStudio(input) {
  const output = new PNG({ width: input.width, height: input.height });
  output.data.set(input.data);
  const { width, height, data } = output;
  const samples = [[6, 6], [width - 7, 6], [6, height - 7], [width - 7, height - 7]];
  let kr = 0;
  let kg = 0;
  let kb = 0;
  for (const [x, y] of samples) {
    const i = (y * width + x) * 4;
    kr += data[i];
    kg += data[i + 1];
    kb += data[i + 2];
  }
  kr /= samples.length;
  kg /= samples.length;
  kb /= samples.length;
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
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const dist = Math.hypot(r - kr, g - kg, b - kb);
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    if (sat > 42 && dist > 28) continue;
    if (dist > 58 && sat > 18) continue;
    data[i + 3] = 0;
    const x = idx % width;
    const y = (idx / width) | 0;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }
  return output;
}
