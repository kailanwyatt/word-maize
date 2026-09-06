import { Kernel, Level } from './types';

export const positionKey = (k: Pick<Kernel, 'row' | 'column'>) => `${k.row}:${k.column}`;
export const kernelId = (row: number, column: number, layer: number) => `${row}-${column}-${layer}`;

export function exposedKernels(kernels: Kernel[]): Kernel[] {
  const groups = new Map<string, Kernel[]>();
  kernels.forEach(k => groups.set(positionKey(k), [...(groups.get(positionKey(k)) ?? []), k]));
  return [...groups.values()]
    .map(stack => stack.sort((a, b) => a.layer - b.layer).find(k => !k.harvested))
    .filter((k): k is Kernel => !!k);
}

export function resetLevel(level: Level, rng: () => number = Math.random): Level {
  const restored = level.kernels.map(k => ({ ...k, harvested: false }));
  return { ...level, kernels: level.shuffleOnStart ? shuffleExposedLetters(restored, rng) : restored };
}

export function kernelsFromRows(rows: string[], variety: Kernel['variety'] = 'sweet'): Kernel[] {
  return rows.flatMap((letters, row) =>
    [...letters].map((letter, column) => ({
      id: kernelId(row, column, 0),
      row,
      column,
      layer: 0,
      letter: letter.toUpperCase(),
      harvested: false,
      variety,
    })),
  );
}

export function underKernels(
  cells: { row: number; column: number; letter: string }[],
  variety: Kernel['variety'] = 'sweet',
): Kernel[] {
  return cells.map(({ row, column, letter }) => ({
    id: kernelId(row, column, 1),
    row,
    column,
    layer: 1,
    letter: letter.toUpperCase(),
    harvested: false,
    variety,
  }));
}

export function pathIds(coords: [number, number][], layer = 0): string[] {
  return coords.map(([row, column]) => kernelId(row, column, layer));
}

export function shuffleExposedLetters(kernels: Kernel[], rng: () => number = Math.random): Kernel[] {
  const exposed = exposedKernels(kernels);
  const letters = exposed.map(k => k.letter);
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  const nextLetter = new Map(exposed.map((kernel, index) => [kernel.id, letters[index]]));
  return kernels.map(kernel => (nextLetter.has(kernel.id) ? { ...kernel, letter: nextLetter.get(kernel.id)! } : kernel));
}
