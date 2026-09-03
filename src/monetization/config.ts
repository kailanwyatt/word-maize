import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  revenueCatIosKey?: string;
  revenueCatAndroidKey?: string;
  privacyPolicyUrl?: string;
  termsOfUseUrl?: string;
  admobRewardedUnitIdIos?: string;
  admobRewardedUnitIdAndroid?: string;
};

export const isExpoGo =
  Constants.appOwnership === 'expo'
  || Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const REVENUECAT_API_KEY = Platform.OS === 'ios' ? extra.revenueCatIosKey ?? '' : extra.revenueCatAndroidKey ?? '';
export const PRIVACY_POLICY_URL = extra.privacyPolicyUrl ?? 'https://example.com/word-maize/privacy';
export const TERMS_URL = extra.termsOfUseUrl ?? 'https://example.com/word-maize/terms';
export const ADMOB_REWARDED_UNIT_ID = Platform.OS === 'ios'
  ? extra.admobRewardedUnitIdIos ?? 'ca-app-pub-3940256099942544/1712485313'
  : extra.admobRewardedUnitIdAndroid ?? 'ca-app-pub-3940256099942544/5224354917';

export const AD_FREE_ENTITLEMENT = 'ad_free';
