import { kernelsFromRows, pathIds, underKernels } from '../game/board';
import { CornVariety, Level, StarGoal } from '../game/types';

const LEVEL_NAMES = [
  'The First Field',
  'Barnyard Words',
  'Golden Grain',
  'Turn the Cob',
  'Orchard Road',
  'Creek Crossing',
  'Hidden Kernels',
  'Garden Layers',
  'Honey Harvest',
  'Bumper Crop',
  'Millstone Morning', 'Market Day', 'Lantern Rows', 'Autumn Maze', 'First Farm Restored',
  'Crows at the Creek', 'Feathered Thieves', 'Scarecrow Post', 'Bridge Watch', 'Two Troubles',
  'Creekside Rescue', 'Squirrel Stash', 'High Branches', 'Old Mill Crossing', 'Patch Stands Guard',
  'Crow Council', 'Riverbank Rush', 'Protected Harvest', 'Bridge Builders', 'Crow Creek Restored',
  'Overgrown Gate', 'Apple Lane', 'Tangled Vines', 'Mill Garden', 'Golden Orchard',
  'Root Cellar', 'Drought Day', 'Rain Barrel', 'Locked Grove', 'Garden Rescue',
  'Cider Press', 'Golden Kernels', 'Orchard Challenge', 'Festival Supplies', 'Orchard Restored',
  'Twilight Fields', 'Rising Wind', 'Lantern Trail', 'Storm Watch', 'Night Harvest',
  'Moonlit Rows', 'Festival Wagons', 'Wind and Rain', 'Golden Night', 'Patch’s Promise',
  'Valley Together', 'Final Supplies', 'Before the Storm', 'Festival Harvest', 'Moonlight Maize',
];

const LATE_CAMPAIGN_WORDS: string[][] = [
  ['WINDMILL', 'FLOUR', 'BREAD'], ['MARKET', 'CRATE', 'FRESH'], ['LANTERN', 'NIGHT', 'GLOW'], ['AUTUMN', 'CIDER', 'LEAF'], ['BUMPER', 'RIBBON', 'HAPPY'],
  ['CROW', 'CREEK', 'FEATHER'], ['BLACKBIRD', 'NEST', 'WING'], ['SCARECROW', 'POST', 'STRAW'], ['BRIDGE', 'WATCH', 'RIVER'], ['CROW', 'MOUSE', 'FIELD'],
  ['RESCUE', 'CHICK', 'NEST'], ['SQUIRREL', 'ACORN', 'STASH'], ['BRANCH', 'CLIMB', 'TREE'], ['MILL', 'CROSSING', 'WATER'], ['PATCH', 'GUARD', 'CROP'],
  ['COUNCIL', 'FLOCK', 'PEACE'], ['RIVERBANK', 'RUSH', 'REED'], ['PROTECT', 'HARVEST', 'SAFE'], ['BUILDERS', 'BRIDGE', 'WOOD'], ['RESTORED', 'CREEK', 'HOME'],
  ['GATE', 'WEEDS', 'CLEAR'], ['APPLE', 'LANE', 'PEAR'], ['TANGLE', 'VINES', 'GRAPE'], ['GARDEN', 'MILL', 'HERB'], ['GOLDEN', 'ORCHARD', 'FRUIT'],
  ['CELLAR', 'ROOT', 'STORE'], ['DROUGHT', 'DRY', 'SUN'], ['RAIN', 'BARREL', 'WATER'], ['LOCKED', 'GROVE', 'KEY'], ['RESCUE', 'GARDEN', 'BLOOM'],
  ['CIDER', 'PRESS', 'APPLE'], ['GOLDEN', 'KERNEL', 'SHINE'], ['ORCHARD', 'CHALLENGE', 'TREE'], ['FESTIVAL', 'SUPPLIES', 'WAGON'], ['RESTORED', 'ORCHARD', 'MILL'],
  ['TWILIGHT', 'FIELD', 'STAR'], ['RISING', 'WIND', 'CLOUD'], ['LANTERN', 'TRAIL', 'LIGHT'], ['STORM', 'WATCH', 'RAIN'], ['NIGHT', 'HARVEST', 'MOON'],
  ['MOONLIT', 'ROWS', 'GLOW'], ['FESTIVAL', 'WAGON', 'LOAD'], ['WIND', 'RAIN', 'SHELTER'], ['GOLDEN', 'NIGHT', 'STAR'], ['PROMISE', 'PATCH', 'BRAVE'],
  ['VALLEY', 'TOGETHER', 'FARM'], ['FINAL', 'SUPPLIES', 'READY'], ['BEFORE', 'STORM', 'SAFE'], ['FESTIVAL', 'HARVEST', 'CROWD'], ['MOONLIGHT', 'MAIZE', 'HOME'],
];

const WORLD_NAMES = ['Sweet Corn Fields', 'Crow Creek', 'Orchard Hollow', 'Moonlight Maize'] as const;

export const CORN_EDUCATIONAL_FACTS: Partial<Record<number, string>> = {
  1: 'FIELD NOTE · Sweet corn is harvested while the kernels are young, tender, and naturally high in sugar.',
  13: 'FIELD NOTE · White corn is naturally pale because its kernels contain very little colored pigment.',
  21: 'FIELD NOTE · Flint corn has a hard outer layer. Real flint varieties can be red, orange, gold, blue, or nearly black.',
  31: 'FIELD NOTE · A popcorn kernel holds a little water. Heat turns it to steam until the kernel bursts open.',
  41: 'FIELD NOTE · Real blue corn is usually dark indigo-purple or nearly black—not bright blue. Its color comes from anthocyanin pigments.',
  51: 'FIELD NOTE · Golden-yellow corn gets much of its color from naturally occurring carotenoid pigments.',
};

function worldForLevel(id: number) {
  return WORLD_NAMES[Math.min(3, Math.floor((id - 1) / 15))];
}

export function cornTypeForLevel(id: number): CornVariety {
  if (id <= 12) return 'sweet';
  if (id <= 20) return 'white';
  if (id <= 30) return 'flint';
  if (id <= 40) return 'popcorn';
  if (id <= 50) return 'blue';
  return 'golden';
}

export function cornMechanicCountForLevel(id: number) {
  const type = cornTypeForLevel(id);
  const start = type === 'white' ? 13 : type === 'flint' ? 21 : type === 'popcorn' ? 31 : type === 'blue' ? 41 : type === 'golden' ? 51 : 1;
  const offset = id - start;
  if (type === 'sweet') return 0;
  if (type === 'white') return offset === 0 ? 1 : offset < 3 ? 2 : 3;
  if (type === 'flint') return offset === 0 ? 2 : offset < 3 ? 3 : offset < 6 ? 4 : 5;
  if (type === 'popcorn') return offset === 0 ? 2 : offset < 4 ? 3 : 4;
  if (type === 'blue') return offset === 0 ? 2 : offset < 4 ? 4 : 6;
  return offset === 0 ? 2 : offset < 4 ? 3 : offset < 7 ? 4 : 5;
}

function chapterOneLate(id: number) {
  const words = LATE_CAMPAIGN_WORDS[id - 11] ?? ['CORN', 'FARM', 'HARVEST'];
  const chapterIndex = (id - 1) % 15;
  const target = Math.min(78, 58 + Math.floor((id - 1) / 10) * 3 + Math.floor(chapterIndex / 4) * 2);
  const longest = Math.min(8, 5 + Math.floor((id - 11) / 15));
  const story = id === 15 ? {
    speaker: 'Patch',
    title: LEVEL_NAMES[id - 1],
    text: 'The road through Sweet Corn Fields is changing. One strong harvest will carry us forward.',
  } : undefined;
  return {
    target,
    reward: 150 + id * 5,
    words,
    objective: id % 3 === 0 ? { harvestPercent: target, minWords: 5 + Math.floor(id / 20) } : { harvestPercent: target, minLongestWord: longest },
    stars: [
      { id: `long-word-${longest + 1}`, kind: 'longestWord' as const, value: longest + 1, label: `Find a ${longest + 1}-letter word` },
      id % 2 === 0
        ? { id: 'no-tools', kind: 'noTools' as const, label: 'Finish without a tool' }
        : { id: `harvest-${Math.min(90, target + 10)}`, kind: 'harvestPercent' as const, value: Math.min(90, target + 10), label: `Harvest ${Math.min(90, target + 10)}%` },
    ],
    tutorial: id === 11 ? ['Caterpillars are back. Harvest their kernel or use the Butter Brush before they settle in.'] : [],
    story,
    layers: 0,
    shuffle: true,
  };
}

function varietyProgression(id: number) {
  const words = LATE_CAMPAIGN_WORDS[id - 11] ?? ['CORN', 'FARM', 'HARVEST'];
  const chapter = Math.floor((id - 1) / 15);
  const slot = (id - 1) % 15;
  const archetype = slot % 5;
  const baselineLongest = Math.min(8, 4 + chapter);
  const baselineHarvest = Math.min(78, 54 + chapter * 4 + Math.floor(slot / 5) * 3);
  // New varieties begin on forgiving cobs before returning to the chapter curve.
  const longest = [21, 31, 41, 51].includes(id) ? 5 : baselineLongest;
  const harvest = id === 21 ? 58 : id === 31 ? 58 : id === 41 ? 60 : id === 51 ? 62 : baselineHarvest;
  const story = [16, 30, 31, 45, 46, 60].includes(id) ? {
    speaker: id === 60 ? 'Farmer May' : 'Patch',
    title: LEVEL_NAMES[id - 1],
    text: id === 60
      ? 'Every farm is shining again. The Harvest Festival can finally begin!'
      : `The road through ${worldForLevel(id)} is changing. One strong harvest will carry us forward.`,
  } : undefined;
  const tutorial = id === 16 ? ['Crows swoop after two valid words. Save the marked kernel first, or wait two more words for its return. Scarecrow clears a crow immediately.']
    : id === 20 ? ['A squirrel guards a letter. Each word of 5 or more letters releases one guarded kernel. Corn Picker harvests it immediately.']
    : id === 32 ? ['Weeds block letters and spread every three valid words, at most twice per level. Harvest beside a weed to cut it back, even across the cob seam. Butter Brush clears a weed.']
    : id === 46 ? ['Moonlight Maize combines every skill from the valley.'] : [];

  if (archetype === 1) {
    const minWords = 6 + chapter;
    return {
      target: Math.min(80, harvest + 4),
      reward: 150 + id * 5,
      words,
      objective: { harvestPercent: Math.min(80, harvest + 4), minWords },
      stars: [
        { id: `max-words-${minWords + 3}`, kind: 'maxWords' as const, value: minWords + 3, label: `Finish in ${minWords + 3} words or fewer` },
        { id: 'no-tools', kind: 'noTools' as const, label: 'Finish without a tool' },
      ],
      tutorial,
      story,
      layers: 0,
      shuffle: true,
    };
  }
  if (archetype === 2) {
    const layers = chapter === 1 ? 2 : 3;
    return {
      target: Math.max(52, harvest - 4),
      reward: 150 + id * 5,
      words,
      objective: { harvestPercent: Math.max(52, harvest - 4), minLayersRevealed: layers },
      stars: [
        { id: `layers-${layers + 1}`, kind: 'layersRevealed' as const, value: layers + 1, label: `Reveal ${layers + 1} hidden kernels` },
        { id: `long-word-${longest}`, kind: 'longestWord' as const, value: longest, label: `Find a ${longest}-letter word` },
      ],
      tutorial,
      story,
      layers: layers + 1,
      shuffle: true,
    };
  }
  if (archetype === 3) {
    const longWord = Math.min(8, longest + 1);
    const target = Math.max(50, harvest - 10);
    return {
      target,
      reward: 150 + id * 5,
      words,
      objective: { harvestPercent: target, minLongestWord: longWord },
      stars: [
        { id: 'no-tools', kind: 'noTools' as const, label: 'Finish without a tool' },
        { id: `harvest-${Math.min(88, harvest + 6)}`, kind: 'harvestPercent' as const, value: Math.min(88, harvest + 6), label: `Harvest ${Math.min(88, harvest + 6)}%` },
      ],
      tutorial,
      story,
      layers: 0,
      shuffle: false,
    };
  }
  if (archetype === 4) {
    const minWords = 5 + chapter;
    return {
      target: harvest,
      reward: 150 + id * 5,
      words,
      objective: { harvestPercent: harvest, minWords, minLongestWord: longest },
      stars: [
        { id: `harvest-${Math.min(90, harvest + 10)}`, kind: 'harvestPercent' as const, value: Math.min(90, harvest + 10), label: `Harvest ${Math.min(90, harvest + 10)}%` },
        { id: 'no-tools', kind: 'noTools' as const, label: 'Finish without a tool' },
      ],
      tutorial,
      story,
      layers: chapter >= 2 ? 2 : 0,
      shuffle: true,
    };
  }
  return {
    target: harvest,
    reward: 150 + id * 5,
    words,
    objective: { harvestPercent: harvest, minLongestWord: longest },
    stars: [
      { id: `long-word-${Math.min(8, longest + 1)}`, kind: 'longestWord' as const, value: Math.min(8, longest + 1), label: `Find a ${Math.min(8, longest + 1)}-letter word` },
      { id: `harvest-${Math.min(90, harvest + 10)}`, kind: 'harvestPercent' as const, value: Math.min(90, harvest + 10), label: `Harvest ${Math.min(90, harvest + 10)}%` },
    ],
    tutorial,
    story,
    layers: 0,
    shuffle: true,
  };
}

function lateProgression(id: number) {
  if (id <= 15) return chapterOneLate(id);
  return varietyProgression(id);
}

const CHAPTER_ONE = {
  1: {
    target: 45, reward: 100, words: ['SEED', 'CORN', 'HAY', 'FARM'],
    objective: { harvestPercent: 45 },
    stars: [
      { id: 'long-word-4', kind: 'longestWord', value: 4, label: 'Find a 4-letter word' },
      { id: 'harvest-60', kind: 'harvestPercent', value: 60, label: 'Harvest 60%' },
    ],
    tutorial: ['Tap any visible kernels in spelling order.', 'Press the green word display to submit.', 'Valid words fly into the harvest basket.'],
    story: { speaker: 'Patch', title: 'The First Field', text: 'Farmer May’s first crop has gone quiet. Let’s wake it up with a few good words!' },
  },
  2: {
    target: 50, reward: 110, words: ['BARN', 'SILO', 'HAY', 'PLOW'],
    objective: { harvestPercent: 50, minLongestWord: 4 },
    stars: [
      { id: 'long-word-5', kind: 'longestWord', value: 5, label: 'Find a 5-letter word' },
      { id: 'eight-words', kind: 'maxWords', value: 8, label: 'Finish in 8 words or fewer' },
    ],
    tutorial: ['Longer words earn more coins.', 'Tap the last selected kernel to undo one letter.'],
  },
  3: {
    target: 50, reward: 120, words: ['WHEAT', 'GRAIN', 'MAIZE', 'HUSK'],
    objective: { harvestPercent: 50, minWords: 4 },
    stars: [
      { id: 'long-word-5', kind: 'longestWord', value: 5, label: 'Find a 5-letter word' },
      { id: 'no-tools', kind: 'noTools', label: 'Finish without a tool' },
    ],
    tutorial: ['Every accepted word fills the basket and earns coins.', 'The Corn Picker harvests one visible kernel immediately. Save it for a letter that blocks your plan.'],
    story: { speaker: 'Farmer May', title: 'A Brighter Harvest', text: 'The field is glowing again. Gather enough grain and we can reopen the lower path.' },
  },
  4: {
    target: 55, reward: 130, words: ['TRACTOR', 'HARVEST', 'PLANTER', 'HAY'],
    objective: { harvestPercent: 55 },
    stars: [
      { id: 'long-word-6', kind: 'longestWord', value: 6, label: 'Find a 6-letter word' },
      { id: 'nine-words', kind: 'maxWords', value: 9, label: 'Finish in 9 words or fewer' },
    ],
    tutorial: ['Swipe horizontally or use the arrows to rotate.', 'Selected letters stay selected while you search around the cob.'],
  },
  5: {
    target: 55, reward: 140, words: ['ORCHARD', 'APPLE', 'PEAR', 'PEACH'],
    objective: { harvestPercent: 55, minLongestWord: 5 },
    stars: [
      { id: 'long-word-7', kind: 'longestWord', value: 7, label: 'Find a 7-letter word' },
      { id: 'harvest-70', kind: 'harvestPercent', value: 70, label: 'Harvest 70%' },
    ],
    tutorial: ['Rotate whenever the next letter is hidden. There is no adjacency rule.'],
  },
  6: {
    target: 58, reward: 150, words: ['RIVER', 'CREEK', 'POND', 'WATER'],
    objective: { harvestPercent: 58, minWords: 5 },
    stars: [
      { id: 'long-word-6', kind: 'longestWord', value: 6, label: 'Find a 6-letter word' },
      { id: 'no-tools', kind: 'noTools', label: 'Finish without a tool' },
    ],
    tutorial: ['The Scarecrow highlights the first letter of a useful word. Later, it can also chase away crows.'],
    story: { speaker: 'Patch', title: 'The Creek Road', text: 'The old creek road is just ahead. Strong harvests will clear the way.' },
  },
  7: {
    target: 55, reward: 165, words: ['SCARECROW', 'CROW', 'FIELD', 'MOUSE'],
    objective: { harvestPercent: 55, minLayersRevealed: 1 },
    stars: [
      { id: 'layers-2', kind: 'layersRevealed', value: 2, label: 'Reveal 2 hidden kernels' },
      { id: 'long-word-6', kind: 'longestWord', value: 6, label: 'Find a 6-letter word' },
    ],
    tutorial: ['Some positions contain another kernel underneath.', 'Harvest the top kernel to reveal the next layer.'],
  },
  8: {
    target: 60, reward: 180, words: ['PUMPKIN', 'SQUASH', 'CARROT', 'BEANS'],
    objective: { harvestPercent: 60, minLayersRevealed: 2 },
    stars: [
      { id: 'layers-3', kind: 'layersRevealed', value: 3, label: 'Reveal 3 hidden kernels' },
      { id: 'nine-words', kind: 'maxWords', value: 9, label: 'Finish in 9 words or fewer' },
    ],
    tutorial: [
      'Newly revealed kernels can be used immediately in later words.',
      'Caterpillars eat their marked kernels when the seconds run out! Harvest threatened letters in a word to save them. Butter Brush clears a caterpillar. Eaten letters can be regrown for free.',
    ],
    story: { speaker: 'Patch', title: 'Hungry Visitors', text: 'Something is chewing the stalks! Save those letters before the caterpillars finish their snack.' },
  },
  9: {
    target: 62, reward: 200, words: ['HONEY', 'BEES', 'POLLEN', 'CLOVER'],
    objective: { harvestPercent: 62, minLongestWord: 6 },
    stars: [
      { id: 'long-word-7', kind: 'longestWord', value: 7, label: 'Find a 7-letter word' },
      { id: 'harvest-75', kind: 'harvestPercent', value: 75, label: 'Harvest 75%' },
    ],
    tutorial: ['Plan longer words before using rare letters.'],
  },
  10: {
    target: 65, reward: 250, words: ['BUTTER', 'KERNEL', 'GOLDEN', 'SWEET'],
    objective: { harvestPercent: 65, minWords: 7 },
    stars: [
      { id: 'long-word-7', kind: 'longestWord', value: 7, label: 'Find a 7-letter word' },
      { id: 'no-tools', kind: 'noTools', label: 'Finish without a tool' },
    ],
    tutorial: ['This Bumper Crop combines rotation, layers, longer words, and careful tool use.'],
    story: { speaker: 'Patch', title: 'Bumper Crop', text: 'One last field! Fill the festival wagon and Sweet Corn Fields will shine again. Keep an eye on the next rows — more hungry pests are gathering.' },
  },
} as const;

function progression(id: number, fallbackTarget: number) {
  const authored = CHAPTER_ONE[id as keyof typeof CHAPTER_ONE];
  if (authored) return authored;
  if (id >= 11 && id <= 60) return lateProgression(id);
  return {
    target: fallbackTarget,
    reward: 100 + id * 10,
    words: [] as string[],
    objective: { harvestPercent: fallbackTarget },
    stars: [
      { id: 'long-word-5', kind: 'longestWord' as const, value: 5, label: 'Find a 5-letter word' },
      { id: 'no-tools', kind: 'noTools' as const, label: 'Finish without a tool' },
    ],
    tutorial: [] as string[],
  };
}

function horiz(row: number, start: number, length: number): [number, number][] {
  return Array.from({ length }, (_, i) => [row, start + i]);
}

function makeLevel(
  id: number,
  targetHarvestPercent: number,
  rows: string[],
  planted: [number, number][][],
  under: { row: number; column: number; letter: string }[] = [],
): Level {
  const columns = rows[0].length;
  const config = progression(id, targetHarvestPercent);
  const cornType = cornTypeForLevel(id);
  const mechanicCount = cornMechanicCountForLevel(id);
  const positions = {
    white: [[1, 0], [3, columns - 1], [5, 1]],
    flint: [[0, 2], [1, columns - 2], [3, 1], [4, columns - 1], [6, 3]],
    popcorn: [[1, 1], [2, columns - 2], [4, 2], [6, columns - 3]],
    blue: [[0, 1], [1, columns - 2], [2, 3], [4, columns - 1], [5, 2], [6, columns - 3]],
    golden: [[0, 2], [2, columns - 2], [3, 1], [5, columns - 1], [6, 3]],
  } as const;
  const activePositions = new Set((cornType === 'sweet' ? [] : positions[cornType])
    .slice(0, mechanicCount)
    .map(([row, column]) => `${row}:${column}`));
  const applyVarietySetup = (kernels: ReturnType<typeof kernelsFromRows>) => kernels.map(kernel => ({
    ...kernel,
    dormant: cornType === 'white' && kernel.layer === 0 && activePositions.has(`${kernel.row}:${kernel.column}`),
    armored: cornType === 'flint' && kernel.layer === 0 && activePositions.has(`${kernel.row}:${kernel.column}`),
    popKernel: cornType === 'popcorn' && kernel.layer === 0 && activePositions.has(`${kernel.row}:${kernel.column}`),
    popCharge: 0,
    moonlit: cornType === 'blue' && kernel.layer === 0 && activePositions.has(`${kernel.row}:${kernel.column}`),
    festival: cornType === 'golden' && kernel.layer === 0 && activePositions.has(`${kernel.row}:${kernel.column}`),
  }));
  const baseObstacleKind = id === 36 ? 'web'
    : id === 48 || id === 52 ? 'frost'
    : id >= 8 && id <= 15 ? 'caterpillar'
    : id >= 16 && id <= 25 ? (id === 20 || id === 24 ? 'squirrel' : 'crow')
    : id >= 26 && id <= 30 ? 'squirrel'
    : id >= 32 && id <= 45 ? 'weed' : undefined;
  const masteryObstacles = id === 46 ? ['crow'] as const
    : id === 49 ? ['squirrel'] as const
    : id === 54 ? ['crow', 'frost'] as const
    : id === 57 ? ['squirrel', 'frost'] as const
    : id === 59 ? ['crow', 'web'] as const
    : id === 60 ? ['crow', 'weed'] as const
    : undefined;
  const obstacleKinds = masteryObstacles
    ? [...masteryObstacles]
    : baseObstacleKind
      ? Array.from({ length: baseObstacleKind === 'caterpillar' ? (id >= 13 ? 3 : 2) : id % 5 === 0 ? 2 : 1 }, () => baseObstacleKind)
      : [];
  const weather = [54, 57, 59, 60].includes(id)
    ? { kind: 'storm' as const, interval: 2 }
    : [37, 40, 43].includes(id)
      ? { kind: 'drought' as const, interval: 1 }
    : [38, 42, 44].includes(id)
    ? { kind: 'rain' as const, interval: 2, coinBonusPerLetter: 1 }
    : [47, 49, 53, 58].includes(id)
      ? { kind: 'wind' as const, interval: 2 }
      : undefined;
  const weatherTutorial = id === 38
    ? ['Rain feeds the crop. Every accepted word earns bonus coins while the shower lasts.']
    : id === 37
      ? ['Drought dries the field. Build words with 5 or more letters to earn a careful-harvest bonus.']
    : id === 47
      ? ['Wind rotates the cob one step after every two accepted words. Your selected letters stay safe.']
      : id === 54
        ? ['A storm combines rain with a sudden cob rotation every two accepted words. Watch the gust warning after submitting.']
      : [];
  const obstacleTutorial = id === 36
    ? ['A spider web traps a letter. Harvest both kernels marked with an anchor to release it, or use Butter Brush. The badge counts anchors remaining.']
    : id === 48
      ? ['Frost coats one kernel. Use its letter in a valid word to crack the ice; the kernel stays until the ice is gone and you use it again. Butter Brush removes all ice.']
      : [];
  return {
    id,
    cornType,
    world: worldForLevel(id),
    name: LEVEL_NAMES[id - 1] ?? `Level ${id}`,
    rows: rows.length,
    columns,
    kernels: applyVarietySetup([...kernelsFromRows(rows, cornType), ...underKernels(under, cornType)]),
    targetHarvestPercent: config.target,
    objective: config.objective,
    starGoals: [...config.stars] as [StarGoal, StarGoal],
    rewardCoins: config.reward,
    guaranteedWords: [...config.words],
    tutorial: [
      ...config.tutorial,
      ...(id === 13 ? ['White Corn has sleeping kernels marked with a husk vein. Harvest beside one to wake its letter.'] : []),
      ...(id === 21 ? ['Flint Corn can grow armored kernels marked 2×. Use one in a valid word to crack it, then use it again to harvest it.'] : []),
      ...(id === 31 ? ['Marked Popcorn kernels charge after every valid word. At 3 charges they pop themselves and the next kernel around the cob.'] : []),
      ...(id === 41 ? ['Moonlit letters appear when their Blue Corn kernel rotates into the bright center. Hints can reveal one from the side.'] : []),
      ...(id === 51 ? ['Festival kernels carry a gold star. Use them in words of 5 or more letters to earn a Golden Corn bonus.'] : []),
      ...obstacleTutorial,
      ...weatherTutorial,
    ],
    educationalFact: CORN_EDUCATIONAL_FACTS[id],
    story: 'story' in config ? config.story : undefined,
    shuffleOnStart: 'shuffle' in config ? config.shuffle : id > 10,
    rotationEnabled: true,
    hintPaths: planted
      .map(coords => pathIds(coords.filter(([row, column]) => row < rows.length && column < columns)))
      .filter(path => path.length >= 3),
    obstacles: obstacleKinds.map((obstacleKind, index) => ({
      id: `${obstacleKind}-${id}-${index}`,
      kind: obstacleKind,
      kernelId: `${1 + index}-${index === 0 ? 2 % columns : 1 % columns}-0`,
      countdown: obstacleKind === 'caterpillar' ? 20 + index * 7 : obstacleKind === 'crow' ? 2 : 0,
      strength: obstacleKind === 'frost' ? (id >= 54 ? 2 : 1) : undefined,
      anchorIds: obstacleKind === 'web' ? [`0-${index % columns}-0`, `0-${(index + 1) % columns}-0`] : undefined,
    })),
    weather,
  };
}

export const WORLD_NAME = 'Sweet Corn Fields';
export const NEXT_WORLD_NAME = 'Popcorn Acres';
export const CAMPAIGN_WORLDS = [...WORLD_NAMES];
export const worldNameForLevel = worldForLevel;
export function nextWorldNameForLevel(id: number) {
  const index = Math.floor((id - 1) / 15);
  return WORLD_NAMES[index + 1] ?? 'Harvest Festival';
}

const CORE_LEVELS: Level[] = [
  makeLevel(1, 70, [
    'SEEDCORN',
    'HAYFARMR',
    'SUNRAINE',
    'SOILGROW',
    'CROPMAIZ',
    'EARFIELD',
    'ROWCOBXY',
  ], [
    horiz(0, 0, 4), horiz(0, 4, 4), horiz(1, 0, 3), horiz(1, 3, 4),
    horiz(2, 0, 3), horiz(2, 3, 4), horiz(3, 0, 4), horiz(3, 4, 4),
    horiz(4, 0, 4), horiz(5, 0, 3), horiz(5, 3, 5), horiz(6, 0, 3), horiz(6, 3, 3),
  ], [
    { row: 1, column: 2, letter: 'C' }, { row: 2, column: 3, letter: 'O' },
    { row: 3, column: 4, letter: 'B' }, { row: 5, column: 2, letter: 'U' },
  ]),
  makeLevel(2, 55, [
    'BARNSILO',
    'HAYSTACK',
    'PLOWCORN',
    'MILKCREAM',
    'GOATSHEEP',
    'FENCEGATE',
    'LANEPATH',
  ].map(row => row.slice(0, 8)), [
    horiz(0, 0, 4), horiz(0, 4, 4), horiz(1, 0, 3),
    horiz(2, 0, 4), horiz(2, 4, 4), horiz(3, 0, 4),
    horiz(4, 0, 4), horiz(5, 0, 5), horiz(6, 0, 4),
  ], [{ row: 0, column: 1, letter: 'O' }, { row: 4, column: 3, letter: 'S' }]),
  makeLevel(3, 55, [
    'WHEATGRAIN',
    'MAIZECOBBY',
    'KERNELGOLD',
    'HUSKLEAFED',
    'STALKGREEN',
    'EARHARVEST',
    'BINSILOSUN',
  ].map(row => row.slice(0, 9)), [
    horiz(0, 0, 5), horiz(0, 5, 5), horiz(1, 0, 5),
    horiz(2, 0, 6), horiz(3, 0, 4), horiz(4, 0, 5),
    horiz(5, 0, 3), horiz(5, 3, 7), horiz(6, 0, 3),
  ], [{ row: 2, column: 2, letter: 'N' }, { row: 5, column: 4, letter: 'V' }]),
  makeLevel(4, 60, [
    'TRACTORS',
    'HARVESTS',
    'PLANTERS',
    'THRESHER',
    'WAGONHAY',
    'BALEFORK',
    'DIRTROAD',
  ], [
    horiz(0, 0, 7), horiz(1, 0, 7), horiz(2, 0, 7),
    horiz(4, 0, 5), horiz(5, 0, 4), horiz(6, 0, 4),
  ], [{ row: 1, column: 3, letter: 'E' }, { row: 6, column: 2, letter: 'O' }]),
  makeLevel(5, 60, [
    'ORCHARDXX',
    'APPLEPEAR',
    'PEACHPLUM',
    'BERRYVINE',
    'CIDERMILL',
    'BASKETHAY',
    'SHADETREE',
  ], [
    horiz(0, 0, 7), horiz(1, 0, 5), horiz(1, 5, 4),
    horiz(2, 0, 5), horiz(2, 5, 4), horiz(3, 0, 5),
    horiz(4, 0, 5), horiz(5, 0, 6), horiz(6, 0, 5),
  ], [{ row: 3, column: 2, letter: 'R' }]),
  makeLevel(6, 62, [
    'RIVERBANK',
    'CREEKFISH',
    'PONDFROGS',
    'REEDGRASS',
    'DUCKGOOSE',
    'BRIDGEOAK',
    'WATERMILL',
  ], [
    horiz(0, 0, 5), horiz(1, 0, 5), horiz(2, 0, 4),
    horiz(3, 0, 4), horiz(4, 0, 4), horiz(4, 4, 5),
    horiz(5, 0, 6), horiz(6, 0, 5),
  ], [{ row: 0, column: 4, letter: 'S' }, { row: 2, column: 3, letter: 'S' }]),
  makeLevel(7, 65, [
    'SCARECROW',
    'CROWSNEST',
    'FIELDMOUSE',
    'BARNYARDO',
    'CHICKENSX',
    'ROOSTERXX',
    'HENSCLUCK',
  ].map(row => row.slice(0, 9)), [
    horiz(0, 0, 9), horiz(1, 0, 5), horiz(2, 0, 5),
    horiz(3, 0, 4), horiz(4, 0, 7), horiz(5, 0, 7), horiz(6, 0, 4),
  ], [{ row: 0, column: 4, letter: 'C' }, { row: 4, column: 2, letter: 'I' }]),
  makeLevel(8, 65, [
    'PUMPKINXX',
    'SQUASHYAM',
    'CARROTBEE',
    'ONIONHERB',
    'TOMATOVIN',
    'PEASBEANS',
    'GARDENROW',
  ], [
    horiz(0, 0, 7), horiz(1, 0, 6), horiz(1, 6, 3),
    horiz(2, 0, 6), horiz(3, 0, 5), horiz(3, 5, 4),
    horiz(4, 0, 6), horiz(5, 0, 4), horiz(5, 4, 5), horiz(6, 0, 6),
  ], [
    { row: 2, column: 5, letter: 'T' },
    { row: 4, column: 2, letter: 'I' },
    { row: 6, column: 4, letter: 'S' },
  ]),
  makeLevel(9, 68, [
    'HONEYBEES',
    'HIVENESTR',
    'POLLENWAX',
    'FLOWERGUM',
    'CLOVERHAY',
    'NECTARGOLD',
    'SWEETCOMB',
  ].map(row => row.slice(0, 9)), [
    horiz(0, 0, 5), horiz(1, 0, 4), horiz(2, 0, 6),
    horiz(3, 0, 6), horiz(4, 0, 6), horiz(5, 0, 6), horiz(6, 0, 5),
  ], [{ row: 0, column: 5, letter: 'B' }, { row: 5, column: 3, letter: 'A' }]),
  makeLevel(10, 70, [
    'BUTTERFLY',
    'KERNELPOP',
    'GOLDENEAR',
    'COBSWEETX',
    'HUSKGREEN',
    'SILKTASEL',
    'ROASTFIRE',
  ], [
    horiz(0, 0, 6), horiz(1, 0, 6), horiz(2, 0, 6),
    horiz(3, 0, 3), horiz(3, 3, 5), horiz(4, 0, 4),
    horiz(5, 0, 4), horiz(6, 0, 5),
  ], [{ row: 1, column: 4, letter: 'L' }, { row: 3, column: 1, letter: 'O' }]),
  makeLevel(11, 70, [
    'WINDMILLX',
    'BLADESTON',
    'GRAINBINY',
    'FLOURMILL',
    'WHEATLOAF',
    'BAKERDOUGH',
    'OVENCRUST',
  ].map(row => row.slice(0, 9)), [
    horiz(0, 0, 8), horiz(2, 0, 5), horiz(3, 0, 5),
    horiz(4, 0, 5), horiz(4, 5, 4), horiz(5, 0, 5), horiz(6, 0, 4),
  ], [{ row: 0, column: 4, letter: 'M' }]),
  makeLevel(12, 72, [
    'HARVESTXX',
    'CRATEBASK',
    'BUSHELBIN',
    'MARKETDAY',
    'FARMSTAND',
    'FRESHCORN',
    'SWEETMAIZE',
  ].map(row => row.slice(0, 9)), [
    horiz(0, 0, 7), horiz(1, 0, 5), horiz(2, 0, 6),
    horiz(3, 0, 6), horiz(4, 0, 4), horiz(5, 0, 5), horiz(5, 5, 4),
  ], [
    { row: 0, column: 3, letter: 'V' }, { row: 4, column: 2, letter: 'R' },
    { row: 5, column: 2, letter: 'E' },
  ]),
  makeLevel(13, 72, [
    'MOONLIGHT',
    'STARFIELD',
    'NIGHTOWLX',
    'CRICKETSY',
    'LANTERNGLOW',
    'FIREFLYXX',
    'SLEEPFARM',
  ].map(row => row.slice(0, 9)), [
    horiz(0, 0, 4), horiz(1, 0, 4), horiz(1, 4, 5),
    horiz(2, 0, 5), horiz(3, 0, 7), horiz(5, 0, 7), horiz(6, 0, 5),
  ], [{ row: 1, column: 6, letter: 'L' }]),
  makeLevel(14, 75, [
    'AUTUMNRED',
    'LEAFFALLS',
    'CIDERPRESS',
    'HAYRIDEXX',
    'CORNMAZEE',
    'PUMPKINPIE',
    'HARVESTMOON',
  ].map(row => row.slice(0, 9)), [
    horiz(0, 0, 6), horiz(1, 0, 4), horiz(2, 0, 5),
    horiz(3, 0, 3), horiz(4, 0, 4), horiz(4, 4, 4),
    horiz(5, 0, 7),
  ], [{ row: 4, column: 2, letter: 'R' }, { row: 5, column: 4, letter: 'K' }]),
  makeLevel(15, 75, [
    'BUMPERCROP',
    'GOLDENCOBS',
    'FULLBASKET',
    'PRIZEMAIZE',
    'FAIRGROUNDS',
    'BLUERIBBON',
    'FARMERWINS',
    'HAPPYHARVEST',
  ].map(row => row.slice(0, 10)), [
    horiz(0, 0, 6), horiz(1, 0, 6), horiz(2, 0, 4),
    horiz(3, 0, 5), horiz(3, 5, 5), horiz(5, 0, 4),
    horiz(5, 4, 6), horiz(6, 0, 6),
  ], [
    { row: 0, column: 6, letter: 'R' }, { row: 2, column: 3, letter: 'L' },
    { row: 6, column: 4, letter: 'E' },
  ]),
];

function makeGeneratedCampaignLevel(id: number): Level {
  const config = lateProgression(id);
  const columns = config.objective.minLongestWord && !config.objective.minWords && !config.shuffle ? 8
    : config.objective.minWords && !config.objective.minLongestWord ? 10
    : id % 3 === 0 ? 10 : 9;
  const rowsCount = 7;
  const words = config.words;
  const filler = 'CORNFIELDHARVESTMAIZEGOLDENBASKETRIVERAPPLEMOONLIGHT';
  const capacity = columns * rowsCount;
  const authored = words.join('');
  const stream = (authored + filler.repeat(3)).slice(0, capacity);
  const rows = Array.from({ length: rowsCount }, (_, row) => stream.slice(row * columns, (row + 1) * columns));
  const paths = words.map(word => {
    const start = authored.indexOf(word);
    return Array.from({ length: word.length }, (_, offset) => {
      const index = start + offset;
      return [Math.floor(index / columns), index % columns] as [number, number];
    });
  });
  const layerCount = Math.max(
    config.layers,
    'minLayersRevealed' in config.objective ? (config.objective.minLayersRevealed ?? 0) : 0,
  );
  const under = Array.from({ length: layerCount }, (_, index) => ({
    row: 1 + index,
    column: (2 + index) % columns,
    letter: ['E', 'A', 'R', 'S'][index % 4],
  }));
  return makeLevel(id, config.target, rows, paths, under);
}

export const LEVELS: Level[] = [
  ...CORE_LEVELS,
  ...Array.from({ length: 45 }, (_, index) => makeGeneratedCampaignLevel(index + 16)),
];

export const levelById = (id: number) => LEVELS.find(level => level.id === id);

export function isLevelUnlocked(id: number, completedIds: number[], devUnlock = false): boolean {
  if (devUnlock || id <= 1) return true;
  return completedIds.includes(id - 1);
}
