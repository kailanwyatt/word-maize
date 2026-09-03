import { useCallback, useEffect, useRef, useState } from 'react';
import { finishRotation, rotationFromDrag, stepRotation, wrapOffset } from '../game/rotation';

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

export function useCobRotation(initial: number, columns: number, sensitivity: number, snap: number) {
  const [rotation, setRotation] = useState(initial);
  const rotationRef = useRef(initial);
  const dragStart = useRef(initial);
  const frame = useRef<number | undefined>(undefined);
  const pending = useRef<number | undefined>(undefined);

  const cancelMotion = useCallback(() => {
    if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    frame.current = undefined;
    pending.current = undefined;
  }, []);

  const commit = useCallback((value: number, wrap = false) => {
    const next = wrap ? wrapOffset(value, columns) : value;
    rotationRef.current = next;
    setRotation(next);
  }, [columns]);

  const animateTo = useCallback((target: number, duration = 260) => {
    cancelMotion();
    const from = rotationRef.current;
    const started = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - started) / duration);
      commit(from + (target - from) * easeOutCubic(t));
      if (t < 1) {
        frame.current = requestAnimationFrame(tick);
        return;
      }
      commit(target, true);
      frame.current = undefined;
    };
    frame.current = requestAnimationFrame(tick);
  }, [cancelMotion, commit]);

  const begin = useCallback(() => {
    cancelMotion();
    dragStart.current = rotationRef.current;
  }, [cancelMotion]);

  const move = useCallback((dx: number) => {
    pending.current = rotationFromDrag(dragStart.current, dx, sensitivity);
    if (frame.current !== undefined) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = undefined;
      if (pending.current === undefined) return;
      commit(pending.current);
      pending.current = undefined;
    });
  }, [commit, sensitivity]);

  const end = useCallback(() => {
    if (pending.current !== undefined) commit(pending.current);
    pending.current = undefined;
    if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    frame.current = undefined;
    animateTo(finishRotation(rotationRef.current, columns, snap), 280);
  }, [animateTo, columns, commit, snap]);

  const nudge = useCallback((direction: 1 | -1) => {
    cancelMotion();
    animateTo(stepRotation(rotationRef.current, columns, direction), 320);
  }, [animateTo, cancelMotion, columns]);

  const reset = useCallback((value = initial) => {
    cancelMotion();
    dragStart.current = value;
    commit(value);
  }, [cancelMotion, commit, initial]);

  useEffect(() => () => cancelMotion(), [cancelMotion]);

  return { rotation, begin, move, end, nudge, reset };
}
