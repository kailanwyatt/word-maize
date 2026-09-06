import { LevelObstacle, ObstacleKind } from './types';

export type ObstacleStatus = 'active' | 'triggered' | 'cleared';
export type ObstacleState = LevelObstacle & { turnsRemaining: number; status: ObstacleStatus };

export function initializeObstacles(obstacles: LevelObstacle[]): ObstacleState[] {
  return obstacles.map(obstacle => ({ ...obstacle, turnsRemaining: obstacle.countdown, status: 'active' }));
}

export function advanceObstacles(states: ObstacleState[], harvestedIds: string[]): ObstacleState[] {
  const harvested = new Set(harvestedIds);
  return states.map(state => {
    if (state.status === 'cleared' || harvested.has(state.kernelId)) return { ...state, status: 'cleared' };
    if (state.kind === 'squirrel' || state.kind === 'weed' || state.kind === 'web' || state.kind === 'frost' || state.status === 'triggered') return state;
    const turnsRemaining = Math.max(0, state.turnsRemaining - 1);
    return { ...state, turnsRemaining, status: turnsRemaining === 0 ? 'triggered' : 'active' };
  });
}

export function clearObstacle(states: ObstacleState[], kernelId: string): ObstacleState[] {
  return states.map(state => state.kernelId === kernelId ? { ...state, status: 'cleared' } : state);
}

export function blockedKernelIds(states: ObstacleState[]): Set<string> {
  return new Set(states.filter(state => state.status !== 'cleared' && (
    state.status === 'triggered' || state.kind === 'squirrel' || state.kind === 'weed' || state.kind === 'web'
  )).map(state => state.kernelId));
}

export function obstacleLabel(kind: ObstacleKind) {
  if (kind === 'caterpillar') return 'Caterpillar';
  if (kind === 'crow') return 'Crow';
  if (kind === 'squirrel') return 'Squirrel';
  if (kind === 'web') return 'Spider Web';
  if (kind === 'frost') return 'Frost';
  return 'Weeds';
}
