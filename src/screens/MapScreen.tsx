import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wordMaizeAssets } from '../../assets/word-maize/assets';
import { CurrencyBar } from '../components/CurrencyBar';
import { FarmButton, Panel } from '../components/FarmButton';
import { CAMPAIGN_WORLDS, isLevelUnlocked, LEVELS } from '../data/levels';
import { chapterIndexForLevel, chapterRange } from '../game/campaign';
import { totalStars } from '../game/scoring';
import { STAR_GATE } from '../game/types';
import { showRewardedAd } from '../monetization/ads';
import { useGameStore } from '../store/GameStore';

const MAP_HEIGHT = 1540;
type MapPoint = { x: number; y: number };

function chapterFromRoute(raw: string | string[] | undefined, fallback: number) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 4) return fallback;
  return n - 1;
}

// Bottom-to-top waypoints traced on the 1024×1536 chapter paintings (dirt road / bridges).
const CHAPTER_PATHS: MapPoint[][] = [
  [
    { x: .50, y: .935 }, { x: .43, y: .88 }, { x: .34, y: .825 }, { x: .28, y: .76 }, { x: .38, y: .69 },
    { x: .48, y: .64 }, { x: .51, y: .57 }, { x: .50, y: .51 }, { x: .47, y: .45 }, { x: .48, y: .38 },
    { x: .52, y: .32 }, { x: .56, y: .25 }, { x: .57, y: .185 }, { x: .53, y: .13 }, { x: .50, y: .09 },
  ],
  [
    { x: .55, y: .94 }, { x: .58, y: .90 }, { x: .48, y: .85 }, { x: .40, y: .80 }, { x: .46, y: .74 },
    { x: .52, y: .68 }, { x: .42, y: .62 }, { x: .40, y: .55 }, { x: .50, y: .47 }, { x: .50, y: .40 },
    { x: .42, y: .34 }, { x: .34, y: .28 }, { x: .30, y: .22 }, { x: .40, y: .15 }, { x: .50, y: .09 },
  ],
  [
    { x: .55, y: .93 }, { x: .56, y: .86 }, { x: .52, y: .80 }, { x: .50, y: .73 }, { x: .48, y: .67 },
    { x: .48, y: .60 }, { x: .50, y: .54 }, { x: .40, y: .48 }, { x: .38, y: .42 }, { x: .42, y: .36 },
    { x: .48, y: .28 }, { x: .52, y: .22 }, { x: .55, y: .16 }, { x: .52, y: .12 }, { x: .50, y: .08 },
  ],
  [
    { x: .50, y: .94 }, { x: .50, y: .87 }, { x: .50, y: .80 }, { x: .50, y: .73 }, { x: .50, y: .66 },
    { x: .54, y: .58 }, { x: .58, y: .50 }, { x: .52, y: .42 }, { x: .48, y: .36 }, { x: .45, y: .28 },
    { x: .48, y: .22 }, { x: .52, y: .18 }, { x: .45, y: .14 }, { x: .42, y: .11 }, { x: .40, y: .08 },
  ],
];

export function MapScreen() {
  const router = useRouter();
  const { chapter: chapterParam } = useLocalSearchParams<{ chapter?: string }>();
  const { height } = useWindowDimensions();
  const store = useGameStore();
  const scrollRef = useRef<ScrollView>(null);
  const chapter = chapterFromRoute(chapterParam, chapterIndexForLevel(store.currentLevelId));
  const [selectedId, setSelectedId] = useState(store.currentLevelId);
  const [needEnergy, setNeedEnergy] = useState(false);
  const chapterLevels = useMemo(() => LEVELS.slice(chapter * 15, chapter * 15 + 15), [chapter]);
  const selectedLevel = chapterLevels.find(level => level.id === selectedId) ?? chapterLevels[0];
  const chapterStars = totalStars(Object.fromEntries(chapterLevels.map(level => [level.id, store.save.levels[level.id] ?? { stars: 0 }])));
  const backgrounds = [
    wordMaizeAssets.backgrounds.mapSweetCorn,
    wordMaizeAssets.backgrounds.mapCrowCreek,
    wordMaizeAssets.backgrounds.mapOrchardHollow,
    wordMaizeAssets.backgrounds.mapMoonlight,
  ];
  const nextWorld = CAMPAIGN_WORLDS[chapter + 1];
  const nextChapterUnlocked = !nextWorld || isLevelUnlocked(chapter * 15 + 16, store.completedIds);

  const scrollToLevel = useCallback((levelId: number, chapterIndex: number, animated: boolean) => {
    const localIndex = Math.max(0, Math.min(14, (levelId - 1) % 15));
    const top = CHAPTER_PATHS[chapterIndex][localIndex].y * MAP_HEIGHT;
    const visible = Math.max(220, height - 280);
    scrollRef.current?.scrollTo({ y: Math.max(0, Math.min(MAP_HEIGHT - visible, top - visible * 0.42)), animated });
  }, [height]);

  useFocusEffect(useCallback(() => {
    const { start, end } = chapterRange(chapter);
    const inChapter = store.currentLevelId >= start && store.currentLevelId <= end;
    const nextPlayable = LEVELS.find(level => (
      level.id >= start
      && level.id <= end
      && isLevelUnlocked(level.id, store.completedIds)
      && !(store.save.levels[level.id]?.stars)
    ));
    const focusId = inChapter
      ? store.currentLevelId
      : (nextPlayable?.id ?? (isLevelUnlocked(end, store.completedIds) ? end : start));
    setSelectedId(focusId);
    const frame = requestAnimationFrame(() => scrollToLevel(focusId, chapter, false));
    const later = setTimeout(() => scrollToLevel(focusId, chapter, false), 80);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(later);
    };
  }, [chapter, scrollToLevel, store.completedIds, store.currentLevelId, store.save.levels]));

  const changeChapter = (next: number) => {
    if (next < 0 || next > 3) return;
    if (next > chapter && !isLevelUnlocked(next * 15 + 1, store.completedIds)) return;
    router.replace(`/map/${next + 1}`);
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
          <Pressable accessibilityRole="button" accessibilityLabel="All chapters" onPress={() => router.push('/(tabs)/map')} style={styles.allChapters}>
            <Text style={styles.allChaptersText}>‹ ALL CHAPTERS</Text>
          </Pressable>
          <Text style={styles.world} numberOfLines={1}>{CAMPAIGN_WORLDS[chapter]}</Text>
          <Text style={styles.dragHint}>SCROLL · LEVELS {chapter * 15 + 1}–{chapter * 15 + 15}</Text>
        </View>
        <ScrollView ref={scrollRef} style={styles.scroller} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces onLayout={() => scrollToLevel(selectedId, chapter, false)}>
          <View style={styles.mapCanvas}>
            <Image source={backgrounds[chapter]} style={styles.mapBackground} resizeMode="cover" />
            {chapterLevels.map((level, index) => {
              const point = CHAPTER_PATHS[chapter][index];
              const unlocked = isLevelUnlocked(level.id, store.completedIds);
              const progress = store.save.levels[level.id];
              const selected = selectedId === level.id;
              const current = store.currentLevelId === level.id;
              const earned = progress?.stars ?? 0;
              const nodeArt = !unlocked
                ? wordMaizeAssets.ui.mapNodeLocked
                : earned > 0
                  ? wordMaizeAssets.ui.mapNodeComplete
                  : wordMaizeAssets.ui.mapNodeCurrent;
              return (
                <View key={level.id} style={[styles.nodeSlot, { left: `${point.x * 100}%` as const, top: point.y * MAP_HEIGHT }]}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${unlocked ? '' : 'Locked '}Level ${level.id}${earned ? `, ${earned} stars` : ''}`}
                    onPress={() => unlocked && setSelectedId(level.id)}
                    style={[styles.node, current && styles.nodeCurrent, selected && styles.nodeSelected]}
                  >
                    <Image
                      source={nodeArt}
                      style={styles.nodeKernel}
                    />
                    {unlocked ? <Text style={styles.nodeText}>{level.id}</Text> : null}
                  </Pressable>
                  <View style={styles.starRow}>
                    {unlocked ? [0, 1, 2].map(star => (
                      <Image
                        key={star}
                        source={star < earned ? wordMaizeAssets.ui.mapStarFilled : wordMaizeAssets.ui.mapStarEmpty}
                        style={[styles.starMark, star < earned && styles.starMarkOn]}
                      />
                    )) : null}
                  </View>
                  {current && !earned ? <Text style={styles.currentLabel}>NEXT</Text> : null}
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
            <Text style={styles.playText}>{selectedUnlocked ? 'PLAY' : 'LOCKED'}</Text>
            {selectedUnlocked ? <Text style={styles.playReward}>+{selectedLevel.rewardCoins}</Text> : null}
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
  header: { backgroundColor: 'rgba(9,34,54,0.88)', paddingBottom: 8, zIndex: 4 },
  allChapters: { alignSelf: 'center', marginTop: 2, paddingHorizontal: 12, paddingVertical: 4 },
  allChaptersText: { color: '#e7c867', fontWeight: '900', fontSize: 11, letterSpacing: 1.1 },
  world: { textAlign: 'center', color: '#fff6c6', fontWeight: '900', fontSize: 22, textShadowColor: '#1d1408', textShadowRadius: 4 },
  dragHint: { textAlign: 'center', color: '#f6d66c', fontWeight: '900', fontSize: 10, letterSpacing: 1.2, marginTop: 2 },
  scroller: { flex: 1 },
  scrollContent: { minHeight: MAP_HEIGHT },
  mapCanvas: { height: MAP_HEIGHT, overflow: 'hidden' },
  mapBackground: { position: 'absolute', left: 0, top: 0, width: '100%', height: MAP_HEIGHT },
  nodeSlot: { position: 'absolute', width: 72, marginLeft: -36, marginTop: -28, alignItems: 'center', zIndex: 2 },
  node: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center' },
  nodeCurrent: { transform: [{ scale: 1.12 }] },
  nodeSelected: { transform: [{ scale: 1.16 }] },
  nodeKernel: { position: 'absolute', width: 62, height: 62, resizeMode: 'contain' },
  nodeText: { color: '#fff8cf', fontWeight: '900', fontSize: 14, textShadowColor: 'rgba(27,62,12,0.95)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 2 },
  starRow: { flexDirection: 'row', gap: 2, marginTop: 1 },
  starMark: { width: 13, height: 13, resizeMode: 'contain' },
  starMarkOn: { opacity: 1 },
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
  playButton: { minWidth: 96, minHeight: 48, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 13, borderWidth: 2, borderColor: '#b9e875', backgroundColor: '#5cae31', alignItems: 'center', justifyContent: 'center' },
  playButtonLocked: { backgroundColor: '#655944', borderColor: '#9f8e65' },
  playText: { color: 'white', fontWeight: '900', fontSize: 14 },
  playReward: { color: '#e8ff9a', fontWeight: '800', fontSize: 11, marginTop: 1 },
  shade: { flex: 1, backgroundColor: 'rgba(20,40,30,0.68)', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#5d8b31', textAlign: 'center', marginBottom: 12 },
});
