import { MAZE_CAMPAIGN_TARGETS, validateMazeCampaignTargets } from './mazeCatalog';
import { parseMazeAscii, validateMazePuzzle, type MazePuzzle } from '../game/maze';
import { buildMazeLevel, materializeCampaignLevel, type MazeLevel } from '../game/mazeCampaign';

export const CORN_MAZE = parseMazeAscii({
  id: 'sunny-acres-corn',
  seed: 'sunny-acres-corn-v1',
  chapter: 1,
  title: 'Sunny Acres',
  answer: 'CORN',
  clue: 'The crop this maze is made of.',
  presentationMode: 'full-word',
  revealDurationMs: 4000,
  ascii: `
###########
#.........#
#.#C#.#O#.#
#.#.#.#.#.#
#.........#
#....S....#
#.........#
#.#.#.#.#.#
#.#R#.#N#.#
#.........#
#.#A#.#E#.#
#.........#
###########
`,
});

const LEGACY_BOARDS: Record<string, MazeLevel> = {
  'sunny-acres-corn': {
    ...CORN_MAZE,
    order: 1,
    lesson: 'explore',
    objective: 'Learn to inspect, remember, and harvest.',
    tip: 'Finding a different letter is useful information. It costs nothing.',
    displayAnswer: 'CORN',
    contentVersion: 'sunny-acres-corn-v1',
    topology: 'legacy',
    landmarks: [
      { id: 'rock', name: 'Rock', origin: { col: 1, row: 1 } },
      { id: 'signpost', name: 'Signpost', origin: { col: 9, row: 1 } },
      { id: 'scarecrow', name: 'Scarecrow', origin: { col: 9, row: 5 } },
      { id: 'sunflowers', name: 'Sunflowers', origin: { col: 1, row: 11 } },
    ],
    playable: true,
  },
  'sunny-hen': buildMazeLevel({ id: 'sunny-hen', order: 2, chapter: 1, title: 'At the fork', answer: 'HEN', clue: 'A female chicken.', layout: 'fork', decoys: 'AO', revealDurationMs: 4000, lesson: 'branches', objective: 'Remember which branch holds each letter.', tip: 'Use the central junction as your landmark.' }),
  'sunny-gate': buildMazeLevel({ id: 'sunny-gate', order: 3, chapter: 1, title: 'The return trip', answer: 'GATE', clue: 'An entrance to the field.', layout: 'fork', decoys: 'NR', revealDurationMs: 4000, lesson: 'return', objective: 'Return to a letter you noticed earlier.', tip: 'The next letter may be back near the start. Notice plants along the way.' }),
  'sunny-apple': buildMazeLevel({ id: 'sunny-apple', order: 4, chapter: 1, title: 'Two Ps in the orchard', answer: 'APPLE', clue: 'An orchard fruit.', layout: 'fork', decoys: 'ON', revealDurationMs: 4000, lesson: 'duplicates', objective: 'Collect separate copies of repeated letters.', tip: 'APPLE needs two different P cobs. Harvesting one leaves the other available.' }),
  'sunny-sheep': buildMazeLevel({ id: 'sunny-sheep', order: 5, chapter: 1, title: 'Around the field', answer: 'SHEEP', clue: 'A woolly farm animal.', layout: 'loop', decoys: 'AT', revealDurationMs: 4000, lesson: 'loops', objective: 'Try another way around instead of always retracing your steps.', tip: 'The outer path is a loop. Remember which side of the field you explored.' }),
  'green-plant': buildMazeLevel({ id: 'green-plant', order: 11, chapter: 2, title: 'Keep it in mind', answer: 'PLANT', clue: 'Something growing in the garden.', layout: 'loop', decoys: 'EOR', revealDurationMs: 3500, lesson: 'return', objective: 'Remember letters after their husks close.', tip: 'An inspected husk marks a visit, not the letter. There is no cost to checking again.' }),
  'green-banana': buildMazeLevel({ id: 'green-banana', order: 12, chapter: 2, title: 'A choice of As', answer: 'BANANA', clue: 'A curved yellow fruit.', layout: 'loop', decoys: 'ET', extraCopies: 'A', revealDurationMs: 3500, lesson: 'duplicates', objective: 'Choose between matching cobs on different routes.', tip: 'Any A works. Choose a nearby one, or one on your route toward a remembered N.' }),
  'green-carrot': buildMazeLevel({ id: 'green-carrot', order: 13, chapter: 2, title: 'The branching garden', answer: 'CARROT', clue: 'An orange root vegetable.', layout: 'branches', decoys: 'EN', revealDurationMs: 3500, lesson: 'branches', objective: 'Distinguish similar branches using their junctions.', tip: 'Think of letters by branch: left fork, upper loop, or the route back to the start.' }),
  'green-harvest': buildMazeLevel({ id: 'green-harvest', order: 14, chapter: 2, title: 'Scout and return', answer: 'HARVEST', clue: 'Gather a ripe crop.', layout: 'branches', decoys: 'ION', revealDurationMs: 3000, lesson: 'return', objective: 'Build a mental map before returning for later letters.', tip: 'You may inspect future letters while looking for H. Exploration never lowers your score.' }),
  'green-sunflower': buildMazeLevel({ id: 'green-sunflower', order: 15, chapter: 2, title: 'The long harvest', answer: 'SUNFLOWER', clue: 'A tall flower with a sunny face.', layout: 'branches', decoys: 'AI', extraCopies: 'R', revealDurationMs: 3000, lesson: 'plan', objective: 'Combine route memory and duplicate choices in a longer word.', tip: 'Take your time. Think about the next two letters before choosing which branch to visit.' }),
};

export const MAZE_PUZZLES: MazeLevel[] = MAZE_CAMPAIGN_TARGETS.map(target => {
  if (target.preserveExistingBoard && LEGACY_BOARDS[target.id]) {
    return { ...LEGACY_BOARDS[target.id], order: target.number, chapter: target.chapter };
  }
  return materializeCampaignLevel(target);
});

export const PLAYABLE_MAZE_IDS = MAZE_PUZZLES.map(level => level.id);

export function mazePuzzleById(id: string) {
  return MAZE_PUZZLES.find(puzzle => puzzle.id === id) ?? MAZE_PUZZLES[0];
}

export function validateMazeLevels(puzzles: MazePuzzle[] = MAZE_PUZZLES) {
  return [
    ...validateMazeCampaignTargets(),
    ...puzzles.flatMap(puzzle => validateMazePuzzle(puzzle).map(issue => `${puzzle.id}: ${issue}`)),
    ...MAZE_PUZZLES.filter(level => level.cobs.length !== MAZE_CAMPAIGN_TARGETS.find(target => target.id === level.id)?.totalCobs)
      .map(level => `${level.id}: cob count does not match campaign target`),
  ];
}
