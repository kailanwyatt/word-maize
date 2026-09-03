import 'react-native-gesture-handler';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ReactNode, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { configureAds } from '../src/monetization/ads';
import { configurePurchases, refreshAdFree } from '../src/monetization/purchases';
import { SplashView } from '../src/screens/SplashView';
import { GameStoreProvider, useGameStore } from '../src/store/GameStore';

const nativeStores = Constants.appOwnership !== 'expo';

function Gate({ children }: { children: ReactNode }) {
  const { ready, setAdFree } = useGameStore();
  const [progress, setProgress] = useState(0.14);
  const [minTime, setMinTime] = useState(false);

  useEffect(() => {
    const tick = setInterval(() => setProgress(value => Math.min(0.9, value + 0.07)), 110);
    const wait = setTimeout(() => { setMinTime(true); setProgress(1); }, 1300);
    if (nativeStores) {
      configurePurchases()
        .then(refreshAdFree)
        .then(adFree => { if (adFree) setAdFree(true); })
        .catch(() => {});
      configureAds().catch(() => {});
    }
    return () => { clearInterval(tick); clearTimeout(wait); };
  }, [setAdFree]);

  if (!ready || !minTime) return <SplashView progress={progress} />;
  return children;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GameStoreProvider>
        <Gate>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#1a3a18' } }} />
        </Gate>
      </GameStoreProvider>
    </GestureHandlerRootView>
  );
}
