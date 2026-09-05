import { kernelsFromRows, pathIds, underKernels } from '../game/board';
import { Level, StarGoal } from '../game/types';

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
];

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
    tutorial: ['Every accepted word fills the basket and earns coins.'],
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
    tutorial: ['The Scarecrow can reveal the start of a useful word when you are stuck.'],
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
    tutorial: ['Newly revealed kernels can be used immediately in later words.'],
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
    story: { speaker: 'Patch', title: 'Bumper Crop', text: 'One last field! Fill the festival wagon and Sweet Corn Fields will shine again.' },
  },
} as const;

function progression(id: number, fallbackTarget: number) {
  const authored = CHAPTER_ONE[id as keyof typeof CHAPTER_ONE];
  if (authored) return authored;
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
  return {
    id,
    world: 'Sweet Corn Fields',
    name: LEVEL_NAMES[id - 1] ?? `Level ${id}`,
    rows: rows.length,
    columns,
    kernels: [...kernelsFromRows(rows), ...underKernels(under)],
    targetHarvestPercent: config.target,
    objective: config.objective,
    starGoals: [...config.stars] as [StarGoal, StarGoal],
    rewardCoins: config.reward,
    guaranteedWords: [...config.words],
    tutorial: [...config.tutorial],
    story: 'story' in config ? config.story : undefined,
    shuffleOnStart: id > 10,
    rotationEnabled: true,
    hintPaths: planted
      .map(coords => pathIds(coords.filter(([row, column]) => row < rows.length && column < columns)))
      .filter(path => path.length >= 3),
  };
}

export const WORLD_NAME = 'Sweet Corn Fields';
export const NEXT_WORLD_NAME = 'Popcorn Acres';

export const LEVELS: Level[] = [
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
  ].map(row => row.slice(0, 10)), [
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

export const levelById = (id: number) => LEVELS.find(level => level.id === id);

export function isLevelUnlocked(id: number, completedIds: number[]): boolean {
  if (id <= 1) return true;
  return completedIds.includes(id - 1);
}
