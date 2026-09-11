import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ReactNode, useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { isExpoGo } from '../src/monetization/config';
import { configurePurchases, refreshAdFree } from '../src/monetization/purchases';
import { configureAds } from '../src/monetization/ads';
import { SplashView } from '../src/screens/SplashView';
import { OnboardingScreen } from '../src/screens/OnboardingScreen';
import { RuntimeBridge } from '../src/components/RuntimeBridge';
import { messagesFor } from '../src/i18n';
import { GameStoreProvider, useGameStore } from '../src/store/GameStore';

const nativeStores = !isExpoGo;

function Gate({ children }: { children: ReactNode }) {
  const { ready, save, setAdFree } = useGameStore();
  const [progress, setProgress] = useState(0.14);
  const [minTime, setMinTime] = useState(false);
  const loading = messagesFor(save.settings.language).splash.loading;

  useEffect(() => {
    const tick = setInterval(() => setProgress(value => Math.min(0.9, value + 0.07)), 110);
    const wait = setTimeout(() => { setMinTime(true); setProgress(1); }, 1300);
    if (nativeStores) {
      configureAds().catch(() => {});
      configurePurchases()
        .then(refreshAdFree)
        .then(adFree => { if (adFree) setAdFree(true); })
        .catch(() => {});
    }
    return () => { clearInterval(tick); clearTimeout(wait); };
  }, [setAdFree]);

  if (!ready || !minTime) return <SplashView progress={progress} loading={loading} />;
  if (!save.seenOnboarding) {
    return (
      <>
        <StatusBar style="light" />
        <OnboardingScreen />
      </>
    );
  }
  return children;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, alignItems: 'center', backgroundColor: '#061a2e' }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 430 }}>
        <GameStoreProvider>
          <RuntimeBridge />
          <Gate>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                gestureEnabled: false,
                fullScreenGestureEnabled: false,
                contentStyle: { flex: 1, backgroundColor: '#1a3a18' },
              }}
            />
          </Gate>
        </GameStoreProvider>
      </View>
    </GestureHandlerRootView>
  );
}
