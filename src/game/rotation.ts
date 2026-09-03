export const wrapColumn = (column: number, columns: number) => ((column % columns) + columns) % columns;
export const wrapOffset = (offset: number, columns: number) => ((offset % columns) + columns) % columns;
export const snapRotation = (offset: number, strength = 1) => offset + (Math.round(offset) - offset) * Math.max(0, Math.min(1, strength));
export function signedColumnOffset(column: number, rotation: number, columns: number) {
  let value = wrapOffset(column - rotation, columns);
  if (value > columns / 2) value -= columns;
  return value;
}
