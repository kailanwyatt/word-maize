import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { wordMaizeAssets } from '../../assets/word-maize/assets';
import { totalStars } from '../game/scoring';
import { useGameStore } from '../store/GameStore';
import { GearIcon } from './GearIcon';

export function CurrencyBar({ onSettings }: { onSettings?: () => void }) {
  const router = useRouter();
  const { save } = useGameStore();
  const stars = totalStars(save.levels);
  const openSettings = onSettings ?? (() => router.push('/settings'));
  return (
    <View style={styles.row}>
      <Pressable style={styles.coinPill} onPress={() => router.push('/(tabs)/shop')}>
        <Image source={wordMaizeAssets.ui.coin} style={styles.coin} />
        <Text style={styles.value}>{save.coins.toLocaleString('en-US')}</Text>
        <View style={styles.plus}>
          <Text style={styles.plusText}>+</Text>
        </View>
      </Pressable>
      <View style={styles.starPill}>
        <Text style={styles.star}>★</Text>
        <Text style={styles.value}>{stars}</Text>
      </View>
      <View style={styles.spacer} />
      <Pressable onPress={openSettings} style={styles.gear} accessibilityLabel="Settings">
        <GearIcon color="#ffffff" size={20} />
      </Pressable>
    </View>
  );
}

const pill = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  backgroundColor: '#3a2410',
  borderRadius: 22,
  paddingVertical: 5,
  paddingLeft: 6,
  paddingRight: 6,
  gap: 6,
  shadowColor: '#000',
  shadowOpacity: 0.28,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 3,
  elevation: 3,
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 8 },
  coinPill: { ...pill, paddingRight: 5 },
  starPill: { ...pill, paddingHorizontal: 10 },
  spacer: { flex: 1 },
  coin: { width: 28, height: 28, resizeMode: 'contain' },
  value: { color: '#ffffff', fontWeight: '900', fontSize: 17, minWidth: 18 },
  plus: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#58c22e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: { color: '#ffffff', fontWeight: '900', fontSize: 18, marginTop: -1 },
  star: { color: '#ffd24a', fontSize: 18, fontWeight: '900' },
  gear: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#3a2410',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 3,
  },
});
