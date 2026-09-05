import { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text } from 'react-native';
import { wordMaizeAssets } from '../../../assets/word-maize/assets';
import { KernelLayout } from './layout';

export function KernelTile({
  layout,
  size,
  selected,
  hinted,
  harvesting,
  harvestIndex = 0,
  harvestTarget,
  faulted,
  rejected,
  onPress,
}: {
  layout: KernelLayout;
  size: number;
  selected: boolean;
  hinted: boolean;
  harvesting?: boolean;
  harvestIndex?: number;
  harvestTarget: { x: number; y: number };
  faulted?: boolean;
  rejected?: boolean;
  onPress?: () => void;
}) {
  const { kernel, x, y, scaleX, scale, shade } = layout;
  const harvest = useRef(new Animated.Value(0)).current;
  const reject = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!harvesting) {
      harvest.setValue(0);
      return;
    }
    Animated.sequence([
      Animated.delay(harvestIndex * 70),
      Animated.spring(harvest, { toValue: 0.18, speed: 28, bounciness: 12, useNativeDriver: true }),
      Animated.timing(harvest, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [harvesting, harvest, harvestIndex]);

  useEffect(() => {
    if (!rejected) {
      reject.setValue(0);
      return;
    }
    Animated.sequence([
      Animated.timing(reject, { toValue: 1, duration: 70, useNativeDriver: true }),
      Animated.timing(reject, { toValue: 0, duration: 110, useNativeDriver: true }),
    ]).start();
  }, [rejected, reject]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Letter ${kernel.letter}, row ${kernel.row + 1}, column ${kernel.column + 1}`}
      accessibilityState={{ selected, disabled: kernel.harvested || (layout.opacity ?? 1) < 0.35 }}
      disabled={kernel.harvested || (layout.opacity ?? 1) < 0.35}
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          left: x - size / 2,
          top: y - size / 2,
          zIndex: Math.round((1 - shade) * 5),
          transform: [{ rotate: `${layout.tilt ?? 0}deg` }, { scaleX }, { scale }],
          opacity: (layout.opacity ?? 1) * (1 - shade * 0.18),
        },
      ]}
      pointerEvents={(layout.opacity ?? 1) < 0.35 ? 'none' : 'auto'}
    >
      <Image source={wordMaizeAssets.kernels.approvedSocket} style={styles.socket} />
      {!kernel.harvested ? <Animated.View
        pointerEvents="none"
        style={[
          styles.fullKernel,
          {
            opacity: harvest.interpolate({ inputRange: [0, 0.3, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateX: harvest.interpolate({ inputRange: [0, 0.18, 1], outputRange: [0, 0, harvestTarget.x - x] }) },
              { translateY: harvest.interpolate({ inputRange: [0, 0.18, 1], outputRange: [0, -14, harvestTarget.y - y] }) },
              { rotate: harvest.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '620deg'] }) },
              { scale: harvest.interpolate({ inputRange: [0, 0.18, 1], outputRange: [1, 1.22, 0.13] }) },
            ],
          },
        ]}
      >
        {(selected || hinted) ? <Image source={wordMaizeAssets.kernels.approvedNormal} style={[styles.kernelGlow, hinted && styles.hintGlow]} /> : null}
        <Animated.Image
          source={wordMaizeAssets.kernels.approvedNormal}
          style={[
            styles.kernel,
            faulted && styles.kernelFaulted,
            rejected && { opacity: reject.interpolate({ inputRange: [0, 1], outputRange: [1, 0.45] }) },
          ]}
        />
        <Text style={[styles.letter, { fontSize: size * 0.42 }, faulted && styles.letterFaulted]}>
          {kernel.letter}
        </Text>
      </Animated.View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center', overflow: 'visible', backgroundColor: 'transparent' },
  socket: { position: 'absolute', width: '148%', height: '148%', resizeMode: 'contain' },
  fullKernel: { position: 'absolute', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  kernelGlow: { position: 'absolute', width: '164%', height: '164%', resizeMode: 'contain', tintColor: '#fffdf0', opacity: 0.9 },
  hintGlow: { tintColor: '#fff07a', opacity: 0.72 },
  kernel: { position: 'absolute', width: '154%', height: '154%', resizeMode: 'contain' },
  kernelFaulted: { tintColor: '#c45a32' },
  letter: {
    fontWeight: '900',
    color: '#2e1a0c',
    textShadowColor: 'rgba(255,236,150,0.55)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 1.5,
  },
  letterFaulted: {
    color: '#fff1e8',
    textShadowColor: '#8a2a12',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 2,
  },
});
