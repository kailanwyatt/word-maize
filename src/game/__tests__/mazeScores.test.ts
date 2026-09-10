import { describe, expect, it } from 'vitest';
import {
  bestMazeScore,
  formatMazeScoreTime,
  isBetterMazeScore,
  mazeScoreTotals,
  migrateMazePendingSync,
  migrateMazeScores,
  queueMazeScoreSync,
  recordMazeScore,
  type MazeFieldScore,
} from '../mazeScores';

const field = (over: Partial<MazeFieldScore> = {}): MazeFieldScore => ({
  puzzleId: 'sunny-acres-corn',
  points: 650,
  letters: 400,
  bonus: 250,
  elapsedMs: 40_000,
  unaided: true,
  storm: false,
  coins: 50,
  at: 100,
  ...over,
});

describe('maze scores', () => {
  it('keeps the higher points and uses faster time on a tie', () => {
    expect(isBetterMazeScore(field({ points: 700 }), field())).toBe(true);
    expect(isBetterMazeScore(field({ points: 600 }), field())).toBe(false);
    expect(isBetterMazeScore(field({ elapsedMs: 30_000 }), field())).toBe(true);
    expect(isBetterMazeScore(field({ elapsedMs: 50_000 }), field())).toBe(false);
  });

  it('records a new best and queues it for a later sync', () => {
    const first = recordMazeScore({}, [], field());
    expect(first.recorded).toBe(true);
    expect(bestMazeScore(first.scores, 'sunny-acres-corn')?.points).toBe(650);
    expect(first.pendingSync).toHaveLength(1);
    const slower = recordMazeScore(first.scores, first.pendingSync, field({ points: 650, elapsedMs: 55_000, at: 200 }));
    expect(slower.recorded).toBe(false);
    expect(slower.pendingSync).toHaveLength(1);
    const faster = recordMazeScore(first.scores, first.pendingSync, field({ elapsedMs: 22_000, at: 300 }));
    expect(faster.recorded).toBe(true);
    expect(faster.pendingSync).toEqual([field({ elapsedMs: 22_000, at: 300 })]);
    expect(queueMazeScoreSync(faster.pendingSync, field({ puzzleId: 'sunny-hen', points: 300 }))).toHaveLength(2);
    expect(mazeScoreTotals(faster.scores)).toEqual({ fields: 1, points: 650, coins: 50 });
  });

  it('migrates missing scores and pendingSync to empty collections', () => {
    expect(migrateMazeScores(undefined)).toEqual({});
    expect(migrateMazePendingSync(undefined)).toEqual([]);
    expect(formatMazeScoreTime(12_400)).toBe('12s');
    expect(formatMazeScoreTime(65_000)).toBe('1:05');
  });
});
