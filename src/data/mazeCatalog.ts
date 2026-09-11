import campaign from './maze-campaign-levels.json';

export type MazeVisibility = 'day' | 'evening' | 'mist' | 'storm';
export type MazeWildlifeTag = string;
export type MazeTopology = 'legacy' | 'fork' | 'loop' | 'hub' | 'double-loop' | 'courtyards' | 'sectors' | 'branches';
export type MazePresentation = 'shown' | 'partial' | 'clue';

export type MazeCampaignTarget = {
  number: number;
  chapter: number;
  chapterLevel: number;
  id: string;
  title: string;
  answer: string;
  normalizedAnswer: string;
  clue: string;
  presentation: MazePresentation;
  givenMask: string | null;
  width: number;
  height: number;
  topology: MazeTopology;
  totalCobs: number;
  requiredCobs: number;
  extraLetters: string;
  decoyLetters: string;
  revealSeconds: number;
  visibility: string;
  wildlife: string;
  stormSeconds: number | null;
  lesson: string;
  preserveExistingBoard: boolean;
};

export const MAZE_CAMPAIGN_CONTENT_VERSION = 'campaign-v2';

export const MAZE_CAMPAIGN_TARGETS = campaign.levels as MazeCampaignTarget[];

export const MAZE_CHAPTER_META = [
  { id: 1, title: 'Sandy Point', description: 'Explore, remember, and harvest.' },
  { id: 2, title: 'Green Valley', description: 'Choose routes and manage more letters.' },
  { id: 3, title: 'Zion Word Hunt', description: 'Solve the clue, then harvest.' },
  { id: 4, title: 'Wingfield', description: 'Navigate larger sectors.' },
  { id: 5, title: 'Crow Country', description: 'Recover from wildlife events.' },
  { id: 6, title: 'Half Moon', description: 'Find letters in limited light.' },
  { id: 7, title: 'Misty Nevis Peak', description: 'Remember explored ground in mist.' },
  { id: 8, title: 'Storm Season', description: 'Finish before the forecast closes.' },
] as const;

export function validateMazeCampaignTargets(targets: MazeCampaignTarget[] = MAZE_CAMPAIGN_TARGETS) {
  const issues: string[] = [];
  if (targets.length !== 80) issues.push(`Expected 80 campaign targets, found ${targets.length}`);
  const ids = new Set<string>();
  const answers = new Set<string>();
  targets.forEach((target, index) => {
    if (target.number !== index + 1) issues.push(`${target.id}: display number ${target.number} should be ${index + 1}`);
    if (ids.has(target.id)) issues.push(`Duplicate campaign id ${target.id}`);
    ids.add(target.id);
    const normalized = target.normalizedAnswer.replace(/[^A-Z]/g, '');
    if (normalized !== target.normalizedAnswer) issues.push(`${target.id}: normalizedAnswer must be A-Z only`);
    if (answers.has(normalized)) issues.push(`${target.id}: duplicate answer ${normalized}`);
    answers.add(normalized);
    if (normalized.length !== target.requiredCobs) issues.push(`${target.id}: requiredCobs ${target.requiredCobs} != ${normalized.length} harvest letters`);
    const inventory = normalized.length + target.extraLetters.length + target.decoyLetters.length;
    if (inventory !== target.totalCobs) issues.push(`${target.id}: letter inventory ${inventory} != totalCobs ${target.totalCobs}`);
    if (target.width < 5 || target.height < 5) issues.push(`${target.id}: maze is too small`);
    if (target.revealSeconds < 3) issues.push(`${target.id}: reveal shorter than campaign minimum`);
  });
  return issues;
}
