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

export const DAILY_REWARDS: { day: number; coins?: number; tools?: Partial<Inventory>; chest?: boolean }[] = [
  { day: 1, coins: 50 },
  { day: 2, tools: { scarecrow: 1 } },
  { day: 3, coins: 80 },
  { day: 4, tools: { butterBrush: 1 } },
  { day: 5, coins: 120 },
  { day: 6, tools: { cornPicker: 1 } },
  { day: 7, coins: 250, tools: { scarecrow: 2, butterBrush: 1, cornPicker: 1 }, chest: true },
];
