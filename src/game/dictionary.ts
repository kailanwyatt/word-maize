import { ENGLISH_WORDS } from '../data/englishWords';

export const MIN_WORD_LENGTH = 3;
const EXTRA_WORDS = [
  'MAIZE', 'COB', 'HUSK', 'KERNEL', 'COBS', 'EAR', 'SILK', 'STALK', 'HUSKS',
  'SCARECROW', 'BUSHEL', 'HAYSTACK', 'THRESHER', 'BARNYARD', 'FIREFLY',
  'PLANTERS', 'CORNMAZE', 'HAYRIDE', 'WINDROW', 'SILO', 'SILOS',
];
export const WORD_LIST = new Set<string>([...ENGLISH_WORDS, ...EXTRA_WORDS]);

let prefixCache: Set<string> | undefined;
export function wordPrefixes(dictionary: Set<string> = WORD_LIST): Set<string> {
  if (dictionary === WORD_LIST && prefixCache) return prefixCache;
  const prefixes = new Set<string>();
  dictionary.forEach(word => {
    for (let i = 1; i < word.length; i++) prefixes.add(word.slice(0, i));
  });
  if (dictionary === WORD_LIST) prefixCache = prefixes;
  return prefixes;
}

export type WordValidation = { valid: true; word: string } | { valid: false; reason: 'too-short' | 'not-found' };

export function validateWord(word: string, dictionary: Set<string> = WORD_LIST): WordValidation {
  const normalized = word.trim().toUpperCase();
  if (normalized.length < MIN_WORD_LENGTH) return { valid: false, reason: 'too-short' };
  return dictionary.has(normalized) ? { valid: true, word: normalized } : { valid: false, reason: 'not-found' };
}
