import { useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { positionKey } from '../../game/board';
import { Kernel, Tuning } from '../../game/types';
import { KernelTile } from './Kernel';
import { cobMetrics, hitKernel, layoutKernels } from './layout';
import { TapGestureArbitrator } from './TapGestureArbitrator';

type Props = {
  kernels: Kernel[];
  columns: number;
  rows: number;
  rotation: number;
  tuning: Tuning;
  selected: Kernel[];
  hints: string[];
  harvestingIds?: string[];
  pickerMode: boolean;
  butterHints?: boolean;
  rejectedId?: string;
  faulted?: boolean;
  locked?: boolean;
  reducedMotion?: boolean;
  onKernelTap: (kernel: Kernel) => void;
  onPick: (kernel: Kernel) => void;
  onRotateStart: () => void;
  onRotateMove: (dx: number) => void;
  onRotateEnd: () => void;
  width?: number;
  height?: number;
};

export function CornCob(props: Props) {
  const width = props.width ?? 360;
  const height = props.height ?? 520;
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
    <TapGestureArbitrator
      style={[styles.frame, { width, height }]}
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
          harvestTarget={{ x: 42, y: height - 42 }}
          faulted={props.faulted && selectedIds.has(item.kernel.id)}
          rejected={props.rejectedId === item.kernel.id}
          reducedMotion={props.reducedMotion}
          onPress={() => handlePress(item.kernel)}
        />
      ))}
    </TapGestureArbitrator>
  );
}

const styles = StyleSheet.create({
  frame: { alignSelf: 'center', position: 'relative' },
});
