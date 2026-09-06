import { forwardRef, useEffect, useMemo, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { wordMaizeAssets } from '../../../assets/word-maize/assets';
import { positionKey } from '../../game/board';
import { Kernel, Point, Tuning } from '../../game/types';
import { KernelTile } from './Kernel';
import { ObstacleState } from '../../game/obstacles';
import { cobMetrics, hitKernel, layoutKernels } from './layout';
import { TapGestureArbitrator } from './TapGestureArbitrator';
import { isMoonlitHidden } from '../../game/cornVarieties';

type Props = {
  kernels: Kernel[];
  columns: number;
  rows: number;
  rotation: number;
  tuning: Tuning;
  selected: Kernel[];
  hints: string[];
  harvestingIds?: string[];
  harvestTarget?: Point;
  pickerMode: boolean;
  butterHints?: boolean;
  rejectedId?: string;
  faulted?: boolean;
  locked?: boolean;
  reducedMotion?: boolean;
  obstacles?: ObstacleState[];
  clearingObstacleIds?: string[];
  blockedKernelIds?: Set<string>;
  onKernelTap: (kernel: Kernel) => void;
  onPick: (kernel: Kernel) => void;
  onRotateStart: () => void;
  onRotateMove: (dx: number) => void;
  onRotateEnd: () => void;
  width?: number;
  height?: number;
};

function BoardActor({
  obstacle, x, y, width, height, faceRight, opacity, reducedMotion, clearing,
}: {
  obstacle: ObstacleState;
  x: number;
  y: number;
  width: number;
  height: number;
  faceRight: boolean;
  opacity: number;
  reducedMotion?: boolean;
  clearing?: boolean;
}) {
  const entrance = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const hover = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(0)).current;
  const crow = obstacle.kind === 'crow';

  useEffect(() => {
    if (reducedMotion) return;
    Animated.spring(entrance, { toValue: 1, speed: 12, bounciness: 8, useNativeDriver: true }).start();
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(hover, { toValue: 1, duration: crow ? 430 : 700, useNativeDriver: true }),
      Animated.timing(hover, { toValue: 0, duration: crow ? 430 : 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [crow, entrance, hover, reducedMotion]);

  useEffect(() => {
    if (!clearing) return;
    Animated.timing(exit, { toValue: 1, duration: reducedMotion ? 1 : 340, useNativeDriver: true }).start();
  }, [clearing, exit, reducedMotion]);

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLabel={`${obstacle.kind} obstacle`}
      style={[
        styles.actor,
        {
          width, height, left: x, top: y,
          opacity: Animated.multiply(opacity, exit.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })),
          transform: [
            { translateX: entrance.interpolate({ inputRange: [0, 1], outputRange: [crow ? -width * 0.8 : width * 0.45, 0] }) },
            { translateY: hover.interpolate({ inputRange: [0, 1], outputRange: [0, crow ? -7 : -3] }) },
            { rotate: exit.interpolate({ inputRange: [0, 1], outputRange: ['0deg', crow ? '-18deg' : '12deg'] }) },
            { scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
          ],
        },
      ]}
    >
      <Image
        source={crow ? wordMaizeAssets.obstacles.crow : wordMaizeAssets.obstacles.squirrel}
        style={[styles.actorImage, { transform: [{ scaleX: faceRight ? 1 : -1 }] }]}
      />
      {obstacle.turnsRemaining > 0 ? (
        <Text style={[styles.actorCountdown, obstacle.status === 'triggered' && styles.actorCountdownTriggered]}>
          {obstacle.turnsRemaining}
        </Text>
      ) : null}
    </Animated.View>
  );
}

export const CornCob = forwardRef<View, Props>(function CornCob(props, ref) {
  const width = props.width ?? 360;
  const height = props.height ?? 520;
  const harvestTarget = props.harvestTarget ?? { x: 42, y: height - 42 };
  const metrics = cobMetrics(width, height);
  const available = useMemo(() => {
    const stacks = new Map<string, Kernel[]>();
    props.kernels.forEach(kernel => {
      const key = positionKey(kernel);
      stacks.set(key, [...(stacks.get(key) ?? []), kernel]);
    });
    return [...stacks.values()].map(stack => {
      const ordered = stack.sort((a, b) => a.layer - b.layer);
      return ordered.find(kernel => !kernel.harvested) ?? ordered[ordered.length - 1];
    });
  }, [props.kernels]);
  const layout = useMemo(
    () => layoutKernels(available, props.columns, props.rows, props.rotation, props.tuning, metrics),
    [available, props.columns, props.rows, props.rotation, props.tuning, metrics.width, metrics.height],
  );

  const selectedIds = new Set(props.selected.map(k => k.id));
  const hintIds = new Set(props.hints);
  const harvestingIds = new Set(props.harvestingIds ?? []);
  const visibleActors = layout.visible.flatMap(item => {
    const obstacle = props.obstacles?.find(candidate => candidate.kernelId === item.kernel.id && candidate.status !== 'cleared');
    return obstacle && (obstacle.kind === 'crow' || obstacle.kind === 'squirrel') ? [{ item, obstacle }] : [];
  });
  const rowGap = metrics.cobHeight / Math.max(1, props.rows - 1);
  const size = Math.min(props.tuning.kernelSize, rowGap);
  const layoutRef = useRef(layout);
  const sizeRef = useRef(size);
  const lastTap = useRef(0);
  const rotating = useRef(false);
  layoutRef.current = layout;
  sizeRef.current = size;

  const handlePress = (kernel: Kernel) => {
    if (props.locked || rotating.current) return;
    const kernelLayout = layoutRef.current.visible.find(item => item.kernel.id === kernel.id);
    if (!props.pickerMode && kernelLayout && isMoonlitHidden(kernel, kernelLayout.shade, selectedIds.has(kernel.id) || hintIds.has(kernel.id))) return;
    const now = Date.now();
    if (now - lastTap.current < 80) return;
    lastTap.current = now;
    if (props.pickerMode) props.onPick(kernel);
    else props.onKernelTap(kernel);
  };

  const handleTap = (x: number, y: number) => {
    if (props.locked || rotating.current) return;
    const kernel = hitKernel({ x, y }, layoutRef.current.visible, sizeRef.current, 1);
    if (kernel) handlePress(kernel);
  };

  return (
    <View ref={ref} collapsable={false} style={[styles.frame, { width, height }]}>
      <TapGestureArbitrator
        style={StyleSheet.absoluteFill}
        movementThreshold={props.tuning.movementThreshold}
        onRotateStart={() => {
          rotating.current = true;
          props.onRotateStart();
        }}
        onRotateMove={props.onRotateMove}
        onRotateEnd={() => {
          props.onRotateEnd();
          setTimeout(() => { rotating.current = false; }, 120);
        }}
        onTap={handleTap}
      >
        {layout.visible.map(item => (
          <KernelTile
            key={item.kernel.id}
            layout={item}
            size={size}
            selected={selectedIds.has(item.kernel.id)}
            hinted={hintIds.has(item.kernel.id)}
            harvesting={harvestingIds.has(item.kernel.id)}
            harvestIndex={Math.max(0, (props.harvestingIds ?? []).indexOf(item.kernel.id))}
            harvestTarget={harvestTarget}
            faulted={props.faulted && selectedIds.has(item.kernel.id)}
            rejected={props.rejectedId === item.kernel.id}
            reducedMotion={props.reducedMotion}
            obstacle={props.obstacles?.find(obstacle => obstacle.kernelId === item.kernel.id)}
            clearing={props.clearingObstacleIds?.includes(props.obstacles?.find(obstacle => obstacle.kernelId === item.kernel.id)?.id ?? '')}
            blocked={props.blockedKernelIds?.has(item.kernel.id)}
            pickerMode={props.pickerMode}
            onPress={() => handlePress(item.kernel)}
          />
        ))}
        {visibleActors.map(({ item, obstacle }) => {
          const crow = obstacle.kind === 'crow';
          const actorWidth = size * (crow ? 2.75 : 2.15);
          const actorHeight = size * (crow ? 2.2 : 2.05);
          return (
            <BoardActor
              key={`actor-${obstacle.id}`}
              obstacle={obstacle}
              x={item.x - actorWidth * (crow ? 0.82 : 0.2)}
              y={item.y - actorHeight * (crow ? 0.88 : 0.82)}
              width={actorWidth}
              height={actorHeight}
              faceRight={item.x < width / 2}
              opacity={item.opacity ?? 1}
              reducedMotion={props.reducedMotion}
              clearing={props.clearingObstacleIds?.includes(obstacle.id)}
            />
          );
        })}
      </TapGestureArbitrator>
    </View>
  );
});

const styles = StyleSheet.create({
  frame: { alignSelf: 'center', position: 'relative', overflow: 'visible' },
  actor: { position: 'absolute', zIndex: 30, overflow: 'visible' },
  actorImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  actorCountdown: {
    position: 'absolute', right: '6%', bottom: '10%', minWidth: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: '#fff3c4', backgroundColor: '#b43b24', color: 'white',
    textAlign: 'center', fontWeight: '900', fontSize: 15, overflow: 'hidden',
  },
  actorCountdownTriggered: { backgroundColor: '#7a160d' },
});
