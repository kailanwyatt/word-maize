import { Inventory } from './types';

export type RestorationMilestone = {
  id: string;
  requiredLevel: number;
  title: string;
  description: string;
  coins: number;
  tools?: Partial<Inventory>;
};

export const RESTORATION_MILESTONES: RestorationMilestone[] = [
  { id: 'lower-field', requiredLevel: 3, title: 'Wake the Lower Field', description: 'Fresh rows begin growing beside Farmer May’s barn.', coins: 75, tools: { cornPicker: 1 } },
  { id: 'farm-road', requiredLevel: 6, title: 'Reopen the Farm Road', description: 'The creek road is cleared for the harvest wagon.', coins: 100, tools: { scarecrow: 1 } },
  { id: 'barn-roof', requiredLevel: 10, title: 'Repair the Old Barn', description: 'The first bumper crop gives the barn a strong new roof.', coins: 150, tools: { butterBrush: 1 } },
  { id: 'festival-wagon', requiredLevel: 12, title: 'Fill the Festival Wagon', description: 'Golden kernels are packed for the valley celebration.', coins: 175, tools: { cornPicker: 1 } },
  { id: 'sweet-corn-restored', requiredLevel: 15, title: 'Restore Sweet Corn Fields', description: 'The farm shines again and the road to Crow Creek opens.', coins: 250, tools: { scarecrow: 1, butterBrush: 1 } },
  { id: 'creek-bridge', requiredLevel: 20, title: 'Rebuild the Creek Bridge', description: 'A sturdier crossing keeps the harvest wagon above the water.', coins: 200, tools: { scarecrow: 1 } },
  { id: 'crow-creek-restored', requiredLevel: 30, title: 'Restore Crow Creek', description: 'The scarecrow line holds and the mill road opens toward the orchard.', coins: 300, tools: { scarecrow: 1, cornPicker: 1 } },
  { id: 'orchard-gate', requiredLevel: 38, title: 'Clear the Orchard Gate', description: 'Vines are cut back so cider barrels can roll through.', coins: 275, tools: { butterBrush: 1 } },
  { id: 'orchard-restored', requiredLevel: 45, title: 'Restore Orchard Hollow', description: 'The mill garden shines and lanterns point to Moonlight Maize.', coins: 350, tools: { butterBrush: 1, cornPicker: 1 } },
  { id: 'lantern-trail', requiredLevel: 52, title: 'Light the Lantern Trail', description: 'Night rows stay visible for the festival wagons.', coins: 325, tools: { scarecrow: 1 } },
  { id: 'moonlight-restored', requiredLevel: 60, title: 'Restore Moonlight Maize', description: 'The Harvest Festival can begin with every farm shining.', coins: 500, tools: { scarecrow: 1, butterBrush: 1, cornPicker: 1 } },
];

export function completedRestorationStage(completedIds: number[]): number {
  const completed = new Set(completedIds);
  return RESTORATION_MILESTONES.filter(milestone => completed.has(milestone.requiredLevel)).length;
}

export function nextRestorationMilestone(completedIds: number[], claimedIds: string[]) {
  const completed = new Set(completedIds);
  const claimed = new Set(claimedIds);
  return RESTORATION_MILESTONES.find(milestone => !claimed.has(milestone.id) || !completed.has(milestone.requiredLevel));
}

export function claimableRestorationMilestone(completedIds: number[], claimedIds: string[]) {
  const completed = new Set(completedIds);
  const claimed = new Set(claimedIds);
  return RESTORATION_MILESTONES.find(milestone => completed.has(milestone.requiredLevel) && !claimed.has(milestone.id));
}
