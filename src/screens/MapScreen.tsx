import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ImageBackground, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wordMaizeAssets } from '../../assets/word-maize/assets';
import { CurrencyBar } from '../components/CurrencyBar';
import { FarmButton, Panel } from '../components/FarmButton';
import { isLevelUnlocked, LEVELS, nextWorldNameForLevel } from '../data/levels';
import { STAR_GATE } from '../game/types';
import { totalStars } from '../game/scoring';
import { showRewardedAd } from '../monetization/ads';
import { useGameStore } from '../store/GameStore';

const NODES = [
  { x: 0.18, y: 0.78 }, { x: 0.38, y: 0.74 }, { x: 0.58, y: 0.70 }, { x: 0.74, y: 0.62 },
  { x: 0.58, y: 0.54 }, { x: 0.36, y: 0.50 }, { x: 0.20, y: 0.42 }, { x: 0.38, y: 0.36 },
  { x: 0.58, y: 0.32 }, { x: 0.76, y: 0.26 }, { x: 0.58, y: 0.20 }, { x: 0.38, y: 0.16 },
  { x: 0.22, y: 0.12 }, { x: 0.42, y: 0.08 }, { x: 0.64, y: 0.06 },
];

export function MapScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const store = useGameStore();
  const [needEnergy, setNeedEnergy] = useState(false);
  const currentLevel = LEVELS.find(level => level.id === store.currentLevelId) ?? LEVELS[0];
  const worldLevels = LEVELS.filter(level => level.world === currentLevel.world);
  const stars = totalStars(Object.fromEntries(worldLevels.map(level => [level.id, store.save.levels[level.id] ?? { stars: 0 }])));
  const mapBackground = currentLevel.world === 'Crow Creek' ? wordMaizeAssets.backgrounds.gameplayCrowCreek
    : currentLevel.world === 'Orchard Hollow' ? wordMaizeAssets.backgrounds.gameplayOrchardHollow
    : currentLevel.world === 'Moonlight Maize' ? wordMaizeAssets.backgrounds.gameplayMoonlightMaize
    : wordMaizeAssets.backgrounds.worldMap;
  const play = (id: number) => {
    if (!isLevelUnlocked(id, store.completedIds)) return;
    const continuing = store.save.activeLevelRun?.levelId === id;
    const { energy } = store.energyNow();
    if (!continuing && energy < 1) { setNeedEnergy(true); return; }
    if (!continuing) store.spendEnergy();
    store.setCurrentLevel(id);
    router.push(`/game/${id}`);
  };
  const refill = async () => {
    const result = await showRewardedAd('energy', store.save.adFree);
    if (result.rewarded) { store.addEnergy(1); setNeedEnergy(false); }
  };
  return (
    <ImageBackground source={mapBackground} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safe}>
        <CurrencyBar onSettings={() => router.push('/settings')} />
        <Text style={styles.world}>{currentLevel.world}</Text>
        <View style={styles.field}>
          {worldLevels.map((level, index) => {
            const node = NODES[index] ?? { x: 0.5, y: 0.5 };
            const unlocked = isLevelUnlocked(level.id, store.completedIds);
            const progress = store.save.levels[level.id];
            const current = store.currentLevelId === level.id;
            return (
              <Pressable
                key={level.id}
                onPress={() => play(level.id)}
                style={[styles.node, {
                  left: node.x * (width - 64),
                  top: node.y * (height * 0.62),
                  backgroundColor: unlocked ? '#66ad36' : '#6b5a3a',
                  borderColor: current ? '#fff36a' : '#f0d48a',
                }]}
              >
                <Text style={styles.nodeText}>{unlocked ? level.id : '🔒'}</Text>
                {progress?.stars ? <Text style={styles.stars}>{'★'.repeat(progress.stars)}</Text> : null}
              </Pressable>
            );
          })}
        </View>
        <View style={styles.levelCard}>
          <View>
            <Text style={styles.levelCardTitle}>LEVEL {currentLevel.id} · {currentLevel.name}</Text>
            <Text style={styles.levelCardGoal}>
              Harvest {currentLevel.objective.harvestPercent}%
              {currentLevel.objective.minWords ? ` · ${currentLevel.objective.minWords} words` : ''}
              {currentLevel.objective.minLongestWord ? ` · ${currentLevel.objective.minLongestWord}-letter word` : ''}
              {currentLevel.objective.minLayersRevealed ? ` · reveal ${currentLevel.objective.minLayersRevealed}` : ''}
            </Text>
          </View>
          <Text style={styles.levelReward}>+{currentLevel.rewardCoins}</Text>
        </View>
        <View style={styles.gate}>
          <Text style={styles.gateText}>{nextWorldNameForLevel(currentLevel.id)} · {stars}/{STAR_GATE} stars</Text>
          <View style={styles.bar}><View style={[styles.fill, { width: `${Math.min(100, (stars / STAR_GATE) * 100)}%` }]} /></View>
        </View>
      </SafeAreaView>
      <Modal visible={needEnergy} transparent animationType="fade">
        <View style={styles.shade}>
          <Panel>
            <Text style={styles.modalTitle}>Out of energy</Text>
            <FarmButton label={store.save.adFree ? 'GET 1 ENERGY' : 'WATCH AD FOR ENERGY'} onPress={refill} />
            <View style={{ height: 10 }} />
            <FarmButton label="CLOSE" onPress={() => setNeedEnergy(false)} />
          </Panel>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  world: { textAlign: 'center', color: '#fff6c6', fontWeight: '900', fontSize: 22, marginTop: 8, textShadowColor: '#1d1408', textShadowRadius: 4 },
  field: { flex: 1, marginTop: 8 },
  node: { position: 'absolute', width: 54, height: 54, borderRadius: 27, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  nodeText: { color: 'white', fontWeight: '900', fontSize: 16 },
  stars: { position: 'absolute', bottom: -14, color: '#ffe676', fontSize: 11, fontWeight: '900' },
  levelCard: { marginHorizontal: 16, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 2, borderColor: '#c99032', backgroundColor: 'rgba(55,34,14,0.93)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  levelCardTitle: { color: '#fff6c6', fontWeight: '900', fontSize: 14 },
  levelCardGoal: { color: '#e9d49c', fontWeight: '700', fontSize: 11, marginTop: 3 },
  levelReward: { color: '#ffe066', fontWeight: '900', fontSize: 18, marginLeft: 10 },
  gate: { padding: 16, paddingBottom: 10 },
  gateText: { color: '#fff6c6', fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  bar: { height: 10, borderRadius: 6, backgroundColor: 'rgba(40,28,12,0.7)', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#e5b72f' },
  shade: { flex: 1, backgroundColor: 'rgba(20,40,30,0.68)', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#5d8b31', textAlign: 'center', marginBottom: 12 },
});
