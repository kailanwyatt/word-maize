import { useCallback, useRef, useState } from 'react';
import { Kernel } from '../game/types';
import { selectionWord, tapKernel, TapAttempt, TapResult } from '../game/selection';

export function useKernelTapSelection(columns: number, locked: boolean) {
  const [path, setPath] = useState<Kernel[]>([]);
  const [rejectedId, setRejectedId] = useState<string>();
  const pathRef = useRef<Kernel[]>([]);
  const rejectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  pathRef.current = path;

  const applyTap = useCallback((attempt: TapAttempt): TapResult => {
    const result = tapKernel(pathRef.current, attempt, columns, { locked });
    pathRef.current = result.path;
    setPath(result.path);
    if (!result.accepted) {
      setRejectedId(attempt.kernel.id);
      if (rejectTimer.current) clearTimeout(rejectTimer.current);
      rejectTimer.current = setTimeout(() => setRejectedId(undefined), 180);
    }
    return result;
  }, [columns, locked]);

  const clear = useCallback(() => {
    pathRef.current = [];
    setPath([]);
    setRejectedId(undefined);
  }, []);

  return {
    path,
    pathRef,
    word: selectionWord(path),
    rejectedId,
    applyTap,
    clear,
    setPath: (next: Kernel[]) => {
      pathRef.current = next;
      setPath(next);
    },
  };
}
