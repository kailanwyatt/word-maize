import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const outDir = path.resolve('assets/word-maize/effects/fog');

function hash(x, y, seed) {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

function fade(t) {
  return t * t * (3 - 2 * t);
}

function valueNoise(x, y, period, seed) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = fade(x - x0);
  const fy = fade(y - y0);
  const wrap = (v) => ((v % period) + period) % period;
  const a = hash(wrap(x0), wrap(y0), seed);
  const b = hash(wrap(x0 + 1), wrap(y0), seed);
  const c = hash(wrap(x0), wrap(y0 + 1), seed);
  const d = hash(wrap(x0 + 1), wrap(y0 + 1), seed);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

function fbm(x, y, period, seed, octaves = 5) {
  let sum = 0;
  let amp = 0.52;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i += 1) {
    const p = Math.max(2, Math.round(period * freq));
    sum += amp * valueNoise((x / period) * p, (y / period) * p, p, seed + i * 19);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

function blur(src, width, height, radius) {
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  const wrapX = (x) => ((x % width) + width) % width;
  const wrapY = (y) => ((y % height) + height) % height;
  const span = radius * 2 + 1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let acc = 0;
      for (let k = -radius; k <= radius; k += 1) acc += src[y * width + wrapX(x + k)];
      tmp[y * width + x] = acc / span;
    }
  }
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let acc = 0;
      for (let k = -radius; k <= radius; k += 1) acc += tmp[wrapY(y + k) * width + x];
      out[y * width + x] = acc / span;
    }
  }
  return out;
}

function writeGrayAlpha(file, width, height, alpha, rgb = 228) {
  const png = new PNG({ width, height });
  for (let i = 0; i < width * height; i += 1) {
    const a = Math.max(0, Math.min(255, Math.round(alpha[i])));
    const o = i * 4;
    png.data[o] = rgb;
    png.data[o + 1] = rgb;
    png.data[o + 2] = rgb + 4;
    png.data[o + 3] = a;
  }
  fs.writeFileSync(file, PNG.sync.write(png));
}

function writeFogPlate(file, width, height, alpha, r, g, b) {
  const png = new PNG({ width, height });
  for (let i = 0; i < width * height; i += 1) {
    const a = Math.max(0, Math.min(255, Math.round(alpha[i])));
    const o = i * 4;
    png.data[o] = r;
    png.data[o + 1] = g;
    png.data[o + 2] = b;
    png.data[o + 3] = a;
  }
  fs.writeFileSync(file, PNG.sync.write(png));
}

function makeSpotlight(size) {
  const alpha = new Float32Array(size * size);
  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;
  const half = size / 2;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const t = Math.hypot(x - cx, y - cy) / half;
      let a = 0;
      if (t <= 0.1) a = 0;
      else if (t <= 0.28) {
        const u = (t - 0.1) / 0.18;
        a = u * u * (3 - 2 * u);
      } else {
        a = 1;
      }
      alpha[y * size + x] = a * 255;
    }
  }
  return alpha;
}

function makeSoft(size) {
  const raw = new Float32Array(size * size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const n = fbm(x, y, size, 11, 6);
      const n2 = fbm(x + 40, y - 18, size, 29, 4);
      raw[y * size + x] = 0.42 + n * 0.46 + n2 * 0.16;
    }
  }
  const blurred = blur(raw, size, size, 10);
  let lo = 1;
  let hi = 0;
  for (let i = 0; i < blurred.length; i += 1) {
    lo = Math.min(lo, blurred[i]);
    hi = Math.max(hi, blurred[i]);
  }
  const alpha = new Float32Array(size * size);
  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = (x - cx) / cx;
      const dy = (y - cy) / cy;
      const center = 1 - Math.min(1, Math.hypot(dx, dy) * 0.4);
      const t = (blurred[y * size + x] - lo) / Math.max(0.001, hi - lo);
      alpha[y * size + x] = (0.2 + t * 0.68 + center * 0.12) * 255;
    }
  }
  return alpha;
}

function makeNoise(size) {
  const raw = new Float32Array(size * size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      raw[y * size + x] = fbm(x, y, size, 47, 4);
    }
  }
  const blurred = blur(raw, size, size, 6);
  let lo = 1;
  let hi = 0;
  for (let i = 0; i < blurred.length; i += 1) {
    lo = Math.min(lo, blurred[i]);
    hi = Math.max(hi, blurred[i]);
  }
  const alpha = new Float32Array(size * size);
  for (let i = 0; i < blurred.length; i += 1) {
    const t = (blurred[i] - lo) / Math.max(0.001, hi - lo);
    alpha[i] = 28 + t * 200;
  }
  return alpha;
}

function makeWisp(width, height, seed, thin) {
  const raw = new Float32Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const nx = x / width;
      const ny = y / height;
      const n = fbm(x * (thin ? 1.6 : 1.1), y * (thin ? 2.4 : 1.7), Math.max(width, height), seed, 5);
      const breaks = thin ? fbm(x * 0.9, y * 3.1, Math.max(width, height), seed + 9, 3) : 1;
      const band = Math.exp(-((ny - (thin ? 0.46 : 0.5)) ** 2) / (thin ? 0.028 : 0.07));
      const lobes = thin
        ? Math.max(0, Math.sin(nx * Math.PI * 3.4 + 0.2)) * Math.max(0.15, Math.sin(nx * Math.PI * 1.15 + 0.8))
        : 0.75 + 0.25 * Math.sin(nx * Math.PI);
      const edgeX = Math.sin(nx * Math.PI) ** 1.35;
      const edgeY = Math.sin(ny * Math.PI) ** 1.6;
      raw[y * width + x] = n * band * lobes * edgeX * edgeY * (thin ? Math.max(0, breaks - 0.28) : 1);
    }
  }
  const blurred = blur(raw, width, height, thin ? 8 : 12);
  const alpha = new Float32Array(width * height);
  let max = 0;
  for (let i = 0; i < blurred.length; i += 1) max = Math.max(max, blurred[i]);
  const cutoff = thin ? 0.1 : 0.12;
  for (let i = 0; i < blurred.length; i += 1) {
    const v = Math.max(0, blurred[i] / max - cutoff) / (1 - cutoff);
    alpha[i] = (v ** 1.2) * (thin ? 188 : 175);
  }
  return alpha;
}

fs.mkdirSync(outDir, { recursive: true });
writeFogPlate(path.join(outDir, 'fog-spotlight.png'), 1024, 1024, makeSpotlight(1024), 0, 0, 0);
console.log(`Wrote fog spotlight to ${outDir}`);
