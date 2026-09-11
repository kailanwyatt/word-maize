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

export const FIELD_WALK_SLOP = 12;
export const FIELD_TAP_SLOP = 18;
export const FIELD_TAP_MS = 280;
export const FIELD_DOUBLE_MS = 280;
export const FIELD_DOUBLE_DIST = 28;
export const FIELD_STICK_MAX = 48;

export function fieldWalkStick(dx: number, dy: number, max = FIELD_STICK_MAX) {
  const length = Math.hypot(dx, dy) || 1;
  if (length < FIELD_WALK_SLOP) return { x: 0, y: 0 };
  const scale = Math.min(1, max / length);
  const x = (dx * scale) / max;
  const y = (dy * scale) / max;
  if (Math.hypot(x, y) < 0.16) return { x: 0, y: 0 };
  return { x, y };
}

export function fieldPointerRelease(dx: number, dy: number, durationMs: number): 'walk' | 'tap' {
  if (Math.hypot(dx, dy) >= FIELD_TAP_SLOP || durationMs > FIELD_TAP_MS) return 'walk';
  return 'tap';
}

export function fieldDoubleTap(
  x: number,
  y: number,
  now: number,
  last: { x: number; y: number; at: number } | null,
) {
  if (!last) return false;
  return now - last.at <= FIELD_DOUBLE_MS && Math.hypot(x - last.x, y - last.y) <= FIELD_DOUBLE_DIST;
}
