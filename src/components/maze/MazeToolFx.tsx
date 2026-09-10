import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { mazeAssets } from '../../../assets/word-maize/maze/assets';
import { wordMaizeAssets } from '../../../assets/word-maize/assets';
import { MAZE_RENDER, type MazeFacing } from '../../game/maze';
import type { ToolId } from '../../game/types';

const TILE = MAZE_RENDER.tile;

export type MazeToolFx =
  | { nonce: number; kind: 'mower' | 'tractor'; facing: MazeFacing; tiles: { col: number; row: number }[]; mowed?: { col: number; row: number }[] }
  | { nonce: number; kind: 'lantern' | 'raincoat' | 'huskClip'; at: { x: number; y: number } }
  | { nonce: number; kind: 'scarecrow'; at: { col: number; row: number } }
  | { nonce: number; kind: 'find'; tool: ToolId; at: { col: number; row: number } };

export function MazeToolFxLayer({
  fx, reducedMotion, onDone,
}: {
  fx: MazeToolFx | null;
  reducedMotion: boolean;
  onDone: () => void;
}) {
  if (!fx) return null;
  if (fx.kind === 'mower' || fx.kind === 'tractor') {
    return <VehicleFx fx={fx} reducedMotion={reducedMotion} onDone={onDone} />;
  }
  if (fx.kind === 'scarecrow') return <ScarecrowFx fx={fx} reducedMotion={reducedMotion} onDone={onDone} />;
  if (fx.kind === 'find') return <FindFx fx={fx} reducedMotion={reducedMotion} onDone={onDone} />;
  if (fx.kind === 'lantern' || fx.kind === 'raincoat' || fx.kind === 'huskClip') {
    return <BurstFx fx={fx} reducedMotion={reducedMotion} onDone={onDone} />;
  }
  return null;
}

function VehicleFx({
  fx, reducedMotion, onDone,
}: {
  fx: Extract<MazeToolFx, { kind: 'mower' | 'tractor' }>;
  reducedMotion: boolean;
  onDone: () => void;
}) {
  const tiles = fx.tiles.length ? fx.tiles : [{ col: 0, row: 0 }];
  const [step, setStep] = useState(0);
  useEffect(() => {
    setStep(0);
    if (reducedMotion || tiles.length < 2) {
      const timer = setTimeout(onDone, reducedMotion ? 180 : 280);
      return () => clearTimeout(timer);
    }
    const ms = 130;
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      if (i >= tiles.length) {
        clearInterval(timer);
        onDone();
        return;
      }
      setStep(i);
    }, ms);
    return () => clearInterval(timer);
  }, [fx.nonce]);
  const tile = tiles[Math.min(step, tiles.length - 1)];
  const frames = fx.kind === 'tractor' ? mazeAssets.tools.tractor : mazeAssets.tools.mower;
  const source = frames[step % 2];
  const transform = fx.facing === 'left'
    ? [{ scaleX: -1 }]
    : fx.facing === 'up'
      ? [{ rotate: '-22deg' }]
      : fx.facing === 'down'
        ? [{ rotate: '22deg' }]
        : [];
  const passed = tiles.slice(0, step + 1);
  const chaff = fx.kind === 'tractor' ? (fx.mowed?.length ? fx.mowed : passed) : passed;
  return (
    <>
      {chaff.map((cell, index) => (
        <Image
          key={`${cell.col},${cell.row},${index}`}
          source={mazeAssets.tools.chaff}
          fadeDuration={0}
          style={[styles.chaff, { left: cell.col * TILE + 4, top: cell.row * TILE - 6, opacity: fx.kind === 'tractor' ? 0.85 : (index === step ? 1 : 0.45) }]}
        />
      ))}
      <Image
        source={source}
        fadeDuration={0}
        style={[
          fx.kind === 'tractor' ? styles.tractor : styles.mower,
          { left: tile.col * TILE - 10, top: tile.row * TILE - 18, zIndex: tile.row * 10 + 30, transform },
        ]}
      />
    </>
  );
}

function BurstFx({
  fx, reducedMotion, onDone,
}: {
  fx: Extract<MazeToolFx, { kind: 'lantern' | 'raincoat' | 'huskClip' }>;
  reducedMotion: boolean;
  onDone: () => void;
}) {
  const pulse = useSharedValue(0.4);
  useEffect(() => {
    pulse.value = reducedMotion
      ? withTiming(1, { duration: 160 })
      : withSequence(
        withTiming(1.12, { duration: 220, easing: Easing.out(Easing.quad) }),
        withTiming(0.2, { duration: 420, easing: Easing.in(Easing.quad) }),
      );
    const timer = setTimeout(onDone, reducedMotion ? 220 : 640);
    return () => clearTimeout(timer);
  }, [fx.nonce, pulse, reducedMotion, onDone]);
  const glow = useAnimatedStyle(() => ({ opacity: pulse.value, transform: [{ scale: 0.7 + pulse.value * 0.5 }] }));
  const icon = fx.kind === 'lantern'
    ? wordMaizeAssets.powerups.lantern
    : fx.kind === 'raincoat'
      ? wordMaizeAssets.powerups.raincoat
      : wordMaizeAssets.powerups.huskClip;
  const wash = fx.kind === 'lantern' ? '#ffe08a66' : fx.kind === 'raincoat' ? '#6ec8ff55' : '#d7f59a66';
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.burst,
        { left: fx.at.x * TILE - 36, top: fx.at.y * TILE - 48, backgroundColor: wash },
        glow,
      ]}
    >
      <Image source={icon} fadeDuration={0} style={styles.burstIcon} />
    </Animated.View>
  );
}

function ScarecrowFx({
  fx, reducedMotion, onDone,
}: {
  fx: Extract<MazeToolFx, { kind: 'scarecrow' }>;
  reducedMotion: boolean;
  onDone: () => void;
}) {
  const pop = useSharedValue(reducedMotion ? 1 : 0.2);
  useEffect(() => {
    pop.value = reducedMotion
      ? withTiming(1, { duration: 120 })
      : withSequence(
        withTiming(1.08, { duration: 180, easing: Easing.out(Easing.back(1.4)) }),
        withTiming(1, { duration: 220 }),
        withTiming(0, { duration: 240 }),
      );
    const timer = setTimeout(onDone, reducedMotion ? 240 : 720);
    return () => clearTimeout(timer);
  }, [fx.nonce, onDone, pop, reducedMotion]);
  const style = useAnimatedStyle(() => ({ opacity: Math.min(1, pop.value), transform: [{ scale: pop.value }] }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.scarecrow, { left: fx.at.col * TILE - 8, top: fx.at.row * TILE - 28 }, style]}
    >
      <Image source={wordMaizeAssets.powerups.scarecrow} fadeDuration={0} style={styles.scarecrowArt} />
    </Animated.View>
  );
}

function FindFx({
  fx, reducedMotion, onDone,
}: {
  fx: Extract<MazeToolFx, { kind: 'find' }>;
  reducedMotion: boolean;
  onDone: () => void;
}) {
  const pop = useSharedValue(reducedMotion ? 1 : 0.15);
  const rise = useSharedValue(0);
  useEffect(() => {
    pop.value = reducedMotion
      ? withTiming(1, { duration: 160 })
      : withSequence(
        withTiming(1.2, { duration: 200, easing: Easing.out(Easing.back(1.7)) }),
        withTiming(1, { duration: 240 }),
        withTiming(0, { duration: 280, easing: Easing.in(Easing.quad) }),
      );
    rise.value = withTiming(reducedMotion ? -8 : -32, { duration: reducedMotion ? 160 : 700, easing: Easing.out(Easing.quad) });
    const timer = setTimeout(onDone, reducedMotion ? 260 : 780);
    return () => clearTimeout(timer);
  }, [fx.nonce, onDone, pop, reducedMotion, rise]);
  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, pop.value),
    transform: [{ translateY: rise.value }, { scale: Math.max(0.2, pop.value) }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.findBurst, { left: fx.at.col * TILE - 6, top: fx.at.row * TILE - 40 }, style]}>
      <View style={styles.findGlow} />
      <Image source={wordMaizeAssets.powerups[fx.tool]} fadeDuration={0} style={styles.findIcon} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tractor: { position: 'absolute', width: 68, height: 58, resizeMode: 'contain' },
  mower: { position: 'absolute', width: 56, height: 52, resizeMode: 'contain' },
  chaff: { position: 'absolute', width: 40, height: 40, resizeMode: 'contain', zIndex: 28 },
  burst: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 32,
  },
  burstIcon: { width: 44, height: 44, resizeMode: 'contain' },
  scarecrow: { position: 'absolute', width: 64, height: 72, zIndex: 32 },
  scarecrowArt: { width: 64, height: 72, resizeMode: 'contain' },
  findBurst: { position: 'absolute', width: 72, height: 72, alignItems: 'center', justifyContent: 'center', zIndex: 34 },
  findGlow: { position: 'absolute', width: 56, height: 56, borderRadius: 28, backgroundColor: '#ffe08a88' },
  findIcon: { width: 52, height: 52, resizeMode: 'contain' },
});
