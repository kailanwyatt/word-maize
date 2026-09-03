import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, ImageBackground, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wordMaizeAssets } from '../../assets/word-maize/assets';
import { CurrencyBar } from '../components/CurrencyBar';
import { FarmButton, Panel } from '../components/FarmButton';
import { isLevelUnlocked, LEVELS } from '../data/levels';
import { showRewardedAd } from '../monetization/ads';
import { useGameStore } from '../store/GameStore';
import { nextDailyDay } from '../store/types';

export function PlayScreen() {
  const router = useRouter();
  const store = useGameStore();
  const [needEnergy, setNeedEnergy] = useState(false);
  const level = LEVELS.find(item => item.id === store.currentLevelId) ?? LEVELS[0];
  const daily = nextDailyDay(store.save.daily);
  const play = () => {
    const { energy } = store.energyNow();
    if (energy < 1) { setNeedEnergy(true); return; }
    if (!isLevelUnlocked(level.id, store.completedIds) && level.id !== 1) return;
    store.spendEnergy();
    router.push(`/game/${level.id}`);
  };
  const refill = async () => {
    const result = await showRewardedAd('energy', store.save.adFree);
    if (result.rewarded) {
      store.addEnergy(1);
      setNeedEnergy(false);
    }
  };
  return (
    <ImageBackground source={wordMaizeAssets.backgrounds.homeFarm} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safe}>
        <CurrencyBar onSettings={() => router.push('/settings')} />
        <View style={styles.hero}>
          <Image source={wordMaizeAssets.corn.fullV2} style={styles.logo} />
          <Text style={styles.title}>WORD MAIZE</Text>
          <Text style={styles.sub}>Sweet Corn Fields · Level {level.id}</Text>
        </View>
        <View style={styles.actions}>
          <Pressable style={styles.daily} onPress={() => router.push('/daily-harvest')}>
            <Image source={wordMaizeAssets.props.chest} style={styles.chest} />
            <Text style={styles.dailyText}>{daily.alreadyClaimed ? 'Daily claimed' : `Day ${daily.day} ready`}</Text>
          </Pressable>
          <FarmButton label={`PLAY LEVEL ${level.id}`} onPress={play} />
        </View>
      </SafeAreaView>
      <Modal visible={needEnergy} transparent animationType="fade">
        <View style={styles.shade}>
          <Panel>
            <Text style={styles.modalTitle}>Out of energy</Text>
            <Text style={styles.body}>Energy grows back every 20 minutes, or watch a harvest ad for one extra ear.</Text>
            <View style={{ height: 12 }} />
            <FarmButton label={store.save.adFree ? 'GET 1 ENERGY' : 'WATCH AD FOR ENERGY'} onPress={refill} />
            <View style={{ height: 10 }} />
            <FarmButton label="BACK TO FARM" onPress={() => setNeedEnergy(false)} />
          </Panel>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1, justifyContent: 'space-between', paddingBottom: 18 },
  hero: { alignItems: 'center', marginTop: 24 },
  logo: { width: 140, height: 140, resizeMode: 'contain' },
  title: { color: '#fff6c6', fontSize: 34, fontWeight: '900', textShadowColor: '#1d1408', textShadowRadius: 6, letterSpacing: 1 },
  sub: { color: '#f7dfa0', fontWeight: '800', marginTop: 4 },
  actions: { alignItems: 'center', gap: 14, paddingBottom: 12 },
  daily: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(47,33,16,0.9)', borderWidth: 2, borderColor: '#e5b72f', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, gap: 8 },
  chest: { width: 36, height: 36, resizeMode: 'contain' },
  dailyText: { color: '#fff6c6', fontWeight: '800' },
  shade: { flex: 1, backgroundColor: 'rgba(20,40,30,0.68)', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#5d8b31', textAlign: 'center', marginBottom: 8 },
  body: { fontSize: 16, lineHeight: 24, textAlign: 'center', color: '#51351f', fontWeight: '700' },
});
