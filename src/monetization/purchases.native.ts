import { SHOP_PRODUCTS, ShopProduct } from '../data/shop';
import { Inventory } from '../game/types';
import { AD_FREE_ENTITLEMENT, DEVELOPMENT_STORE_GRANTS, REVENUECAT_API_KEY, isExpoGo } from './config';

type PurchaseResult = { ok: boolean; adFree?: boolean; tools?: Partial<Inventory>; message?: string };

let configured = false;
let configuring: Promise<void> | null = null;

function loadPurchases(): typeof import('react-native-purchases').default | null {
  if (isExpoGo) return null;
  try {
    return require('react-native-purchases').default;
  } catch {
    return null;
  }
}

export async function configurePurchases(): Promise<void> {
  if (configured) return;
  if (configuring) return configuring;
  const task = (async () => {
    const Purchases = loadPurchases();
    if (!Purchases || !REVENUECAT_API_KEY) return;
    Purchases.configure({ apiKey: REVENUECAT_API_KEY });
    configured = true;
  })();
  configuring = task.finally(() => { configuring = null; });
  return configuring;
}

export async function refreshAdFree(): Promise<boolean> {
  const Purchases = loadPurchases();
  if (!Purchases || !configured) return false;
  try {
    const info = await Purchases.getCustomerInfo();
    return !!info.entitlements.active[AD_FREE_ENTITLEMENT];
  } catch {
    return false;
  }
}

export async function restorePurchases(): Promise<{ ok: boolean; adFree: boolean; message: string }> {
  await configurePurchases();
  const Purchases = loadPurchases();
  if (!Purchases || !configured) {
    return { ok: false, adFree: false, message: 'Purchases need a development build and RevenueCat keys.' };
  }
  try {
    const info = await Purchases.restorePurchases();
    const adFree = !!info.entitlements.active[AD_FREE_ENTITLEMENT];
    return { ok: true, adFree, message: adFree ? 'Ad-Free Harvest restored.' : 'No prior purchases found.' };
  } catch (error) {
    return { ok: false, adFree: false, message: error instanceof Error ? error.message : 'Restore failed.' };
  }
}

export async function purchaseProduct(product: ShopProduct): Promise<PurchaseResult> {
  await configurePurchases();
  const Purchases = loadPurchases();
  if (!Purchases || !configured) {
    if (DEVELOPMENT_STORE_GRANTS) {
      return { ok: true, adFree: product.entitlement === 'ad_free', tools: product.tools, message: 'Development grant (store not configured).' };
    }
    return { ok: false, message: 'Store unavailable. Use a development build with RevenueCat keys.' };
  }
  try {
    const offerings = await Purchases.getOfferings();
    const pack = offerings.current?.availablePackages.find(item => item.product.identifier === product.storeProductId)
      ?? Object.values(offerings.all ?? {}).flatMap(offering => offering.availablePackages).find(item => item.product.identifier === product.storeProductId);
    if (!pack) {
      if (DEVELOPMENT_STORE_GRANTS) return { ok: true, adFree: product.entitlement === 'ad_free', tools: product.tools, message: 'Development grant (product missing from offering).' };
      return { ok: false, message: 'This pack is not available on the store yet.' };
    }
    const { customerInfo } = await Purchases.purchasePackage(pack);
    return {
      ok: true,
      adFree: !!customerInfo.entitlements.active[AD_FREE_ENTITLEMENT],
      tools: product.tools,
    };
  } catch (error) {
    const cancelled = typeof error === 'object' && error !== null && 'userCancelled' in error && Boolean((error as { userCancelled?: boolean }).userCancelled);
    if (cancelled) return { ok: false, message: 'Purchase cancelled.' };
    return { ok: false, message: error instanceof Error ? error.message : 'Purchase failed.' };
  }
}

export const shopCatalog = SHOP_PRODUCTS;
