import { Level } from './types';

export const CHAPTER_TITLES = ['CHAPTER ONE', 'CHAPTER TWO', 'CHAPTER THREE', 'CHAPTER FOUR'] as const;

export function chapterIndexForLevel(id: number) {
  return Math.min(3, Math.max(0, Math.floor((id - 1) / 15)));
}

export function chapterRange(chapterIndex: number) {
  const start = chapterIndex * 15 + 1;
  return { start, end: start + 14 };
}

export function chapterHarvests(completedIds: number[], chapterIndex: number) {
  const { start, end } = chapterRange(chapterIndex);
  const clears = completedIds.filter(id => id >= start && id <= end).length;
  return { clears, total: 15, complete: clears >= 15 };
}

export const CHAPTER_SUMMARIES = [
  'Wake Farmer May’s first farm.',
  'Keep crows off the creek road.',
  'Cut vines and ride the orchard weather.',
  'Light the festival fields at night.',
] as const;

export function isChapterUnlocked(chapterIndex: number, completedIds: number[], devUnlock = false) {
  if (devUnlock || chapterIndex <= 0) return true;
  return completedIds.includes(chapterIndex * 15);
}

export function chapterStarCount(progress: Record<number, { stars?: number }>, chapterIndex: number) {
  const { start, end } = chapterRange(chapterIndex);
  let stars = 0;
  for (let id = start; id <= end; id += 1) stars += progress[id]?.stars ?? 0;
  return stars;
}

export function farmQuote(input: {
  levelId: number;
  world: string;
  chapterComplete: boolean;
  claimableTitle?: string;
}) {
  if (input.claimableTitle) return `${input.claimableTitle} is ready to claim. The valley is waking up!`;
  if (input.levelId === 1) return 'Farmer May’s first crop has gone quiet. Let’s wake it up with a few good words!';
  if (input.chapterComplete) {
    if (input.world === 'Sweet Corn Fields') return 'Sweet Corn Fields is shining again. The wagon is ready for Crow Creek!';
    if (input.world === 'Crow Creek') return 'The creek road is clear. Orchard Hollow is waiting beyond the mill.';
    if (input.world === 'Orchard Hollow') return 'The orchard is restored. Lanterns are already lighting the road to Moonlight Maize.';
    return 'Every farm is shining. The Harvest Festival can finally begin!';
  }
  if (input.world === 'Crow Creek') return `Crows are working the creek. Level ${input.levelId} will keep them off the crop.`;
  if (input.world === 'Orchard Hollow') return `Vines and weather are thick in the orchard. Level ${input.levelId} still needs a careful harvest.`;
  if (input.world === 'Moonlight Maize') return `The festival fields are restless tonight. Level ${input.levelId} is the next lantern on the trail.`;
  return `Level ${input.levelId} is waiting on the cob. One more harvest and the farm keeps waking up.`;
}

export function secondaryObjective(level: Level) {
  if (level.objective.minLayersRevealed) {
    return { value: `${level.objective.minLayersRevealed}`, label: 'HIDDEN LAYERS' };
  }
  if (level.objective.minWords && !level.objective.minLongestWord) {
    return { value: `${level.objective.minWords}`, label: 'WORDS' };
  }
  if (level.objective.minLongestWord) {
    return { value: `${level.objective.minLongestWord}+`, label: 'LETTER WORD' };
  }
  if (level.objective.minWords) {
    return { value: `${level.objective.minWords}`, label: 'WORDS' };
  }
  return { value: '3+', label: 'LETTER WORD' };
}
