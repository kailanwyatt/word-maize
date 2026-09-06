import { forwardRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { wordMaizeAssets } from '../../assets/word-maize/assets';

export const HarvestMeter = forwardRef<View, { percent: number; catching?: boolean }>(function HarvestMeter({ percent, catching }, ref) {
  const basket = percent <= 0
    ? wordMaizeAssets.props.harvestBasketEmpty
    : percent >= 70
      ? wordMaizeAssets.props.harvestBasketFull
      : wordMaizeAssets.props.harvestBasketPartial;
  return (
    <View ref={ref} collapsable={false} style={styles.row}>
      {catching ? <Image source={wordMaizeAssets.effects.sparkleBurst} style={styles.sparkle} /> : null}
      <Image source={basket} style={styles.basket} />
      <Text style={styles.percent}>{percent}%</Text>
      <Text style={styles.label}>HARVESTED</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    width: 76,
    height: 74,
    borderRadius: 14,
    backgroundColor: 'rgba(46,35,17,0.92)',
    borderWidth: 2,
    borderColor: '#c68b28',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  basket: { width: 58, height: 44, resizeMode: 'contain' as const, marginTop: -8 },
  sparkle: { position: 'absolute' as const, width: 72, height: 72, resizeMode: 'contain' as const, opacity: 0.85, top: -8 },
  percent: { color: '#fff6c6', fontSize: 15, fontWeight: '900', marginTop: -5 },
  label: { color: '#fff6c6', fontSize: 7, fontWeight: '900' },
});
