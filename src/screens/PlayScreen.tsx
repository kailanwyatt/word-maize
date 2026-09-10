import { useRouter } from 'expo-router';
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wordMaizeAssets } from '../../assets/word-maize/assets';
import { CurrencyBar } from '../components/CurrencyBar';
import { RaisedPill } from '../components/FarmButton';
import { RaisedBoard } from '../components/RaisedBoard';
import { Chevron } from '../components/HomeGlyphs';
import { MAZE_PUZZLES } from '../data/mazeLevels';
import { continueMazeLevel, isFreePlayUnlocked, maizeHomeQuote, MAZE_CHAPTERS } from '../game/mazeCampaign';
import { bestMazeScore, formatMazeScoreTime } from '../game/mazeScores';
import { useMessages } from '../i18n';
import { useGameStore } from '../store/GameStore';

export function PlayScreen() {
  const router = useRouter();
  const t = useMessages();
  const store = useGameStore();
  const next = continueMazeLevel(MAZE_PUZZLES, store.save.maze.rewardedIds, store.save.maze.unlockedIds, store.save.maze.runs);
  const chapter = MAZE_CHAPTERS.find(item => item.id === next.chapter) ?? MAZE_CHAPTERS[0];
  const cleared = store.save.maze.rewardedIds.length;
  const quote = maizeHomeQuote(next, cleared);
  const lastId = store.save.maze.rewardedIds.at(-1);
  const lastPuzzle = lastId ? MAZE_PUZZLES.find(level => level.id === lastId) : undefined;
  const lastScore = lastId ? bestMazeScore(store.save.maze.scores, lastId) : null;
  const lastRibbon = lastId ? store.save.maze.ribbons?.[lastId] : undefined;
  const nextBest = bestMazeScore(store.save.maze.scores, next.id);
  const nextRibbon = store.save.maze.ribbons?.[next.id];
  const resume = store.save.maze.runs[next.id] && !store.save.maze.runs[next.id]?.completed && !store.save.maze.rewardedIds.includes(next.id);
  const farmer = cleared >= 80 ? wordMaizeAssets.characters.farmerMayCelebration : wordMaizeAssets.characters.homeFarmerIdle;
  const freePlay = isFreePlayUnlocked(store.save.maze.rewardedIds, store.save.settings.devUnlock);

  return (
    <View style={styles.root}>
      <ImageBackground source={wordMaizeAssets.backgrounds.homeHero} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={styles.scrim} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <CurrencyBar tone="glass" onSettings={() => router.push('/settings')} />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.brand}>
            <View style={styles.logoCol}>
              <Image source={wordMaizeAssets.ui.logo} style={styles.logo} />
              <View style={styles.tag}>
                <View style={styles.ropes} pointerEvents="none">
                  <View style={styles.rope} />
                  <View style={styles.rope} />
                </View>
                <RaisedBoard wood radius={12} depth={3} style={styles.tagFace} wrapStyle={styles.tagBoard}>
                  <Text
                    style={styles.tagText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.72}
                  >
                    EXPLORE • SOLVE • HARVEST
                  </Text>
                </RaisedBoard>
              </View>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={`Open World Maize chapters, ${chapter.title}`} onPress={() => router.push('/maze')} style={styles.worldCard}>
              <Image source={wordMaizeAssets.ui.homeWorldThumb} style={styles.worldThumb} />
              <View style={styles.worldCopy}>
                <View style={styles.worldTitleRow}>
                  <Text style={styles.worldKicker}>CHAPTER {chapter.id}</Text>
                  <Chevron size={12} color="#6a4420" />
                </View>
                <Text style={styles.worldName} numberOfLines={1}>{chapter.title}</Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.max(6, (cleared / 80) * 100)}%` }]} />
                </View>
                <Text style={styles.worldFields}>{cleared} / 80 Fields</Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.hero}>
            <Image source={farmer} style={styles.farmer} />
            <View style={styles.speech}>
              <View style={styles.speechTail} />
              <Text style={styles.quote} numberOfLines={4}>{quote}</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={resume ? `Continue World Maize, ${next.displayAnswer}` : `Play World Maize, ${next.displayAnswer}`}
              onPress={() => router.push(`/maze/${next.id}`)}
              style={styles.continueCard}
            >
              {({ pressed }) => (
                <>
                  <Text style={styles.continueKicker}>{resume ? 'RESUME FIELD' : 'CONTINUE MAIZE'}</Text>
                  <Text style={styles.continueMeta}>{chapter.title} • Field {next.order}</Text>
                  {lastScore && lastId !== next.id ? (
                    <Text style={styles.continueReward} numberOfLines={1}>
                      {lastPuzzle?.displayAnswer}: {lastScore.coins ? `+${lastScore.coins} coins` : `${lastScore.points} pts`}
                      {lastRibbon?.unaided ? ' · Unaided' : ''}
                      {lastRibbon?.storm ? ' · Storm' : ''}
                    </Text>
                  ) : nextBest ? (
                    <Text style={styles.continueReward} numberOfLines={1}>
                      Best {nextBest.points} pts · {formatMazeScoreTime(nextBest.elapsedMs)}
                      {nextRibbon?.unaided ? ' · Unaided' : ''}
                      {nextRibbon?.storm ? ' · Storm' : ''}
                    </Text>
                  ) : null}
                  <Image source={wordMaizeAssets.ui.homeContinueThumb} style={styles.featureArt} />
                  <RaisedPill label={resume ? 'RESUME' : 'PLAY'} pressed={pressed} />
                </>
              )}
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Open World Maize chapters" onPress={() => router.push('/maze')} style={styles.mapCard}>
              {({ pressed }) => (
                <>
                  <Text style={styles.mapKicker}>CHAPTERS</Text>
                  <Image source={wordMaizeAssets.ui.homeWorldMapThumb} style={styles.featureArt} />
                  <Text style={styles.mapMeta}>Eight chapters</Text>
                  <RaisedPill label="VIEW" tone="tan" pressed={pressed} />
                </>
              )}
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={freePlay ? t.home.freePlayOpen : t.home.freePlayLocked}
            disabled={!freePlay}
            onPress={() => freePlay && router.push('/maze/free')}
            style={[styles.freePlayCard, !freePlay && styles.freePlayDim]}
          >
            {({ pressed }) => (
              <>
                <View style={styles.freePlayCopy}>
                  <Text style={styles.freePlayTitle}>{t.home.freePlayTitle}</Text>
                  <Text style={styles.freePlayMeta}>{freePlay ? t.home.freePlayOpen : t.home.freePlayLocked}</Text>
                </View>
                {freePlay ? (
                  <View style={styles.freePlayCta}>
                    <RaisedPill label={t.home.freePlayPlay} pressed={pressed} />
                  </View>
                ) : <View style={styles.lockMark}><View style={styles.lockShackle} /><View style={styles.lockBody} /></View>}
              </>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#16381e' },
  scrim: { position: 'absolute', inset: 0, backgroundColor: 'rgba(10, 28, 18, 0.08)' },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 24, gap: 12 },
  brand: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  logoCol: { width: 164, alignItems: 'center' },
  logo: { width: 148, height: 78, resizeMode: 'contain' },
  tag: {
    marginTop: -4,
    width: '100%',
    alignItems: 'center',
  },
  ropes: {
    position: 'absolute',
    top: 0,
    left: 26,
    right: 26,
    height: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  rope: {
    width: 2,
    height: 12,
    borderRadius: 1,
    backgroundColor: '#d2b06a',
    shadowColor: '#3a2410',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 0,
  },
  tagBoard: { marginTop: 8, width: '100%' },
  tagFace: {
    minHeight: 26,
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagText: {
    color: '#fff4c8',
    fontWeight: '900',
    fontSize: 8,
    letterSpacing: 0.15,
    textAlign: 'center',
    width: '100%',
    textShadowColor: 'rgba(20, 8, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
  },
  worldCard: {
    flex: 1,
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 248, 230, 0.88)',
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: '#e2c48a',
    borderBottomColor: '#8a5a22',
  },
  worldThumb: { width: 48, height: 48, borderRadius: 12, resizeMode: 'contain', backgroundColor: 'transparent' },
  worldCopy: { flex: 1, minWidth: 0 },
  worldTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  worldKicker: { color: '#7a5828', fontWeight: '900', fontSize: 10, letterSpacing: 0.8 },
  worldName: { color: '#3d2a14', fontWeight: '900', fontSize: 16, marginTop: 1 },
  progressTrack: { height: 7, backgroundColor: '#d9c9a4', borderRadius: 6, overflow: 'hidden', marginTop: 6 },
  progressFill: { height: '100%', backgroundColor: '#58c22e', borderRadius: 6 },
  worldFields: { color: '#6a4a24', fontWeight: '800', fontSize: 10, marginTop: 4 },
  hero: { minHeight: 132, flexDirection: 'row', alignItems: 'flex-end' },
  farmer: { width: 118, height: 148, resizeMode: 'contain', marginRight: -6, zIndex: 2 },
  speech: {
    flex: 1,
    backgroundColor: 'rgba(255, 246, 220, 0.96)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(180, 140, 80, 0.35)',
  },
  speechTail: {
    position: 'absolute',
    left: -8,
    bottom: 16,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderRightWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: 'rgba(255, 246, 220, 0.96)',
  },
  quote: { color: '#4a331c', fontWeight: '700', fontSize: 13, lineHeight: 18 },
  featureRow: { flexDirection: 'row', gap: 10 },
  continueCard: {
    flex: 1.12,
    borderRadius: 20,
    padding: 10,
    backgroundColor: '#1f6d32',
    borderWidth: 2,
    borderColor: '#8ee85a',
    gap: 6,
    shadowColor: '#0b2a12',
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  continueKicker: { color: '#ffffff', fontWeight: '900', fontSize: 13, letterSpacing: 0.4 },
  continueMeta: { color: '#d7f0b8', fontWeight: '700', fontSize: 11 },
  continueReward: { color: '#ffe08a', fontWeight: '800', fontSize: 11 },
  featureArt: { width: '100%', height: 72, borderRadius: 12, resizeMode: 'cover', backgroundColor: '#2a4a20' },
  mapCard: {
    flex: 1,
    borderRadius: 20,
    padding: 10,
    backgroundColor: '#f4ead2',
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: '#e2c48a',
    borderBottomColor: '#8a5a22',
    gap: 6,
  },
  mapKicker: { color: '#5a3c18', fontWeight: '900', fontSize: 13, letterSpacing: 0.4 },
  mapMeta: { color: '#7a5828', fontWeight: '700', fontSize: 11 },
  freePlayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    padding: 12,
    backgroundColor: '#f4ead2',
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: '#e2c48a',
    borderBottomColor: '#8a5a22',
  },
  freePlayDim: { opacity: 0.72 },
  freePlayCopy: { flex: 1, minWidth: 0 },
  freePlayTitle: { color: '#3d2a14', fontWeight: '900', fontSize: 15, letterSpacing: 0.6 },
  freePlayMeta: { color: '#7a5828', fontWeight: '700', fontSize: 12, marginTop: 4, lineHeight: 16 },
  freePlayCta: { width: 108 },
  lockMark: { width: 18, height: 20, alignItems: 'center' },
  lockShackle: { width: 10, height: 7, borderWidth: 2, borderBottomWidth: 0, borderColor: '#7a6a50', borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  lockBody: { width: 16, height: 11, borderRadius: 3, backgroundColor: '#8a7a60', marginTop: -1 },
});
