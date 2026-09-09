import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FarmButton } from '../components/FarmButton';
import { MAZE_PUZZLES } from '../data/mazeLevels';
import { isFreePlayUnlocked } from '../game/mazeCampaign';
import { useGameStore } from '../store/GameStore';

const PRESETS = [
  { id: 'sunny', label: 'Sunny', min: 1, max: 20 },
  { id: 'growing', label: 'Growing', min: 21, max: 40 },
  { id: 'harvest', label: 'Harvest', min: 41, max: 70 },
  { id: 'storm', label: 'Storm', min: 71, max: 80 },
] as const;

export function MazeFreePlayScreen() {
  const router = useRouter();
  const { save } = useGameStore();
  const unlocked = isFreePlayUnlocked(save.maze.rewardedIds, save.settings.devUnlock);
  const start = (min: number, max: number) => {
    const pool = MAZE_PUZZLES.filter(level => level.order >= min && level.order <= max);
    const level = pool[Math.floor(Math.random() * pool.length)] ?? pool[0];
    router.push({ pathname: '/maze/[id]', params: { id: level.id, free: '1' } });
  };
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <FarmButton label="BACK" onPress={() => router.back()} />
        <Text style={styles.heading}>Free Play</Text>
        <Text style={styles.copy}>Seeded variety from the campaign word bank. Completions here keep stats, not campaign unlocks or first-clear bonuses.</Text>
        {!unlocked ? <Text style={styles.copy}>Finish Sunny Acres field 10 to open this shed.</Text> : null}
        {PRESETS.map(preset => (
          <View key={preset.id} style={styles.card}>
            <Text style={styles.title}>{preset.label}</Text>
            <FarmButton dim={!unlocked} label={`PLAY ${preset.label.toUpperCase()}`} onPress={() => start(preset.min, preset.max)} />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#263f26' },
  content: { padding: 18, gap: 12 },
  heading: { color: '#ffdf89', fontSize: 26, fontWeight: '900' },
  copy: { color: '#fff1ce', fontSize: 16, lineHeight: 23 },
  card: { backgroundColor: '#f5e5bd', padding: 16, borderRadius: 16, gap: 10 },
  title: { color: '#4e321c', fontSize: 18, fontWeight: '800' },
});
