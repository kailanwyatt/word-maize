import { Kernel, Point, Tuning } from '../../game/types';
import { signedColumnOffset } from '../../game/rotation';

export type CobMetrics = {
  width: number;
  height: number;
  radius: number;
  top: number;
  cobHeight: number;
};

export type KernelLayout = {
  kernel: Kernel;
  x: number;
  y: number;
  scaleX: number;
  scale: number;
  shade: number;
};

// cob-full-v2 is a front-facing ear: silk at the top, husks at the bottom,
// and a regular (not staggered) kernel grid on the cob body.
export function cobMetrics(width: number, height: number): CobMetrics {
  return {
    width,
    height,
    radius: width * 0.32,
    top: height * 0.16,
    cobHeight: height * 0.65,
  };
}

export function rowRadius(row: number, rows: number, radius: number) {
  return radius * (0.82 + 0.18 * Math.sin(Math.PI * (row + 1) / (rows + 1)));
}

export function layoutKernels(
  kernels: Kernel[],
  columns: number,
  rows: number,
  rotation: number,
  tuning: Tuning,
  metrics: CobMetrics,
): { centers: Record<string, Point>; visible: KernelLayout[] } {
  const centers: Record<string, Point> = {};
  const visible: KernelLayout[] = [];
  const frontLimit = (tuning.visibleColumns - 1) / 2;
  kernels.forEach(kernel => {
    const offset = signedColumnOffset(kernel.column, rotation, columns);
    if (Math.abs(offset) > frontLimit + 0.12) return;
    const angle = (offset / tuning.visibleColumns) * Math.PI;
    const x = metrics.width / 2 + Math.sin(angle) * rowRadius(kernel.row, rows, metrics.radius);
    const y = metrics.top + kernel.row * (metrics.cobHeight / Math.max(1, rows - 1));
    const edge = Math.min(1, Math.abs(offset) / Math.max(0.65, frontLimit));
    centers[kernel.id] = { x, y };
    visible.push({ kernel, x, y, scaleX: 1 - edge * 0.22, scale: 1 - edge * 0.08, shade: edge });
  });
  return { centers, visible: visible.sort((a, b) => b.shade - a.shade) };
}

export function hitKernel(point: Point, visible: KernelLayout[], size: number, touchMultiplier: number): Kernel | undefined {
  const radius = (size * touchMultiplier) / 2;
  return visible
    .map(item => ({ kernel: item.kernel, d: Math.hypot(point.x - item.x, point.y - item.y) }))
    .filter(item => item.d <= radius)
    .sort((a, b) => a.d - b.d)[0]?.kernel;
}
