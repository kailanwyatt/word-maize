import { useRouter } from 'expo-router';
import { Alert, Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wordMaizeAssets } from '../../assets/word-maize/assets';
import { CurrencyBar } from '../components/CurrencyBar';
import { CAMPAIGN_WORLDS } from '../data/levels';
import { CHAPTER_SUMMARIES, CHAPTER_TITLES, chapterHarvests, chapterIndexForLevel, chapterRange, chapterStarCount, isChapterUnlocked } from '../game/campaign';
import { useGameStore } from '../store/GameStore';

const CHAPTER_ART = [
  wordMaizeAssets.backgrounds.mapSweetCorn,
  wordMaizeAssets.backgrounds.mapCrowCreek,
  wordMaizeAssets.backgrounds.mapOrchardHollow,
  wordMaizeAssets.backgrounds.mapMoonlight,
];

export function ChapterSelectScreen() {
  const router = useRouter();
  const store = useGameStore();
  const currentChapter = chapterIndexForLevel(store.currentLevelId);

  const openChapter = (index: number) => {
    if (!isChapterUnlocked(index, store.completedIds)) {
      Alert.alert('Still locked', `Harvest level ${index * 15} first to open this farm.`);
      return;
    }
    router.push(`/map/${index + 1}`);
  };

  return (
    <ImageBackground source={wordMaizeAssets.backgrounds.homeFarmRestored} style={styles.root} resizeMode="cover">
      <View style={styles.scrim} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <CurrencyBar onSettings={() => router.push('/settings')} />
        <View style={styles.titleBoard}>
          <Text style={styles.eyebrow}>VALLEY MAP</Text>
          <Text style={styles.title}>Chapters</Text>
          <Text style={styles.subtitle}>Choose a farm to visit</Text>
        </View>
        <View style={styles.grid}>
          {[0, 1].map(row => (
            <View key={row} style={styles.row}>
              {[0, 1].map(col => {
                const index = row * 2 + col;
                const unlocked = isChapterUnlocked(index, store.completedIds);
                const harvests = chapterHarvests(store.completedIds, index);
                const stars = chapterStarCount(store.save.levels, index);
                const range = chapterRange(index);
                const current = currentChapter === index;
                return (
                  <Pressable
                    key={index}
                    accessibilityRole="button"
                    accessibilityLabel={`${unlocked ? '' : 'Locked. '} ${CHAPTER_TITLES[index]}, ${CAMPAIGN_WORLDS[index]}, levels ${range.start} to ${range.end}, ${harvests.clears} of ${harvests.total} harvests${current ? ', current chapter' : ''}`}
                    onPress={() => openChapter(index)}
                    style={[styles.card, current && styles.cardCurrent, !unlocked && styles.cardLocked]}
                  >
                    <Image source={CHAPTER_ART[index]} style={styles.art} resizeMode="cover" />
                    <View style={styles.shade} />
                    {!unlocked ? <View style={styles.lockVeil} /> : null}
                    <View style={styles.copy}>
                      <Text style={styles.chapter}>{CHAPTER_TITLES[index]}</Text>
                      <Text style={styles.world} numberOfLines={2}>{CAMPAIGN_WORLDS[index]}</Text>
                      <Text style={styles.blurb} numberOfLines={2}>{CHAPTER_SUMMARIES[index]}</Text>
                      <Text style={styles.meta}>LEVELS {range.start}–{range.end}</Text>
                      <View style={styles.stats}>
                        <Text style={styles.stat}>{harvests.clears}/{harvests.total} HARVESTS</Text>
                        <Text style={styles.stat}>{stars}/45 STARS</Text>
                      </View>
                    </View>
                    {current && unlocked ? <View style={styles.now}><Text style={styles.nowText}>NOW</Text></View> : null}
                    {harvests.complete ? <View style={styles.done}><Text style={styles.doneText}>RESTORED</Text></View> : null}
                    {!unlocked ? (
                      <View style={styles.lockBadge}>
                        <Image source={wordMaizeAssets.ui.mapNodeLocked} style={styles.lockIcon} />
                        <Text style={styles.lockText}>COMPLETE LEVEL {index * 15}</Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#16381e' },
  scrim: { position: 'absolute', inset: 0, backgroundColor: 'rgba(8,28,20,0.28)' },
  safe: { flex: 1 },
  titleBoard: { alignSelf: 'center', minWidth: 230, marginTop: 2, marginBottom: 8, paddingHorizontal: 22, paddingVertical: 8, borderRadius: 14, borderWidth: 3, borderColor: '#c78a32', backgroundColor: 'rgba(68,36,15,0.94)', alignItems: 'center' },
  eyebrow: { color: '#e9c968', fontWeight: '900', fontSize: 9, letterSpacing: 2 },
  title: { color: '#fff6c6', fontWeight: '900', fontSize: 28, lineHeight: 32 },
  subtitle: { color: '#ead9a7', fontWeight: '700', fontSize: 12 },
  grid: { flex: 1, paddingHorizontal: 12, paddingBottom: 8, gap: 10 },
  row: { flex: 1, flexDirection: 'row', gap: 10 },
  card: { flex: 1, minHeight: 0, borderRadius: 18, borderWidth: 3, borderColor: '#d7ad4b', overflow: 'hidden', backgroundColor: '#2a1a0c' },
  cardCurrent: { borderColor: '#7ee04a' },
  cardLocked: { borderColor: '#8a7350' },
  art: { position: 'absolute', inset: 0 },
  shade: { position: 'absolute', inset: 0, backgroundColor: 'rgba(22,12,4,0.42)' },
  lockVeil: { position: 'absolute', inset: 0, backgroundColor: 'rgba(12,10,8,0.45)' },
  copy: { flex: 1, justifyContent: 'flex-end', padding: 10 },
  chapter: { color: '#e7c867', fontWeight: '900', fontSize: 9, letterSpacing: 1.1 },
  world: { color: '#fff6c6', fontWeight: '900', fontSize: 16, lineHeight: 19, marginTop: 2 },
  blurb: { color: '#f3e2b4', fontWeight: '700', fontSize: 11, lineHeight: 14, marginTop: 4 },
  meta: { color: '#f6d66c', fontWeight: '900', fontSize: 9, letterSpacing: 0.6, marginTop: 6 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  stat: { color: '#ead9a7', fontWeight: '800', fontSize: 9 },
  now: { position: 'absolute', top: 8, left: 8, backgroundColor: '#c78a32', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#fff6c6' },
  nowText: { color: '#fff6c6', fontWeight: '900', fontSize: 9, letterSpacing: 0.8 },
  done: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(55,34,14,0.94)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: '#d7ad4b' },
  doneText: { color: '#fff6c6', fontWeight: '900', fontSize: 8, letterSpacing: 0.6 },
  lockBadge: { position: 'absolute', left: 8, right: 8, top: '38%', alignItems: 'center' },
  lockIcon: { width: 42, height: 42, resizeMode: 'contain' },
  lockText: { color: '#fff6c6', fontWeight: '900', fontSize: 9, marginTop: 4, textAlign: 'center' },
});
