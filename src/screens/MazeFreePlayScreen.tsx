import { useRouter } from 'expo-router';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wordMaizeAssets } from '../../assets/word-maize/assets';
import { FarmButton } from '../components/FarmButton';
import { MAZE_PUZZLES } from '../data/mazeLevels';
import { isFreePlayUnlocked } from '../game/mazeCampaign';
import { FREE_PLAY_BANDS, pickFreePlayLevel, type FreePlayDifficulty } from '../game/mazeFreePlay';
import { useMessages } from '../i18n';
import { useGameStore } from '../store/GameStore';

const DIFFICULTIES: FreePlayDifficulty[] = ['easy', 'medium', 'hard'];

export function MazeFreePlayScreen() {
  const router = useRouter();
  const t = useMessages();
  const { save, setSetting } = useGameStore();
  const unlocked = isFreePlayUnlocked(save.maze.rewardedIds, save.settings.devUnlock);
  const prefs = save.settings.freePlay;
  const start = () => {
    const level = pickFreePlayLevel(MAZE_PUZZLES, prefs);
    if (!unlocked || !level) return;
    router.push({ pathname: '/maze/[id]', params: { id: level.id, free: '1' } });
  };
  return (
    <ImageBackground source={wordMaizeAssets.backgrounds.homeFarm} style={styles.root} resizeMode="cover">
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <FarmButton label={t.common.back} onPress={() => router.back()} />
          <View style={styles.panel}>
            <Text style={styles.heading}>{t.freePlay.title}</Text>
            <Text style={styles.copy}>{unlocked ? t.freePlay.body : t.freePlay.locked}</Text>
            <Text style={styles.section}>{t.freePlay.difficulty}</Text>
            <View style={styles.bands}>
              {DIFFICULTIES.map(id => {
                const [min, max] = FREE_PLAY_BANDS[id];
                const selected = prefs.difficulty === id;
                const hint = id === 'easy' ? t.freePlay.easyHint : id === 'medium' ? t.freePlay.mediumHint : t.freePlay.hardHint;
                return (
                  <Pressable
                    key={id}
                    accessibilityRole="button"
                    accessibilityState={{ selected, disabled: !unlocked }}
                    disabled={!unlocked}
                    onPress={() => setSetting('freePlay', { ...prefs, difficulty: id })}
                    style={[styles.band, selected && styles.bandOn]}
                  >
                    <Text style={[styles.bandTitle, selected && styles.bandTitleOn]}>{t.freePlay[id]}</Text>
                    <Text style={[styles.bandHint, selected && styles.bandHintOn]}>{hint}</Text>
                    <Text style={[styles.bandRange, selected && styles.bandHintOn]}>{min}–{max}</Text>
                  </Pressable>
                );
              })}
            </View>
            {([
              ['storms', t.freePlay.storms],
              ['mist', t.freePlay.mist],
              ['wildlife', t.freePlay.wildlife],
            ] as const).map(([key, label]) => (
              <View key={key} style={styles.row}>
                <Text style={styles.label}>{label}</Text>
                <Switch
                  disabled={!unlocked}
                  value={prefs[key]}
                  onValueChange={value => setSetting('freePlay', { ...prefs, [key]: value })}
                />
              </View>
            ))}
            <FarmButton dim={!unlocked} label={t.freePlay.play} onPress={start} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#16381e' },
  safe: { flex: 1 },
  content: { padding: 16, paddingBottom: 28, gap: 12 },
  panel: {
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: 22,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
  },
  heading: { color: '#3d2a14', fontSize: 28, fontWeight: '900' },
  copy: { color: '#5a3c18', fontSize: 15, lineHeight: 21, fontWeight: '700' },
  section: { color: '#7a5828', fontWeight: '900', fontSize: 12, letterSpacing: 1.1, marginTop: 4 },
  bands: { gap: 8 },
  band: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 248, 230, 0.92)',
    borderWidth: 2,
    borderColor: '#c9a15a',
  },
  bandOn: { borderColor: '#3d8c22', backgroundColor: '#e7f6c8' },
  bandTitle: { color: '#3d2a14', fontWeight: '900', fontSize: 16 },
  bandTitleOn: { color: '#245818' },
  bandHint: { color: '#7a5828', fontWeight: '700', fontSize: 12, marginTop: 2 },
  bandHintOn: { color: '#3d6a20' },
  bandRange: { color: '#8a7350', fontWeight: '800', fontSize: 11, marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 48, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(90, 60, 24, 0.12)' },
  label: { color: '#3d2a14', fontWeight: '800', fontSize: 16, flex: 1, paddingRight: 12 },
});
