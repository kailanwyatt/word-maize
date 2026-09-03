import { Kernel, Point } from './types';
import { areAdjacent, neighborsOf } from './adjacency';

export function extendSelection(path: Kernel[], next: Kernel, columns: number): Kernel[] {
  if (!path.length) return [next];
  if (path.length > 1 && path[path.length - 2].id === next.id) return path.slice(0, -1);
  if (path.some(k => k.id === next.id)) return path;
  return areAdjacent(path[path.length - 1], next, columns) ? [...path, next] : path;
}

export function magneticNeighbor(current: Kernel, candidates: Kernel[], centers: Record<string, Point>, origin: Point, finger: Point, columns: number, threshold: number, directionalBias: number): Kernel | undefined {
  const dx = finger.x - origin.x, dy = finger.y - origin.y;
  const distance = Math.hypot(dx, dy);
  if (distance < threshold) return undefined;
  return neighborsOf(current, candidates, columns).map(kernel => {
    const p = centers[kernel.id];
    if (!p) return { kernel, score: Infinity };
    const vx = p.x - origin.x, vy = p.y - origin.y;
    const magnitude = Math.max(1, Math.hypot(vx, vy));
    const cosine = (dx * vx + dy * vy) / (distance * magnitude);
    return { kernel, score: Math.hypot(finger.x - p.x, finger.y - p.y) - cosine * directionalBias };
  }).sort((a, b) => a.score - b.score)[0]?.kernel;
}
