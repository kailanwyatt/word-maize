import { exposedKernels } from './board';
import { Kernel, LevelObstacle, ObstacleKind } from './types';

export type ObstacleStatus = 'active' | 'triggered' | 'cleared';
export type ObstacleState = LevelObstacle & {
  turnsRemaining: number;
  status: ObstacleStatus;
  secondsRemaining?: number;
};

function isTimedKernel(kind: ObstacleKind) {
  return kind === 'caterpillar' || kind === 'rot';
}

export function initializeObstacles(obstacles: LevelObstacle[]): ObstacleState[] {
  return obstacles.map(obstacle => ({
    ...obstacle, status: 'active',
    turnsRemaining: obstacle.kind === 'weed' ? 3 : obstacle.countdown,
    secondsRemaining: isTimedKernel(obstacle.kind) ? obstacle.countdown : undefined,
  }));
}

/** Merge old saves with authored metadata without restarting saved timers. */
export function restoreObstacles(authored: LevelObstacle[], saved?: ObstacleState[]): ObstacleState[] {
  if (!saved) return initializeObstacles(authored);
  return saved.map(state => {
    const source = authored.find(o => o.id === state.id);
    const timed = isTimedKernel(state.kind);
    return { ...source, ...state,
      countdown: timed ? source?.countdown ?? (state.kind === 'rot' ? 30 : 20) : state.countdown,
      anchorIds: state.anchorIds ?? source?.anchorIds,
      strength: state.strength ?? source?.strength,
      secondsRemaining: timed ? state.secondsRemaining ?? source?.countdown ?? (state.kind === 'rot' ? 30 : 20) : undefined,
    };
  });
}

export function releaseWebAnchors(states: ObstacleState[], harvestedIds: string[]): ObstacleState[] {
  return states.map(state => {
    if (state.kind !== 'web' || state.status === 'cleared') return state;
    const anchorIds = (state.anchorIds ?? []).filter(id => !harvestedIds.includes(id));
    return { ...state, anchorIds, status: anchorIds.length ? state.status : 'cleared' };
  });
}

function neighbors(a: Kernel, b: Kernel, columns: number) {
  const distance = Math.abs(a.column - b.column);
  return a.id !== b.id && ((a.row === b.row && (distance === 1 || distance === columns - 1))
    || (a.column === b.column && Math.abs(a.row - b.row) === 1));
}

export function clearHarvestObstacles(states: ObstacleState[], harvestedIds: string[], kernels: Kernel[], columns: number) {
  return releaseWebAnchors(states, harvestedIds).map(state => {
    if (harvestedIds.includes(state.kernelId)) return { ...state, status: 'cleared' as const };
    const target = kernels.find(k => k.id === state.kernelId);
    if (state.kind === 'weed' && target && kernels.some(k => harvestedIds.includes(k.id) && neighbors(target, k, columns))) {
      return { ...state, status: 'cleared' as const };
    }
    return state;
  });
}

export function regrowEatenKernels(kernels: Kernel[]): Kernel[] {
  return kernels.map(k => k.eaten ? { ...k, harvested: false, eaten: false } : k);
}

/** Called only for accepted words; elapsed time is handled separately. */
export function advanceObstacles(
  states: ObstacleState[], harvestedIds: string[],
  context: { kernels: Kernel[]; columns: number; wordIds: string[] } = { kernels: [], columns: 1, wordIds: [] },
): ObstacleState[] {
  const harvested = new Set(harvestedIds);
  const used = new Set(context.wordIds);
  const squirrel = context.wordIds.length >= 5
    ? states.find(s => s.kind === 'squirrel' && s.status !== 'cleared')?.id : undefined;
  const next = clearHarvestObstacles(states, harvestedIds, context.kernels, context.columns).map(state => {
    if (state.status === 'cleared' || harvested.has(state.kernelId)) return { ...state, status: 'cleared' as const };
    if (state.kind === 'frost' && used.has(state.kernelId)) {
      const strength = (state.strength ?? 1) - 1;
      return { ...state, strength, status: strength <= 0 ? 'cleared' as const : 'active' as const };
    }
    if (state.id === squirrel) return { ...state, status: 'cleared' as const };
    if (state.kind === 'web') {
      const anchorIds = (state.anchorIds ?? []).filter(id => !harvested.has(id) && !context.kernels.find(k => k.id === id)?.harvested);
      return { ...state, anchorIds, status: anchorIds.length ? state.status : 'cleared' as const };
    }
    if (state.kind === 'weed') {
      return { ...state, turnsRemaining: Math.max(0, state.turnsRemaining - 1) };
    }
    if (state.kind !== 'crow') return state;
    const turnsRemaining = Math.max(0, state.turnsRemaining - 1);
    if (turnsRemaining > 0) return { ...state, turnsRemaining };
    // The stolen letter returns after two words and the crow leaves.
    return state.status === 'triggered'
      ? { ...state, turnsRemaining: 0, status: 'cleared' as const }
      : { ...state, turnsRemaining: 2, status: 'triggered' as const };
  });
  const exposed = exposedKernels(context.kernels).filter(k => !harvested.has(k.id));
  const occupied = new Set(next.filter(s => s.status !== 'cleared').flatMap(s => [s.kernelId, ...(s.anchorIds ?? [])]));
  // At most two new weeds per level, including weeds that were already cut.
  let growth = next.filter(s => s.id.includes(':growth:')).length;
  for (const state of [...next]) {
    if (state.kind !== 'weed' || state.status === 'cleared' || state.turnsRemaining > 0) continue;
    state.turnsRemaining = 3;
    const target = context.kernels.find(k => k.id === state.kernelId);
    const neighbor = target && exposed.find(k => !occupied.has(k.id) && !k.dormant && neighbors(target, k, context.columns));
    if (!neighbor || growth >= 2) continue;
    growth++;
    next.push({ id: `${state.id}:growth:${growth}`, kind: 'weed', kernelId: neighbor.id, countdown: 3, turnsRemaining: 3, status: 'active' });
    occupied.add(neighbor.id);
  }
  return next;
}

export function frostProtectedIds(states: ObstacleState[]): Set<string> {
  return new Set(states.filter(s => s.kind === 'frost' && s.status !== 'cleared').map(s => s.kernelId));
}

/** Pure clock step. Caterpillars eat (regrowable). Rot falls off for good. */
export function tickCaterpillars(states: ObstacleState[], kernels: Kernel[], seconds: number) {
  const exposed = new Set(exposedKernels(kernels).map(k => k.id));
  const eatenIds: string[] = [];
  const fallenIds: string[] = [];
  const obstacles = states.map(state => {
    if (!isTimedKernel(state.kind) || state.status === 'cleared' || !exposed.has(state.kernelId)) return state;
    const fallback = state.kind === 'rot' ? 30 : 20;
    const secondsRemaining = Math.max(0, (state.secondsRemaining ?? fallback) - Math.max(0, seconds));
    if (secondsRemaining === 0) {
      if (state.kind === 'rot') fallenIds.push(state.kernelId);
      else eatenIds.push(state.kernelId);
    }
    return { ...state, secondsRemaining, status: secondsRemaining === 0 ? 'cleared' as const : 'active' as const };
  });
  return {
    obstacles, eatenIds, fallenIds,
    kernels: kernels.map(k => {
      if (eatenIds.includes(k.id)) return { ...k, harvested: true, eaten: true };
      if (fallenIds.includes(k.id)) return { ...k, harvested: true };
      return k;
    }),
  };
}

export function clearObstacle(states: ObstacleState[], kernelId: string): ObstacleState[] {
  return states.map(state => state.kernelId === kernelId ? { ...state, status: 'cleared' } : state);
}

export function blockedKernelIds(states: ObstacleState[]): Set<string> {
  return new Set(states.filter(state => state.status !== 'cleared' && (
    (state.kind === 'crow' && state.status === 'triggered') || state.kind === 'squirrel' || state.kind === 'weed' || state.kind === 'web'
  )).map(state => state.kernelId));
}

export function obstacleBadge(state: ObstacleState): string {
  if (state.kind === 'caterpillar' || state.kind === 'rot') return `${Math.ceil(state.secondsRemaining ?? (state.kind === 'rot' ? 30 : 20))}s`;
  if (state.kind === 'squirrel') return '5+';
  if (state.kind === 'web') return `${state.anchorIds?.length ?? 0}⚓`;
  if (state.kind === 'frost') return `${state.strength ?? 1}❄`;
  return `${state.turnsRemaining}`;
}

export function obstacleLabel(kind: ObstacleKind) {
  if (kind === 'caterpillar') return 'Caterpillar';
  if (kind === 'crow') return 'Crow';
  if (kind === 'squirrel') return 'Squirrel';
  if (kind === 'web') return 'Spider Web';
  if (kind === 'frost') return 'Frost';
  if (kind === 'rot') return 'Rot';
  return 'Weeds';
}
