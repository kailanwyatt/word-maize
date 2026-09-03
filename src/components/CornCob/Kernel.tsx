import { StyleSheet, Text, View } from 'react-native';
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
      {(selected || hinted) && <View style={[styles.glow, selected ? styles.selected : styles.hinted]} />}
      <Text style={[styles.letter, { fontSize: size * 0.46, color: selected ? '#fff8cf' : '#2e1a0c' }]}>{kernel.letter}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', zIndex: 5, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', left: '6%', right: '6%', top: '6%', bottom: '6%', borderRadius: 10, borderWidth: 3 },
  selected: { backgroundColor: 'rgba(44,148,36,0.55)', borderColor: '#d9ff9a' },
  hinted: { backgroundColor: 'rgba(126,190,36,0.4)', borderColor: '#efff71' },
  letter: {
    fontWeight: '900',
    textShadowColor: 'rgba(255,236,150,0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});
