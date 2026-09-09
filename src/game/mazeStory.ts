export type StorySpeaker = 'May' | 'Patch';

export type StoryLine = {
  speaker: StorySpeaker;
  pose?: 'welcome' | 'celebrate' | 'speaking' | 'worried' | 'pointing';
  text: string;
};

export type StoryBeat = {
  id: string;
  lines: StoryLine[];
};

const CHAPTER_OPEN: Record<number, StoryBeat> = {
  1: {
    id: 'chapter:1',
    lines: [
      { speaker: 'May', pose: 'welcome', text: 'Walk the rows, face a plant to peek its letter, then harvest in spelling order. Wrong plants cost nothing.' },
    ],
  },
  2: {
    id: 'chapter:2',
    lines: [
      { speaker: 'Patch', pose: 'pointing', text: 'Green Fields stretch farther. An inspected husk remembers your visit, not the letter. Use the junctions.' },
    ],
  },
  3: {
    id: 'chapter:3',
    lines: [
      { speaker: 'May', pose: 'welcome', text: 'Word Hunt first. Solve the clue, then walk. The maize will not show the next letter until the word is in.' },
    ],
  },
  4: {
    id: 'chapter:4',
    lines: [
      { speaker: 'May', pose: 'welcome', text: 'Tall Corn means bigger sectors. Landmarks — wells, mills, hay — keep your place when the rows look the same.' },
    ],
  },
  5: {
    id: 'chapter:5',
    lines: [
      { speaker: 'Patch', pose: 'worried', text: 'Crow Country. A bird, a squirrel, or a wrap might borrow a plant. Shoo them. The letter comes back.' },
    ],
  },
  6: {
    id: 'chapter:6',
    lines: [
      { speaker: 'May', pose: 'welcome', text: 'Evening light is short. Stay near the lamp of your path, and open the field map if a junction goes dim.' },
    ],
  },
  7: {
    id: 'chapter:7',
    lines: [
      { speaker: 'Patch', pose: 'speaking', text: 'Mist hides what you have not walked. Explored ground stays in mind. A lantern in the Barn helps, but your feet still teach the maze.' },
    ],
  },
  8: {
    id: 'chapter:8',
    lines: [
      { speaker: 'May', pose: 'welcome', text: 'Storm Season. Finish before the forecast if you can. Shelter still unlocks the field — the storm ribbon wants the original clock.' },
    ],
  },
};

export const STORY_BEATS = {
  firstField: {
    id: 'field:sunny-acres-corn',
    lines: [
      { speaker: 'May', pose: 'welcome', text: 'You are the valley’s Word Harvester. Peek, remember, harvest CORN in order, and we start the season.' },
    ],
  } satisfies StoryBeat,
  wildlife: {
    id: 'mechanic:wildlife',
    lines: [
      { speaker: 'Patch', pose: 'worried', text: 'Something is after a plant. Walk up and shoo, or pull a Scarecrow from the Barn. Letters always come back.' },
    ],
  } satisfies StoryBeat,
  mist: {
    id: 'mechanic:mist',
    lines: [
      { speaker: 'Patch', pose: 'speaking', text: 'The valley filled in. Walk to remember the ground. The Barn lantern only lights farther around you — it will not paint letters you have not found.' },
    ],
  } satisfies StoryBeat,
  storm: {
    id: 'mechanic:storm',
    lines: [
      { speaker: 'May', pose: 'welcome', text: 'The forecast is running. Harvest before it closes for the storm ribbon. If you take shelter, the field still counts.' },
    ],
  } satisfies StoryBeat,
  clue: {
    id: 'mechanic:clue',
    lines: [
      { speaker: 'May', pose: 'welcome', text: 'Type the word from the clue first. Reveal Answer is always free, but it sets the Unaided ribbon aside.' },
    ],
  } satisfies StoryBeat,
  finale: {
    id: 'finale',
    lines: [
      { speaker: 'May', pose: 'celebrate', text: 'Golden Harvest is in. The festival lamps can go up.' },
      { speaker: 'Patch', pose: 'speaking', text: 'Free Play keeps the fields open, and the Fair still has word games if you want more coins for the Barn.' },
    ],
  } satisfies StoryBeat,
};

export function chapterOpenBeat(chapter: number) {
  return CHAPTER_OPEN[chapter] ?? null;
}

export function chapterClearBeat(chapter: number): StoryBeat {
  return {
    id: `complete:${chapter}`,
    lines: [
      { speaker: 'May', pose: 'celebrate', text: chapter >= 8
        ? 'The last chapter is harvested. Walk the map whenever you miss a field.'
        : 'Chapter harvested. The next fields are waiting when you are ready.' },
    ],
  };
}

export function nextStoryBeat(input: {
  campaign: boolean;
  skipStory: boolean;
  seen: string[];
  puzzleId: string;
  chapter: number;
  chapterLevel: number;
  started: boolean;
  solved: boolean;
  needsClue: boolean;
  mist: boolean;
  storm: boolean;
  wildlife: boolean;
  completed: boolean;
  chapterDone: boolean;
  finale: boolean;
}): StoryBeat | null {
  if (!input.campaign || input.skipStory) return null;
  const unseen = (beat: StoryBeat | null) => (beat && !input.seen.includes(beat.id) ? beat : null);
  if (input.completed && input.finale) return unseen(STORY_BEATS.finale);
  if (input.completed && input.chapterDone) return unseen(chapterClearBeat(input.chapter));
  if (!input.started) {
    if (input.puzzleId === 'sunny-acres-corn') return unseen(STORY_BEATS.firstField);
    if (input.chapterLevel === 1) return unseen(chapterOpenBeat(input.chapter));
    if (input.needsClue && !input.solved) return unseen(STORY_BEATS.clue);
    if (input.mist) return unseen(STORY_BEATS.mist);
    if (input.storm) return unseen(STORY_BEATS.storm);
  }
  if (input.started && input.wildlife) return unseen(STORY_BEATS.wildlife);
  return null;
}
