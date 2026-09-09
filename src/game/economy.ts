import { Inventory, ToolId, TOOL_IDS } from './types';
import { completionBonus } from './scoring';

export const EMPTY_INVENTORY: Inventory = {
  scarecrow: 0,
  butterBrush: 0,
  cornPicker: 0,
  mower: 0,
  tractor: 0,
  lantern: 0,
  raincoat: 0,
  huskClip: 0,
};

export function barnStock(inventory: Inventory) {
  return TOOL_IDS.reduce((sum, id) => sum + (inventory[id] ?? 0), 0);
}

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

export function addToInventory(inventory: Inventory, tools: Partial<Inventory> = {}): Inventory {
  const next = { ...EMPTY_INVENTORY };
  for (const id of TOOL_IDS) next[id] = clampInventoryAmount((inventory[id] ?? 0) + (tools[id] ?? 0));
  return next;
}

export function mazeClearCoins(chapter: number, stormRibbon = false) {
  const base = chapter <= 2 ? 50 : chapter <= 4 ? 70 : chapter <= 6 ? 90 : 110;
  return base + (stormRibbon ? 30 : 0);
}

export function fairPuzzleCoins(authored: boolean) {
  return authored ? 40 : 20;
}

export function fairRewardId(mode: 'crossword' | 'twist', puzzleId: string) {
  return `${mode}:${puzzleId}`;
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
    inventory: addToInventory(inventory, tools),
  };
}
