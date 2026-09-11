export type CrosswordSlot = { id: string; clue: string; answer: string; row: number; column: number; direction: 'across' | 'down' };
export type CrosswordPuzzle = { id: string; title: string; columns: number; rows: number; slots: CrosswordSlot[]; givens: string[] };
export const CROSSWORDS: CrosswordPuzzle[] = [
  { id: 'orchard', title: 'Orchard crossing', columns: 8, rows: 5, givens: ['0:7', '4:0'], slots: [
    { id: '1', clue: 'A pet that purrs', answer: 'CAT', row: 0, column: 7, direction: 'across' },
    { id: '2', clue: 'A crunchy orchard fruit', answer: 'APPLE', row: 0, column: 0, direction: 'down' },
    { id: '3', clue: 'Fruit baked inside a crust', answer: 'PIE', row: 2, column: 0, direction: 'across' },
  ] },
  { id: 'sunshine', title: 'A sunny afternoon', columns: 8, rows: 4, givens: ['0:1'], slots: [
    { id: '1', clue: 'Our nearest star', answer: 'SUN', row: 0, column: 1, direction: 'across' },
    { id: '2', clue: 'A squirrel’s favorite snack', answer: 'NUT', row: 0, column: 3, direction: 'down' },
    { id: '3', clue: 'A drink made by steeping leaves', answer: 'TEA', row: 2, column: 3, direction: 'across' },
  ] },
  { id: 'barn', title: 'Barnyard crossing', columns: 8, rows: 5, givens: ['0:0'], slots: [
    { id: '1', clue: 'A farm bird that lays eggs', answer: 'HEN', row: 0, column: 0, direction: 'across' },
    { id: '2', clue: 'A farm animal you can ride', answer: 'HORSE', row: 0, column: 0, direction: 'down' },
    { id: '3', clue: 'A grain used in some breads', answer: 'RYE', row: 2, column: 0, direction: 'across' },
  ] },
  { id: 'meadow', title: 'Meadow crossing', columns: 8, rows: 4, givens: ['0:0'], slots: [
    { id: '1', clue: 'A farm animal that says moo', answer: 'COW', row: 0, column: 0, direction: 'across' },
    { id: '2', clue: 'A tall yellow crop', answer: 'CORN', row: 0, column: 0, direction: 'down' },
    { id: '3', clue: 'A male sheep', answer: 'RAM', row: 2, column: 0, direction: 'across' },
  ] },
  { id: 'kitchen', title: 'Kitchen crossing', columns: 8, rows: 5, givens: ['0:0'], slots: [
    { id: '1', clue: 'A buzzing garden insect', answer: 'BEE', row: 0, column: 0, direction: 'across' },
    { id: '2', clue: 'Baked loaf on the table', answer: 'BREAD', row: 0, column: 0, direction: 'down' },
    { id: '3', clue: 'You hear with this', answer: 'EAR', row: 2, column: 0, direction: 'across' },
  ] },
  { id: 'ocean', title: 'Ocean crossing', columns: 8, rows: 5, givens: ['0:0'], slots: [
    { id: '1', clue: 'A large body of salt water', answer: 'SEA', row: 0, column: 0, direction: 'across' },
    { id: '2', clue: 'A hard cover from the beach', answer: 'SHELL', row: 0, column: 0, direction: 'down' },
    { id: '3', clue: 'A long, slippery fish', answer: 'EEL', row: 2, column: 0, direction: 'across' },
  ] },
  { id: 'night', title: 'Night crossing', columns: 8, rows: 5, givens: ['0:0'], slots: [
    { id: '1', clue: 'Our nearest star', answer: 'SUN', row: 0, column: 0, direction: 'across' },
    { id: '2', clue: 'Wind, rain, and thunder together', answer: 'STORM', row: 0, column: 0, direction: 'down' },
    { id: '3', clue: 'A night bird', answer: 'OWL', row: 2, column: 0, direction: 'across' },
  ] },
  { id: 'music', title: 'Music crossing', columns: 8, rows: 4, givens: ['0:0'], slots: [
    { id: '1', clue: 'A large body of salt water', answer: 'SEA', row: 0, column: 0, direction: 'across' },
    { id: '2', clue: 'A tune you can sing', answer: 'SONG', row: 0, column: 0, direction: 'down' },
    { id: '3', clue: 'Used to catch fish or butterflies', answer: 'NET', row: 2, column: 0, direction: 'across' },
  ] },
];
export const wrap = (value: number, size: number) => ((value % size) + size) % size;
export function slotCells(slot: CrosswordSlot, columns: number) {
  return [...slot.answer].map((letter, i) => ({ id: `${slot.row + (slot.direction === 'down' ? i : 0)}:${wrap(slot.column + (slot.direction === 'across' ? i : 0), columns)}`, letter }));
}
export function crosswordCells(puzzle: CrosswordPuzzle) {
  const cells = new Map<string, string>();
  puzzle.slots.forEach(slot => slotCells(slot, puzzle.columns).forEach(cell => cells.set(cell.id, cell.letter)));
  return [...cells].map(([id, letter]) => ({ id, letter }));
}
export function crosswordTiles(puzzle: CrosswordPuzzle) {
  return crosswordCells(puzzle).filter(c => !puzzle.givens.includes(c.id)).map((c, i) => ({ id: `tile-${i}`, letter: c.letter }))
    .sort((a, b) => a.letter.localeCompare(b.letter) || a.id.localeCompare(b.id));
}
export type Placements = Record<string, string>;
export function crosswordLetter(puzzle: CrosswordPuzzle, placements: Placements, cellId: string) {
  if (puzzle.givens.includes(cellId)) return crosswordCells(puzzle).find(c => c.id === cellId)?.letter ?? '';
  return crosswordTiles(puzzle).find(t => t.id === placements[cellId])?.letter ?? '';
}
export function solvedSlots(puzzle: CrosswordPuzzle, placements: Placements) {
  return puzzle.slots.filter(slot => slotCells(slot, puzzle.columns).every(c => crosswordLetter(puzzle, placements, c.id) === c.letter)).map(s => s.id);
}
export function placeCrosswordTile(puzzle: CrosswordPuzzle, placements: Placements, tileId: string, cellId: string, locked: string[]) {
  if (!crosswordTiles(puzzle).some(t => t.id === tileId) || !crosswordCells(puzzle).some(c => c.id === cellId)
    || puzzle.givens.includes(cellId) || locked.includes(cellId)) return placements;
  if (Object.entries(placements).some(([id, tile]) => tile === tileId && locked.includes(id))) return placements;
  const next = Object.fromEntries(Object.entries(placements).filter(([id, tile]) => id !== cellId && tile !== tileId));
  return { ...next, [cellId]: tileId };
}
// Each clue reserves a separate copy of every letter in its required row.
export type TwistClue = { id: string; clue: string; pattern: string; lane: number };
export type TwistPuzzle = { id: string; title: string; rings: string[]; offsets: number[]; clues: TwistClue[] };
export type TwistHarvest = { ids: string[]; offsets: number[] };
export const TWIST_SAVE_VERSION = 4;
export const TWIST_VISIBLE_COLUMNS = 6;
function makeTwist(id: string, title: string, entries: [string, string][]): TwistPuzzle {
  const clues = entries.map(([clue, pattern], i) => ({ id: String(i + 1), clue, pattern, lane: 2 }));
  const rings = Array.from({ length: 7 }, (_, row) => {
    const letters = clues.map(c => c.pattern[row]).filter(letter => letter !== '.');
    letters.push('AEIOSTR'[row], 'NRLAEOT'[row]);
    const ring = Array<string>(12).fill('.');
    letters.forEach((letter, index) => { ring[(index * 5 + row * 3) % 12] = letter; });
    return ring.join('');
  });
  return { id, title, clues, rings, offsets: [3, 1, 8, 5, 0, 10, 4] };
}
export const TWISTS: TwistPuzzle[] = [
  makeTwist('animal-harvest', 'A farm full of words', [
    ['Which three-letter pet purrs?', '.CAT...'],
    ['Which three-letter pet barks?', '..DOG..'],
    ['Which farm animal do you ride?', 'HORSE..'],
    ['Which woolly farm animal says baa?', '.SHEEP.'],
  ]),
  makeTwist('garden-harvest', 'Gather the garden', [
    ['What star warms the garden?', '..SUN..'],
    ['What can grow into a new plant?', '.SEED..'],
    ['What carries water up a plant?', '..STEM.'],
    ['Which plant part grows underground?', 'ROOT...'],
    ['What liquid do you pour on thirsty plants?', '.WATER.'],
  ]),
  makeTwist('kitchen-harvest', 'A busy kitchen', [
    ['What do you boil water in?', '..POT..'],
    ['What do you eat soup with?', '.SPOON.'],
    ['What holds a sandwich?', '.BREAD.'],
    ['What sweet food comes from bees?', '.HONEY.'],
  ]),
  makeTwist('weather-harvest', 'Look at the sky', [
    ['Drops that fall from clouds?', '.RAIN..'],
    ['Frozen rain in winter?', '.SNOW..'],
    ['A loud storm sound?', 'THUNDER'],
    ['Moving air you can feel?', '.WIND..'],
  ]),
  makeTwist('ocean-harvest', 'Down by the water', [
    ['A large body of salt water?', '..SEA..'],
    ['A sandy place by the water?', '.BEACH.'],
    ['A boat with sails?', '.SHIP..'],
    ['A very large sea animal?', '.WHALE.'],
  ]),
  makeTwist('space-harvest', 'Night sky words', [
    ['Our nearest star?', '..SUN..'],
    ['It lights the night sky?', '.MOON..'],
    ['A point of light in space?', '.STAR..'],
    ['Our planet?', '.EARTH.'],
  ]),
  makeTwist('sports-harvest', 'Game day', [
    ['You kick this in soccer?', '.BALL..'],
    ['Where points are scored?', '.GOAL..'],
    ['A group of players?', '.TEAM..'],
    ['You win the...?', '.GAME..'],
    ['A place with seats for fans?', '.ARENA.'],
  ]),
];
export function turnRing(puzzle: TwistPuzzle, offsets: number[], row: number, step: number) {
  if (!Number.isInteger(row) || !Number.isInteger(step) || row < 0 || row >= puzzle.rings.length) return offsets;
  return offsets.map((offset, i) => i === row ? wrap(offset + step, puzzle.rings[i].length) : offset);
}
export function twistLine(puzzle: TwistPuzzle, offsets: number[], lane: number, removed: string[] = []) {
  return puzzle.rings.map((ring, row) => {
    const col = wrap((offsets[row] ?? 0) + lane, ring.length);
    return removed.includes(`${row}:${col}`) ? '.' : ring[col];
  }).join('');
}
export function twistRemoved(history: TwistHarvest[]) { return history.flatMap(h => h.ids); }
export function twistProgress(puzzle: TwistPuzzle, history: TwistHarvest[]) {
  const total = puzzle.rings.join('').replaceAll('.', '').length;
  const target = puzzle.clues.reduce((sum, clue) => sum + clue.pattern.replaceAll('.', '').length, 0);
  const removed = twistRemoved(history).length;
  return { total, removed, percent: removed / total * 100, targetPercent: target / total * 100, complete: history.length === puzzle.clues.length };
}
export function harvestTwist(puzzle: TwistPuzzle, offsets: number[], history: TwistHarvest[]) {
  const clue = puzzle.clues[history.length];
  if (!clue || offsets.length !== 7 || !offsets.every(Number.isInteger) || twistLine(puzzle, offsets, clue.lane, twistRemoved(history)) !== clue.pattern) return history;
  const ids = [...clue.pattern].flatMap((letter, row) => letter === '.' ? [] : [`${row}:${wrap(offsets[row] + clue.lane, puzzle.rings[row].length)}`]);
  return [...history, { ids, offsets: [...offsets] }];
}
export function undoTwist(history: TwistHarvest[]) {
  const last = history[history.length - 1];
  return last ? { history: history.slice(0, -1), offsets: [...last.offsets] } : undefined;
}
export function solveTwist(puzzle: TwistPuzzle, history: TwistHarvest[] = [], reverse = false): number[] | undefined {
  const clue = puzzle.clues[history.length];
  if (!clue) return undefined;
  const removed = new Set(twistRemoved(history));
  const offsets = puzzle.rings.map((ring, row) => {
    const columns = Array.from({ length: ring.length }, (_, i) => reverse ? ring.length - 1 - i : i);
    const col = columns.find(col => (removed.has(`${row}:${col}`) ? '.' : ring[col]) === clue.pattern[row]);
    return col === undefined ? -1 : wrap(col - clue.lane, ring.length);
  });
  return offsets.every(offset => offset >= 0) ? offsets : undefined;
}
export function restoreTwistHistory(puzzle: TwistPuzzle, value: unknown): TwistHarvest[] {
  if (!Array.isArray(value) || value.length > puzzle.clues.length) return [];
  let history: TwistHarvest[] = [];
  for (const entry of value) {
    if (!entry || !Array.isArray(entry.offsets)) return [];
    const next = harvestTwist(puzzle, entry.offsets, history);
    if (next === history) return [];
    history = next;
  }
  return history;
}
export function twistSwipeSteps(dx: number, pitch: number) {
  return Math.abs(dx) < 12 ? 0 : Math.round(-dx / pitch) || (dx < 0 ? 1 : -1);
}
export function restoreTwistOffsets(index: number, version: unknown, offsets: unknown) {
  const puzzle = twistAt(index);
  if (version !== TWIST_SAVE_VERSION || !Array.isArray(offsets) || offsets.length !== 7 || !offsets.every(Number.isInteger)) return [...puzzle.offsets];
  return offsets.map((offset, row) => wrap(offset, puzzle.rings[row].length));
}

type BankWord = { word: string; clue: string };
const DOWN_BANK: BankWord[] = [
  { word: 'APPLE', clue: 'A crunchy orchard fruit' }, { word: 'HORSE', clue: 'A farm animal you can ride' },
  { word: 'SHEEP', clue: 'A woolly farm animal' }, { word: 'BREAD', clue: 'A baked loaf' },
  { word: 'SHELL', clue: 'A hard cover from the beach' }, { word: 'STORM', clue: 'Wind, rain, and thunder' },
  { word: 'CORAL', clue: 'A colorful reef animal' }, { word: 'WHALE', clue: 'A very large sea animal' },
  { word: 'PIANO', clue: 'A keyboard instrument' }, { word: 'FLUTE', clue: 'A woodwind you blow' },
  { word: 'RIVER', clue: 'A flowing body of water' }, { word: 'CLOUD', clue: 'A puff in the sky' },
  { word: 'CHAIR', clue: 'You sit on this' }, { word: 'TABLE', clue: 'A flat surface for meals' },
  { word: 'TRAIN', clue: 'It runs on tracks' }, { word: 'PLANE', clue: 'It flies through the sky' },
  { word: 'TIGER', clue: 'A striped big cat' }, { word: 'ROBOT', clue: 'A machine that can move' },
  { word: 'CANDY', clue: 'A sweet treat' }, { word: 'LEMON', clue: 'A sour yellow fruit' },
];
const ACROSS_BANK: BankWord[] = [
  { word: 'CAT', clue: 'A pet that purrs' }, { word: 'SUN', clue: 'Our nearest star' },
  { word: 'PIE', clue: 'Fruit baked inside a crust' }, { word: 'TEA', clue: 'A drink made from leaves' },
  { word: 'HEN', clue: 'A farm bird that lays eggs' }, { word: 'COW', clue: 'A farm animal that says moo' },
  { word: 'SEA', clue: 'A large body of salt water' }, { word: 'OWL', clue: 'A night bird' },
  { word: 'NET', clue: 'Used to catch fish' }, { word: 'BEE', clue: 'A buzzing garden insect' },
  { word: 'EAR', clue: 'You hear with this' }, { word: 'EEL', clue: 'A long, slippery fish' },
  { word: 'RAM', clue: 'A male sheep' }, { word: 'HAT', clue: 'Worn on the head' },
  { word: 'MAP', clue: 'It shows the way' }, { word: 'BUS', clue: 'A large vehicle for riders' },
  { word: 'CAR', clue: 'A vehicle with four wheels' }, { word: 'DOG', clue: 'A pet that barks' },
  { word: 'ANT', clue: 'A tiny marching insect' }, { word: 'ICE', clue: 'Frozen water' },
  { word: 'SKY', clue: 'It is blue on a clear day' }, { word: 'BED', clue: 'You sleep here' },
  { word: 'PEN', clue: 'Used for writing' }, { word: 'KEY', clue: 'It opens a lock' },
  { word: 'BOX', clue: 'A container with a lid' }, { word: 'BAG', clue: 'You carry things in this' },
  { word: 'JAM', clue: 'Fruit spread for toast' }, { word: 'RED', clue: 'The color of a ripe apple' },
  { word: 'BAT', clue: 'Used to hit a baseball' }, { word: 'CUP', clue: 'You drink from this' },
];
const TWIST_BANK: BankWord[] = [
  { word: 'CAT', clue: 'A pet that purrs' }, { word: 'DOG', clue: 'A pet that barks' },
  { word: 'HORSE', clue: 'A farm animal you ride' }, { word: 'SHEEP', clue: 'A woolly farm animal' },
  { word: 'SUN', clue: 'Our nearest star' }, { word: 'SEED', clue: 'It can grow into a plant' },
  { word: 'WATER', clue: 'You pour this on thirsty plants' }, { word: 'BREAD', clue: 'A baked loaf' },
  { word: 'HONEY', clue: 'Sweet food from bees' }, { word: 'RAIN', clue: 'Drops that fall from clouds' },
  { word: 'SNOW', clue: 'Frozen rain in winter' }, { word: 'WIND', clue: 'Moving air you can feel' },
  { word: 'BEACH', clue: 'A sandy place by the water' }, { word: 'WHALE', clue: 'A very large sea animal' },
  { word: 'MOON', clue: 'It lights the night sky' }, { word: 'STAR', clue: 'A point of light in space' },
  { word: 'EARTH', clue: 'Our planet' }, { word: 'BALL', clue: 'You kick this in soccer' },
  { word: 'GOAL', clue: 'Where points are scored' }, { word: 'TEAM', clue: 'A group of players' },
  { word: 'PIANO', clue: 'A keyboard instrument' }, { word: 'MUSIC', clue: 'Songs and tunes' },
  { word: 'TRAIN', clue: 'It runs on tracks' }, { word: 'PLANE', clue: 'It flies through the sky' },
  { word: 'TIGER', clue: 'A striped big cat' }, { word: 'ROBOT', clue: 'A machine that can move' },
  { word: 'CANDY', clue: 'A sweet treat' }, { word: 'LEMON', clue: 'A sour yellow fruit' },
  { word: 'CHAIR', clue: 'You sit on this' }, { word: 'TABLE', clue: 'A flat surface for meals' },
  { word: 'RIVER', clue: 'A flowing body of water' }, { word: 'CLOUD', clue: 'A puff in the sky' },
];
const CROSSWORD_TITLES = ['New crossing', 'Word cob', 'Letter weave', 'Kernel crossword', 'Another harvest'];
const TWIST_TITLES = ['Fresh rings', 'Another cob', 'Keep twisting', 'New harvest', 'More words'];

function rngFrom(seed: string) {
  let state = 2166136261;
  for (let i = 0; i < seed.length; i += 1) state = Math.imul(state ^ seed.charCodeAt(i), 16777619);
  return () => {
    state = Math.imul(state ^ (state >>> 15), 16843009) >>> 0;
    return state;
  };
}
function pick<T>(rng: () => number, list: T[]) {
  if (!list.length) return undefined;
  return list[rng() % list.length];
}
function twistPattern(word: string) {
  const clipped = word.slice(0, 7);
  const extra = 7 - clipped.length;
  const left = Math.floor(extra / 2);
  return `${'.'.repeat(left)}${clipped}${'.'.repeat(extra - left)}`;
}
function crossingPuzzle(id: string, title: string, down: BankWord, first: BankWord, second: BankWord, secondRow: number): CrosswordPuzzle | undefined {
  const firstAt = first.word.indexOf(down.word[0]);
  const secondAt = second.word.indexOf(down.word[secondRow] ?? '');
  if (firstAt < 0 || secondAt < 0 || first.word === second.word) return undefined;
  const columns = 8;
  return {
    id, title, columns, rows: down.word.length, givens: ['0:0'],
    slots: [
      { id: '1', clue: first.clue, answer: first.word, row: 0, column: wrap(0 - firstAt, columns), direction: 'across' },
      { id: '2', clue: down.clue, answer: down.word, row: 0, column: 0, direction: 'down' },
      { id: '3', clue: second.clue, answer: second.word, row: secondRow, column: wrap(0 - secondAt, columns), direction: 'across' },
    ],
  };
}
export function generateCrossword(seed: string): CrosswordPuzzle {
  const rng = rngFrom(seed);
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const down = pick(rng, DOWN_BANK);
    if (!down) continue;
    const row = Math.min(down.word.length - 2, 2 + (rng() % Math.max(1, down.word.length - 3)));
    const first = pick(rng, ACROSS_BANK.filter(item => item.word.includes(down.word[0])));
    const second = pick(rng, ACROSS_BANK.filter(item => item.word.includes(down.word[row]) && item.word !== first?.word));
    if (!first || !second) continue;
    const built = crossingPuzzle(`xw-${seed}`, pick(rng, CROSSWORD_TITLES) ?? 'New crossing', down, first, second, row);
    if (!built) continue;
    const letters = new Map<string, string>();
    let clash = false;
    for (const slot of built.slots) for (const cell of slotCells(slot, built.columns)) {
      if (letters.has(cell.id) && letters.get(cell.id) !== cell.letter) clash = true;
      letters.set(cell.id, cell.letter);
    }
    if (!clash && letters.size < built.slots.reduce((sum, slot) => sum + slot.answer.length, 0)) return built;
  }
  return { ...CROSSWORDS[0], id: `xw-${seed}`, title: pick(rng, CROSSWORD_TITLES) ?? 'New crossing' };
}
export function generateTwist(seed: string): TwistPuzzle {
  const rng = rngFrom(seed);
  const pool = [...TWIST_BANK];
  const picked: BankWord[] = [];
  let letters = 0;
  while (pool.length && (picked.length < 4 || letters < 16) && picked.length < 5) {
    const item = pool.splice(rng() % pool.length, 1)[0];
    if (picked.some(entry => entry.word === item.word)) continue;
    if (letters + item.word.length > 24 && picked.length >= 4) continue;
    picked.push(item);
    letters += item.word.length;
  }
  if (letters < 16) return TWISTS[rng() % TWISTS.length];
  return makeTwist(`tw-${seed}`, pick(rng, TWIST_TITLES) ?? 'Fresh rings', picked.map(item => [item.clue, twistPattern(item.word)]));
}
export function crosswordAt(index: number) {
  return CROSSWORDS[index] ?? generateCrossword(`endless-xw-${index}`);
}
export function twistAt(index: number) {
  return TWISTS[index] ?? generateTwist(`endless-tw-${index}`);
}
