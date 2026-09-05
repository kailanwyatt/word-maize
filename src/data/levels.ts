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

function worldForLevel(id: number) {
  return WORLD_NAMES[Math.min(3, Math.floor((id - 1) / 15))];
}

function lateProgression(id: number) {
  const words = LATE_CAMPAIGN_WORDS[id - 11] ?? ['CORN', 'FARM', 'HARVEST'];
  const chapterIndex = (id - 1) % 15;
  const target = Math.min(78, 58 + Math.floor((id - 1) / 10) * 3 + Math.floor(chapterIndex / 4) * 2);
  const longest = Math.min(8, 5 + Math.floor((id - 11) / 15));
  const story = [15, 16, 30, 31, 45, 46, 60].includes(id) ? {
    speaker: id === 60 ? 'Farmer May' : 'Patch',
    title: LEVEL_NAMES[id - 1],
    text: id === 60
      ? 'Every farm is shining again. The Harvest Festival can finally begin!'
      : `The road through ${worldForLevel(id)} is changing. One strong harvest will carry us forward.`,
  } : undefined;
  return {
    target,
    reward: 140 + id * 12,
    words,
    objective: id % 3 === 0 ? { harvestPercent: target, minWords: 5 + Math.floor(id / 20) } : { harvestPercent: target, minLongestWord: longest },
    stars: [
      { id: `long-word-${longest + 1}`, kind: 'longestWord' as const, value: longest + 1, label: `Find a ${longest + 1}-letter word` },
      id % 2 === 0
        ? { id: 'no-tools', kind: 'noTools' as const, label: 'Finish without a tool' }
        : { id: `harvest-${Math.min(90, target + 10)}`, kind: 'harvestPercent' as const, value: Math.min(90, target + 10), label: `Harvest ${Math.min(90, target + 10)}%` },
    ],
    tutorial: id === 11 ? ['Caterpillars count down after each valid word. Harvest their kernel or use the Butter Brush before they settle in.']
      : id === 16 ? ['Crows swoop in after two valid words. The Scarecrow clears one before it blocks a letter.']
      : id === 20 ? ['Squirrels guard a kernel immediately. Use a Corn Picker to remove it.']
      : id === 31 ? ['Weeds lock a kernel in place. The Butter Brush clears them without harvesting the letter.']
      : id === 46 ? ['Moonlight Maize combines every skill from the valley.'] : [],
    story,
  };
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
  const obstacleKind = id >= 11 && id <= 15 ? 'caterpillar'
    : id >= 16 && id <= 25 ? (id % 4 === 0 ? 'squirrel' : 'crow')
    : id >= 26 && id <= 30 ? 'squirrel'
    : id >= 31 && id <= 45 ? 'weed' : undefined;
  const obstacleCount = obstacleKind ? (id % 5 === 0 ? 2 : 1) : 0;
  return {
    id,
    world: worldForLevel(id),
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
    obstacles: Array.from({ length: obstacleCount }, (_, index) => ({
      id: `${obstacleKind}-${id}-${index}`,
      kind: obstacleKind!,
      kernelId: `${1 + index}-${index === 0 ? 2 % columns : 1 % columns}-0`,
      countdown: obstacleKind === 'caterpillar' ? 3 : obstacleKind === 'crow' ? 2 : 0,
    })),
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
  const columns = id % 3 === 0 ? 10 : 9;
  const rowsCount = 7;
  const words = lateProgression(id).words;
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
  const under = id % 4 === 0 ? [
    { row: 2, column: 2, letter: 'E' },
    { row: 4, column: columns - 3, letter: 'A' },
  ] : [];
  return makeLevel(id, lateProgression(id).target, rows, paths, under);
}

export const LEVELS: Level[] = [
  ...CORE_LEVELS,
  ...Array.from({ length: 45 }, (_, index) => makeGeneratedCampaignLevel(index + 16)),
];

export const levelById = (id: number) => LEVELS.find(level => level.id === id);

export function isLevelUnlocked(id: number, completedIds: number[]): boolean {
  if (id <= 1) return true;
  return completedIds.includes(id - 1);
}
