import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const masterDir = path.join(projectRoot, 'assets/word-maize/corn/asset-set-v1');
const outputRoot = path.join(projectRoot, 'assets/word-maize/corn/varieties');

const varieties = {
  sweet: { kernel: ['#a94803', '#ffb600', '#fff29b'], socket: ['#2a0c03', '#7a2e06', '#ffc21a'] },
  white: { kernel: ['#9a5b20', '#e4be64', '#fff8db'], socket: ['#2a1408', '#795126', '#fff2c2'] },
  'flint-red': { kernel: ['#52120f', '#a93620', '#ff9a49'], socket: ['#210806', '#651a12', '#cf4a28'] },
  'flint-orange': { kernel: ['#6e2407', '#d66a19', '#ffd06a'], socket: ['#291006', '#7f310b', '#e67e25'] },
  'flint-blue': { kernel: ['#151b3d', '#263f73', '#8ca6dc'], socket: ['#090b1b', '#18264c', '#49669f'] },
  'flint-gold': { kernel: ['#74400c', '#d99b22', '#ffe58a'], socket: ['#281307', '#74400c', '#e6aa2f'] },
  popcorn: { kernel: ['#9b551a', '#e6a72b', '#fff2c2'], socket: ['#2b1407', '#734019', '#ffe7a0'] },
  blue: { kernel: ['#211840', '#4a4696', '#c5c4f4'], socket: ['#0c0819', '#28204f', '#6864b3'] },
  golden: { kernel: ['#713404', '#e89a00', '#ffd429'], socket: ['#251003', '#713404', '#f2b800'] },
};

function rgb(hex) {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function mix(a, b, amount) {
  return a.map((channel, index) => Math.round(channel + (b[index] - channel) * amount));
}

function paletteColor(palette, amount) {
  const colors = palette.map(rgb);
  const t = Math.max(0, Math.min(1, amount));
  return t < 0.56
    ? mix(colors[0], colors[1], t / 0.56)
    : mix(colors[1], colors[2], (t - 0.56) / 0.44);
}

function recolor(sourcePath, targetPath, palette, mode) {
  const input = PNG.sync.read(fs.readFileSync(sourcePath));
  const output = new PNG({ width: input.width, height: input.height });

  for (let offset = 0; offset < input.data.length; offset += 4) {
    const red = input.data[offset];
    const green = input.data[offset + 1];
    const blue = input.data[offset + 2];
    const alpha = input.data[offset + 3];
    const luminance = (red * 0.2126 + green * 0.7152 + blue * 0.0722) / 255;
    const shaped = mode === 'socket'
      ? Math.pow(Math.max(0, (luminance - 0.025) / 0.975), 1.12)
      : Math.pow(Math.max(0, (luminance - 0.08) / 0.92), 0.9);
    const [nextRed, nextGreen, nextBlue] = paletteColor(palette, shaped);

    output.data[offset] = nextRed;
    output.data[offset + 1] = nextGreen;
    output.data[offset + 2] = nextBlue;
    output.data[offset + 3] = alpha;
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, PNG.sync.write(output));
}

for (const [id, palettes] of Object.entries(varieties)) {
  const directory = path.join(outputRoot, id);
  recolor(path.join(masterDir, 'kernel-full.png'), path.join(directory, 'kernel-full.png'), palettes.kernel, 'kernel');
  recolor(path.join(masterDir, 'kernel-empty-socket.png'), path.join(directory, 'kernel-empty-socket.png'), palettes.socket, 'socket');
}

console.log(`Generated ${Object.keys(varieties).length} perspective-locked kernel/socket pairs.`);
