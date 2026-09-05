import { useCallback, useEffect, useRef, useState } from 'react';
import { finishRotation, rotationFromDrag, stepRotation, wrapOffset } from '../game/rotation';

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

export function useCobRotation(initial: number, columns: number, sensitivity: number, snap: number, reducedMotion = false) {
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
    if (reducedMotion) {
      commit(target, true);
      return;
    }
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
  }, [cancelMotion, commit, reducedMotion]);

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

  const end = useCallback((velocityX = 0) => {
    if (pending.current !== undefined) commit(pending.current);
    pending.current = undefined;
    if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    frame.current = undefined;
    let velocity = -velocityX * sensitivity;
    let previous = Date.now();
    const coast = () => {
      const now = Date.now();
      const dt = Math.min((now - previous) / 1000, 0.032);
      previous = now;
      commit(rotationRef.current + velocity * dt);
      velocity *= Math.exp(-6.2 * dt);
      if (Math.abs(velocity) < 0.22) {
        animateTo(finishRotation(rotationRef.current, columns, snap), 300);
        return;
      }
      frame.current = requestAnimationFrame(coast);
    };
    if (!reducedMotion && Math.abs(velocity) >= 0.22) {
      frame.current = requestAnimationFrame(coast);
      return;
    }
    animateTo(finishRotation(rotationRef.current, columns, snap), 300);
  }, [animateTo, columns, commit, reducedMotion, sensitivity, snap]);

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
