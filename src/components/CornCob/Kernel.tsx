import { useEffect, useRef } from 'react';
import { Animated, Image, ImageSourcePropType, Pressable, StyleSheet, Text } from 'react-native';
import { wordMaizeAssets } from '../../../assets/word-maize/assets';
import { KernelLayout } from './layout';

function kernelArt(selected: boolean, hinted: boolean): ImageSourcePropType {
  if (selected || hinted) return wordMaizeAssets.kernels.selectedV2;
  return wordMaizeAssets.kernels.normalV2;
}

export function KernelTile({
  layout,
  size,
  selected,
  hinted,
  harvesting,
  faulted,
  rejected,
  onPress,
}: {
  layout: KernelLayout;
  size: number;
  selected: boolean;
  hinted: boolean;
  harvesting?: boolean;
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
      Animated.spring(harvest, { toValue: 0.16, speed: 32, bounciness: 10, useNativeDriver: true }),
      Animated.timing(harvest, { toValue: 1, duration: 360, useNativeDriver: true }),
    ]).start();
  }, [harvesting, harvest]);

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
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          left: x - size / 2,
          top: y - size / 2,
          zIndex: Math.round((1 - shade) * 5),
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
        <Animated.Image
          source={kernelArt(selected, hinted)}
          style={[
            styles.kernel,
            faulted && styles.kernelFaulted,
            rejected && { opacity: reject.interpolate({ inputRange: [0, 1], outputRange: [1, 0.45] }) },
          ]}
        />
        <Text style={[styles.letter, { fontSize: size * 0.42 }, faulted && styles.letterFaulted]}>
          {kernel.letter}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center', overflow: 'visible', backgroundColor: 'transparent' },
  socket: { position: 'absolute', width: '92%', height: '92%', resizeMode: 'contain' },
  fullKernel: { position: 'absolute', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  kernel: { position: 'absolute', width: '92%', height: '92%', resizeMode: 'contain' },
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
