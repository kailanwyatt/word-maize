import { MAZE_CAMPAIGN_CONTENT_VERSION, MAZE_CHAPTER_META, type MazeCampaignTarget } from '../data/mazeCatalog';
import { cellKey, floodFillPaths, parseMazeAscii, type MazeCell, type MazeLandmark, type MazePuzzle } from './maze';
import { carveCampaignTopology } from './mazeBoards';

export type MazeLesson = 'explore' | 'branches' | 'return' | 'loops' | 'duplicates' | 'plan';
export type MazeLevel = MazePuzzle & {
  order: number;
  lesson: MazeLesson;
  objective: string;
  tip: string;
  displayAnswer: string;
  contentVersion: string;
  topology: string;
  landmarks: MazeLandmark[];
  playable: boolean;
};

export const MAZE_CHAPTERS = MAZE_CHAPTER_META.map(chapter => ({
  ...chapter,
  playable: true,
}));

export const LEGACY_MAZE_IDS = [
  'sunny-acres-corn', 'sunny-hen', 'sunny-gate', 'sunny-apple', 'sunny-sheep',
  'green-plant', 'green-banana', 'green-carrot', 'green-harvest', 'green-sunflower',
] as const;

export const INSERTED_SUNNY_IDS = [
  'maze-06-barn', 'maze-07-seed', 'maze-08-wheat', 'maze-09-tractor', 'maze-10-farmer',
] as const;

export const LEGACY_GREEN_IDS = [
  'green-plant', 'green-banana', 'green-carrot', 'green-harvest', 'green-sunflower',
] as const;

const layouts = {
  fork: ['###########', '#####.#####', '#####.#####', '#.........#', '#.###.###.#', '#.###S###.#', '#.###.###.#', '#.........#', '#####.#####', '#####.#####', '###########'],
  loop: ['#############', '#...........#', '#.###.#####.#', '#.###.#####.#', '#.###.....#.#', '#.#######.#.#', '#.....S...#.#', '#.###.#####.#', '#.###.#####.#', '#...........#', '#############'],
  branches: ['###############', '#.............#', '#.###.###.###.#', '#.#...#...#...#', '#.#.###.###.#.#', '#...........#.#', '###.###S###.#.#', '#...#.......#.#', '#.###.###.###.#', '#.............#', '###############'],
};

/** Shortest distances on paths, measured in logical tiles rather than sprite pixels. */
export function mazeDistances(puzzle: MazePuzzle, origin: MazeCell, mowedKeys: readonly string[] = []) {
  const distances = new Map<string, number>([[cellKey(origin), 0]]);
  const queue = [origin];
  const mowed = new Set(mowedKeys);
  for (let i = 0; i < queue.length; i++) {
    const cell = queue[i];
    for (const [dc, dr] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const next = { col: cell.col + dc, row: cell.row + dr };
      const key = cellKey(next);
      const walkable = puzzle.terrain[next.row]?.[next.col] === 'path' || mowed.has(key);
      if (!walkable || distances.has(key)) continue;
      distances.set(key, distances.get(cellKey(cell))! + 1); queue.push(next);
    }
  }
  return distances;
}

/** Seeded tie-breaking keeps placements stable across restarts and devices. */
function rank(seed: string, cell: MazeCell) {
  let hash = 2166136261;
  for (const char of `${seed}:${cellKey(cell)}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}
export function buildMazeLevel(config: {
  id: string; order: number; chapter: number; title: string; answer: string; clue: string;
  layout: keyof typeof layouts; decoys: string; extraCopies?: string; revealDurationMs: number;
  lesson: MazeLesson; objective: string; tip: string;
}): MazeLevel {
  const base = parseMazeAscii({ ...config, seed: `${config.id}-v1`, ascii: layouts[config.layout].join('\n') });
  const reachable = floodFillPaths(base, base.spawn);
  const distances = mazeDistances(base, base.spawn);
  const candidates: { wall: MazeCell; inspect: MazeCell }[] = [];
  for (let row = 1; row < base.rows - 1; row++) for (let col = 1; col < base.cols - 1; col++) {
    if (base.terrain[row][col] !== 'wall') continue;
    const inspect = [[0,-1],[1,0],[0,1],[-1,0]].map(([dc,dr]) => ({col:col+dc,row:row+dr})).find(cell => reachable.has(cellKey(cell)));
    if (inspect) candidates.push({ wall: { col, row }, inspect });
  }
  const letters = [...config.answer, ...(config.extraCopies ?? ''), ...config.decoys];
  const selected: typeof candidates = [];
  // Spread plants along walkable routes instead of scattering by screen distance.
  for (let i = 0; i < letters.length; i++) {
    const eligible = candidates.filter(c => !selected.some(s => cellKey(s.wall) === cellKey(c.wall) || cellKey(s.inspect) === cellKey(c.inspect)));
    const priorDistances = selected.map(s => mazeDistances(base, s.inspect));
    eligible.sort((a, b) => {
      const score = (candidate: typeof a) => {
        const distance = distances.get(cellKey(candidate.inspect))!;
        if (i === 0) return config.lesson === 'return' ? distance : -distance;
        if (i === 1 && config.lesson === 'return') return -distance;
        return Math.min(...priorDistances.map(d => d.get(cellKey(candidate.inspect))!));
      };
      return score(b) - score(a) || rank(base.seed, a.wall) - rank(base.seed, b.wall);
    });
    if (!eligible.length) throw new Error(`${config.id}: insufficient distinct inspection sites`);
    selected.push(eligible[0]);
  }
  return { ...base, order: config.order, lesson: config.lesson, objective: config.objective, tip: config.tip,
    displayAnswer: config.answer, contentVersion: MAZE_CAMPAIGN_CONTENT_VERSION, topology: config.layout, landmarks: [], playable: true,
    cobs: letters.map((letter, i) => ({ id: `${config.id}-cob-${i}`, letter, ...selected[i] })) };
}

export function lessonForTarget(target: MazeCampaignTarget): MazeLesson {
  const text = target.lesson.toLowerCase();
  if (text.includes('return') || text.includes('near home') || text.includes('near the start')) return 'return';
  if (text.includes('loop')) return 'loops';
  if (text.includes('branch')) return 'branches';
  if (text.includes('duplicate') || text.includes('repeated') || text.includes('interchangeable') || text.includes('copies')) return 'duplicates';
  if (text.includes('plan') || text.includes('review') || text.includes('compare')) return 'plan';
  return 'explore';
}

export function materializeCampaignLevel(target: MazeCampaignTarget): MazeLevel {
  const lesson = lessonForTarget(target);
  const { ascii, landmarks } = carveCampaignTopology(target.width, target.height, target.topology);
  const generated = parseMazeAscii({
    id: target.id,
    seed: `${target.id}-${MAZE_CAMPAIGN_CONTENT_VERSION}`,
    chapter: target.chapter,
    title: target.title,
    answer: target.normalizedAnswer,
    clue: target.clue,
    presentationMode: target.presentation === 'shown' ? 'shown' : target.presentation,
    ascii,
    revealDurationMs: Math.round(target.revealSeconds * 1000),
  });
  return attachInventory({
    ...generated,
    givenMask: target.givenMask,
    visibility: target.visibility,
    wildlife: target.wildlife,
    stormSeconds: target.stormSeconds,
    wildlifeIntro: target.chapter === 5 && [1, 3, 5].includes(target.chapterLevel),
  }, target, landmarks, lesson);
}

function attachInventory(base: MazePuzzle, target: MazeCampaignTarget, landmarks: MazeLandmark[], lesson: MazeLesson): MazeLevel {
  const withPaths = { ...base, landmarks, seed: `${target.id}-${MAZE_CAMPAIGN_CONTENT_VERSION}` };
  const letters = [...target.normalizedAnswer, ...target.extraLetters, ...target.decoyLetters];
  const reachable = floodFillPaths(withPaths, withPaths.spawn);
  const distances = mazeDistances(withPaths, withPaths.spawn);
  const candidates: { wall: MazeCell; inspect: MazeCell }[] = [];
  for (let row = 1; row < withPaths.rows - 1; row += 1) for (let col = 1; col < withPaths.cols - 1; col += 1) {
    if (withPaths.terrain[row][col] !== 'wall') continue;
    const inspect = [[0, -1], [1, 0], [0, 1], [-1, 0]].map(([dc, dr]) => ({ col: col + dc, row: row + dr })).find(cell => reachable.has(cellKey(cell)));
    if (inspect) candidates.push({ wall: { col, row }, inspect });
  }
  const selected: typeof candidates = [];
  for (let i = 0; i < letters.length; i += 1) {
    const eligible = candidates.filter(c => !selected.some(s => cellKey(s.wall) === cellKey(c.wall) || cellKey(s.inspect) === cellKey(c.inspect)));
    const priorDistances = selected.map(s => mazeDistances(withPaths, s.inspect));
    eligible.sort((a, b) => {
      const score = (candidate: typeof a) => {
        const distance = distances.get(cellKey(candidate.inspect)) ?? 0;
        if (i === 0) return lesson === 'return' || target.number >= 6 ? distance : -distance;
        if (i === 1 && lesson === 'return') return -distance;
        return Math.min(...priorDistances.map(d => d.get(cellKey(candidate.inspect)) ?? 99));
      };
      return score(b) - score(a) || rank(withPaths.seed, a.wall) - rank(withPaths.seed, b.wall);
    });
    if (!eligible.length) throw new Error(`${target.id}: insufficient distinct inspection sites`);
    selected.push(eligible[0]);
  }
  const reservedHosts = eligibleRemaining(candidates, selected).slice(0, 16).map(item => item.wall);
  return {
    ...withPaths,
    order: target.number,
    lesson,
    objective: target.lesson,
    tip: target.clue,
    displayAnswer: target.answer,
    contentVersion: MAZE_CAMPAIGN_CONTENT_VERSION,
    topology: target.topology,
    landmarks,
    reservedHosts,
    playable: true,
    cobs: letters.map((letter, i) => ({ id: `${target.id}-cob-${i}`, letter, ...selected[i] })),
  };
}

function eligibleRemaining(candidates: { wall: MazeCell; inspect: MazeCell }[], selected: { wall: MazeCell; inspect: MazeCell }[]) {
  return candidates.filter(c => !selected.some(s => cellKey(s.wall) === cellKey(c.wall) || cellKey(s.inspect) === cellKey(c.inspect)));
}
export function migrateMazeUnlocks(rewardedIds: string[], storedUnlocked: string[] = [], playableIds: string[]) {
  const unlocked = new Set<string>([playableIds[0], ...storedUnlocked.filter(id => playableIds.includes(id))]);
  for (let i = 0; i < LEGACY_MAZE_IDS.length; i += 1) {
    const id = LEGACY_MAZE_IDS[i];
    if (i === 0 || rewardedIds.includes(id) || rewardedIds.includes(LEGACY_MAZE_IDS[i - 1])) unlocked.add(id);
  }
  if (LEGACY_GREEN_IDS.some(id => unlocked.has(id) || rewardedIds.includes(id))) {
    INSERTED_SUNNY_IDS.forEach(id => unlocked.add(id));
  }
  playableIds.forEach((id, index) => {
    if (rewardedIds.includes(id)) {
      unlocked.add(id);
      if (playableIds[index + 1]) unlocked.add(playableIds[index + 1]);
    }
  });
  return playableIds.filter(id => unlocked.has(id));
}

export function isMazeLevelUnlocked(levels: MazeLevel[], id: string, completedIds: string[], unlockedIds: string[] = [], devUnlock = false) {
  if (devUnlock || unlockedIds.includes(id) || completedIds.includes(id)) return true;
  const index = levels.findIndex(level => level.id === id);
  return index >= 0 && (index === 0 || completedIds.includes(levels[index - 1].id));
}

export function nextMazeLevel(levels: MazeLevel[], completedIds: string[], unlockedIds: string[] = []) {
  return levels.find(level => isMazeLevelUnlocked(levels, level.id, completedIds, unlockedIds) && !completedIds.includes(level.id))
    ?? levels.find(level => !completedIds.includes(level.id))
    ?? levels[levels.length - 1];
}

export function continueMazeLevel(levels: MazeLevel[], completedIds: string[], unlockedIds: string[] = [], runs: Record<string, { completed?: boolean }> = {}) {
  const playable = levels.filter(level => level.playable);
  const unfinished = playable.find(level => isMazeLevelUnlocked(playable, level.id, completedIds, unlockedIds) && runs[level.id] && !runs[level.id].completed && !completedIds.includes(level.id));
  if (unfinished) return unfinished;
  return nextMazeLevel(playable, completedIds, unlockedIds);
}

export function maizeHomeQuote(level: { displayAnswer?: string; title: string; tip: string }, cleared: number) {
  if (cleared <= 0) return 'Walk the rows, face a plant to peek its letter, and harvest the word in spelling order. Wrong plants cost nothing.';
  if (cleared >= 80) return 'The valley’s maize is harvested. Free Play keeps the fields open, and the Fair has more word games.';
  return `${level.displayAnswer ?? level.title} is waiting. ${level.tip}`;
}

export { isFreePlayUnlocked } from './mazeFreePlay';

export function unlockAfterMazeComplete(playableIds: string[], unlockedIds: string[], completedId: string) {
  const next = playableIds[playableIds.indexOf(completedId) + 1];
  return [...new Set([...unlockedIds, completedId, ...(next ? [next] : [])])];
}
