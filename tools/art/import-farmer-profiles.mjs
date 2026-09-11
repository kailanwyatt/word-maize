import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PNG } from 'pngjs';

const IDS = ['may', 'sprout', 'reed', 'patch', 'cedar', 'lin', 'sol', 'nia', 'clay'];
const SRC = '/Users/kurt/.cursor/projects/Users-kurt-Documents-mobile-apps-word-maize/assets';
const ROOT = path.resolve(import.meta.dirname, '../..');

function floodMagenta(input) {
  const output = new PNG({ width: input.width, height: input.height });
  output.data.set(input.data);
  const { width, height, data } = output;
  const samples = [[4, 4], [width - 5, 4], [4, height - 5], [width - 5, height - 5]];
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
    const magenta = Math.min(r, b) - g;
    if (dist > 54 && magenta < 48) continue;
    data[i + 3] = dist < 22 || magenta > 110 ? 0 : Math.max(0, Math.round(255 * (dist - 22) / 40));
    const x = idx % width;
    const y = (idx / width) | 0;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const magenta = Math.min(r, b) - g;
    if (magenta < 40 || g > 140 || r < 140) continue;
    data[i + 3] = magenta > 64 ? 0 : Math.min(data[i + 3], Math.max(0, Math.round(255 * (64 - magenta) / 36)));
  }
  return output;
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wm-profiles-'));
for (const id of IDS) {
  const jpeg = ['pose', 'profile'].map(prefix => path.join(SRC, `${prefix}-${id}.png`)).find(fs.existsSync);
  if (!jpeg) throw new Error(`Missing pose/profile art for ${id}`);
  const converted = path.join(tmp, `${id}.png`);
  execFileSync('sips', ['-s', 'format', 'png', jpeg, '--out', converted], { stdio: 'pipe' });
  const source = PNG.sync.read(fs.readFileSync(converted));
  const keyed = floodMagenta(source);
  const dest = path.join(ROOT, 'assets/word-maize/maze/characters', id, 'profile.png');
  fs.writeFileSync(dest, PNG.sync.write(keyed));
  let opaque = 0;
  for (let i = 3; i < keyed.data.length; i += 4) if (keyed.data[i] > 12) opaque += 1;
  console.log(`${id} ${keyed.width}x${keyed.height} opaque=${opaque}`);
}
