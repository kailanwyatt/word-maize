import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wordMaizeAssets } from '../../assets/word-maize/assets';
import { CurrencyBar } from '../components/CurrencyBar';
import { FarmButton, Panel } from '../components/FarmButton';
import { CAMPAIGN_WORLDS, isLevelUnlocked, LEVELS } from '../data/levels';
import { totalStars } from '../game/scoring';
import { STAR_GATE } from '../game/types';
import { showRewardedAd } from '../monetization/ads';
import { useGameStore } from '../store/GameStore';

const SECTION_HEIGHT = 1500;
const MAP_HEIGHT = SECTION_HEIGHT * 4;
const NODE_STEP = 96;
const NODE_BOTTOM = 126;
const X_PATH = [0.50, 0.28, 0.20, 0.35, 0.64, 0.76, 0.62, 0.34, 0.20, 0.38, 0.68, 0.77, 0.58, 0.30, 0.50];

export function MapScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const store = useGameStore();
  const scrollRef = useRef<ScrollView>(null);
  const [needEnergy, setNeedEnergy] = useState(false);
  const [selectedId, setSelectedId] = useState(store.currentLevelId);
  const selectedLevel = LEVELS.find(level => level.id === selectedId) ?? LEVELS[0];
  const selectedWorldLevels = useMemo(() => LEVELS.filter(level => level.world === selectedLevel.world), [selectedLevel.world]);
  const stars = totalStars(Object.fromEntries(selectedWorldLevels.map(level => [level.id, store.save.levels[level.id] ?? { stars: 0 }])));
  const sectionBackgrounds = [
    wordMaizeAssets.backgrounds.mapMoonlight,
    wordMaizeAssets.backgrounds.mapOrchardHollow,
    wordMaizeAssets.backgrounds.mapCrowCreek,
    wordMaizeAssets.backgrounds.mapSweetCorn,
  ];

  useEffect(() => {
    setSelectedId(store.currentLevelId);
    const index = Math.max(0, store.currentLevelId - 1);
    const nodeTop = MAP_HEIGHT - NODE_BOTTOM - index * NODE_STEP;
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: Math.max(0, nodeTop - height * 0.43), animated: false }));
  }, [height, store.currentLevelId]);

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
  const selectedUnlocked = isLevelUnlocked(selectedLevel.id, store.completedIds);

  return (
    <View style={styles.shell}>
      <View style={styles.bg}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.header}>
            <CurrencyBar onSettings={() => router.push('/settings')} />
            <Text style={styles.world}>{selectedLevel.world}</Text>
            <Text style={styles.dragHint}>SCROLL THE FARM · 60 LEVELS</Text>
          </View>
          <ScrollView ref={scrollRef} style={styles.scroller} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces>
            <View style={styles.mapCanvas}>
              {sectionBackgrounds.map((source, section) => (
                <Image key={section} source={source} style={[styles.sectionBackground, { top: section * SECTION_HEIGHT }]} resizeMode="cover" />
              ))}
              {CAMPAIGN_WORLDS.map((world, worldIndex) => (
                <View key={world} style={[styles.worldBoard, { top: (3 - worldIndex) * SECTION_HEIGHT + 32 }]}>
                  <Text style={styles.worldBoardTitle}>{world}</Text>
                  <Text style={styles.worldBoardSubtitle}>LEVELS {worldIndex * 15 + 1}–{worldIndex * 15 + 15}</Text>
                </View>
              ))}
              {LEVELS.map((level, index) => {
                const top = MAP_HEIGHT - NODE_BOTTOM - index * NODE_STEP;
                const left = `${X_PATH[index % X_PATH.length] * 100}%` as const;
                const unlocked = isLevelUnlocked(level.id, store.completedIds);
                const progress = store.save.levels[level.id];
                const selected = selectedId === level.id;
                const current = store.currentLevelId === level.id;
                return (
                  <View key={level.id} style={[styles.nodeSlot, { left, top }]}>
                    {index < LEVELS.length - 1 ? <View style={[styles.trail, { transform: [{ rotate: X_PATH[(index + 1) % X_PATH.length] > X_PATH[index % X_PATH.length] ? '-20deg' : '20deg' }] }]} /> : null}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${unlocked ? '' : 'Locked '}Level ${level.id}`}
                      onPress={() => unlocked && setSelectedId(level.id)}
                      style={[styles.node, !unlocked && styles.nodeLocked, current && styles.nodeCurrent, selected && styles.nodeSelected]}
                    >
                      <Text style={styles.nodeText}>{unlocked ? level.id : '🔒'}</Text>
                    </Pressable>
                    {progress?.stars ? <Text style={styles.stars}>{'★'.repeat(progress.stars)}{'☆'.repeat(3 - progress.stars)}</Text> : current ? <Text style={styles.currentLabel}>NEXT</Text> : null}
                  </View>
                );
              })}
              <View style={styles.gate}>
                <Text style={styles.gateTitle}>HARVEST FESTIVAL</Text>
                <Text style={styles.gateText}>{stars}/{STAR_GATE} STARS IN {selectedLevel.world.toUpperCase()}</Text>
                <View style={styles.bar}><View style={[styles.fill, { width: `${Math.min(100, (stars / STAR_GATE) * 100)}%` }]} /></View>
              </View>
            </View>
          </ScrollView>
          <View style={styles.levelCard}>
            <View style={styles.levelCopy}>
              <Text style={styles.levelCardTitle}>LEVEL {selectedLevel.id} · {selectedLevel.name}</Text>
              <Text style={styles.levelCardGoal} numberOfLines={1}>
                Harvest {selectedLevel.objective.harvestPercent}%
                {selectedLevel.objective.minWords ? ` · ${selectedLevel.objective.minWords} words` : ''}
                {selectedLevel.objective.minLongestWord ? ` · ${selectedLevel.objective.minLongestWord}-letter word` : ''}
              </Text>
            </View>
            <Pressable disabled={!selectedUnlocked} onPress={() => play(selectedLevel.id)} style={[styles.playButton, !selectedUnlocked && styles.playButtonLocked]}>
              <Text style={styles.playText}>{selectedUnlocked ? `PLAY  +${selectedLevel.rewardCoins}` : 'LOCKED'}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#071d2d' },
  bg: { flex: 1 },
  safe: { flex: 1 },
  header: { backgroundColor: 'rgba(7,29,45,0.72)', paddingBottom: 8, zIndex: 4 },
  world: { textAlign: 'center', color: '#fff6c6', fontWeight: '900', fontSize: 24, textShadowColor: '#1d1408', textShadowRadius: 4 },
  dragHint: { textAlign: 'center', color: '#f6d66c', fontWeight: '900', fontSize: 10, letterSpacing: 1.2, marginTop: 2 },
  scroller: { flex: 1 },
  scrollContent: { minHeight: MAP_HEIGHT },
  mapCanvas: { height: MAP_HEIGHT, overflow: 'hidden' },
  sectionBackground: { position: 'absolute', left: 0, right: 0, width: '100%', height: SECTION_HEIGHT },
  worldBoard: { position: 'absolute', alignSelf: 'center', left: '16%', right: '16%', paddingVertical: 10, borderRadius: 16, borderWidth: 3, borderColor: '#d7ad4b', backgroundColor: 'rgba(55,34,14,0.94)', alignItems: 'center', zIndex: 3 },
  worldBoardTitle: { color: '#fff6c6', fontSize: 20, fontWeight: '900' },
  worldBoardSubtitle: { color: '#e7c867', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  nodeSlot: { position: 'absolute', width: 86, marginLeft: -43, alignItems: 'center', zIndex: 2 },
  trail: { position: 'absolute', width: 8, height: 112, top: -82, borderRadius: 4, backgroundColor: 'rgba(255,225,126,0.72)', borderWidth: 2, borderColor: 'rgba(96,61,24,0.55)' },
  node: { width: 62, height: 62, borderRadius: 31, borderWidth: 4, borderColor: '#f8dc83', backgroundColor: '#5fae35', alignItems: 'center', justifyContent: 'center', shadowColor: '#221308', shadowOpacity: 0.5, shadowRadius: 5, shadowOffset: { width: 0, height: 4 } },
  nodeLocked: { backgroundColor: '#756548', borderColor: '#ccb980' },
  nodeCurrent: { borderColor: '#fff36a', transform: [{ scale: 1.08 }] },
  nodeSelected: { borderColor: '#ffffff', shadowColor: '#fff36a', shadowOpacity: 0.95, shadowRadius: 10 },
  nodeText: { color: 'white', fontWeight: '900', fontSize: 20, textShadowColor: '#254312', textShadowRadius: 2 },
  stars: { color: '#ffe676', fontSize: 14, fontWeight: '900', marginTop: 2, textShadowColor: '#5b3714', textShadowRadius: 2 },
  currentLabel: { color: '#fff6c6', fontSize: 10, fontWeight: '900', marginTop: 3, backgroundColor: '#533318', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  gate: { position: 'absolute', top: 118, left: 28, right: 28, padding: 14, borderRadius: 18, borderWidth: 3, borderColor: '#d7ad4b', backgroundColor: 'rgba(55,34,14,0.92)' },
  gateTitle: { color: '#fff6c6', fontSize: 18, fontWeight: '900', textAlign: 'center' },
  gateText: { color: '#ead9a7', fontSize: 11, fontWeight: '900', textAlign: 'center', marginTop: 2 },
  bar: { height: 10, marginTop: 8, borderRadius: 6, backgroundColor: 'rgba(10,8,4,0.55)', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#e5b72f' },
  levelCard: { marginHorizontal: 12, marginVertical: 8, padding: 10, borderRadius: 18, borderWidth: 3, borderColor: '#c99032', backgroundColor: 'rgba(55,34,14,0.97)', flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelCopy: { flex: 1 },
  levelCardTitle: { color: '#fff6c6', fontWeight: '900', fontSize: 13 },
  levelCardGoal: { color: '#e9d49c', fontWeight: '700', fontSize: 10, marginTop: 3 },
  playButton: { minWidth: 104, paddingHorizontal: 10, paddingVertical: 13, borderRadius: 13, borderWidth: 2, borderColor: '#b9e875', backgroundColor: '#5cae31', alignItems: 'center' },
  playButtonLocked: { backgroundColor: '#655944', borderColor: '#9f8e65' },
  playText: { color: 'white', fontWeight: '900', fontSize: 12 },
  shade: { flex: 1, backgroundColor: 'rgba(20,40,30,0.68)', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#5d8b31', textAlign: 'center', marginBottom: 12 },
});
