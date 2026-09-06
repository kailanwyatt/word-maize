import { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { wordMaizeAssets } from '../../../assets/word-maize/assets';
import { KernelLayout } from './layout';
import { ObstacleState } from '../../game/obstacles';

function varietyArt(kernel: KernelLayout['kernel']) {
  const varieties = wordMaizeAssets.kernels.varieties;
  if (kernel.variety === 'flint') {
    return varieties.flint[(kernel.row * 11 + kernel.column) % varieties.flint.length];
  }
  return varieties[kernel.variety];
}

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
  reducedMotion = false,
  obstacle,
  clearing = false,
  blocked = false,
  pickerMode = false,
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
  reducedMotion?: boolean;
  obstacle?: ObstacleState;
  clearing?: boolean;
  blocked?: boolean;
  pickerMode?: boolean;
}) {
  const { kernel, x, y, scaleX, scale, shade } = layout;
  const dormant = kernel.variety === 'white' && kernel.dormant === true;
  const activeObstacle = obstacle && obstacle.status !== 'cleared' ? obstacle : undefined;
  const isKernelObstacle = activeObstacle?.kind === 'weed' || activeObstacle?.kind === 'caterpillar' || activeObstacle?.kind === 'frost';
  const isBoardActorTarget = activeObstacle?.kind === 'crow' || activeObstacle?.kind === 'squirrel';
  const cornArt = varietyArt(kernel);
  const kernelArt = activeObstacle?.kind === 'weed'
    ? wordMaizeAssets.obstacles.weed
    : activeObstacle?.kind === 'caterpillar'
      ? wordMaizeAssets.obstacles.caterpillar
      : activeObstacle?.kind === 'frost'
        ? wordMaizeAssets.obstacles.frostKernel
      : cornArt.full;
  const harvest = useRef(new Animated.Value(0)).current;
  const reject = useRef(new Animated.Value(0)).current;
  const obstaclePulse = useRef(new Animated.Value(0)).current;
  const obstacleExit = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!activeObstacle || reducedMotion) {
      obstaclePulse.stopAnimation();
      obstaclePulse.setValue(0);
      return;
    }
    const duration = activeObstacle.kind === 'caterpillar' ? 360 : 700;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(obstaclePulse, { toValue: 1, duration, useNativeDriver: true }),
      Animated.timing(obstaclePulse, { toValue: 0, duration, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [activeObstacle?.id, activeObstacle?.kind, activeObstacle?.status, obstaclePulse, reducedMotion]);

  useEffect(() => {
    if (!clearing) {
      obstacleExit.setValue(0);
      return;
    }
    Animated.timing(obstacleExit, { toValue: 1, duration: reducedMotion ? 1 : 340, useNativeDriver: true }).start();
  }, [clearing, obstacleExit, reducedMotion]);

  useEffect(() => {
    if (!harvesting) {
      harvest.setValue(0);
      return;
    }
    if (reducedMotion) {
      harvest.setValue(1);
      return;
    }
    Animated.sequence([
      Animated.delay(harvestIndex * 70),
      Animated.spring(harvest, { toValue: 0.18, speed: 28, bounciness: 12, useNativeDriver: true }),
      Animated.timing(harvest, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [harvesting, harvest, harvestIndex, reducedMotion]);

  useEffect(() => {
    if (!rejected) {
      reject.setValue(0);
      return;
    }
    if (reducedMotion) return;
    Animated.sequence([
      Animated.timing(reject, { toValue: 1, duration: 70, useNativeDriver: true }),
      Animated.timing(reject, { toValue: 0, duration: 110, useNativeDriver: true }),
    ]).start();
  }, [rejected, reject, reducedMotion]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Letter ${kernel.letter}, row ${kernel.row + 1}, column ${kernel.column + 1}${dormant ? ', sleeping White Corn kernel' : ''}${obstacle && obstacle.status !== 'cleared' ? `, ${obstacle.kind} obstacle` : ''}`}
      accessibilityState={{ selected, disabled: kernel.harvested || (!pickerMode && blocked) || (layout.opacity ?? 1) < 0.35 }}
      disabled={kernel.harvested || (!pickerMode && blocked) || (layout.opacity ?? 1) < 0.35}
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
      <Image source={cornArt.socket} style={styles.socket} />
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
        {isBoardActorTarget ? (
          <Image
            source={wordMaizeAssets.obstacles.crowTarget}
            style={[styles.actorTarget, activeObstacle?.status === 'triggered' && styles.actorTargetTriggered]}
          />
        ) : null}
        {(selected || hinted) ? <Image source={cornArt.full} style={[styles.kernelGlow, hinted && styles.hintGlow]} /> : null}
        <Animated.Image
          source={kernelArt}
          style={[
            styles.kernel,
            dormant && styles.dormantKernel,
            faulted && styles.kernelFaulted,
            rejected && { opacity: reject.interpolate({ inputRange: [0, 1], outputRange: [1, 0.45] }) },
            isKernelObstacle && {
              opacity: obstacleExit.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
              transform: [
                { scale: obstacleExit.interpolate({ inputRange: [0, 0.35, 1], outputRange: [1, 1.12, 0.3] }) },
                { rotate: obstacleExit.interpolate({ inputRange: [0, 1], outputRange: ['0deg', activeObstacle?.kind === 'frost' ? '16deg' : '-10deg'] }) },
              ],
            },
          ]}
        />
        {kernel.cracked ? <Image source={wordMaizeAssets.kernels.varieties.flintCrack} style={styles.crackOverlay} /> : null}
        <Text style={[styles.letter, dormant && styles.dormantLetter, { fontSize: size * 0.42 }]}> 
          {kernel.letter}
        </Text>
        {kernel.armored && !kernel.cracked ? <Text style={styles.armoredBadge}>2×</Text> : null}
        {dormant ? (
          <View pointerEvents="none" style={styles.dormantMark}>
            <View style={[styles.vein, styles.veinOne]} />
            <View style={[styles.vein, styles.veinTwo]} />
          </View>
        ) : null}
        {activeObstacle && !isKernelObstacle && !isBoardActorTarget ? <Animated.View style={[
          activeObstacle.kind === 'web' ? styles.webWrap : styles.obstacleWrap,
          activeObstacle.kind === 'web' && {
            opacity: obstacleExit.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
            transform: [
              { scale: obstacleExit.interpolate({ inputRange: [0, 0.3, 1], outputRange: [1, 1.15, 0.25] }) },
              { rotate: obstacleExit.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '22deg'] }) },
            ],
          },
        ]}>
          <Image source={wordMaizeAssets.obstacles[activeObstacle.kind]} style={styles.obstacle} />
          {activeObstacle.turnsRemaining > 0 ? <Text style={styles.countdown}>{activeObstacle.turnsRemaining}</Text> : null}
        </Animated.View> : null}
        {isKernelObstacle && activeObstacle.turnsRemaining > 0 ? <Text style={styles.kernelCountdown}>{activeObstacle.turnsRemaining}</Text> : null}
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
  actorTarget: { position: 'absolute', width: '172%', height: '172%', resizeMode: 'contain', opacity: 0.82, zIndex: 3 },
  actorTargetTriggered: { opacity: 1, tintColor: '#ff6945' },
  obstacleWrap: { position: 'absolute', right: '-28%', top: '-48%', width: '84%', height: '84%', zIndex: 8 },
  webWrap: { position: 'absolute', left: '-44%', top: '-44%', width: '188%', height: '188%', zIndex: 8 },
  obstacle: { width: '100%', height: '100%', resizeMode: 'contain' },
  countdown: { position: 'absolute', right: 0, top: 0, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: '#b43b24', color: 'white', textAlign: 'center', fontWeight: '900', fontSize: 11, overflow: 'hidden' },
  kernelCountdown: { position: 'absolute', right: '-17%', top: '-17%', zIndex: 10, minWidth: 19, height: 19, borderRadius: 10, borderWidth: 1.5, borderColor: '#fff3c4', backgroundColor: '#b43b24', color: 'white', textAlign: 'center', fontWeight: '900', fontSize: 12, overflow: 'hidden' },
  kernel: { position: 'absolute', width: '154%', height: '154%', resizeMode: 'contain' },
  dormantKernel: { opacity: 0.72 },
  crackOverlay: { position: 'absolute', width: '154%', height: '154%', resizeMode: 'contain', zIndex: 2 },
  armoredBadge: { position: 'absolute', right: '-12%', top: '-10%', zIndex: 6, minWidth: 23, height: 19, borderRadius: 10, borderWidth: 1.5, borderColor: '#ffe89a', backgroundColor: '#663518', color: '#fff6cd', textAlign: 'center', fontWeight: '900', fontSize: 11, overflow: 'hidden' },
  kernelFaulted: { tintColor: '#c45a32' },
  dormantLetter: { opacity: 0.5 },
  dormantMark: { position: 'absolute', width: '56%', height: '56%', opacity: 0.75 },
  vein: { position: 'absolute', left: '48%', top: '8%', width: 3, height: '86%', borderRadius: 2, backgroundColor: '#78914c' },
  veinOne: { transform: [{ rotate: '34deg' }] },
  veinTwo: { transform: [{ rotate: '-34deg' }] },
  letter: {
    fontWeight: '900',
    color: '#2e1a0c',
    textShadowColor: 'rgba(255,236,150,0.55)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 1.5,
  },
});
