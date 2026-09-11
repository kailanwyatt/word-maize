import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

function sampleScreen(img) {
  const { width, height, data } = img;
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  const add = (x, y) => {
    const i = (y * width + x) * 4;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    n += 1;
  };
  for (let x = 0; x < width; x += 4) {
    add(x, 2);
    add(x, height - 3);
  }
  for (let y = 0; y < height; y += 4) {
    add(2, y);
    add(width - 3, y);
  }
  return [r / n, g / n, b / n];
}

function knockout(input) {
  const [sr, sg, sb] = sampleScreen(input);
  const out = new PNG({ width: input.width, height: input.height });
  for (let i = 0; i < input.data.length; i += 4) {
    const r = input.data[i];
    const g = input.data[i + 1];
    const b = input.data[i + 2];
    const dist = Math.hypot(r - sr, g - sg, b - sb);
    const greenness = g - Math.max(r, b);
    let amount = 0;
    if (dist < 62 || greenness > 22) amount = 1;
    else if (dist < 108) amount = (108 - dist) / 46;
    else if (greenness > 8) amount = Math.min(1, (greenness - 8) / 24);
    const maxRB = Math.max(r, b);
    const ng = amount > 0 && g > maxRB ? Math.round(maxRB + (g - maxRB) * (1 - amount)) : g;
    const alpha = Math.round(255 * (1 - Math.min(1, amount)));
    out.data[i] = alpha < 16 ? 0 : r;
    out.data[i + 1] = alpha < 16 ? 0 : ng;
    out.data[i + 2] = alpha < 16 ? 0 : b;
    out.data[i + 3] = alpha;
  }
  return out;
}

function erode(img, times = 1) {
  const { width, height, data } = img;
  for (let n = 0; n < times; n += 1) {
    const copy = Buffer.from(data);
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const i = (y * width + x) * 4;
        if (copy[i + 3] < 16) continue;
        let clear = 0;
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          if (copy[((y + dy) * width + (x + dx)) * 4 + 3] < 16) clear += 1;
        }
        if (clear >= 2) {
          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 0;
          data[i + 3] = 0;
        }
      }
    }
  }
}

function trim(img, pad = 8) {
  const { width, height, data } = img;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] < 16) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < minX) return img;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const out = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y += 1) {
    const src = ((minY + y) * width + minX) * 4;
    out.data.set(data.subarray(src, src + w * 4), y * w * 4);
  }
  return out;
}

function report(label, img) {
  let trans = 0;
  let greenish = 0;
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] < 16) trans += 1;
    else if (img.data[i + 1] > img.data[i] + 12 && img.data[i + 1] > img.data[i + 2] + 12) greenish += 1;
  }
  const tot = img.width * img.height;
  console.log(`${label} ${img.width}x${img.height} trans=${((trans / tot) * 100).toFixed(1)}% greenish=${greenish}`);
}

const files = process.argv.slice(2);
if (!files.length) throw new Error('Usage: node knockout-green.mjs <png> [png...]');
for (const file of files) {
  const abs = path.resolve(file);
  const img = knockout(PNG.sync.read(fs.readFileSync(abs)));
  erode(img, 1);
  const out = trim(img);
  fs.writeFileSync(abs, PNG.sync.write(out));
  report(path.relative(process.cwd(), abs), out);
}
