import { kernelsFromRows, pathIds, underKernels } from '../game/board';
import { Level } from '../game/types';

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
  return {
    id,
    world: 'Sweet Corn Fields',
    name: `Level ${id}`,
    rows: rows.length,
    columns,
    kernels: [...kernelsFromRows(rows), ...underKernels(under)],
    targetHarvestPercent,
    rotationEnabled: true,
    hintPaths: planted
      .map(coords => pathIds(coords.filter(([row, column]) => row < rows.length && column < columns)))
      .filter(path => path.length >= 3),
  };
}

export const WORLD_NAME = 'Sweet Corn Fields';
export const NEXT_WORLD_NAME = 'Popcorn Acres';

export const LEVELS: Level[] = [
  makeLevel(1, 50, [
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
  ], [{ row: 2, column: 5, letter: 'T' }]),
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
