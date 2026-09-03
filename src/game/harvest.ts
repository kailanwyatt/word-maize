import { Kernel } from './types';

export function harvestKernels(kernels: Kernel[], ids: string[]): Kernel[] {
  const chosen = new Set(ids);
  return kernels.map(k => chosen.has(k.id) ? { ...k, harvested: true } : k);
}

export function harvestPercent(kernels: Kernel[]): number {
  if (!kernels.length) return 0;
  return Math.round(kernels.filter(k => k.harvested).length / kernels.length * 100);
}
