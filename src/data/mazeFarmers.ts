export const MAZE_FARMER_IDS = ['patch', 'may', 'sprout', 'reed', 'cedar', 'lin', 'sol', 'nia', 'clay'] as const;
export type MazeFarmerId = (typeof MAZE_FARMER_IDS)[number];

export const MAZE_FARMERS: { id: MazeFarmerId; name: string }[] = [
  { id: 'may', name: 'May' },
  { id: 'sprout', name: 'Sprout' },
  { id: 'reed', name: 'Reed' },
  { id: 'patch', name: 'Patch' },
  { id: 'cedar', name: 'Cedar' },
  { id: 'lin', name: 'Lin' },
  { id: 'sol', name: 'Sol' },
  { id: 'nia', name: 'Nia' },
  { id: 'clay', name: 'Clay' },
];

export const FARMER_NAME_MAX = 18;

export function isMazeFarmerId(value: unknown): value is MazeFarmerId {
  return typeof value === 'string' && (MAZE_FARMER_IDS as readonly string[]).includes(value);
}

export function editFarmerName(value: string): string {
  return value.replace(/[^\p{L}\p{M}\p{N} '\-]/gu, '').slice(0, FARMER_NAME_MAX);
}

export function sanitizeFarmerName(value: unknown): string {
  if (typeof value !== 'string') return '';
  return editFarmerName(value).replace(/\s+/g, ' ').trim();
}
