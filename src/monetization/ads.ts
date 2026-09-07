import { DEVELOPMENT_STORE_GRANTS } from './config';

export async function configureAds(): Promise<void> {}

export async function showRewardedAd(
  kind: 'energy' | 'double_coins' | 'tool',
  adFree: boolean,
): Promise<{ rewarded: boolean; message?: string }> {
  if (adFree) return { rewarded: true, message: 'Ad-free harvest.' };
  if (DEVELOPMENT_STORE_GRANTS) return { rewarded: true, message: `Development reward (${kind}).` };
  return { rewarded: false, message: 'Ads need a development build with AdMob.' };
}
