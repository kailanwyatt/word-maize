import { Inventory, ToolId } from '../game/types';

export type ShopProductId =
  | 'ad_free'
  | 'starter_shed'
  | 'farmers_toolbox'
  | 'master_harvester'
  | 'field_kit'
  | 'coin_sack'
  | 'coin_bushel'
  | 'coin_barn';

export type ShopProduct = {
  id: ShopProductId;
  storeProductId: string;
  title: string;
  blurb: string;
  displayPrice: string;
  entitlement?: 'ad_free';
  tools?: Partial<Inventory>;
  coins?: number;
};

export const TOOL_INFO: Record<ToolId, { title: string; blurb: string }> = {
  scarecrow: { title: 'Scarecrow', blurb: 'Shoos a maze crow or pest from anywhere, or highlights a starting letter on a cob.' },
  butterBrush: { title: 'Butter Brush', blurb: 'Clears weeds, pests, webs, or frost—or reveals a useful word path.' },
  cornPicker: { title: 'Corn Picker', blurb: 'Harvests one visible kernel immediately, including a squirrel’s target.' },
  mower: { title: 'Mower', blurb: 'Cuts a straight line of decorative corn so you can walk a shortcut.' },
  tractor: { title: 'Tractor', blurb: 'Rolls a short strip, mows a corridor, and harvests up to three letters in order.' },
  lantern: { title: 'Lantern', blurb: 'A larger lamp for mist, evening, and storm. Lights farther around you for the rest of the field.' },
  raincoat: { title: 'Raincoat', blurb: 'Adds about 90 seconds to a storm forecast. Storm ribbons still use the original deadline.' },
  huskClip: { title: 'Husk Clip', blurb: 'Peeks last twice as long for the rest of this field. Husks still close.' },
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
    id: 'coin_sack',
    storeProductId: 'wordmaize_coin_sack',
    title: 'Coin Sack',
    blurb: '500 coins to stock the Barn.',
    displayPrice: '$0.99',
    coins: 500,
  },
  {
    id: 'coin_bushel',
    storeProductId: 'wordmaize_coin_bushel',
    title: 'Coin Bushel',
    blurb: '1,200 coins for lanterns, mowers, and more.',
    displayPrice: '$2.99',
    coins: 1200,
  },
  {
    id: 'coin_barn',
    storeProductId: 'wordmaize_coin_barn',
    title: 'Coin Barn',
    blurb: '3,000 coins — a season’s worth of helpers.',
    displayPrice: '$4.99',
    coins: 3000,
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
    id: 'field_kit',
    storeProductId: 'wordmaize_field_kit',
    title: 'Field Kit',
    blurb: 'Lanterns, mowers, a tractor, and storm gear for World Maize.',
    displayPrice: '$2.99',
    tools: { lantern: 3, mower: 3, tractor: 1, raincoat: 2, huskClip: 2 },
  },
  {
    id: 'master_harvester',
    storeProductId: 'wordmaize_master_harvester',
    title: 'Master Harvester',
    blurb: 'A barn-load of cob tools plus maze lanterns and a mower.',
    displayPrice: '$4.99',
    tools: { scarecrow: 30, butterBrush: 20, cornPicker: 20, lantern: 2, mower: 2 },
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
    if (!product.entitlement && !product.tools && !product.coins) issues.push(`Product has no grant: ${product.id}`);
    Object.values(product.tools ?? {}).forEach(amount => {
      if (!Number.isInteger(amount) || amount < 1) issues.push(`Invalid tool quantity: ${product.id}`);
    });
    if (product.coins != null && (!Number.isInteger(product.coins) || product.coins < 1)) issues.push(`Invalid coin grant: ${product.id}`);
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
  { id: 'coin-scarecrow', title: 'Scarecrow Stake', blurb: 'One Scarecrow for a crow or a helpful starting letter.', coins: 220, tools: { scarecrow: 1 } },
  { id: 'coin-brush', title: 'Butter Brush Tin', blurb: 'One Butter Brush for an obstacle or a useful word path.', coins: 280, tools: { butterBrush: 1 } },
  { id: 'coin-picker', title: 'Corn Picker', blurb: 'One Corn Picker to harvest a stubborn visible kernel.', coins: 340, tools: { cornPicker: 1 } },
  { id: 'coin-lantern', title: 'Field Lantern', blurb: 'One larger lamp for mist, evening, or storm.', coins: 280, tools: { lantern: 1 } },
  { id: 'coin-mower', title: 'Field Mower', blurb: 'One mower charge that cuts a line through decorative corn.', coins: 300, tools: { mower: 1 } },
  { id: 'coin-tractor', title: 'Field Tractor', blurb: 'One tractor burst that rolls a strip and harvests in order.', coins: 520, tools: { tractor: 1 } },
  { id: 'coin-raincoat', title: 'Storm Raincoat', blurb: 'One extra 90 seconds on a storm forecast.', coins: 260, tools: { raincoat: 1 } },
  { id: 'coin-husk', title: 'Husk Clip', blurb: 'One clip that doubles peek time for a field.', coins: 220, tools: { huskClip: 1 } },
  { id: 'coin-belt', title: 'Field Belt', blurb: 'One of each cob tool, packed for a hard cob.', coins: 720, tools: { scarecrow: 1, butterBrush: 1, cornPicker: 1 } },
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
  { day: 1, coins: 40 },
  { day: 2, tools: { scarecrow: 1 } },
  { day: 3, coins: 60 },
  { day: 4, tools: { butterBrush: 1 } },
  { day: 5, coins: 100 },
  { day: 6, tools: { cornPicker: 1 } },
  { day: 7, coins: 180, tools: { scarecrow: 1, butterBrush: 1, cornPicker: 1, lantern: 1 }, chest: true },
];
