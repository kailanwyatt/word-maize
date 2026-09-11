import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { CrosswordPuzzle, crosswordCells, crosswordLetter, Placements } from '../../game/cobPuzzles';
import { Kernel, Tuning } from '../../game/types';
import { KernelTile } from './Kernel';
import { cobMetrics, hitKernel, layoutKernels } from './layout';
import { TapGestureArbitrator } from './TapGestureArbitrator';

const CROSSWORD_TUNING: Tuning = {
  kernelSize: 78,
  touchMultiplier: 1.15,
  movementThreshold: 28,
  rotationSensitivity: 0.018,
  rotationSnap: 0.7,
  visibleColumns: 6,
  harvestTarget: 70,
  haptics: false,
};

export type CrosswordCobHandle = {
  hitCell: (pageX: number, pageY: number) => Promise<string | undefined>;
};

function crosswordKernels(puzzle: CrosswordPuzzle, placements: Placements): Kernel[] {
  return crosswordCells(puzzle).map(cell => {
    const [row, column] = cell.id.split(':').map(Number);
    const letter = crosswordLetter(puzzle, placements, cell.id);
    return {
      id: cell.id,
      row,
      column,
      layer: 0,
      letter,
      harvested: !letter,
      variety: 'sweet' as const,
    };
  });
}

export const CrosswordCob = forwardRef<CrosswordCobHandle, {
  puzzle: CrosswordPuzzle;
  placements: Placements;
  rotation: number;
  highlighted: string[];
  lockedCells: string[];
  reducedMotion: boolean;
  locked: boolean;
  width: number;
  height: number;
  onCellPress: (cellId: string) => void;
  onRotateStart: () => void;
  onRotateMove: (dx: number) => void;
  onRotateEnd: (velocityX: number) => void;
}>(function CrosswordCob({
  puzzle, placements, rotation, highlighted, lockedCells, reducedMotion, locked, width, height,
  onCellPress, onRotateStart, onRotateMove, onRotateEnd,
}, ref) {
  const box = useRef<View>(null);
  const rotating = useRef(false);
  const metrics = useMemo(() => cobMetrics(width, height), [width, height]);
  const kernels = useMemo(() => crosswordKernels(puzzle, placements), [puzzle, placements]);
  const layout = useMemo(
    () => layoutKernels(kernels, puzzle.columns, puzzle.rows, rotation, CROSSWORD_TUNING, metrics),
    [kernels, puzzle.columns, puzzle.rows, rotation, metrics],
  );
  const size = Math.min(CROSSWORD_TUNING.kernelSize, metrics.cobHeight / Math.max(1, puzzle.rows - 1));
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const sizeRef = useRef(size);
  sizeRef.current = size;

  useImperativeHandle(ref, () => ({
    hitCell: (pageX, pageY) => new Promise(resolve => {
      if (!box.current) {
        resolve(undefined);
        return;
      }
      box.current.measureInWindow((left, top) => {
        resolve(hitKernel({ x: pageX - left, y: pageY - top }, layoutRef.current.visible, sizeRef.current, CROSSWORD_TUNING.touchMultiplier)?.id);
      });
    }),
  }), []);

  const handlePress = (cellId: string) => {
    if (locked || rotating.current) return;
    onCellPress(cellId);
  };

  return (
    <View ref={box} collapsable={false} style={[styles.frame, { width, height }]}>
      <TapGestureArbitrator
        style={StyleSheet.absoluteFill}
        movementThreshold={CROSSWORD_TUNING.movementThreshold}
        onRotateStart={() => {
          rotating.current = true;
          onRotateStart();
        }}
        onRotateMove={onRotateMove}
        onRotateEnd={velocityX => {
          onRotateEnd(velocityX);
          setTimeout(() => { rotating.current = false; }, 120);
        }}
        onTap={(x, y) => {
          if (locked || rotating.current) return;
          const kernel = hitKernel({ x, y }, layoutRef.current.visible, sizeRef.current, CROSSWORD_TUNING.touchMultiplier);
          if (kernel) handlePress(kernel.id);
        }}
      >
        {layout.visible.map(item => {
          const givenOrLocked = puzzle.givens.includes(item.kernel.id) || lockedCells.includes(item.kernel.id);
          return (
            <KernelTile
              key={item.kernel.id}
              layout={item}
              size={size}
              selected={givenOrLocked}
              hinted={highlighted.includes(item.kernel.id)}
              harvestTarget={{ x: 0, y: 0 }}
              reducedMotion={reducedMotion}
              blocked={givenOrLocked}
              allowPressWhenEmpty={!givenOrLocked}
              onPress={() => handlePress(item.kernel.id)}
            />
          );
        })}
      </TapGestureArbitrator>
    </View>
  );
});

const styles = StyleSheet.create({
  frame: { alignSelf: 'center', position: 'relative', overflow: 'visible' },
});
