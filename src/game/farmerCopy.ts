import { MAZE_FARMERS, sanitizeFarmerName, type MazeFarmerId } from '../data/mazeFarmers';

export type FarmerSlot = 'nameplate' | 'speaker' | 'subject' | 'possessive' | 'your' | 'shop';

/** Character budget per slot. Longer profile names fall back to generic copy. */
const SLOT_MAX: Record<FarmerSlot, number> = {
  nameplate: 12,
  speaker: 14,
  subject: 14,
  possessive: 16,
  your: 12,
  shop: 12,
};

function named(raw: string): string {
  return sanitizeFarmerName(raw);
}

function possessiveOf(name: string): string {
  return /s$/i.test(name) ? `${name}'` : `${name}'s`;
}

function fits(value: string, slot: FarmerSlot): boolean {
  return value.length > 0 && value.length <= SLOT_MAX[slot];
}

/** Player-facing label for Farmer May, using the profile name when it fits the slot. */
export function farmerPhrase(rawName: string, slot: FarmerSlot): string {
  const name = named(rawName);
  switch (slot) {
    case 'nameplate':
      if (!name) return 'FARMER MAY';
      return fits(name, 'nameplate') ? name.toUpperCase() : 'THE FARMER';
    case 'speaker':
      if (!name) return 'FARMER MAY';
      return fits(name, 'speaker') ? name.toUpperCase() : 'YOU';
    case 'subject':
      if (!name) return 'Farmer May';
      return fits(name, 'subject') ? name : 'the farmer';
    case 'possessive':
      if (!name) return "Farmer May's";
      return fits(name, 'possessive') ? possessiveOf(name) : "the farmer's";
    case 'your':
      if (!name) return "Farmer May's";
      return fits(name, 'your') ? possessiveOf(name) : 'your';
    case 'shop': {
      if (!name) return "FARMER MAY'S";
      const poss = possessiveOf(name).toUpperCase();
      return fits(poss, 'shop') ? poss : 'YOUR';
    }
  }
}

/** Conversation nameplate: personal name if it fits, otherwise the chosen farmer profile. */
export function farmerTalkName(rawName: string, profileId: MazeFarmerId): string {
  const name = named(rawName);
  if (name) return farmerPhrase(rawName, 'speaker');
  return (MAZE_FARMERS.find(farmer => farmer.id === profileId)?.name ?? 'May').toUpperCase();
}

/** Swap Farmer May mentions in authored copy for the profile name, or a generic fallback. */
export function personalizeFarmerCopy(text: string, rawName: string): string {
  return text
    .replace(/FARMER MAY['’]S/g, farmerPhrase(rawName, 'shop'))
    .replace(/Farmer May['’]s/g, farmerPhrase(rawName, 'your'))
    .replace(/FARMER MAY/g, farmerPhrase(rawName, 'nameplate'))
    .replace(/Farmer May/g, farmerPhrase(rawName, 'subject'));
}
