import { createElement, useEffect, useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming, type SharedValue } from 'react-native-reanimated';
import { playGameSound } from '../../audio/sounds';
import type { StormPhase } from '../../game/mazeStorm';
import type { MazeSight } from '../../game/mazeVisibility';

export type MazeWeatherLayerProps = {
  phase: StormPhase;
  sight: MazeSight;
  farmerX: number;
  farmerY: number;
  paused: boolean;
  reducedMotion: boolean;
  width?: number;
  height?: number;
};

const RAIN_COUNT = 72;
const GRACE_RAIN_COUNT = 96;

export function MazeWeatherLayer({
  phase, paused, reducedMotion, width = 1, height = 1,
}: MazeWeatherLayerProps) {
  const raining = phase === 'rain' || phase === 'grace' || phase === 'expired';
  const stormFx = raining || phase === 'overcast' || phase === 'dark' || phase === 'untimed';
  const drops = phase === 'grace' ? GRACE_RAIN_COUNT : RAIN_COUNT;

  useEffect(() => {
    if (!raining || paused || reducedMotion) return;
    playGameSound('weatherRain', 0.34);
    const id = setInterval(() => playGameSound('weatherRain', 0.34), 4200);
    return () => clearInterval(id);
  }, [paused, raining, reducedMotion]);

  if (!stormFx) return null;

  return (
    <View pointerEvents="none" style={[styles.layer, { backgroundColor: washColor(phase) }]} accessibilityElementsHidden>
      {raining && !reducedMotion ? (
        Platform.OS === 'web'
          ? <WebRain count={drops} height={height} paused={paused} />
          : <NativeRain count={drops} width={width} height={height} paused={paused} />
      ) : null}
      {raining && !reducedMotion ? (
        Platform.OS === 'web'
          ? <WebThunder paused={paused} />
          : <NativeThunder paused={paused} />
      ) : null}
    </View>
  );
}

function WebRain({ count, height, paused }: { count: number; height: number; paused: boolean }) {
  const streaks = useMemo(() => Array.from({ length: count }, (_, i) => ({
    left: ((i * 47 + 13) % 100),
    duration: 0.55 + (i % 8) * 0.08,
    delay: ((i * 0.37) % 4.8),
    length: 18 + (i % 6) * 6,
    opacity: 0.45 + (i % 4) * 0.12,
  })), [count]);
  const travel = Math.max(280, Math.round(height) + 48);
  return (
    <>
      {createElement('style', {
        dangerouslySetInnerHTML: {
          __html: `@keyframes wm-maze-rain{from{transform:rotate(15deg) translateY(-40px)}to{transform:rotate(15deg) translateY(${travel}px)}}`,
        },
      })}
      {streaks.map((drop, i) => createElement('div', {
        key: `rain-${i}`,
        style: {
          position: 'absolute',
          left: `${drop.left}%`,
          top: 0,
          width: 2,
          height: drop.length,
          margin: 0,
          borderRadius: 1,
          pointerEvents: 'none',
          opacity: drop.opacity,
          background: 'linear-gradient(to bottom, rgba(236,246,255,0.15), rgba(236,246,255,0.95))',
          transformOrigin: '50% 0%',
          animation: `wm-maze-rain ${drop.duration}s linear ${drop.delay}s infinite`,
          animationPlayState: paused ? 'paused' : 'running',
        },
      }))}
    </>
  );
}

function WebThunder({ paused }: { paused: boolean }) {
  return (
    <>
      {createElement('style', {
        dangerouslySetInnerHTML: {
          __html: '@keyframes wm-maze-thunder{0%,8%,100%{background-color:transparent}1%{background-color:rgba(255,255,255,0.72)}2%{background-color:rgba(255,255,255,0.28)}}',
        },
      })}
      {createElement('div', {
        style: {
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          animation: 'wm-maze-thunder 10s linear 2s infinite',
          animationPlayState: paused ? 'paused' : 'running',
        },
      })}
    </>
  );
}

function NativeRain({ count, width, height, paused }: { count: number; width: number; height: number; paused: boolean }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    if (paused) {
      cancelAnimation(progress);
      return;
    }
    progress.value = 0;
    progress.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(progress);
  }, [paused, progress]);
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <NativeDrop key={`rain-${i}`} index={i} progress={progress} width={width} height={height} />
      ))}
    </>
  );
}

function NativeDrop({ index, progress, width, height }: { index: number; progress: SharedValue<number>; width: number; height: number }) {
  const x = ((index * 47 + 13) % 100) / 100 * Math.max(1, width);
  const start = -24 + ((index * 17) % 90);
  const len = 18 + (index % 6) * 4;
  const opacity = 0.28 + (index % 4) * 0.1;
  const span = Math.max(220, height + 80);
  const style = useAnimatedStyle(() => {
    const y = ((start + progress.value * span) % span) - 40;
    return { transform: [{ translateX: x }, { translateY: y }, { rotate: '15deg' }] };
  });
  return (
    <Animated.View
      style={[styles.drop, { height: len, opacity }, style]}
    />
  );
}

function NativeThunder({ paused }: { paused: boolean }) {
  const bolt = useSharedValue(0);
  useEffect(() => {
    if (paused) {
      cancelAnimation(bolt);
      bolt.value = 0;
      return;
    }
    let alive = true;
    const flash = () => {
      if (!alive) return;
      bolt.value = 0;
      bolt.value = withSequence(
        withTiming(1, { duration: 90 }),
        withTiming(0, { duration: 180 }),
        withDelay(80, withTiming(0.55, { duration: 70 })),
        withTiming(0, { duration: 320 }),
      );
      playGameSound('weatherStorm', 0.38);
    };
    const id = setInterval(flash, 10000);
    const first = setTimeout(flash, 2200);
    return () => {
      alive = false;
      clearInterval(id);
      clearTimeout(first);
      cancelAnimation(bolt);
    };
  }, [bolt, paused]);
  const flash = useAnimatedStyle(() => ({ opacity: bolt.value }));
  return <Animated.View pointerEvents="none" style={[styles.thunder, flash]} />;
}

function washColor(phase: StormPhase) {
  if (phase === 'grace' || phase === 'expired') return 'rgba(12, 22, 48, 0.5)';
  if (phase === 'rain') return 'rgba(16, 32, 58, 0.32)';
  if (phase === 'dark') return 'rgba(18, 28, 48, 0.36)';
  if (phase === 'overcast' || phase === 'untimed') return 'rgba(40, 50, 62, 0.2)';
  return 'rgba(20, 28, 40, 0.16)';
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 2, overflow: 'hidden' },
  drop: { position: 'absolute', left: 0, top: 0, width: 2, borderRadius: 1, backgroundColor: 'rgba(236, 246, 255, 0.92)' },
  thunder: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(255, 255, 255, 0.72)' },
});
