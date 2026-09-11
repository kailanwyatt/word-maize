import { createElement, PointerEvent, forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { TwistPuzzle, TWIST_VISIBLE_COLUMNS, twistSwipeSteps } from '../../game/cobPuzzles';
import { Kernel, Tuning } from '../../game/types';
import { KernelTile } from './Kernel';
import { cobMetrics, layoutKernelsWithRowRotations } from './layout';

const TWIST_TUNING: Tuning = {
  kernelSize: 78,
  touchMultiplier: 1,
  movementThreshold: 28,
  rotationSensitivity: 0.018,
  rotationSnap: 0.7,
  visibleColumns: TWIST_VISIBLE_COLUMNS,
  harvestTarget: 70,
  haptics: false,
};

function twistKernels(puzzle: TwistPuzzle, removed: string[], harvesting: string[]): Kernel[] {
  return puzzle.rings.flatMap((ring, row) => [...ring].map((letter, column) => {
    const id = `${row}:${column}`;
    const flying = harvesting.includes(id);
    const empty = letter === '.' || (removed.includes(id) && !flying);
    return {
      id,
      row,
      column,
      layer: 0,
      letter: empty ? '' : letter,
      harvested: empty,
      variety: 'sweet' as const,
    };
  }));
}

function TwistRow({
  row, y, height, width, locked, onTurn, onInteraction, onDrag,
}: {
  row: number; y: number; height: number; width: number; locked: boolean;
  onTurn: (step: number) => void; onInteraction: (active: boolean) => void; onDrag: (dx: number) => void;
}) {
  const pitch = width / TWIST_VISIBLE_COLUMNS;
  const latest = useRef({ locked, onTurn, onInteraction, onDrag, pitch });
  latest.current = { locked, onTurn, onInteraction, onDrag, pitch };
  const start = () => latest.current.onInteraction(true);
  const end = (dx: number, cancel = false) => {
    if (!cancel && !latest.current.locked) {
      const step = twistSwipeSteps(dx, latest.current.pitch);
      if (step) latest.current.onTurn(step);
    }
    latest.current.onDrag(0);
    latest.current.onInteraction(false);
  };
  const callbacks = useRef({ start, end }); callbacks.current = { start, end };
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => !latest.current.locked,
    onPanResponderGrant: () => callbacks.current.start(),
    onPanResponderMove: (_, g) => latest.current.onDrag(g.dx),
    onPanResponderRelease: (_, g) => callbacks.current.end(g.dx),
    onPanResponderTerminationRequest: () => false,
    onPanResponderTerminate: () => callbacks.current.end(0, true),
  })).current;
  const pointer = useRef<{ x: number; id: number } | null>(null);
  useEffect(() => () => latest.current.onInteraction(false), []);
  const turn = (step: number) => {
    latest.current.onDrag(0);
    latest.current.onInteraction(false);
    latest.current.onTurn(step);
  };
  const arrows = <>
    <Pressable accessibilityRole="button" accessibilityLabel={`Turn ring ${row + 1} left`} disabled={locked} onPress={() => turn(1)} style={[styles.arrow, styles.arrowLeft]}>
      <Text style={styles.arrowText}>‹</Text>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={`Turn ring ${row + 1} right`} disabled={locked} onPress={() => turn(-1)} style={[styles.arrow, styles.arrowRight]}>
      <Text style={styles.arrowText}>›</Text>
    </Pressable>
  </>;
  const swipe = Platform.OS === 'web'
    ? createElement('div', {
      style: { position: 'absolute', left: 32, right: 32, top: 0, bottom: 0, touchAction: 'none', userSelect: 'none', cursor: locked ? 'default' : 'grab' },
      onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
        if (locked || pointer.current) return;
        const target = event.target as HTMLElement | null;
        if (target?.closest?.('button')) return;
        event.preventDefault();
        pointer.current = { x: event.clientX, id: event.pointerId };
        event.currentTarget.setPointerCapture(event.pointerId);
        start();
      },
      onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
        if (pointer.current?.id === event.pointerId) latest.current.onDrag(event.clientX - pointer.current.x);
      },
      onPointerUp: (event: PointerEvent<HTMLDivElement>) => {
        if (pointer.current?.id !== event.pointerId) return;
        const dx = event.clientX - pointer.current.x;
        pointer.current = null;
        end(dx);
      },
      onPointerCancel: () => { pointer.current = null; end(0, true); },
    })
    : <View style={styles.swipe} {...pan.panHandlers} />;
  return (
    <View pointerEvents="box-none" style={[styles.rowHit, { top: y - height / 2, height, width }]}>
      {arrows}
      {swipe}
    </View>
  );
}

export const TwistCob = forwardRef<View, {
  puzzle: TwistPuzzle;
  offsets: number[];
  locked: boolean;
  removed: string[];
  harvesting: string[];
  reducedMotion: boolean;
  width: number;
  height: number;
  harvestTarget: { x: number; y: number };
  lane: number;
  onTurn: (row: number, step: number) => void;
  onInteraction: (active: boolean) => void;
}>(function TwistCob({
  puzzle, offsets, locked, removed, harvesting, reducedMotion, width, height, harvestTarget, lane, onTurn, onInteraction,
}, ref) {
  const [drag, setDrag] = useState({ row: -1, dx: 0 });
  const metrics = useMemo(() => cobMetrics(width, height), [width, height]);
  const pitch = width / TWIST_VISIBLE_COLUMNS;
  const rows = puzzle.rings.length;
  const columns = puzzle.rings[0]?.length ?? 12;
  const rowRotations = offsets.map((offset, row) => offset + lane - (drag.row === row ? drag.dx / pitch : 0));
  const kernels = useMemo(() => twistKernels(puzzle, removed, harvesting), [puzzle, removed, harvesting]);
  const layout = useMemo(
    () => layoutKernelsWithRowRotations(kernels, columns, rows, rowRotations, TWIST_TUNING, metrics),
    [kernels, columns, rows, rowRotations, metrics],
  );
  const rowGap = metrics.cobHeight / Math.max(1, rows - 1);
  const size = Math.min(TWIST_TUNING.kernelSize, rowGap);

  return (
    <View ref={ref} collapsable={false} style={[styles.frame, { width, height }]}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {layout.visible.map(item => (
          <KernelTile
            key={item.kernel.id}
            layout={item}
            size={size}
            selected={false}
            hinted={false}
            harvesting={harvesting.includes(item.kernel.id)}
            harvestIndex={Math.max(0, harvesting.indexOf(item.kernel.id))}
            harvestTarget={harvestTarget}
            reducedMotion={reducedMotion}
          />
        ))}
      </View>
      <View pointerEvents="none" style={[styles.lane, { left: width / 2 - 1, top: metrics.top - 18, height: metrics.cobHeight + 28 }]}>
        <Text style={styles.laneMark}>↓</Text>
      </View>
      {puzzle.rings.map((_, row) => (
        <TwistRow
          key={`${puzzle.id}-${row}`}
          row={row}
          y={metrics.top + row * rowGap}
          height={rowGap}
          width={width}
          locked={locked}
          onTurn={step => onTurn(row, step)}
          onInteraction={active => {
            if (!active) setDrag({ row: -1, dx: 0 });
            onInteraction(active);
          }}
          onDrag={dx => setDrag({ row, dx })}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  frame: { alignSelf: 'center', position: 'relative', overflow: 'visible' },
  lane: { position: 'absolute', width: 2, backgroundColor: 'rgba(255, 226, 127, 0.55)', borderRadius: 2, zIndex: 8 },
  laneMark: { position: 'absolute', top: -16, left: -11, width: 24, textAlign: 'center', color: '#ffe27f', fontWeight: '900', fontSize: 16 },
  rowHit: { position: 'absolute', left: 0, zIndex: 12 },
  swipe: { position: 'absolute', left: 32, right: 32, top: 0, bottom: 0 },
  arrow: { position: 'absolute', top: 0, bottom: 0, width: 28, alignItems: 'center', justifyContent: 'center', zIndex: 13 },
  arrowLeft: { left: 0 },
  arrowRight: { right: 0 },
  arrowText: { fontSize: 22, color: 'rgba(255, 240, 189, 0.78)', fontWeight: '900' },
});
