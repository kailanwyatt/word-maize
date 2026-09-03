import { neighborsOf } from './adjacency';
import { exposedKernels } from './board';
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

export function findDiscoverablePath(
  kernels: Kernel[],
  columns: number,
  dictionary: Set<string>,
  prefixes: Set<string>,
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
  const found = new Set(foundWords);
  let best: Kernel[] | undefined;

  const walk = (path: Kernel[]) => {
    if (best && best.length >= 5) return;
    const word = pathWord(path);
    if (path.length >= minLength && dictionary.has(word) && !found.has(word)) {
      if (!best || path.length > best.length) best = [...path];
    }
    if (path.length >= maxLength) return;
    if (!prefixes.has(word) && path.length > 0) return;
    const used = new Set(path.map(kernel => kernel.id));
    for (const next of neighborsOf(path[path.length - 1], exposed, columns)) {
      if (used.has(next.id)) continue;
      const prefix = word + next.letter;
      if (prefix.length < minLength && !prefixes.has(prefix) && !dictionary.has(prefix)) continue;
      if (prefix.length >= minLength && !prefixes.has(prefix) && !dictionary.has(prefix)) continue;
      walk([...path, next]);
    }
  };

  for (const start of exposed) walk([start]);
  return best;
}
