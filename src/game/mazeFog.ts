import { MAZE_RENDER } from './maze';
import type { StormPhase } from './mazeStorm';
import { LANTERN_SIGHT_BONUS, type MazeSight } from './mazeVisibility';

export type FogIntensity = 'light' | 'medium' | 'heavy' | 'storm';

export const FOG_PRESETS = {
  light: { density: 0.82, innerScale: 0.48, outerScale: 1.15, warm: 0, texture: 0 },
  medium: { density: 0.9, innerScale: 0.38, outerScale: 1.02, warm: 0, texture: 0 },
  heavy: { density: 0.94, innerScale: 0.32, outerScale: 0.9, warm: 0, texture: 0 },
  storm: { density: 0.96, innerScale: 0.28, outerScale: 0.82, warm: 0, texture: 0 },
} as const;

export function fogIntensityFor(sight: MazeSight, phase: StormPhase): FogIntensity {
  const stormy = phase === 'dark' || phase === 'rain' || phase === 'grace' || phase === 'expired';
  if (sight.mode === 'storm' || (stormy && sight.radius)) return 'storm';
  if (sight.mode === 'evening') return 'light';
  if (sight.mode === 'mist') return (sight.radius ?? 4) >= 5 ? 'medium' : 'heavy';
  return 'medium';
}

export function fogRadiiPx(
  sight: MazeSight,
  intensity: FogIntensity,
  reducedMist = false,
  viewport?: { width: number; height: number },
  lantern = false,
) {
  const tiles = Math.max(3, (sight.radius ?? 5) + (reducedMist ? 3 : 0) + (lantern ? LANTERN_SIGHT_BONUS : 0));
  const preset = FOG_PRESETS[intensity];
  let inner = tiles * MAZE_RENDER.tile * preset.innerScale;
  let outer = tiles * MAZE_RENDER.tile * preset.outerScale;
  const short = Math.min(viewport?.width ?? Number.POSITIVE_INFINITY, viewport?.height ?? Number.POSITIVE_INFINITY);
  if (Number.isFinite(short) && short > 1) {
    inner = Math.min(inner, short * 0.22);
    outer = Math.min(outer, short * 0.48);
    outer = Math.max(outer, inner + 64);
  }
  return { inner, outer };
}
