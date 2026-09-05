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

const MAP_HEIGHT = 1540;
type MapPoint = { x: number; y: number };

// Bottom-to-top positions follow the painted road or creek on each chapter illustration.
const CHAPTER_PATHS: MapPoint[][] = [
  [
    { x: .52, y: .91 }, { x: .63, y: .85 }, { x: .69, y: .78 }, { x: .58, y: .71 }, { x: .38, y: .65 },
    { x: .28, y: .58 }, { x: .38, y: .51 }, { x: .56, y: .45 }, { x: .62, y: .38 }, { x: .54, y: .31 },
    { x: .46, y: .25 }, { x: .50, y: .19 }, { x: .61, y: .14 }, { x: .57, y: .09 }, { x: .48, y: .055 },
  ],
  [
    { x: .43, y: .92 }, { x: .54, y: .86 }, { x: .58, y: .79 }, { x: .48, y: .72 }, { x: .57, y: .65 },
    { x: .70, y: .58 }, { x: .73, y: .50 }, { x: .63, y: .43 }, { x: .47, y: .37 }, { x: .31, y: .31 },
    { x: .27, y: .24 }, { x: .37, y: .18 }, { x: .48, y: .13 }, { x: .44, y: .085 }, { x: .52, y: .05 },
  ],
  [
    { x: .45, y: .92 }, { x: .34, y: .86 }, { x: .30, y: .79 }, { x: .42, y: .73 }, { x: .58, y: .67 },
    { x: .65, y: .60 }, { x: .57, y: .53 }, { x: .44, y: .47 }, { x: .36, y: .40 }, { x: .43, y: .33 },
    { x: .54, y: .27 }, { x: .59, y: .20 }, { x: .52, y: .14 }, { x: .44, y: .09 }, { x: .50, y: .05 },
  ],
  [
    { x: .50, y: .92 }, { x: .43, y: .86 }, { x: .39, y: .79 }, { x: .47, y: .72 }, { x: .60, y: .66 },
    { x: .63, y: .59 }, { x: .55, y: .52 }, { x: .43, y: .46 }, { x: .38, y: .39 }, { x: .47, y: .32 },
    { x: .58, y: .26 }, { x: .61, y: .19 }, { x: .53, y: .13 }, { x: .45, y: .085 }, { x: .50, y: .05 },
  ],
];

export function MapScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const store = useGameStore();
  const scrollRef = useRef<ScrollView>(null);
  const initialChapter = Math.min(3, Math.floor((store.currentLevelId - 1) / 15));
  const [chapter, setChapter] = useState(initialChapter);
  const [selectedId, setSelectedId] = useState(store.currentLevelId);
  const [needEnergy, setNeedEnergy] = useState(false);
  const chapterLevels = useMemo(() => LEVELS.slice(chapter * 15, chapter * 15 + 15), [chapter]);
  const selectedLevel = LEVELS.find(level => level.id === selectedId) ?? chapterLevels[0];
  const chapterStars = totalStars(Object.fromEntries(chapterLevels.map(level => [level.id, store.save.levels[level.id] ?? { stars: 0 }])));
  const backgrounds = [
    wordMaizeAssets.backgrounds.mapSweetCorn,
    wordMaizeAssets.backgrounds.mapCrowCreek,
    wordMaizeAssets.backgrounds.mapOrchardHollow,
    wordMaizeAssets.backgrounds.mapMoonlight,
  ];
  const nextWorld = CAMPAIGN_WORLDS[chapter + 1];
  const nextChapterUnlocked = !nextWorld || isLevelUnlocked(chapter * 15 + 16, store.completedIds);

  const centerLevel = (levelId: number, animated: boolean) => {
    const localIndex = (levelId - 1) % 15;
    const top = CHAPTER_PATHS[chapter][localIndex].y * MAP_HEIGHT;
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: Math.max(0, top - height * 0.42), animated }));
  };

  useEffect(() => {
    const currentChapter = Math.min(3, Math.floor((store.currentLevelId - 1) / 15));
    if (currentChapter !== chapter) return;
    setSelectedId(store.currentLevelId);
    centerLevel(store.currentLevelId, false);
  }, [chapter, height, store.currentLevelId]);

  const changeChapter = (next: number) => {
    if (next < 0 || next > 3) return;
    const firstId = next * 15 + 1;
    const fallbackId = next < chapter ? firstId + 14 : firstId;
    const preferred = LEVELS.find(level => level.id >= firstId && level.id <= firstId + 14 && level.id === store.currentLevelId)?.id ?? fallbackId;
    setChapter(next);
    setSelectedId(preferred);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: next < chapter ? 0 : MAP_HEIGHT, animated: false }));
  };

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
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <CurrencyBar onSettings={() => router.push('/settings')} />
          <Text style={styles.world}>{CAMPAIGN_WORLDS[chapter]}</Text>
          <Text style={styles.dragHint}>SCROLL THE CHAPTER · LEVELS {chapter * 15 + 1}–{chapter * 15 + 15}</Text>
        </View>
        <ScrollView ref={scrollRef} style={styles.scroller} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces>
          <View style={styles.mapCanvas}>
            <Image source={backgrounds[chapter]} style={styles.mapBackground} resizeMode="stretch" />
            {chapterLevels.map((level, index) => {
              const point = CHAPTER_PATHS[chapter][index];
              const unlocked = isLevelUnlocked(level.id, store.completedIds);
              const progress = store.save.levels[level.id];
              const selected = selectedId === level.id;
              const current = store.currentLevelId === level.id;
              const nextPoint = CHAPTER_PATHS[chapter][index + 1];
              const angle = nextPoint ? Math.atan2((nextPoint.y - point.y) * MAP_HEIGHT, (nextPoint.x - point.x) * 430) * 180 / Math.PI + 90 : 0;
              return (
                <View key={level.id} style={[styles.nodeSlot, { left: `${point.x * 100}%` as const, top: point.y * MAP_HEIGHT }]}>
                  {nextPoint ? <View style={[styles.trail, { transform: [{ rotate: `${angle}deg` }] }]} /> : null}
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
            <View style={styles.chapterGate}>
              <Text style={styles.gateEyebrow}>{chapter === 3 ? 'FINAL DESTINATION' : 'CHAPTER GATE'}</Text>
              <Text style={styles.gateTitle}>{nextWorld ?? 'HARVEST FESTIVAL'}</Text>
              <Text style={styles.gateText}>{chapterStars}/{STAR_GATE} STARS EARNED HERE</Text>
              {nextWorld ? (
                <Pressable disabled={!nextChapterUnlocked} onPress={() => changeChapter(chapter + 1)} style={[styles.chapterButton, !nextChapterUnlocked && styles.chapterButtonLocked]}>
                  <Text style={styles.chapterButtonText}>{nextChapterUnlocked ? `GO TO ${nextWorld.toUpperCase()}  ›` : `COMPLETE LEVEL ${chapter * 15 + 15} TO UNLOCK`}</Text>
                </Pressable>
              ) : null}
            </View>
            {chapter > 0 ? (
              <Pressable onPress={() => changeChapter(chapter - 1)} style={styles.previousButton}>
                <Text style={styles.previousText}>‹ BACK TO {CAMPAIGN_WORLDS[chapter - 1].toUpperCase()}</Text>
              </Pressable>
            ) : null}
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
  safe: { flex: 1 },
  header: { backgroundColor: '#092236', paddingBottom: 8, zIndex: 4 },
  world: { textAlign: 'center', color: '#fff6c6', fontWeight: '900', fontSize: 24, textShadowColor: '#1d1408', textShadowRadius: 4 },
  dragHint: { textAlign: 'center', color: '#f6d66c', fontWeight: '900', fontSize: 10, letterSpacing: 1.2, marginTop: 2 },
  scroller: { flex: 1 },
  scrollContent: { minHeight: MAP_HEIGHT },
  mapCanvas: { height: MAP_HEIGHT, overflow: 'hidden' },
  mapBackground: { position: 'absolute', left: 0, top: 0, width: '100%', height: MAP_HEIGHT },
  nodeSlot: { position: 'absolute', width: 86, marginLeft: -43, marginTop: -31, alignItems: 'center', zIndex: 2 },
  trail: { position: 'absolute', width: 7, height: 104, top: -78, borderRadius: 4, backgroundColor: 'rgba(255,225,126,0.74)', borderWidth: 2, borderColor: 'rgba(96,61,24,0.55)' },
  node: { width: 60, height: 60, borderRadius: 30, borderWidth: 4, borderColor: '#f8dc83', backgroundColor: '#5fae35', alignItems: 'center', justifyContent: 'center', shadowColor: '#221308', shadowOpacity: 0.55, shadowRadius: 5, shadowOffset: { width: 0, height: 4 } },
  nodeLocked: { backgroundColor: '#756548', borderColor: '#d3c18b' },
  nodeCurrent: { borderColor: '#fff36a', transform: [{ scale: 1.08 }] },
  nodeSelected: { borderColor: '#ffffff', shadowColor: '#fff36a', shadowOpacity: 0.95, shadowRadius: 10 },
  nodeText: { color: 'white', fontWeight: '900', fontSize: 18, textShadowColor: '#254312', textShadowRadius: 2 },
  stars: { color: '#ffe676', fontSize: 13, fontWeight: '900', marginTop: 1, textShadowColor: '#5b3714', textShadowRadius: 2 },
  currentLabel: { color: '#fff6c6', fontSize: 9, fontWeight: '900', marginTop: 2, backgroundColor: '#533318', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  chapterGate: { position: 'absolute', top: 14, left: 22, right: 22, padding: 13, borderRadius: 18, borderWidth: 3, borderColor: '#d7ad4b', backgroundColor: 'rgba(55,34,14,0.95)', alignItems: 'center', zIndex: 4 },
  gateEyebrow: { color: '#e7c867', fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  gateTitle: { color: '#fff6c6', fontSize: 20, fontWeight: '900', textAlign: 'center' },
  gateText: { color: '#ead9a7', fontSize: 10, fontWeight: '800', marginTop: 1 },
  chapterButton: { marginTop: 8, borderRadius: 12, borderWidth: 2, borderColor: '#b9e875', backgroundColor: '#5cae31', paddingVertical: 9, paddingHorizontal: 14 },
  chapterButtonLocked: { backgroundColor: '#655944', borderColor: '#9f8e65' },
  chapterButtonText: { color: 'white', fontWeight: '900', fontSize: 10 },
  previousButton: { position: 'absolute', left: 22, right: 22, bottom: 18, paddingVertical: 10, borderRadius: 14, borderWidth: 2, borderColor: '#d7ad4b', backgroundColor: 'rgba(55,34,14,0.94)', alignItems: 'center' },
  previousText: { color: '#fff6c6', fontWeight: '900', fontSize: 11 },
  levelCard: { marginHorizontal: 12, marginVertical: 8, padding: 10, borderRadius: 18, borderWidth: 3, borderColor: '#c99032', backgroundColor: 'rgba(55,34,14,0.98)', flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelCopy: { flex: 1 },
  levelCardTitle: { color: '#fff6c6', fontWeight: '900', fontSize: 13 },
  levelCardGoal: { color: '#e9d49c', fontWeight: '700', fontSize: 10, marginTop: 3 },
  playButton: { minWidth: 104, paddingHorizontal: 10, paddingVertical: 13, borderRadius: 13, borderWidth: 2, borderColor: '#b9e875', backgroundColor: '#5cae31', alignItems: 'center' },
  playButtonLocked: { backgroundColor: '#655944', borderColor: '#9f8e65' },
  playText: { color: 'white', fontWeight: '900', fontSize: 12 },
  shade: { flex: 1, backgroundColor: 'rgba(20,40,30,0.68)', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#5d8b31', textAlign: 'center', marginBottom: 12 },
});
