import fs from 'node:fs';
import { PNG } from 'pngjs';

const inputPath = new URL('../../assets/word-maize/ui/materials/wood-planks-source-v1.png', import.meta.url);
const outputPath = new URL('../../assets/word-maize/ui/materials/wood-planks-tile-v1.png', import.meta.url);
const source = PNG.sync.read(fs.readFileSync(inputPath));
const output = new PNG({ width: source.width * 2, height: source.height * 2 });

// Mirror each axis at the center. Opposing outer edges now reference the same
// source pixels, making the result mathematically continuous when repeated.
for (let y = 0; y < output.height; y += 1) {
  const sourceY = y < source.height ? y : output.height - 1 - y;
  for (let x = 0; x < output.width; x += 1) {
    const sourceX = x < source.width ? x : output.width - 1 - x;
    const from = (sourceY * source.width + sourceX) * 4;
    const to = (y * output.width + x) * 4;
    output.data[to] = source.data[from];
    output.data[to + 1] = source.data[from + 1];
    output.data[to + 2] = source.data[from + 2];
    output.data[to + 3] = source.data[from + 3];
  }
}

fs.writeFileSync(outputPath, PNG.sync.write(output));

for (let y = 0; y < output.height; y += 1) {
  for (let channel = 0; channel < 4; channel += 1) {
    if (output.data[(y * output.width) * 4 + channel] !== output.data[(y * output.width + output.width - 1) * 4 + channel]) {
      throw new Error(`Horizontal edge mismatch at row ${y}.`);
    }
  }
}
for (let x = 0; x < output.width; x += 1) {
  for (let channel = 0; channel < 4; channel += 1) {
    if (output.data[x * 4 + channel] !== output.data[((output.height - 1) * output.width + x) * 4 + channel]) {
      throw new Error(`Vertical edge mismatch at column ${x}.`);
    }
  }
}

console.log(`Wrote and edge-validated seamless ${output.width}x${output.height} wood tile.`);
