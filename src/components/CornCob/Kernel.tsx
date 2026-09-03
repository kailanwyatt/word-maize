import { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { wordMaizeAssets } from '../../../assets/word-maize/assets';
import { KernelLayout } from './layout';

export function KernelTile({
  layout,
  size,
  selected,
  hinted,
  harvesting,
  onPress,
}: {
  layout: KernelLayout;
  size: number;
  selected: boolean;
  hinted: boolean;
  harvesting?: boolean;
  onPress?: () => void;
}) {
  const { kernel, x, y, scaleX, scale, shade } = layout;
  const visual = size * (selected ? 1.06 : 1);
  const harvest = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!harvesting) {
      harvest.setValue(0);
      return;
    }
    Animated.sequence([
      Animated.spring(harvest, { toValue: 0.16, speed: 32, bounciness: 10, useNativeDriver: true }),
      Animated.timing(harvest, { toValue: 1, duration: 360, useNativeDriver: true }),
    ]).start();
  }, [harvesting, harvest]);

  return (
    <Pressable
      onPress={onPress}
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
      <Image source={wordMaizeAssets.kernels.emptySocketV2} style={styles.socket} />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.fullKernel,
          {
            opacity: harvest.interpolate({ inputRange: [0, 0.3, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateX: harvest.interpolate({ inputRange: [0, 0.16, 1], outputRange: [0, 0, -105] }) },
              { translateY: harvest.interpolate({ inputRange: [0, 0.16, 1], outputRange: [0, -8, 260] }) },
              { rotate: harvest.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-240deg'] }) },
              { scale: harvest.interpolate({ inputRange: [0, 0.16, 1], outputRange: [1, 1.16, 0.42] }) },
            ],
          },
        ]}
      >
        <Image source={wordMaizeAssets.kernels.normalV2} style={styles.kernel} />
        {(selected || hinted) && <View style={[styles.glow, selected ? styles.selected : styles.hinted]} />}
        <Text style={[styles.letter, { fontSize: size * 0.46 }, selected && styles.letterSelected]}>{kernel.letter}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', zIndex: 5, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  socket: { position: 'absolute', width: '102%', height: '102%', resizeMode: 'contain' },
  fullKernel: { position: 'absolute', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  kernel: { position: 'absolute', width: '106%', height: '106%', resizeMode: 'contain' },
  glow: { position: 'absolute', left: '0%', right: '0%', top: '0%', bottom: '0%', borderRadius: 16, borderWidth: 3 },
  selected: { backgroundColor: 'transparent', borderColor: '#dfffad', borderWidth: 4, shadowColor: '#4d8a28', shadowOffset: { width: 0, height: 0 }, shadowRadius: 4, shadowOpacity: 1 },
  hinted: { backgroundColor: 'rgba(126,190,36,0.4)', borderColor: '#efff71' },
  letter: {
    fontWeight: '900',
    color: '#2e1a0c',
    textShadowColor: 'rgba(255,236,150,0.55)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 1.5,
  },
  letterSelected: {
    color: '#ffffff',
    textShadowColor: '#4d8a28',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 2,
  },
});
