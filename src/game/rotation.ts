export const wrapColumn = (column: number, columns: number) => ((column % columns) + columns) % columns;
export const wrapOffset = (offset: number, columns: number) => ((offset % columns) + columns) % columns;
export const snapRotation = (offset: number, strength = 1) => offset + (Math.round(offset) - offset) * Math.max(0, Math.min(1, strength));
export const degreesPerColumn = (columns: number) => 360 / Math.max(1, columns);

export function signedColumnOffset(column: number, rotation: number, columns: number) {
  let value = wrapOffset(column - rotation, columns);
  if (value > columns / 2) value -= columns;
  return value;
}

export function rotationFromDrag(start: number, dx: number, sensitivity: number) {
  return start + dx * sensitivity;
}

export function nearestRotationTarget(from: number, wrappedTarget: number, columns: number) {
  const snapped = wrapOffset(wrappedTarget, columns);
  const turns = Math.round((from - snapped) / columns);
  return snapped + turns * columns;
}

export function finishRotation(offset: number, columns: number, snap = 1) {
  return nearestRotationTarget(offset, wrapOffset(snapRotation(offset, snap), columns), columns);
}

export function stepRotation(offset: number, columns: number, direction: 1 | -1) {
  return offset + direction;
}
