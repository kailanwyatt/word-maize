import { describe, expect, it } from 'vitest';
import { MAZE_PUZZLES } from '../../data/mazeLevels';
import { createMazeRun } from '../maze';
import { fogIntensityFor, fogRadiiPx } from '../mazeFog';
import { fogVeil, parseMazeVisibility, tileVisible } from '../mazeVisibility';

const mist = MAZE_PUZZLES.find(level => level.id === 'maze-61-mist')!;

describe('maze fog presentation', () => {
  it('maps visibility tags onto fog intensity without changing storm rules', () => {
    expect(fogIntensityFor({ mode: 'evening', radius: 6 }, 'clear')).toBe('light');
    expect(fogIntensityFor({ mode: 'mist', radius: 5 }, 'clear')).toBe('medium');
    expect(fogIntensityFor({ mode: 'mist', radius: 4 }, 'clear')).toBe('heavy');
    expect(fogIntensityFor({ mode: 'storm', radius: 5 }, 'rain')).toBe('storm');
    expect(fogRadiiPx({ mode: 'mist', radius: 5 }, 'medium').outer).toBeGreaterThan(fogRadiiPx({ mode: 'mist', radius: 4 }, 'heavy').inner);
    const phone = fogRadiiPx({ mode: 'mist', radius: 4 }, 'heavy', false, { width: 360, height: 640 });
    expect(phone.outer).toBeLessThan(180);
    expect(phone.inner).toBeLessThan(phone.outer - 48);
    expect(phone.compact).toBe(true);
    expect(fogRadiiPx({ mode: 'mist', radius: 4 }, 'heavy', false, { width: 900, height: 700 }).compact).toBe(false);
    const lamp1 = fogRadiiPx({ mode: 'mist', radius: 4 }, 'heavy', false, { width: 360, height: 640 }, 1);
    const lamp2 = fogRadiiPx({ mode: 'mist', radius: 4 }, 'heavy', false, { width: 360, height: 640 }, 2);
    expect(lamp1.inner).toBeGreaterThan(phone.inner);
    expect(lamp2.inner).toBeGreaterThan(lamp1.inner);
    expect(lamp2.densityMul).toBeLessThan(lamp1.densityMul);
    expect(lamp1.densityMul).toBeCloseTo(0.75);
  });

  it('keeps unexplored mist tiles hidden to gameplay while veiling them for silhouettes', () => {
    expect(parseMazeVisibility(mist.visibility).mode).toBe('mist');
    const run = createMazeRun(mist);
    const far = { col: mist.cols - 2, row: 1 };
    expect(Math.hypot(run.player.x - (far.col + 0.5), run.player.y - (far.row + 0.5))).toBeGreaterThan(6);
    expect(tileVisible(mist, run, mist.spawn.col, mist.spawn.row)).toBe(true);
    expect(tileVisible(mist, run, far.col, far.row)).toBe(false);
    expect(fogVeil(mist, run, mist.spawn.col, mist.spawn.row)).toBe(1);
    expect(fogVeil(mist, run, far.col, far.row)).toBeLessThan(0.4);
  });
});
