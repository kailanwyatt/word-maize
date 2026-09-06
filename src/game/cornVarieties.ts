import { Kernel } from './types';

export function isDormantKernel(kernel: Kernel) {
  return kernel.variety === 'white' && kernel.dormant === true && !kernel.harvested;
}

export function dormantKernelIds(kernels: Kernel[]) {
  return new Set(kernels.filter(isDormantKernel).map(kernel => kernel.id));
}

function adjacentPositions(row: number, column: number, columns: number) {
  return new Set([
    `${row - 1}:${column}`,
    `${row + 1}:${column}`,
    `${row}:${(column - 1 + columns) % columns}`,
    `${row}:${(column + 1) % columns}`,
  ]);
}

export function wakeDormantNeighbors(kernels: Kernel[], harvestedIds: string[], columns: number): Kernel[] {
  const harvested = kernels.filter(kernel => harvestedIds.includes(kernel.id));
  if (!harvested.length) return kernels;
  const wakePositions = new Set<string>();
  harvested.forEach(kernel => {
    adjacentPositions(kernel.row, kernel.column, columns).forEach(position => wakePositions.add(position));
  });
  return kernels.map(kernel => (
    isDormantKernel(kernel) && wakePositions.has(`${kernel.row}:${kernel.column}`)
      ? { ...kernel, dormant: false }
      : kernel
  ));
}

export function restoreCornVarietyState(kernels: Kernel[], columns: number): Kernel[] {
  return wakeDormantNeighbors(kernels, kernels.filter(kernel => kernel.harvested).map(kernel => kernel.id), columns);
}
