import { ENERGY_MAX, ENERGY_REGEN_MS } from './types';

export function replenishEnergy(energy: number, updatedAt: number, now = Date.now()): { energy: number; energyUpdatedAt: number } {
  if (energy >= ENERGY_MAX) return { energy: ENERGY_MAX, energyUpdatedAt: now };
  const gained = Math.floor(Math.max(0, now - updatedAt) / ENERGY_REGEN_MS);
  if (gained <= 0) return { energy, energyUpdatedAt: updatedAt };
  const next = Math.min(ENERGY_MAX, energy + gained);
  return {
    energy: next,
    energyUpdatedAt: next >= ENERGY_MAX ? now : updatedAt + gained * ENERGY_REGEN_MS,
  };
}

export function msUntilNextEnergy(energy: number, updatedAt: number, now = Date.now()): number {
  if (energy >= ENERGY_MAX) return 0;
  const elapsed = Math.max(0, now - updatedAt);
  return Math.max(0, ENERGY_REGEN_MS - (elapsed % ENERGY_REGEN_MS));
}

export function canSpendEnergy(energy: number): boolean {
  return energy >= 1;
}
