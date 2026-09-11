import { describe, expect, it } from 'vitest';
import { cobMetrics, layoutKernels, layoutKernelsWithRowRotations } from '../../components/CornCob/layout';
import { Kernel, Tuning } from '../types';

const tuning: Tuning = {
  kernelSize: 78,
  touchMultiplier: 1,
  movementThreshold: 28,
  rotationSensitivity: 0.018,
  rotationSnap: 0.7,
  visibleColumns: 6,
  harvestTarget: 70,
  haptics: false,
};

function kernel(row: number, column: number): Kernel {
  return { id: `${row}:${column}`, row, column, layer: 0, letter: 'A', harvested: false, variety: 'sweet' };
}

describe('cob kernel layout', () => {
  it('keeps a shared rotation path for classic harvest', () => {
    const metrics = cobMetrics(300, 480);
    const same = layoutKernels([kernel(0, 0), kernel(1, 0)], 12, 7, 2, tuning, metrics);
    expect(same.centers['1:0'].y).toBeGreaterThan(same.centers['0:0'].y);
    expect(Object.keys(same.centers)).toHaveLength(2);
  });

  it('lets twist rings sit on the same cob with independent rotations', () => {
    const metrics = cobMetrics(300, 480);
    const layout = layoutKernelsWithRowRotations([kernel(0, 2), kernel(1, 2)], 12, 7, [2, 4], tuning, metrics);
    expect(layout.centers['0:2'].x).toBeCloseTo(metrics.width / 2, 0);
    expect(layout.centers['1:2'].x).not.toBeCloseTo(layout.centers['0:2'].x, 0);
    expect(layout.centers['1:2'].y).toBeGreaterThan(layout.centers['0:2'].y);
  });

  it('keeps a wrapping crossword word on the same ear as classic harvest', () => {
    const metrics = cobMetrics(300, 480);
    const cells = [kernel(0, 7), kernel(0, 0), kernel(0, 1), kernel(2, 0)];
    const layout = layoutKernels(cells, 8, 5, 0, tuning, metrics);
    expect(layout.centers['0:0'].x).toBeCloseTo(metrics.width / 2, 0);
    expect(layout.centers['0:7'].x).toBeLessThan(layout.centers['0:0'].x);
    expect(layout.centers['0:1'].x).toBeGreaterThan(layout.centers['0:0'].x);
    expect(layout.centers['2:0'].y).toBeGreaterThan(layout.centers['0:0'].y);
  });
});
