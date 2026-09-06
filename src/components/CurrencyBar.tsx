import { useRouter } from 'expo-router';
import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { wordMaizeAssets } from '../../assets/word-maize/assets';
import { ENERGY_MAX } from '../game/types';
import { totalStars } from '../game/scoring';
import { useGameStore } from '../store/GameStore';
import { GearIcon } from './GearIcon';

export function CurrencyBar({ onSettings }: { onSettings?: () => void }) {
  const router = useRouter();
  const { save, energyNow } = useGameStore();
  const stars = totalStars(save.levels);
  const { energy } = energyNow();
  const openSettings = onSettings ?? (() => router.push('/settings'));
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${save.coins} coins, open shop`}
        style={styles.pillPress}
        onPress={() => router.push('/(tabs)/shop')}
      >
        <ImageBackground source={wordMaizeAssets.ui.materials.woodPlanks} resizeMode="repeat" style={styles.coinPill} imageStyle={styles.woodTexture}>
          <Image source={wordMaizeAssets.ui.coin} style={styles.coin} />
          <Text style={styles.value}>{save.coins.toLocaleString('en-US')}</Text>
          <View style={styles.plus}>
            <Text style={styles.plusText}>+</Text>
          </View>
        </ImageBackground>
      </Pressable>
      <ImageBackground source={wordMaizeAssets.ui.materials.woodPlanks} resizeMode="repeat" imageStyle={styles.woodTexture} accessibilityLabel={`${energy} of ${ENERGY_MAX} energy`} style={styles.energyPill}>
        <Image source={wordMaizeAssets.ui.energy} style={styles.energy} />
        <Text style={styles.value}>{energy}</Text>
      </ImageBackground>
      <ImageBackground source={wordMaizeAssets.ui.materials.woodPlanks} resizeMode="repeat" imageStyle={styles.woodTexture} accessibilityLabel={`${stars} stars`} style={styles.starPill}>
        <Image source={wordMaizeAssets.kernels.approvedNormal} style={styles.star} />
        <Text style={styles.value}>{stars}</Text>
      </ImageBackground>
      <View style={styles.spacer} />
      <Pressable accessibilityRole="button" onPress={openSettings} style={styles.gear} accessibilityLabel="Settings">
        <ImageBackground source={wordMaizeAssets.ui.materials.woodPlanks} resizeMode="repeat" imageStyle={styles.woodTexture} style={styles.gearFace}>
          <GearIcon color="#ffffff" size={20} />
        </ImageBackground>
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
  overflow: 'hidden' as const,
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 6 },
  coinPill: { ...pill, paddingRight: 5 },
  pillPress: { borderRadius: 22 },
  energyPill: { ...pill, paddingHorizontal: 8 },
  starPill: { ...pill, paddingHorizontal: 10 },
  spacer: { flex: 1 },
  coin: { width: 28, height: 28, resizeMode: 'contain' },
  energy: { width: 26, height: 26, resizeMode: 'contain' },
  value: { color: '#ffffff', fontWeight: '900', fontSize: 15, minWidth: 12 },
  plus: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#58c22e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: { color: '#ffffff', fontWeight: '900', fontSize: 18, marginTop: -1 },
  star: { width: 22, height: 22, resizeMode: 'contain' },
  gear: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 3,
  },
  gearFace: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
  woodTexture: { opacity: .86 },
});
