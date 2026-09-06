import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const masterDir = path.join(projectRoot, 'assets/word-maize/corn/asset-set-v1');
const outputRoot = path.join(projectRoot, 'assets/word-maize/corn/varieties');
const expected = ['sweet', 'white', 'flint-red', 'flint-orange', 'flint-blue', 'flint-gold', 'popcorn', 'blue', 'golden'];

function read(file) {
  return PNG.sync.read(fs.readFileSync(file));
}

function alphaBounds(image) {
  let left = image.width;
  let top = image.height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const alpha = image.data[(y * image.width + x) * 4 + 3];
      if (alpha === 0) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  return [left, top, right, bottom].join(':');
}

for (const filename of ['kernel-full.png', 'kernel-empty-socket.png']) {
  const master = read(path.join(masterDir, filename));
  const masterBounds = alphaBounds(master);
  for (const id of expected) {
    const candidate = read(path.join(outputRoot, id, filename));
    if (candidate.width !== master.width || candidate.height !== master.height) {
      throw new Error(`${id}/${filename} has the wrong canvas size.`);
    }
    if (alphaBounds(candidate) !== masterBounds) {
      throw new Error(`${id}/${filename} changed the approved alpha footprint.`);
    }
    for (let offset = 3; offset < master.data.length; offset += 4) {
      if (candidate.data[offset] !== master.data[offset]) {
        throw new Error(`${id}/${filename} changed alpha at pixel ${(offset - 3) / 4}.`);
      }
    }
  }
}

console.log(`Validated ${expected.length} corn palettes against the approved perspective contract.`);
