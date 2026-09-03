import { Image, StyleSheet, Text, View } from 'react-native';
import { wordMaizeAssets } from '../../../assets/word-maize/assets';
import { KernelLayout } from './layout';

export function KernelTile({
  layout,
  size,
  selected,
  hinted,
}: {
  layout: KernelLayout;
  size: number;
  selected: boolean;
  hinted: boolean;
}) {
  const { kernel, x, y, scaleX, scale, shade } = layout;
  const visual = size * (selected ? 1.06 : 1);
  return (
    <View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          width: visual,
          height: visual,
          left: x - visual / 2,
          top: y - visual / 2,
          transform: [{ scaleX }, { scale }],
          opacity: 1 - shade * 0.18,
        },
      ]}
    >
      <Image source={wordMaizeAssets.kernels.normalV2} style={styles.kernel} />
      {(selected || hinted) && <View style={[styles.glow, selected ? styles.selected : styles.hinted]} />}
      <Text style={[styles.letter, { fontSize: size * 0.46, color: selected ? '#fff8cf' : '#2e1a0c' }]}>{kernel.letter}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', zIndex: 5, alignItems: 'center', justifyContent: 'center' },
  kernel: { position: 'absolute', width: '112%', height: '112%', resizeMode: 'contain' },
  glow: { position: 'absolute', left: '5%', right: '5%', top: '5%', bottom: '5%', borderRadius: 12, borderWidth: 3 },
  selected: { backgroundColor: 'rgba(44,148,36,0.55)', borderColor: '#d9ff9a' },
  hinted: { backgroundColor: 'rgba(126,190,36,0.4)', borderColor: '#efff71' },
  letter: {
    fontWeight: '900',
    textShadowColor: 'rgba(255,236,150,0.55)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 1.5,
  },
});
