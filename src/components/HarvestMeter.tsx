import { Image, StyleSheet, Text, View } from 'react-native';
import { wordMaizeAssets } from '../../assets/word-maize/assets';

export function HarvestMeter({ percent }: { percent: number; target?: number }) {
  return (
    <View style={styles.row}>
      <Image source={wordMaizeAssets.props.harvestBasket} style={styles.basket} />
      <Text style={styles.percent}>{percent}%</Text>
      <Text style={styles.label}>HARVESTED</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: 84,
    height: 82,
    borderRadius: 14,
    backgroundColor: 'rgba(46,35,17,0.92)',
    borderWidth: 2,
    borderColor: '#c68b28',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  basket: { width: 68, height: 52, resizeMode: 'contain' as const, marginTop: -11 },
  percent: { color: '#fff6c6', fontSize: 17, fontWeight: '900', marginTop: -7 },
  label: { color: '#fff6c6', fontSize: 7, fontWeight: '900' },
});
