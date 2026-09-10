import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { mazeAssets } from '../../../assets/word-maize/maze/assets';
import { MAZE_RENDER, type MazeWildlifeKind } from '../../game/maze';

const TILE = MAZE_RENDER.tile;
const ART = mazeAssets.wildlife;

export function MazePest({
  kind, phase, left, top, reducedMotion,
}: {
  kind: MazeWildlifeKind;
  phase: 'warning' | 'active';
  left: number;
  top: number;
  reducedMotion: boolean;
}) {
  const bob = useSharedValue(0);
  const glow = useSharedValue(0.72);
  useEffect(() => {
    if (reducedMotion) {
      bob.value = 0;
      glow.value = 0.85;
      return;
    }
    bob.value = withRepeat(withSequence(
      withTiming(-7, { duration: 280, easing: Easing.inOut(Easing.quad) }),
      withTiming(0, { duration: 280, easing: Easing.inOut(Easing.quad) }),
    ), -1, true);
    glow.value = withRepeat(withSequence(
      withTiming(1, { duration: phase === 'warning' ? 260 : 420, easing: Easing.inOut(Easing.quad) }),
      withTiming(0.55, { duration: phase === 'warning' ? 260 : 420, easing: Easing.inOut(Easing.quad) }),
    ), -1, true);
  }, [bob, glow, phase, reducedMotion]);
  const bobStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  const size = kind === 'crow' ? 58 : 50;
  return (
    <View pointerEvents="none" accessibilityLabel={`${kind} blocking a plant`} style={[styles.wrap, { left, top: top - 38 }]}>
      <View style={styles.ring} />
      <Animated.View style={[styles.halo, glowStyle]} />
      <Animated.View style={bobStyle}>
        <Image source={ART[kind]} fadeDuration={0} style={{ width: size, height: size, resizeMode: 'contain' }} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    width: TILE,
    height: 86,
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 14,
  },
  ring: {
    position: 'absolute',
    bottom: 6,
    width: TILE * 0.72,
    height: 16,
    borderRadius: 10,
    backgroundColor: '#f0c43acc',
    borderWidth: 2,
    borderColor: '#fff6c6',
  },
  halo: {
    position: 'absolute',
    bottom: 22,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#fff4b0cc',
    borderWidth: 2,
    borderColor: '#f0c43a',
  },
});
