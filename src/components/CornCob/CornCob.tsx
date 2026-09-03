import { useMemo, useRef } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { wordMaizeAssets } from '../../../assets/word-maize/assets';
import { exposedKernels, positionKey } from '../../game/board';
import { signedColumnOffset, snapRotation } from '../../game/rotation';
import { magneticNeighbor } from '../../game/selection';
import { Kernel, Tuning } from '../../game/types';
import { KernelTile } from './Kernel';
import { cobMetrics, hitKernel, layoutKernels, rowRadius } from './layout';
import { WordSelectionPath } from './WordSelectionPath';

type Props = {
  kernels: Kernel[];
  columns: number;
  rows: number;
  rotation: number;
  tuning: Tuning;
  selected: Kernel[];
  hints: string[];
  pickerMode: boolean;
  butterHints?: boolean;
  onStart: (kernel: Kernel) => void;
  onExtend: (kernel: Kernel) => void;
  onSubmit: () => void;
  onPick: (kernel: Kernel) => void;
  onRotation: (value: number) => void;
  width?: number;
  height?: number;
};

export function CornCob(props: Props) {
  const width = props.width ?? 360;
  const height = props.height ?? 520;
  const metrics = cobMetrics(width, height);
  const mode = useRef<'select' | 'rotate' | null>(null);
  const startRotation = useRef(props.rotation);
  const tilt = useSharedValue(0);
  const available = useMemo(() => exposedKernels(props.kernels), [props.kernels]);
  const layout = useMemo(
    () => layoutKernels(available, props.columns, props.rows, props.rotation, props.tuning, metrics),
    [available, props.columns, props.rows, props.rotation, props.tuning, metrics.width, metrics.height],
  );

  const selectedRef = useRef(props.selected); selectedRef.current = props.selected;
  const centersRef = useRef(layout.centers); centersRef.current = layout.centers;
  const availableRef = useRef(available); availableRef.current = available;
  const rotationRef = useRef(props.rotation); rotationRef.current = props.rotation;
  const visibleRef = useRef(layout.visible); visibleRef.current = layout.visible;

  const sockets = useMemo(() => {
    const exposed = new Set(available.map(positionKey));
    const frontLimit = (props.tuning.visibleColumns - 1) / 2;
    return props.kernels
      .filter(k => k.harvested && !exposed.has(positionKey(k)) && k.layer === Math.max(...props.kernels.filter(x => positionKey(x) === positionKey(k)).map(x => x.layer)))
      .map(k => {
        const offset = signedColumnOffset(k.column, props.rotation, props.columns);
        if (Math.abs(offset) > frontLimit + 0.15) return null;
        const angle = (offset / props.tuning.visibleColumns) * Math.PI;
        return {
          k,
          x: width / 2 + Math.sin(angle) * rowRadius(k.row, props.rows, metrics.radius),
          y: metrics.top + k.row * (metrics.cobHeight / Math.max(1, props.rows - 1)),
        };
      })
      .filter(Boolean) as { k: Kernel; x: number; y: number }[];
  }, [props.kernels, available, props.rotation, props.columns, props.rows, props.tuning.visibleColumns, width, metrics]);

  const gesture = useMemo(() => Gesture.Pan()
    .runOnJS(true)
    .onBegin(event => {
      const point = { x: event.x, y: event.y };
      const kernel = hitKernel(point, visibleRef.current, props.tuning.kernelSize, props.tuning.touchMultiplier);
      startRotation.current = rotationRef.current;
      if (kernel) {
        if (props.pickerMode) {
          mode.current = null;
          props.onPick(kernel);
        } else {
          mode.current = 'select';
          props.onStart(kernel);
        }
      } else {
        mode.current = 'rotate';
      }
    })
    .onUpdate(event => {
      if (mode.current === 'rotate') {
        const next = startRotation.current - event.translationX * props.tuning.rotationSensitivity;
        tilt.value = ((next % 1) + 1) % 1;
        props.onRotation(next);
        return;
      }
      const path = selectedRef.current;
      if (mode.current !== 'select' || !path.length) return;
      const current = path[path.length - 1];
      const origin = centersRef.current[current.id];
      if (!origin) return;
      const next = magneticNeighbor(
        current,
        availableRef.current,
        centersRef.current,
        origin,
        { x: event.x, y: event.y },
        props.columns,
        props.tuning.movementThreshold,
        props.tuning.directionalBias,
      );
      if (next) props.onExtend(next);
    })
    .onFinalize(() => {
      if (mode.current === 'select') props.onSubmit();
      if (mode.current === 'rotate') {
        const snapped = snapRotation(rotationRef.current, props.tuning.rotationSnap);
        tilt.value = withTiming(0, { duration: 180 });
        props.onRotation(snapped);
      }
      mode.current = null;
    }), [props.pickerMode, props.tuning, props.columns, props.onStart, props.onExtend, props.onSubmit, props.onPick, props.onRotation, tilt]);

  const cobTilt = useAnimatedStyle(() => ({
    transform: [{ perspective: 900 }, { rotateY: `${(tilt.value - 0.5) * 16}deg` }],
  }));

  const selectedIds = new Set(props.selected.map(k => k.id));
  const hintIds = new Set(props.hints);
  const size = props.tuning.kernelSize;

  return (
    <GestureDetector gesture={gesture}>
      <View style={[styles.frame, { width, height }]}>
        <Animated.View style={[styles.cobWrap, { width, height }, cobTilt]}>
          <Image
            source={wordMaizeAssets.corn.fullV2}
            style={{ position: 'absolute', left: 0, top: 0, width, height, resizeMode: 'contain' }}
          />
        </Animated.View>
        {sockets.map(({ k, x, y }) => (
          <Image
            key={`socket-${k.id}`}
            source={wordMaizeAssets.kernels.emptySocketV2}
            style={{ position: 'absolute', zIndex: 3, width: size * 0.86, height: size * 0.86, left: x - size * 0.43, top: y - size * 0.43, resizeMode: 'contain' }}
          />
        ))}
        {layout.visible.map(item => (
          <KernelTile
            key={item.kernel.id}
            layout={item}
            size={size}
            selected={selectedIds.has(item.kernel.id)}
            hinted={hintIds.has(item.kernel.id)}
          />
        ))}
        <WordSelectionPath path={props.selected} centers={layout.centers} />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  frame: { alignSelf: 'center' },
  cobWrap: { position: 'absolute', left: 0, top: 0 },
});
