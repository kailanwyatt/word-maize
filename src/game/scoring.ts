export function coinsForWord(word: string): number {
  const length = word.trim().length;
  if (length < 3) return 0;
  return length * 10 + Math.max(0, length - 4) * 8;
}

export function completionBonus(percent: number, target: number): number {
  return 80 + Math.max(0, percent - target) * 4;
}

export function starsForLevel(percent: number, target: number, wordsFound: number): 0 | 1 | 2 | 3 {
  if (percent < target) return 0;
  if (percent >= Math.min(100, target + 20) || wordsFound >= 12) return 3;
  if (percent >= target + 10 || wordsFound >= 8) return 2;
  return 1;
}

export function totalStars(progress: Record<number, { stars: number }>): number {
  return Object.values(progress).reduce((sum, entry) => sum + entry.stars, 0);
}
