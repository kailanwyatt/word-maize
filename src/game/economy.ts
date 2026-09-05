import { completionBonus } from './scoring';

export type CompletionReward = {
  wordCoins: number;
  firstClearCoins: number;
  performanceCoins: number;
  subtotal: number;
  multiplier: 1 | 2;
  total: number;
};

export function completionReward(input: {
  wordCoins: number;
  levelReward: number;
  harvestPercent: number;
  harvestTarget: number;
  firstClear: boolean;
  doubled?: boolean;
}): CompletionReward {
  const wordCoins = Math.max(0, Math.floor(input.wordCoins));
  const firstClearCoins = input.firstClear ? Math.max(0, Math.floor(input.levelReward)) : 0;
  const performanceCoins = input.firstClear ? completionBonus(input.harvestPercent, input.harvestTarget) : 0;
  const subtotal = wordCoins + firstClearCoins + performanceCoins;
  const multiplier = input.doubled ? 2 : 1;
  return { wordCoins, firstClearCoins, performanceCoins, subtotal, multiplier, total: subtotal * multiplier };
}

export function clampInventoryAmount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(999, Math.floor(value)));
}
