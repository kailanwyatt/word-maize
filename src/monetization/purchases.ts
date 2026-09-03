import { SHOP_PRODUCTS, ShopProduct } from '../data/shop';
import { Inventory } from '../game/types';

type PurchaseResult = { ok: boolean; adFree?: boolean; tools?: Partial<Inventory>; message?: string };

export async function configurePurchases(): Promise<void> {}

export async function refreshAdFree(): Promise<boolean> {
  return false;
}

export async function restorePurchases(): Promise<{ ok: boolean; adFree: boolean; message: string }> {
  return { ok: false, adFree: false, message: 'Purchases need a development build and RevenueCat keys.' };
}

export async function purchaseProduct(product: ShopProduct): Promise<PurchaseResult> {
  if (__DEV__) {
    return { ok: true, adFree: product.entitlement === 'ad_free', tools: product.tools, message: 'Dev grant (store not configured).' };
  }
  return { ok: false, message: 'Store unavailable. Use a development build with RevenueCat keys.' };
}

export const shopCatalog = SHOP_PRODUCTS;
