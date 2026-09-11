import { useRouter } from 'expo-router';
import { type ReactNode } from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { wordMaizeAssets } from '../../assets/word-maize/assets';
import { ENERGY_MAX } from '../game/types';
import { totalStars } from '../game/scoring';
import { useGameStore } from '../store/GameStore';
import { GearIcon } from './GearIcon';

function PlusMark() {
  return (
    <View style={styles.plus}>
      <View style={styles.plusLip} />
      <View style={styles.plusFace}>
        <Text style={styles.plusText}>+</Text>
      </View>
    </View>
  );
}

export function CurrencyBar({ onSettings, tone = 'wood' }: { onSettings?: () => void; tone?: 'wood' | 'glass' }) {
  const router = useRouter();
  const { save, energyNow } = useGameStore();
  const stars = totalStars(save.levels);
  const { energy } = energyNow();
  const openSettings = onSettings ?? (() => router.push('/(tabs)/profile'));
  const openShop = () => router.push('/(tabs)/shop');
  const glass = tone === 'glass';
  const pillStyle = glass ? styles.glassPill : styles.woodPill;
  const valueStyle = glass ? styles.glassValue : styles.value;
  const wrap = (inner: ReactNode, extra?: object) => glass
    ? <View style={[pillStyle, extra]}>{inner}</View>
    : (
      <ImageBackground source={wordMaizeAssets.ui.materials.woodPlanks} resizeMode="repeat" style={[pillStyle, extra]} imageStyle={styles.woodTexture}>
        {inner}
      </ImageBackground>
    );
  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${save.coins} coins, open shop`} style={styles.pillPress} onPress={openShop}>
        {wrap(
          <>
            <Image source={wordMaizeAssets.ui.coin} style={styles.coin} />
            <Text style={valueStyle}>{save.coins.toLocaleString('en-US')}</Text>
            <PlusMark />
          </>,
          styles.coinPad,
        )}
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`${energy} of ${ENERGY_MAX} energy, open shop`} style={styles.pillPress} onPress={openShop}>
        {wrap(
          <>
            <Image source={wordMaizeAssets.ui.energy} style={styles.energy} />
            <Text style={valueStyle}>{energy}</Text>
            {glass ? <PlusMark /> : null}
          </>,
        )}
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`${stars} stars, open shop`} style={styles.pillPress} onPress={openShop}>
        {wrap(
          <>
            <Image source={wordMaizeAssets.kernels.approvedNormal} style={styles.star} />
            <Text style={valueStyle}>{stars}</Text>
            {glass ? <PlusMark /> : null}
          </>,
        )}
      </Pressable>
      <View style={styles.spacer} />
      <Pressable accessibilityRole="button" onPress={openSettings} style={styles.gear} accessibilityLabel="Profile">
        {glass ? (
          <View style={[styles.gearFace, styles.glassGear]}><GearIcon color="#ffffff" size={20} /></View>
        ) : (
          <ImageBackground source={wordMaizeAssets.ui.materials.woodPlanks} resizeMode="repeat" imageStyle={styles.woodTexture} style={styles.gearFace}>
            <GearIcon color="#ffffff" size={20} />
          </ImageBackground>
        )}
      </Pressable>
    </View>
  );
}

const pill = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
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
  woodPill: { ...pill, backgroundColor: '#3a2410' },
  glassPill: { ...pill, backgroundColor: 'rgba(16, 24, 18, 0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', paddingRight: 5 },
  coinPad: { paddingRight: 5 },
  pillPress: { borderRadius: 22 },
  spacer: { flex: 1 },
  coin: { width: 28, height: 28, resizeMode: 'contain' },
  energy: { width: 26, height: 26, resizeMode: 'contain' },
  value: { color: '#ffffff', fontWeight: '900', fontSize: 15, minWidth: 12 },
  glassValue: { color: '#ffffff', fontWeight: '800', fontSize: 15, minWidth: 12 },
  plus: { width: 22, height: 22 },
  plusLip: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 20,
    borderRadius: 7,
    backgroundColor: '#1d6a12',
    borderWidth: 1,
    borderColor: '#164e0e',
  },
  plusFace: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 19,
    borderRadius: 7,
    backgroundColor: '#58c22e',
    borderWidth: 1.5,
    borderColor: '#9ef06a',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  plusText: { color: '#ffffff', fontWeight: '900', fontSize: 15, marginTop: -1 },
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
  glassGear: { backgroundColor: 'rgba(16, 24, 18, 0.78)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', borderRadius: 21 },
  woodTexture: { opacity: .86 },
});
