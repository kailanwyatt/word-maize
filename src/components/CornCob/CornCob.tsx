import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { exposedKernels } from '../../game/board';
import { Kernel, Tuning } from '../../game/types';
import { KernelTile } from './Kernel';
import { cobMetrics, layoutKernels } from './layout';

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
  onKernelTap: (kernel: Kernel) => void;
  onPick: (kernel: Kernel) => void;
  onRotation: (value: number) => void;
  width?: number;
  height?: number;
};

export function CornCob(props: Props) {
  const width = props.width ?? 360;
  const height = props.height ?? 520;
  const metrics = cobMetrics(width, height);
  const available = useMemo(() => exposedKernels(props.kernels), [props.kernels]);
  const layout = useMemo(
    () => layoutKernels(available, props.columns, props.rows, props.rotation, props.tuning, metrics),
    [available, props.columns, props.rows, props.rotation, props.tuning, metrics.width, metrics.height],
  );

  const selectedIds = new Set(props.selected.map(k => k.id));
  const hintIds = new Set(props.hints);
  const harvestingIds = new Set(props.harvestingIds ?? []);
  const size = props.tuning.kernelSize;

  return (
    <View style={[styles.frame, { width, height }]}>

      {layout.visible.map(item => (
        <KernelTile
          key={item.kernel.id}
          layout={item}
          size={size}
          selected={selectedIds.has(item.kernel.id)}
          hinted={hintIds.has(item.kernel.id)}
          harvesting={harvestingIds.has(item.kernel.id)}
          onPress={() => props.pickerMode ? props.onPick(item.kernel) : props.onKernelTap(item.kernel)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { alignSelf: 'center' },
});
