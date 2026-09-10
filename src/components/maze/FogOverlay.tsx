import { createElement, useEffect } from 'react';
import { Image, Platform, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { fogAssets } from '../../../assets/word-maize/effects/fog/assets';
import { FOG_PRESETS, fogIntensityFor, fogLanternCount, fogRadiiPx, type FogIntensity } from '../../game/mazeFog';
import type { StormPhase } from '../../game/mazeStorm';
import { lanternBrighten, type MazeSight } from '../../game/mazeVisibility';

export const DEBUG_MAZE_FOG = false;

export type FogOverlayProps = {
  enabled: boolean;
  intensity?: FogIntensity;
  playerX: number;
  playerY: number;
  sight: MazeSight;
  phase?: StormPhase;
  viewportWidth: number;
  viewportHeight: number;
  paused?: boolean;
  reducedMotion?: boolean;
  lantern?: number | boolean;
  debug?: boolean;
  bottomInset?: number;
};

/** Matches `makeSpotlight` in tools/art/generate-fog-textures.mjs */
const SPOTLIGHT_DARK_T = 0.28;

const FOG_OPACITY = {
  light: 0.48,
  medium: 0.7,
  heavy: 0.88,
  storm: 0.78,
} as const;

export function FogOverlay({
  enabled, intensity, playerX, playerY, sight, phase = 'clear',
  viewportWidth, viewportHeight, paused = false, reducedMotion = false, lantern = false, bottomInset = 0,
}: FogOverlayProps) {
  if (!enabled || viewportWidth < 2 || viewportHeight < 2) return null;
  if (lanternBrighten(fogLanternCount(lantern)) >= 1) return null;
  const grade = intensity ?? fogIntensityFor(sight, phase);
  const { inner, outer, densityMul, compact } = fogRadiiPx(sight, grade, reducedMotion, { width: viewportWidth, height: viewportHeight }, lantern);
  const night = FOG_PRESETS[grade].density * densityMul * (compact ? 0.9 : 1);
  const fogAmt = FOG_OPACITY[grade] * Math.max(0, densityMul) * (compact ? 0.82 : 1);
  const radii = holeRadii(inner, outer);
  return (
    <View pointerEvents="none" style={[styles.layer, { bottom: bottomInset }]} accessibilityElementsHidden>
      {Platform.OS === 'web' ? (
        <WebFog playerX={playerX} playerY={playerY} radii={radii} night={night} fogAmt={fogAmt} paused={paused} reducedMotion={reducedMotion} />
      ) : (
        <NativeFog
          playerX={playerX} playerY={playerY} radii={radii} night={night} fogAmt={fogAmt}
          width={viewportWidth} height={viewportHeight} paused={paused} reducedMotion={reducedMotion}
        />
      )}
    </View>
  );
}

function holeRadii(inner: number, outer: number) {
  const clear = Math.max(36, Math.round(inner * 0.55));
  const mid = Math.max(clear + 28, Math.round(inner));
  const fade = Math.max(mid + 48, Math.round(outer));
  return { clear, mid, fade };
}

function WebFog({
  playerX, playerY, radii, night, fogAmt, paused, reducedMotion,
}: {
  playerX: number; playerY: number; radii: { clear: number; mid: number; fade: number };
  night: number; fogAmt: number; paused: boolean; reducedMotion: boolean;
}) {
  const play = paused || reducedMotion ? 'paused' : 'running';
  return (
    <>
      {createElement('div', {
        style: {
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `radial-gradient(circle at ${playerX}px ${playerY}px, transparent 0px, transparent ${radii.clear}px, rgba(0,0,0,${(night * 0.4).toFixed(2)}) ${radii.mid}px, rgba(0,0,0,${night}) ${radii.fade}px)`,
        },
      })}
      {createElement('style', {
        dangerouslySetInnerHTML: { __html: fogKeyframes(fogAmt) },
      })}
      {createElement('div', {
        style: {
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          filter: 'blur(1px)',
        },
      }, [
        webBank('fog-a', fogAssets.bank1, 'wm-fog-op1 10s linear infinite, wm-fog-move 15s linear infinite', play, reducedMotion),
        webBank('fog-b', fogAssets.bank2, 'wm-fog-op2 21s linear infinite, wm-fog-move 13s linear infinite', play, reducedMotion),
        webBank('fog-c', fogAssets.bank2, 'wm-fog-op3 17s linear infinite, wm-fog-move 19s linear infinite', play, reducedMotion),
      ])}
    </>
  );
}

function webBank(key: string, source: ImageSourcePropType, animation: string, play: string, reducedMotion: boolean) {
  return createElement('div', {
    key,
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      height: '100%',
      width: '200%',
      display: 'flex',
      animation: reducedMotion ? 'none' : animation,
      animationPlayState: play,
    },
  }, [
    createElement(View, { key: `${key}-a`, style: styles.fogTile },
      createElement(Image, { source, resizeMode: 'cover', fadeDuration: 0, style: styles.fogArt }),
    ),
    createElement(View, { key: `${key}-b`, style: styles.fogTile },
      createElement(Image, { source, resizeMode: 'cover', fadeDuration: 0, style: styles.fogArt }),
    ),
  ]);
}

function fogKeyframes(amt: number) {
  const op = (value: number) => (value * amt).toFixed(2);
  return [
    '@keyframes wm-fog-move{from{left:0}to{left:-100%}}',
    `@keyframes wm-fog-op1{0%{opacity:${op(0.1)}}22%{opacity:${op(0.5)}}40%{opacity:${op(0.28)}}58%{opacity:${op(0.4)}}80%{opacity:${op(0.16)}}100%{opacity:${op(0.1)}}}`,
    `@keyframes wm-fog-op2{0%{opacity:${op(0.5)}}25%{opacity:${op(0.2)}}50%{opacity:${op(0.1)}}80%{opacity:${op(0.3)}}100%{opacity:${op(0.5)}}}`,
    `@keyframes wm-fog-op3{0%{opacity:${op(0.8)}}27%{opacity:${op(0.2)}}52%{opacity:${op(0.6)}}68%{opacity:${op(0.3)}}100%{opacity:${op(0.8)}}}`,
  ].join('');
}

function NativeFog({
  playerX, playerY, radii, night, fogAmt, width, height, paused, reducedMotion,
}: {
  playerX: number; playerY: number; radii: { clear: number; mid: number; fade: number };
  night: number; fogAmt: number; width: number; height: number; paused: boolean; reducedMotion: boolean;
}) {
  const size = (radii.fade / SPOTLIGHT_DARK_T) * 2;
  const left = playerX - size / 2;
  const top = playerY - size / 2;
  return (
    <>
      <View style={[styles.band, { left: 0, right: 0, top: 0, height: Math.max(0, top), backgroundColor: `rgba(0,0,0,${night})` }]} />
      <View style={[styles.band, { left: 0, right: 0, top: top + size, bottom: 0, backgroundColor: `rgba(0,0,0,${night})` }]} />
      <View style={[styles.band, { left: 0, top: Math.max(0, top), width: Math.max(0, left), height: size, backgroundColor: `rgba(0,0,0,${night})` }]} />
      <View style={[styles.band, { left: left + size, top: Math.max(0, top), right: 0, height: size, backgroundColor: `rgba(0,0,0,${night})` }]} />
      <Image
        source={fogAssets.spotlight}
        fadeDuration={0}
        style={{ position: 'absolute', width: size, height: size, left, top, opacity: night }}
      />
      <View style={styles.banks}>
        <NativeBank source={fogAssets.bank1} width={width} height={height} duration={15000} paused={paused} reducedMotion={reducedMotion} opacity={0.35 * fogAmt} />
        <NativeBank source={fogAssets.bank2} width={width} height={height} duration={13000} paused={paused} reducedMotion={reducedMotion} opacity={0.28 * fogAmt} />
        <NativeBank source={fogAssets.bank2} width={width} height={height} duration={19000} paused={paused} reducedMotion={reducedMotion} opacity={0.4 * fogAmt} />
      </View>
    </>
  );
}

function NativeBank({
  source, width, height, duration, paused, reducedMotion, opacity,
}: {
  source: ImageSourcePropType; width: number; height: number; duration: number; paused: boolean; reducedMotion: boolean; opacity: number;
}) {
  const drift = useSharedValue(0);
  useEffect(() => {
    if (paused || reducedMotion) {
      cancelAnimation(drift);
      return;
    }
    drift.value = 0;
    drift.value = withRepeat(withTiming(-width, { duration, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(drift);
  }, [drift, duration, paused, reducedMotion, width]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: drift.value }] }));
  return (
    <Animated.View style={[styles.bankRow, { width: width * 2, height, opacity }, style]}>
      <Image source={source} fadeDuration={0} resizeMode="cover" style={{ width, height }} />
      <Image source={source} fadeDuration={0} resizeMode="cover" style={{ width, height }} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', left: 0, right: 0, top: 0, zIndex: 1, overflow: 'hidden' },
  band: { position: 'absolute' },
  banks: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  bankRow: { position: 'absolute', left: 0, top: 0, flexDirection: 'row' },
  fogTile: { width: '50%', height: '100%' },
  fogArt: { width: '100%', height: '100%' },
});
