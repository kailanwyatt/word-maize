import { Inventory, ToolId } from '../game/types';

export type ShopProductId = 'ad_free' | 'starter_shed' | 'farmers_toolbox' | 'master_harvester';

export type ShopProduct = {
  id: ShopProductId;
  storeProductId: string;
  title: string;
  blurb: string;
  displayPrice: string;
  entitlement?: 'ad_free';
  tools?: Partial<Inventory>;
};

export const TOOL_INFO: Record<ToolId, { title: string; blurb: string }> = {
  scarecrow: { title: 'Scarecrow', blurb: 'Highlights the first letter of a hidden word.' },
  butterBrush: { title: 'Butter Brush', blurb: 'Highlights the letters of a hidden word around the cob.' },
  cornPicker: { title: 'Corn Picker', blurb: 'Remove any single kernel from the cob.' },
};

export const SHOP_PRODUCTS: ShopProduct[] = [
  {
    id: 'ad_free',
    storeProductId: 'wordmaize_ad_free',
    title: 'Ad-Free Harvest',
    blurb: 'Remove rewarded-ad prompts and keep every kernel of progress.',
    displayPrice: '$3.99',
    entitlement: 'ad_free',
  },
  {
    id: 'starter_shed',
    storeProductId: 'wordmaize_starter_shed',
    title: "Starter Tool Shed",
    blurb: 'A small restock for when the cob gets stubborn.',
    displayPrice: '$0.99',
    tools: { scarecrow: 5, butterBrush: 3, cornPicker: 3 },
  },
  {
    id: 'farmers_toolbox',
    storeProductId: 'wordmaize_farmers_toolbox',
    title: "Farmer's Toolbox",
    blurb: '15 Scarecrows, 10 Brushes, and 10 Pickers.',
    displayPrice: '$2.99',
    tools: { scarecrow: 15, butterBrush: 10, cornPicker: 10 },
  },
  {
    id: 'master_harvester',
    storeProductId: 'wordmaize_master_harvester',
    title: 'Master Harvester',
    blurb: 'A barn-load of tools plus extra breathing room.',
    displayPrice: '$4.99',
    tools: { scarecrow: 30, butterBrush: 20, cornPicker: 20 },
  },
];

export function validateShopProducts(products: ShopProduct[] = SHOP_PRODUCTS): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  const storeIds = new Set<string>();
  products.forEach(product => {
    if (ids.has(product.id)) issues.push(`Duplicate product id: ${product.id}`);
    if (storeIds.has(product.storeProductId)) issues.push(`Duplicate store product id: ${product.storeProductId}`);
    ids.add(product.id);
    storeIds.add(product.storeProductId);
    if (!/^\$\d+\.\d{2}$/.test(product.displayPrice)) issues.push(`Invalid display price: ${product.id}`);
    if (!product.entitlement && !product.tools) issues.push(`Product has no grant: ${product.id}`);
    Object.values(product.tools ?? {}).forEach(amount => {
      if (!Number.isInteger(amount) || amount < 1) issues.push(`Invalid tool quantity: ${product.id}`);
    });
  });
  return issues;
}

export type CoinToolOffer = {
  id: string;
  title: string;
  blurb: string;
  coins: number;
  tools: Partial<Inventory>;
};

export const COIN_TOOL_OFFERS: CoinToolOffer[] = [
  { id: 'coin-scarecrow', title: 'Scarecrow Stake', blurb: 'One Scarecrow to mark the start of a hidden word.', coins: 80, tools: { scarecrow: 1 } },
  { id: 'coin-brush', title: 'Butter Brush Tin', blurb: 'One Butter Brush to paint a whole hidden word.', coins: 100, tools: { butterBrush: 1 } },
  { id: 'coin-picker', title: 'Corn Picker', blurb: 'One Corn Picker to pluck a stubborn kernel.', coins: 120, tools: { cornPicker: 1 } },
  { id: 'coin-belt', title: 'Field Belt', blurb: 'One of each tool, packed for a hard cob.', coins: 260, tools: { scarecrow: 1, butterBrush: 1, cornPicker: 1 } },
];

export function coinOfferForTool(tool: ToolId) {
  return COIN_TOOL_OFFERS.find(offer => offer.tools[tool] === 1 && Object.keys(offer.tools).length === 1);
}

export function validateCoinOffers(offers: CoinToolOffer[] = COIN_TOOL_OFFERS): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  offers.forEach(offer => {
    if (ids.has(offer.id)) issues.push(`Duplicate coin offer: ${offer.id}`);
    ids.add(offer.id);
    if (!Number.isInteger(offer.coins) || offer.coins < 1) issues.push(`Invalid coin price: ${offer.id}`);
    if (!offer.tools || !Object.values(offer.tools).some(amount => (amount ?? 0) > 0)) issues.push(`Coin offer has no tools: ${offer.id}`);
  });
  return issues;
}

export const DAILY_REWARDS: { day: number; coins?: number; tools?: Partial<Inventory>; chest?: boolean }[] = [
  { day: 1, coins: 50 },
  { day: 2, tools: { scarecrow: 1 } },
  { day: 3, coins: 80 },
  { day: 4, tools: { butterBrush: 1 } },
  { day: 5, coins: 120 },
  { day: 6, tools: { cornPicker: 1 } },
  { day: 7, coins: 250, tools: { scarecrow: 2, butterBrush: 1, cornPicker: 1 }, chest: true },
];
