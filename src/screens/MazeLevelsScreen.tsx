import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wordMaizeAssets } from '../../assets/word-maize/assets';
import { Chevron } from '../components/HomeGlyphs';
import { MAZE_CAMPAIGN_TARGETS } from '../data/mazeCatalog';
import { MAZE_PUZZLES } from '../data/mazeLevels';
import { isFreePlayUnlocked, isMazeLevelUnlocked, MAZE_CHAPTERS } from '../game/mazeCampaign';
import { bestMazeScore } from '../game/mazeScores';
import { useMessages } from '../i18n';
import { useGameStore } from '../store/GameStore';

const CHAPTER_THUMBS = wordMaizeAssets.ui.chapterThumbs;

function LockMark() {
  return (
    <View style={styles.lockMark} accessibilityElementsHidden>
      <View style={styles.lockShackle} />
      <View style={styles.lockBody} />
    </View>
  );
}

export function MazeLevelsScreen() {
  const router = useRouter();
  const t = useMessages();
  const { save, setSetting } = useGameStore();
  const unlockedIds = save.maze.unlockedIds ?? [];
  const rewardedIds = save.maze.rewardedIds;
  const devUnlock = save.settings.devUnlock;
  const [openChapter, setOpenChapter] = useState<number | null>(null);
  const freePlay = isFreePlayUnlocked(rewardedIds, devUnlock);
  const chapter = openChapter ? MAZE_CHAPTERS[openChapter - 1] : undefined;

  const chapterUnlocked = (id: number) => {
    if (devUnlock || id === 1) return true;
    const targets = MAZE_CAMPAIGN_TARGETS.filter(target => target.chapter === id);
    const previous = MAZE_CAMPAIGN_TARGETS.filter(target => target.chapter === id - 1);
    return targets.some(target => unlockedIds.includes(target.id) || rewardedIds.includes(target.id))
      || previous.every(target => rewardedIds.includes(target.id));
  };

  return (
    <View style={styles.root}>
      <ImageBackground source={wordMaizeAssets.backgrounds.homeFarmRestored} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={styles.scrim} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={chapter ? 'Back to chapters' : 'Back to Play'}
            onPress={() => (chapter ? setOpenChapter(null) : router.replace('/(tabs)/play'))}
            style={styles.back}
          >
            <Text style={styles.backMark}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{chapter ? chapter.title : 'Chapters'}</Text>
          {__DEV__ ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={devUnlock ? 'Turn off developer unlock' : 'Unlock all levels for testing'}
              onPress={() => setSetting('devUnlock', !devUnlock)}
              style={[styles.devChip, devUnlock && styles.devChipOn]}
            >
              <Text style={styles.devChipText}>{devUnlock ? 'DEV ON' : 'DEV'}</Text>
            </Pressable>
          ) : <View style={styles.headerSpacer} />}
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {chapter ? (
            <>
              <Text style={styles.lead}>{chapter.description}</Text>
              {MAZE_PUZZLES.filter(level => level.chapter === openChapter).map(level => {
                const completed = rewardedIds.includes(level.id);
                const unlocked = isMazeLevelUnlocked(MAZE_PUZZLES, level.id, rewardedIds, unlockedIds, devUnlock);
                const continuing = !!save.maze.runs[level.id] && !save.maze.runs[level.id]?.completed;
                const ribbon = save.maze.ribbons?.[level.id];
                const score = bestMazeScore(save.maze.scores, level.id);
                const action = !unlocked ? 'Locked' : continuing ? 'Continue' : completed ? 'Replay' : 'Enter';
                const rewardBits = [
                  score && score.coins > 0 ? `+${score.coins} coins` : null,
                  score ? `${score.points} pts` : null,
                  ribbon?.unaided ? 'Unaided' : null,
                  ribbon?.storm ? 'Beat the Storm' : ribbon?.harvested ? 'Harvested' : null,
                ].filter(Boolean).join(' · ');
                return (
                  <Pressable
                    key={level.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Field ${level.order}, ${level.displayAnswer}, ${action}`}
                    disabled={!unlocked}
                    onPress={() => unlocked && router.push(`/maze/${level.id}`)}
                    style={[styles.fieldCard, !unlocked && styles.dimmed]}
                  >
                    <View style={styles.fieldCopy}>
                      <Text style={styles.fieldTitle}>{level.order}. {level.displayAnswer}{completed ? ' ✓' : ''}</Text>
                      <Text style={styles.fieldBody} numberOfLines={2}>{level.objective}</Text>
                      {rewardBits ? <Text style={styles.ribbon}>{rewardBits}</Text> : null}
                    </View>
                    {unlocked ? <Text style={styles.fieldAction}>{action.toUpperCase()}</Text> : <LockMark />}
                  </Pressable>
                );
              })}
            </>
          ) : (
            <>
              <Text style={styles.lead}>World Maize · eight chapters, eighty fields.</Text>
              {MAZE_CHAPTERS.map(item => {
                const targets = MAZE_CAMPAIGN_TARGETS.filter(target => target.chapter === item.id);
                const complete = targets.filter(target => rewardedIds.includes(target.id)).length;
                const unlocked = chapterUnlocked(item.id);
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityLabel={unlocked ? `Chapter ${item.id}, ${item.title}, ${complete} of 10 fields` : `Chapter ${item.id}, ${item.title}, locked`}
                    disabled={!unlocked}
                    onPress={() => unlocked && setOpenChapter(item.id)}
                    style={[styles.chapterRow, !unlocked && styles.dimmed]}
                  >
                    <Image source={CHAPTER_THUMBS[item.id - 1]} style={styles.thumb} />
                    <View style={styles.chapterCopy}>
                      <Text style={styles.chapterTitle}>{item.id}. {item.title}</Text>
                      <Text style={styles.chapterText} numberOfLines={1}>{item.description}</Text>
                      <View style={styles.barRow}>
                        <View style={styles.barTrack}>
                          <View style={[styles.barFill, { width: `${(complete / 10) * 100}%` }]} />
                        </View>
                        <Text style={styles.barCount}>{complete} / 10</Text>
                      </View>
                    </View>
                    {unlocked ? <Chevron color="#6a4420" size={16} /> : <LockMark />}
                  </Pressable>
                );
              })}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={freePlay ? t.home.freePlayOpen : t.home.freePlayLocked}
                disabled={!freePlay}
                onPress={() => freePlay && router.push('/maze/free')}
                style={[styles.freePlay, !freePlay && styles.dimmed]}
              >
                <Image source={wordMaizeAssets.ui.iconGamepad} style={styles.freePlayIcon} />
                <View style={styles.chapterCopy}>
                  <Text style={styles.chapterTitle}>{t.freePlay.title}</Text>
                  <Text style={styles.chapterText}>{freePlay ? t.home.freePlayOpen : t.home.freePlayLocked}</Text>
                </View>
                {freePlay ? <Chevron color="#6a4420" size={16} /> : <LockMark />}
              </Pressable>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#16381e' },
  scrim: { position: 'absolute', inset: 0, backgroundColor: 'rgba(10, 28, 18, 0.28)' },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingBottom: 8, gap: 8 },
  back: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 246, 220, 0.88)', borderWidth: 1, borderColor: '#c9a15a' },
  backMark: { color: '#4a2e10', fontSize: 28, fontWeight: '300', marginTop: -4 },
  headerTitle: { flex: 1, textAlign: 'center', color: '#fff6c6', fontWeight: '900', fontSize: 20 },
  headerSpacer: { width: 36 },
  devChip: { minWidth: 36, height: 36, borderRadius: 12, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(55, 34, 14, 0.72)', borderWidth: 1, borderColor: '#c9a15a' },
  devChipOn: { backgroundColor: '#527f2d', borderColor: '#a9d56a' },
  devChipText: { color: '#fff6c6', fontWeight: '900', fontSize: 9 },
  content: { paddingHorizontal: 12, paddingBottom: 28, gap: 8 },
  lead: { color: '#f5e6c4', fontWeight: '700', fontSize: 13, lineHeight: 18, marginBottom: 4, paddingHorizontal: 4 },
  chapterRow: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    padding: 8,
    backgroundColor: 'rgba(247, 236, 210, 0.94)',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: '#e2c48a',
    borderBottomColor: '#8a5a22',
  },
  thumb: { width: 72, height: 72, borderRadius: 12, resizeMode: 'cover', backgroundColor: '#7aa24a' },
  chapterCopy: { flex: 1, minWidth: 0 },
  chapterTitle: { color: '#3d2a14', fontWeight: '900', fontSize: 16 },
  chapterText: { color: '#7a5828', fontWeight: '700', fontSize: 12, marginTop: 2 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  barTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: '#d9c9a4', overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#58c22e', borderRadius: 4 },
  barCount: { color: '#6a4a24', fontWeight: '800', fontSize: 11, minWidth: 40, textAlign: 'right' },
  dimmed: { opacity: 0.55 },
  fieldCard: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(247, 236, 210, 0.94)',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: '#e2c48a',
    borderBottomColor: '#8a5a22',
  },
  fieldCopy: { flex: 1, minWidth: 0 },
  fieldTitle: { color: '#3d2a14', fontWeight: '900', fontSize: 16 },
  fieldBody: { color: '#7a5828', fontWeight: '700', fontSize: 12, marginTop: 2 },
  fieldAction: { color: '#4f7f26', fontWeight: '900', fontSize: 11, letterSpacing: 0.4 },
  ribbon: { color: '#4f7f26', fontWeight: '800', fontSize: 11, marginTop: 4 },
  freePlayIcon: { width: 42, height: 42, resizeMode: 'contain' },
  freePlay: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 6,
    backgroundColor: 'rgba(247, 236, 210, 0.94)',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: '#e2c48a',
    borderBottomColor: '#8a5a22',
  },
  lockMark: { width: 18, height: 20, alignItems: 'center' },
  lockShackle: { width: 10, height: 7, borderWidth: 2, borderBottomWidth: 0, borderColor: '#7a6a50', borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  lockBody: { width: 16, height: 11, borderRadius: 3, backgroundColor: '#8a7a60', marginTop: -1 },
});
