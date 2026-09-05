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
  tilt?: number;
  shade: number;
  opacity?: number;
};

// cob-full-v2 is a front-facing ear: silk at the top, husks at the bottom,
// and a regular (not staggered) kernel grid on the cob body.
export function cobMetrics(width: number, height: number): CobMetrics {
  return {
    width,
    height,
    radius: width * 0.424,
    top: height * 0.21,
    cobHeight: height * 0.63,
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
    const distance = Math.abs(offset);
    const angle = (offset / tuning.visibleColumns) * Math.PI;
    const x = metrics.width / 2 + Math.sin(angle) * rowRadius(kernel.row, rows, metrics.radius);
    const y = metrics.top + kernel.row * (metrics.cobHeight / Math.max(1, rows - 1));
    const edge = Math.min(1, distance / Math.max(0.65, frontLimit));
    const rowT = kernel.row / Math.max(1, rows - 1);
    const opacity = Math.max(0, Math.min(1, (frontLimit + 1.05 - distance) / 0.8));
    const tilt = edge > 0.36
      ? -Math.sign(offset) * (0.5 - rowT) * 24 * Math.pow((edge - 0.36) / 0.64, 1.15)
      : 0;
    centers[kernel.id] = { x, y };
    visible.push({ kernel, x, y, scaleX: 1 - edge * 0.44, scale: 1 - edge * 0.08, tilt, shade: edge, opacity });
  });
  return { centers, visible: visible.sort((a, b) => b.shade - a.shade) };
}

export function hitKernel(point: Point, visible: KernelLayout[], size: number, touchMultiplier: number): Kernel | undefined {
  const half = (size * touchMultiplier) / 2;
  return visible
    .filter(item => (item.opacity ?? 1) >= 0.35)
    .map(item => ({
      kernel: item.kernel,
      d: Math.hypot(point.x - item.x, point.y - item.y),
      box: Math.max(Math.abs(point.x - item.x), Math.abs(point.y - item.y)),
    }))
    .filter(item => item.box <= half)
    .sort((a, b) => a.d - b.d)[0]?.kernel;
}
