import { resetLevel } from './board';
import { CornVariety, Level, StarGoal } from './types';

const ENDLESS_VARIETY_ORDER: CornVariety[] = ['sweet', 'white', 'flint', 'popcorn', 'blue', 'golden'];

function seedNumber(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function seededRandom(seed: string) {
  let state = seedNumber(seed) || 1;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function endlessDifficulty(stage: number) {
  const safeStage = Math.max(1, Math.floor(stage));
  return {
    harvestPercent: Math.min(86, 58 + Math.floor((safeStage - 1) / 3) * 2),
    minimumLongestWord: Math.min(8, 4 + Math.floor((safeStage - 1) / 6)),
    rewardCoins: 110 + safeStage * 12,
  };
}

export function generateEndlessLevel(seed: string, stage: number, templates: Level[]): Level {
  if (!templates.length) throw new Error('Endless Harvest requires at least one validated template.');
  const safeStage = Math.max(1, Math.floor(stage));
  const variety = ENDLESS_VARIETY_ORDER[(safeStage - 1) % ENDLESS_VARIETY_ORDER.length];
  const candidates = templates.filter(level => level.cornType === variety);
  const pool = candidates.length ? candidates : templates;
  const rng = seededRandom(`${seed}:${safeStage}:${variety}`);
  const source = pool[Math.floor(rng() * pool.length)];
  const difficulty = endlessDifficulty(safeStage);
  const longestGuaranteed = Math.max(3, ...source.guaranteedWords.map(word => word.length));
  const longestTarget = Math.min(difficulty.minimumLongestWord, longestGuaranteed);
  const starGoals: [StarGoal, StarGoal] = [
    { id: `endless-long-${longestTarget}`, kind: 'longestWord', value: longestTarget, label: `Find a ${longestTarget}-letter word` },
    { id: 'endless-no-tools', kind: 'noTools', label: 'Finish without a tool' },
  ];
  const cloned: Level = {
    ...source,
    id: 10_000 + safeStage,
    name: `Endless Cob ${safeStage}`,
    world: 'Endless Harvest',
    targetHarvestPercent: difficulty.harvestPercent,
    objective: { harvestPercent: difficulty.harvestPercent, minLongestWord: longestTarget },
    starGoals,
    rewardCoins: difficulty.rewardCoins,
    story: safeStage === 1
      ? { speaker: 'Patch', title: 'Endless Harvest', text: 'The festival fields keep growing. Let’s see how long this harvest can last!' }
      : undefined,
    tutorial: safeStage === 1 ? ['Each cob is generated from a validated farm pattern. Difficulty rises every three completed cobs.'] : [],
    shuffleOnStart: true,
    kernels: source.kernels.map(kernel => ({ ...kernel, harvested: false, cracked: false, popCharge: 0 })),
    obstacles: source.obstacles.map(obstacle => ({ ...obstacle, id: `endless-${safeStage}-${obstacle.id}` })),
    hintPaths: source.hintPaths.map(path => [...path]),
    guaranteedWords: [...source.guaranteedWords],
  };
  return resetLevel(cloned, rng);
}
