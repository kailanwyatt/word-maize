import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { wordMaizeAssets } from '../../../assets/word-maize/assets';
import { farmerPhrase } from '../../game/farmerCopy';
import type { StoryBeat, StoryLine } from '../../game/mazeStory';

const POSES = {
  May: {
    welcome: wordMaizeAssets.characters.farmerMayWelcome,
    celebrate: wordMaizeAssets.characters.farmerMayCelebration,
    speaking: wordMaizeAssets.characters.farmerMayWelcome,
    worried: wordMaizeAssets.characters.farmerMayWelcome,
    pointing: wordMaizeAssets.characters.farmerMayWelcome,
  },
  Patch: {
    welcome: wordMaizeAssets.characters.patchSpeaking,
    celebrate: wordMaizeAssets.characters.patchCelebrating,
    speaking: wordMaizeAssets.characters.patchSpeaking,
    worried: wordMaizeAssets.characters.patchWorried,
    pointing: wordMaizeAssets.characters.patchPointing,
  },
} as const;

export function StoryBeatOverlay({
  beat, lineIndex, farmerName = '', onAdvance, onSkip,
}: {
  beat: StoryBeat;
  lineIndex: number;
  farmerName?: string;
  onAdvance: () => void;
  onSkip: () => void;
}) {
  const line: StoryLine | undefined = beat.lines[Math.min(lineIndex, Math.max(0, beat.lines.length - 1))];
  if (!line) return null;
  const pose = line.pose ?? 'speaking';
  const gold = line.speaker === 'May';
  return (
    <View style={styles.shade}>
      <Pressable accessibilityRole="button" accessibilityLabel="Continue story" onPress={onAdvance} style={styles.advance} />
      <View pointerEvents="none" style={styles.letterboxTop} />
      <Pressable accessibilityRole="button" accessibilityLabel="Skip story" onPress={onSkip} style={styles.skip}>
        <Text style={styles.skipText}>SKIP</Text>
      </Pressable>
      <View pointerEvents="none" style={styles.row}>
        <Image source={POSES[line.speaker][pose]} style={styles.portrait} />
        <View style={[styles.bubble, gold ? styles.may : styles.patch]}>
          <Text style={styles.name}>{line.speaker === 'May' ? farmerPhrase(farmerName, 'nameplate') : 'PATCH'}</Text>
          <Text style={styles.body}>{line.text}</Text>
          <Text style={styles.hint}>TAP TO CONTINUE</Text>
        </View>
      </View>
      <View pointerEvents="none" style={styles.letterboxBottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  shade: { ...StyleSheet.absoluteFill, zIndex: 20, backgroundColor: 'rgba(8,10,8,0.35)', justifyContent: 'flex-end' },
  advance: { ...StyleSheet.absoluteFill, zIndex: 0 },
  letterboxTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 42, backgroundColor: '#050505' },
  letterboxBottom: { height: 36, backgroundColor: '#050505' },
  skip: { position: 'absolute', top: 48, right: 12, zIndex: 3, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(20,16,10,0.72)', borderWidth: 1, borderColor: '#c78a32' },
  skipText: { color: '#fff6c6', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  row: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingBottom: 10, gap: 8 },
  portrait: { width: 86, height: 108, resizeMode: 'contain' },
  bubble: { flex: 1, borderRadius: 18, borderWidth: 3, paddingHorizontal: 12, paddingVertical: 10, minHeight: 88 },
  may: { backgroundColor: '#f6de7a', borderColor: '#c78a32' },
  patch: { backgroundColor: '#fff4d6', borderColor: '#8a5a18' },
  name: { color: '#6a4420', fontWeight: '900', fontSize: 10, letterSpacing: 1.2 },
  body: { color: '#3d2a16', fontWeight: '700', fontSize: 15, lineHeight: 21, marginTop: 4 },
  hint: { color: '#7a5a28', fontWeight: '800', fontSize: 9, letterSpacing: 1, marginTop: 8 },
});
