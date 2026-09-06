import { exposedKernels } from './board';
import { wordsOfLength } from './dictionary';
import { Kernel } from './types';

export function pathWord(path: Kernel[]): string {
  return path.map(kernel => kernel.letter).join('');
}

export function plantedPathStillOpen(pathIds: string[], kernels: Kernel[], foundWords: string[]): Kernel[] | undefined {
  const byId = new Map(kernels.map(kernel => [kernel.id, kernel]));
  const exposed = new Set(exposedKernels(kernels).map(kernel => kernel.id));
  const path = pathIds.map(id => byId.get(id)).filter((kernel): kernel is Kernel => !!kernel);
  if (path.length !== pathIds.length) return undefined;
  if (!path.every(kernel => exposed.has(kernel.id))) return undefined;
  const word = pathWord(path);
  if (foundWords.includes(word)) return undefined;
  return path;
}

function letterCounts(kernels: Kernel[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const kernel of kernels) counts.set(kernel.letter, (counts.get(kernel.letter) ?? 0) + 1);
  return counts;
}

function canSpell(word: string, counts: Map<string, number>): boolean {
  const used = new Map<string, number>();
  for (const letter of word) {
    const next = (used.get(letter) ?? 0) + 1;
    if (next > (counts.get(letter) ?? 0)) return false;
    used.set(letter, next);
  }
  return true;
}

export function pickKernelsForWord(word: string, exposed: Kernel[]): Kernel[] | undefined {
  const used = new Set<string>();
  const path: Kernel[] = [];
  for (const letter of word) {
    const kernel = exposed.find(item => item.letter === letter && !used.has(item.id));
    if (!kernel) return undefined;
    used.add(kernel.id);
    path.push(kernel);
  }
  return path;
}

export function findDiscoverablePath(
  kernels: Kernel[],
  _columns: number,
  dictionary: Set<string>,
  _prefixes: Set<string>,
  foundWords: string[],
  hintPaths: string[][] = [],
  minLength = 3,
  maxLength = 7,
): Kernel[] | undefined {
  for (const planted of hintPaths) {
    const open = plantedPathStillOpen(planted, kernels, foundWords);
    if (open && dictionary.has(pathWord(open))) return open;
  }

  const exposed = exposedKernels(kernels);
  const counts = letterCounts(exposed);
  const found = new Set(foundWords);

  for (let length = maxLength; length >= minLength; length--) {
    for (const word of wordsOfLength(length, dictionary)) {
      if (found.has(word) || !canSpell(word, counts)) continue;
      const path = pickKernelsForWord(word, exposed);
      if (path) return path;
    }
  }
  return undefined;
}
