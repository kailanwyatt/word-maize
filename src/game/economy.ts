import { Inventory } from './types';
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

export function purchaseCoinOffer(
  coins: number,
  inventory: Inventory,
  cost: number,
  tools: Partial<Inventory>,
): { ok: true; coins: number; inventory: Inventory } | { ok: false; reason: 'coins' } {
  if (!Number.isFinite(cost) || cost < 1 || coins < cost) return { ok: false, reason: 'coins' };
  return {
    ok: true,
    coins: coins - Math.floor(cost),
    inventory: {
      scarecrow: clampInventoryAmount(inventory.scarecrow + (tools.scarecrow ?? 0)),
      butterBrush: clampInventoryAmount(inventory.butterBrush + (tools.butterBrush ?? 0)),
      cornPicker: clampInventoryAmount(inventory.cornPicker + (tools.cornPicker ?? 0)),
    },
  };
}
