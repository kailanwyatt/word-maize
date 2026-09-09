import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const KEY = [255, 0, 255];
const HARD = 78;
const SOFT = 148;
const SRC = '/Users/kurt/.cursor/projects/Users-kurt-Documents-mobile-apps-word-maize/assets';
const ROOT = path.resolve(import.meta.dirname, '../..');

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
    let nb = b;
    if (alpha < 255) {
      const spill = Math.max(0, Math.min(r, b) - g) / 255;
      nr = Math.max(0, Math.round(r - spill * (r - g) * 0.85));
      nb = Math.max(0, Math.round(b - spill * (b - g) * 0.85));
    }
    output.data[i] = nr;
    output.data[i + 1] = g;
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

function resizeTo(src, width, height) {
  const out = new PNG({ width, height });
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const x0 = Math.floor((x * src.width) / width);
      const y0 = Math.floor((y * src.height) / height);
      const x1 = Math.max(x0 + 1, Math.min(src.width, Math.floor(((x + 1) * src.width) / width)));
      const y1 = Math.max(y0 + 1, Math.min(src.height, Math.floor(((y + 1) * src.height) / height)));
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
      const o = (y * width + x) * 4;
      if (a < 1) continue;
      out.data[o] = Math.round(r / a);
      out.data[o + 1] = Math.round(g / a);
      out.data[o + 2] = Math.round(b / a);
      out.data[o + 3] = Math.round(a / n);
    }
  }
  return out;
}

function writePng(dest, img) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, PNG.sync.write(img));
  let opaque = 0;
  for (let i = 3; i < img.data.length; i += 4) if (img.data[i] > 12) opaque += 1;
  console.log(`${path.relative(ROOT, dest)} ${img.width}x${img.height} opaque=${opaque}`);
}

function keyed(name) {
  const source = PNG.sync.read(fs.readFileSync(path.join(SRC, name)));
  const img = knockout(source);
  floodEdges(img);
  return img;
}

if (process.argv.includes('--hud')) {
  for (const name of ['icon-hud-time.png', 'icon-hud-harvest.png', 'icon-hud-chapter.png', 'icon-hud-fog.png']) {
    writePng(path.join(ROOT, `assets/word-maize/ui/${name}`), resizeTo(keyed(name), 128, 128));
  }
  process.exit(0);
}

const sprites = [
  ['open-v4.png', 'assets/word-maize/maze/open-v4.png', 256, 256],
  ['closed-letter-v1.png', 'assets/word-maize/maze/closed-letter-v1.png', 256, 256],
  ['home-world-thumb.png', 'assets/word-maize/ui/home-world-thumb.png', 256, 256],
  ['icon-gamepad.png', 'assets/word-maize/ui/icon-gamepad.png', 192, 192],
  ['icon-fair-tent.png', 'assets/word-maize/ui/icon-fair-tent.png', 192, 192],
];

for (const [name, dest, w, h] of sprites) {
  writePng(path.join(ROOT, dest), resizeTo(keyed(name), w, h));
}

const farmer = keyed('home-farmer-idle.png');
const farmerH = 1024;
const farmerW = Math.round((farmer.width / farmer.height) * farmerH);
writePng(path.join(ROOT, 'assets/word-maize/characters/home-farmer-idle.png'), resizeTo(farmer, farmerW, farmerH));

const plaque = keyed('logo-tagline-plaque.png');
const plaqueW = 768;
const plaqueH = Math.round((plaque.height / plaque.width) * plaqueW);
writePng(path.join(ROOT, 'assets/word-maize/ui/logo-tagline-plaque.png'), resizeTo(plaque, plaqueW, plaqueH));

const copies = [
  ['home-hero-v1.jpg', 'assets/word-maize/backgrounds/home-hero-v1.jpg'],
  ['home-continue-thumb.png', 'assets/word-maize/ui/home-continue-thumb.png'],
  ['home-world-map-thumb.png', 'assets/word-maize/ui/home-world-map-thumb.png'],
  ...Array.from({ length: 8 }, (_, i) => {
    const n = String(i + 1).padStart(2, '0');
    return [`chapter-thumb-${n}.png`, `assets/word-maize/ui/chapter-thumb-${n}.png`];
  }),
];

for (const [name, dest] of copies) {
  const out = path.join(ROOT, dest);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.copyFileSync(path.join(SRC, name), out);
  console.log(`copied ${dest}`);
}
