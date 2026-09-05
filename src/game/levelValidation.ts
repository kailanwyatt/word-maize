import { WORD_LIST } from './dictionary';
import { Level } from './types';

export type LevelValidationIssue = { levelId: number; message: string };

function letterCounts(level: Level) {
  const counts = new Map<string, number>();
  level.kernels.filter(kernel => kernel.layer === 0).forEach(kernel => {
    counts.set(kernel.letter, (counts.get(kernel.letter) ?? 0) + 1);
  });
  return counts;
}

function canSpell(word: string, available: Map<string, number>) {
  const used = new Map<string, number>();
  for (const letter of word) {
    const next = (used.get(letter) ?? 0) + 1;
    if (next > (available.get(letter) ?? 0)) return false;
    used.set(letter, next);
  }
  return true;
}

export function validateLevels(levels: Level[], dictionary: Set<string> = WORD_LIST): LevelValidationIssue[] {
  const issues: LevelValidationIssue[] = [];
  const ids = new Set<number>();

  levels.forEach(level => {
    const add = (message: string) => issues.push({ levelId: level.id, message });
    if (ids.has(level.id)) add('Level id is duplicated.');
    ids.add(level.id);
    if (level.rows < 1 || level.columns < 3) add('Board dimensions are invalid.');
    if (level.targetHarvestPercent < 1 || level.targetHarvestPercent > 100) add('Harvest target must be between 1 and 100.');
    if (level.objective.harvestPercent !== level.targetHarvestPercent) add('Objective and display harvest targets differ.');
    if (level.starGoals.length !== 2) add('Exactly two optional star goals are required.');
    if (!level.rewardCoins || level.rewardCoins < 1) add('A positive completion reward is required.');
    if (level.kernels.some(kernel => kernel.row >= level.rows || kernel.column >= level.columns)) add('A kernel lies outside the board.');
    const kernelIds = new Set(level.kernels.map(kernel => kernel.id));
    level.obstacles.forEach(obstacle => {
      if (!kernelIds.has(obstacle.kernelId)) add(`Obstacle ${obstacle.id} targets a missing kernel.`);
      if (obstacle.countdown < 0) add(`Obstacle ${obstacle.id} has an invalid countdown.`);
    });

    const available = letterCounts(level);
    level.guaranteedWords.forEach(rawWord => {
      const word = rawWord.toUpperCase();
      if (!dictionary.has(word)) add(`Guaranteed word ${word} is missing from the dictionary.`);
      if (!canSpell(word, available)) add(`The authored board cannot spell guaranteed word ${word}.`);
    });

    const layeredPositions = new Set(level.kernels.filter(kernel => kernel.layer > 0).map(kernel => `${kernel.row}:${kernel.column}`)).size;
    if ((level.objective.minLayersRevealed ?? 0) > layeredPositions) {
      add('The layer objective exceeds the number of layered positions.');
    }
    level.starGoals.forEach(goal => {
      if (goal.kind === 'layersRevealed' && goal.value > layeredPositions) add(`Star goal ${goal.id} exceeds available layers.`);
    });
  });

  return issues;
}

export function assertValidLevels(levels: Level[], dictionary: Set<string> = WORD_LIST) {
  const issues = validateLevels(levels, dictionary);
  if (issues.length) {
    throw new Error(issues.map(issue => `Level ${issue.levelId}: ${issue.message}`).join('\n'));
  }
}
