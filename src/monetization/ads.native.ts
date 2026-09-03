import { ADMOB_REWARDED_UNIT_ID } from './config';

type RewardKind = 'energy' | 'double_coins' | 'tool';

function loadAds(): typeof import('react-native-google-mobile-ads') | null {
  try {
    return require('react-native-google-mobile-ads');
  } catch {
    return null;
  }
}

let adsReady = false;

export async function configureAds(): Promise<void> {
  const ads = loadAds();
  if (!ads || adsReady) return;
  try {
    await ads.default().initialize();
    adsReady = true;
  } catch {
    adsReady = false;
  }
}

export async function showRewardedAd(kind: RewardKind, adFree: boolean): Promise<{ rewarded: boolean; message?: string }> {
  if (adFree) return { rewarded: true, message: 'Ad-free harvest.' };
  await configureAds();
  const ads = loadAds();
  if (!ads || !adsReady) {
    if (__DEV__) return { rewarded: true, message: 'Dev reward (ads unavailable in this build).' };
    return { rewarded: false, message: 'Ads need a development build with AdMob.' };
  }
  try {
    const reward = ads.RewardedAd.createForAdRequest(ADMOB_REWARDED_UNIT_ID);
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Ad timed out')), 12_000);
      const loaded = reward.addAdEventListener(ads.RewardedAdEventType.LOADED, () => {
        loaded();
        clearTimeout(timeout);
        reward.show().then(() => resolve()).catch(reject);
      });
      const failed = reward.addAdEventListener(ads.AdEventType.ERROR, error => {
        failed();
        clearTimeout(timeout);
        reject(error);
      });
      reward.load();
    });
    return await new Promise(resolve => {
      const earned = reward.addAdEventListener(ads.RewardedAdEventType.EARNED_REWARD, () => {
        earned();
        resolve({ rewarded: true });
      });
      const closed = reward.addAdEventListener(ads.AdEventType.CLOSED, () => {
        closed();
        resolve({ rewarded: false, message: 'Ad closed before the reward.' });
      });
    });
  } catch (error) {
    if (__DEV__) return { rewarded: true, message: `Dev reward (${kind}).` };
    return { rewarded: false, message: error instanceof Error ? error.message : 'Ad failed to play.' };
  }
}
