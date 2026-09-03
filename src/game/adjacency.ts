import { Kernel } from './types';

export const wrappedColumnDelta = (a: number, b: number, columns: number) => {
  const raw = Math.abs(a - b);
  return Math.min(raw, columns - raw);
};

export function areAdjacent(a: Kernel, b: Kernel, columns: number): boolean {
  if (a.id === b.id) return false;
  const dr = Math.abs(a.row - b.row);
  const dc = wrappedColumnDelta(a.column, b.column, columns);
  return dr <= 1 && dc <= 1 && dr + dc > 0;
}

export const neighborsOf = (kernel: Kernel, candidates: Kernel[], columns: number) =>
  candidates.filter(candidate => areAdjacent(kernel, candidate, columns));
