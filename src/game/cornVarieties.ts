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

export const POP_CHARGE_TARGET = 3;

export function advancePopCharge(kernels: Kernel[], columns: number) {
  const poppedIds = new Set<string>();
  const next = kernels.map(kernel => {
    if (kernel.variety !== 'popcorn' || !kernel.popKernel || kernel.harvested) return kernel;
    const charge = Math.min(POP_CHARGE_TARGET, (kernel.popCharge ?? 0) + 1);
    if (charge < POP_CHARGE_TARGET) return { ...kernel, popCharge: charge };
    poppedIds.add(kernel.id);
    const neighborColumn = (kernel.column + 1) % columns;
    const neighbor = kernels.find(candidate => (
      candidate.row === kernel.row
      && candidate.column === neighborColumn
      && candidate.layer === kernel.layer
      && !candidate.harvested
    ));
    if (neighbor) poppedIds.add(neighbor.id);
    return { ...kernel, popCharge: 0 };
  });
  return { kernels: next, poppedIds: [...poppedIds] };
}

export function reducePopCharge(kernels: Kernel[]) {
  return kernels.map(kernel => kernel.variety === 'popcorn' && kernel.popKernel && !kernel.harvested
    ? { ...kernel, popCharge: Math.max(0, (kernel.popCharge ?? 0) - 1) }
    : kernel);
}

export function restorePopCharge(kernels: Kernel[], charges: Record<string, number> = {}) {
  return kernels.map(kernel => kernel.variety === 'popcorn' && kernel.popKernel && Number.isFinite(charges[kernel.id])
    ? { ...kernel, popCharge: Math.max(0, Math.min(POP_CHARGE_TARGET - 1, charges[kernel.id])) }
    : kernel);
}

export const MOONLIT_CENTER_SHADE = 0.28;

export function isMoonlitHidden(kernel: Kernel, shade: number, revealed = false) {
  return kernel.variety === 'blue' && kernel.moonlit === true && shade > MOONLIT_CENTER_SHADE && !revealed;
}
