export type CornVariety = 'yellow' | 'red' | 'white' | 'purple' | 'glass_gem';

export type ToolId = 'scarecrow' | 'butterBrush' | 'cornPicker';

export type Kernel = {
  id: string;
  row: number;
  column: number;
  layer: number;
  letter: string;
  harvested: boolean;
  variety: CornVariety;
};

export type Point = { x: number; y: number };

export type Level = {
  id: number;
  world: string;
  name: string;
  rows: number;
  columns: number;
  kernels: Kernel[];
  targetHarvestPercent: number;
  rotationEnabled: boolean;
  hintPaths: string[][];
};

export type Tuning = {
  kernelSize: number;
  touchMultiplier: number;
  movementThreshold: number;
  rotationSensitivity: number;
  rotationSnap: number;
  visibleColumns: number;
  harvestTarget: number;
  haptics: boolean;
};

export type Inventory = Record<ToolId, number>;

export type LevelProgress = {
  stars: 0 | 1 | 2 | 3;
  completed: boolean;
  bestPercent: number;
};

export const ENERGY_MAX = 5;
export const ENERGY_REGEN_MS = 20 * 60 * 1000;
export const STAR_GATE = 36;
export const WORLD_LEVEL_COUNT = 15;
