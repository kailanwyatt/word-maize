export type CornVariety = 'sweet' | 'white' | 'flint' | 'popcorn' | 'blue' | 'golden';

export type ToolId = 'scarecrow' | 'butterBrush' | 'cornPicker' | 'mower' | 'tractor' | 'lantern' | 'raincoat' | 'huskClip';
export const TOOL_IDS: ToolId[] = ['scarecrow', 'butterBrush', 'cornPicker', 'mower', 'tractor', 'lantern', 'raincoat', 'huskClip'];
export const MAZE_TOOL_IDS: ToolId[] = ['lantern', 'mower', 'tractor', 'raincoat', 'huskClip', 'scarecrow'];
export type ObstacleKind = 'caterpillar' | 'crow' | 'squirrel' | 'weed' | 'web' | 'frost';
export type LevelObstacle = { id: string; kind: ObstacleKind; kernelId: string; countdown: number; anchorIds?: string[]; strength?: number };
export type WeatherKind = 'rain' | 'wind' | 'drought' | 'storm';
export type LevelWeather = { kind: WeatherKind; interval: number; coinBonusPerLetter?: number };

export type Kernel = {
  id: string;
  row: number;
  column: number;
  layer: number;
  letter: string;
  harvested: boolean;
  eaten?: boolean;
  variety: CornVariety;
  dormant?: boolean;
  armored?: boolean;
  cracked?: boolean;
  popKernel?: boolean;
  popCharge?: number;
  moonlit?: boolean;
  festival?: boolean;
};

export type Point = { x: number; y: number };

export type LevelObjective = {
  harvestPercent: number;
  minWords?: number;
  minLongestWord?: number;
  minLayersRevealed?: number;
};

export type StarGoal =
  | { id: string; kind: 'longestWord'; value: number; label: string }
  | { id: string; kind: 'maxWords'; value: number; label: string }
  | { id: string; kind: 'noTools'; label: string }
  | { id: string; kind: 'layersRevealed'; value: number; label: string }
  | { id: string; kind: 'harvestPercent'; value: number; label: string };

export type Level = {
  id: number;
  cornType: CornVariety;
  world: string;
  name: string;
  rows: number;
  columns: number;
  kernels: Kernel[];
  targetHarvestPercent: number;
  objective: LevelObjective;
  starGoals: [StarGoal, StarGoal];
  rewardCoins: number;
  guaranteedWords: string[];
  tutorial: string[];
  educationalFact?: string;
  story?: { speaker: string; title: string; text: string };
  shuffleOnStart: boolean;
  rotationEnabled: boolean;
  hintPaths: string[][];
  obstacles: LevelObstacle[];
  weather?: LevelWeather;
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
  bestWordsFound?: number;
  bestLongestWord?: string;
  completedGoalIds?: string[];
};

export const ENERGY_MAX = 5;
// Five attempts with a 20-minute refill keeps an MVP session generous while
// still giving energy, daily rewards, and rewarded refills a clear purpose.
export const ENERGY_REGEN_MS = 20 * 60 * 1000;
export const STAR_GATE = 36;
export const WORLD_LEVEL_COUNT = 15;
