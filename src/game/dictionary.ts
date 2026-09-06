import COMMON_WORDS from '../data/commonWords.json';
import { ENGLISH_WORDS } from '../data/englishWords';

export const MIN_WORD_LENGTH = 3;
const EXTRA_WORDS = [
  'MAIZE', 'COB', 'HUSK', 'KERNEL', 'KERNELS', 'COBS', 'EAR', 'SILK', 'STALK', 'HUSKS',
  'SCARECROW', 'BUSHEL', 'HAYSTACK', 'THRESHER', 'BARNYARD', 'FIREFLY',
  'PLANTERS', 'CORNMAZE', 'HAYRIDE', 'WINDROW', 'SILO', 'SILOS',
  'PLOW', 'PLOWS', 'PLANTER', 'ORCHARD', 'PEAR', 'PEACH', 'CROW', 'PUMPKIN',
  'SQUASH', 'CARROT', 'BEES', 'POLLEN', 'CLOVER',
  'WINDMILL', 'CRATE', 'LANTERN', 'CIDER', 'FEATHER', 'BLACKBIRD', 'STRAW',
  'SQUIRREL', 'ACORN', 'STASH', 'FLOCK', 'RIVERBANK', 'WEEDS', 'TANGLE',
  'VINES', 'GRAPE', 'CELLAR', 'DROUGHT', 'CHALLENGE', 'TWILIGHT', 'MOONLIT',
  'MOONLIGHT',
  'BARLEY', 'OAT', 'OATS', 'RYE', 'SPELT', 'MILLET', 'SORGHUM', 'FLAX',
  'GRAINS', 'CROPS', 'CORNFIELD', 'WHEATFIELD', 'FARMLAND', 'PASTURE', 'PASTURES',
  'MEADOW', 'MEADOWS', 'FURROW', 'FURROWS', 'BALE', 'BALES', 'HAYLOFT', 'HAYBALE',
  'HOE', 'HOES', 'RAKE', 'RAKES', 'TROWEL', 'SCYTHE', 'SICKLE', 'TROUGH', 'YOKE',
  'PADDOCK', 'STABLE', 'STABLES', 'COOP', 'HEN', 'HENS', 'CHICK', 'CHICKS', 'ROOSTER',
  'PIG', 'PIGS', 'CALF', 'LAMB', 'LAMBS', 'GOATS', 'DUCK', 'DUCKS', 'GOOSE', 'GEESE',
  'TOMATO', 'POTATO', 'POTATOES', 'ONIONS', 'LETTUCE', 'MELON', 'MELONS', 'BERRY',
  'BERRIES', 'CHERRY', 'PLUM', 'PLUMS', 'GOURD', 'GOURDS', 'TURNIP', 'RADISH',
  'CABBAGE', 'CELERY', 'GARLIC', 'PEPPER', 'PEPPERS', 'SPINACH', 'SPROUT', 'SPROUTS',
  'BLOOM', 'BLOOMS', 'BUD', 'BUDS', 'ROOT', 'ROOTS', 'STEM', 'STEMS', 'LEAF', 'LEAVES',
  'OAK', 'ELM', 'ASH', 'FIR', 'PINE', 'CEDAR', 'MAPLE', 'WILLOW', 'IVY', 'DEW', 'SOD',
  'SWEETCORN', 'CORNCOB', 'EARCORN', 'SHUCK', 'SHUCKS', 'TASSEL', 'TASSELS',
  'POPCORN', 'CORNBREAD', 'HOMINY', 'GRITS',
];
export const WORD_LIST = new Set<string>([...ENGLISH_WORDS, ...COMMON_WORDS, ...EXTRA_WORDS]);

const wordsByLength = new Map<number, string[]>();
WORD_LIST.forEach(word => {
  const bucket = wordsByLength.get(word.length);
  if (bucket) bucket.push(word);
  else wordsByLength.set(word.length, [word]);
});

export function wordsOfLength(length: number, dictionary: Set<string> = WORD_LIST): readonly string[] {
  if (dictionary === WORD_LIST) return wordsByLength.get(length) ?? [];
  return [...dictionary].filter(word => word.length === length);
}

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
