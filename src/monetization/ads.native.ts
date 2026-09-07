import { ADMOB_CONFIGURED, ADMOB_REWARDED_UNIT_ID, DEVELOPMENT_STORE_GRANTS, isExpoGo } from './config';

type RewardKind = 'energy' | 'double_coins' | 'tool';

function loadAds(): typeof import('react-native-google-mobile-ads') | null {
  if (isExpoGo) return null;
  try {
    return require('react-native-google-mobile-ads');
  } catch {
    return null;
  }
}

let adsReady = false;
let configuring: Promise<void> | null = null;

export async function configureAds(): Promise<void> {
  if (adsReady) return;
  if (configuring) return configuring;
  const task = (async () => {
    const ads = loadAds();
    if (!ads || !ADMOB_CONFIGURED) return;
    await ads.default().initialize();
    adsReady = true;
  })();
  configuring = task.finally(() => { configuring = null; });
  return configuring;
}

export async function showRewardedAd(kind: RewardKind, adFree: boolean): Promise<{ rewarded: boolean; message?: string }> {
  if (adFree) return { rewarded: true, message: 'Ad-free harvest.' };
  await configureAds();
  const ads = loadAds();
  if (!ads || !adsReady) {
    if (DEVELOPMENT_STORE_GRANTS) return { rewarded: true, message: 'Development reward (AdMob is not configured).' };
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
    if (DEVELOPMENT_STORE_GRANTS) return { rewarded: true, message: `Development reward (${kind}).` };
    return { rewarded: false, message: error instanceof Error ? error.message : 'Ad failed to play.' };
  }
}
