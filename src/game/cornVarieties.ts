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

export function isArmoredKernel(kernel: Kernel) {
  return kernel.variety === 'flint' && kernel.armored === true && !kernel.harvested;
}

export function resolveFlintHarvest(kernels: Kernel[], submittedIds: string[]) {
  const submitted = new Set(submittedIds);
  const harvestIds: string[] = [];
  const newlyCrackedIds: string[] = [];
  const next = kernels.map(kernel => {
    if (!submitted.has(kernel.id)) return kernel;
    if (!isArmoredKernel(kernel) || kernel.cracked) {
      harvestIds.push(kernel.id);
      return kernel;
    }
    newlyCrackedIds.push(kernel.id);
    return { ...kernel, cracked: true };
  });
  return { kernels: next, harvestIds, newlyCrackedIds };
}

export function restoreFlintState(kernels: Kernel[], crackedIds: string[] = []) {
  const cracked = new Set(crackedIds);
  return kernels.map(kernel => cracked.has(kernel.id) && isArmoredKernel(kernel) ? { ...kernel, cracked: true } : kernel);
}
