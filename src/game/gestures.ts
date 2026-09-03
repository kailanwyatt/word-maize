export type GestureMode = 'pending' | 'rotate';
export type PointerResolution = 'tap' | 'rotate';

export function classifyMovement(dx: number, _dy: number, threshold: number, current: GestureMode): GestureMode {
  if (current === 'rotate') return 'rotate';
  return Math.abs(dx) >= threshold ? 'rotate' : 'pending';
}

export function resolvePointerRelease(mode: GestureMode, dx: number, threshold: number): PointerResolution {
  if (mode === 'rotate' || Math.abs(dx) >= threshold) return 'rotate';
  return 'tap';
}
