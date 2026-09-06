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
