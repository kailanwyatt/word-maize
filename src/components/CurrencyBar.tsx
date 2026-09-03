import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { wordMaizeAssets } from '../../assets/word-maize/assets';
import { msUntilNextEnergy } from '../game/energy';
import { ENERGY_MAX } from '../game/types';
import { useGameStore } from '../store/GameStore';

function formatMs(ms: number) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function CurrencyBar({ onSettings }: { onSettings?: () => void }) {
  const { save, energyNow } = useGameStore();
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(value => value + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const energy = energyNow();
  const wait = msUntilNextEnergy(energy.energy, energy.energyUpdatedAt);
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.chip}>
          <Image source={wordMaizeAssets.ui.coin} style={styles.icon} />
          <Text style={styles.value}>{save.coins}</Text>
        </View>
        <View style={styles.chip}>
          <Image source={wordMaizeAssets.ui.energy} style={styles.icon} />
          <Text style={styles.value}>{energy.energy}/{ENERGY_MAX}</Text>
          {energy.energy < ENERGY_MAX ? <Text style={styles.wait}>{formatMs(wait)}</Text> : null}
        </View>
        {onSettings ? (
          <Pressable onPress={onSettings} style={styles.gear}><Text style={styles.gearText}>⚙</Text></Pressable>
        ) : <View style={styles.gearSpacer} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    backgroundColor: 'rgba(47,33,16,0.9)',
    borderWidth: 2,
    borderColor: '#e5b72f',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  icon: { width: 22, height: 22, resizeMode: 'contain' },
  value: { color: '#fff6c6', fontWeight: '900', fontSize: 16 },
  wait: { color: '#f7dfa0', fontWeight: '800', fontSize: 11 },
  gear: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#4c3515',
    borderWidth: 3,
    borderColor: '#e5b72f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearSpacer: { width: 42, height: 42 },
  gearText: { color: '#ffe676', fontSize: 20, fontWeight: '900' },
});
