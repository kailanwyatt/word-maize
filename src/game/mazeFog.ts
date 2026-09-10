import { MAZE_RENDER } from './maze';
import type { StormPhase } from './mazeStorm';
import { lanternBrighten, lanternSightBonus, type MazeSight } from './mazeVisibility';

export type FogIntensity = 'light' | 'medium' | 'heavy' | 'storm';

export const FOG_PRESETS = {
  light: { density: 0.76, innerScale: 0.52, outerScale: 1.18, warm: 0, texture: 0 },
  medium: { density: 0.86, innerScale: 0.42, outerScale: 1.06, warm: 0, texture: 0 },
  heavy: { density: 0.9, innerScale: 0.36, outerScale: 0.94, warm: 0, texture: 0 },
  storm: { density: 0.92, innerScale: 0.32, outerScale: 0.86, warm: 0, texture: 0 },
} as const;

export function fogLanternCount(lantern: number | boolean = 0) {
  if (typeof lantern === 'boolean') return lantern ? 1 : 0;
  return Math.max(0, Math.floor(lantern) || 0);
}

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
  lantern: number | boolean = 0,
) {
  const count = fogLanternCount(lantern);
  const brighten = lanternBrighten(count);
  const tiles = Math.max(3, (sight.radius ?? 5) + (reducedMist ? 3 : 0) + lanternSightBonus(count));
  const preset = FOG_PRESETS[intensity];
  let inner = tiles * MAZE_RENDER.tile * preset.innerScale * (1 + brighten);
  let outer = tiles * MAZE_RENDER.tile * preset.outerScale * (1 + brighten);
  const short = Math.min(viewport?.width ?? Number.POSITIVE_INFINITY, viewport?.height ?? Number.POSITIVE_INFINITY);
  const compact = Number.isFinite(short) && short <= 400;
  if (Number.isFinite(short) && short > 1) {
    inner = Math.min(inner, short * (compact ? 0.26 : 0.22) * (1 + brighten));
    outer = Math.min(outer, short * 0.48 * (1 + brighten));
    outer = Math.max(outer, inner + 64);
  }
  return { inner, outer, densityMul: 1 - brighten, compact };
}
