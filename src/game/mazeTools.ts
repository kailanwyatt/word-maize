import { clipFacingHusk, consumeBarnFind, type MazePuzzle, type MazeRun } from './maze';
import { cutMowerLine } from './mazeMower';
import { driveTractor } from './mazeTractor';
import { parseMazeVisibility, lanternBrightenPercent, lanternCountFor, LANTERN_MAX_STACK } from './mazeVisibility';
import { clearWildlife } from './mazeWildlife';
import type { Inventory, ToolId } from './types';

export const RAINCOAT_BONUS_MS = 90_000;

export function mazeToolReason(puzzle: MazePuzzle, run: MazeRun, tool: ToolId): string | null {
  if (run.completed) return 'This field is already harvested.';
  if (tool === 'lantern') {
    const sight = parseMazeVisibility(puzzle.visibility);
    const stormy = !!puzzle.stormSeconds;
    if (sight.mode === 'day' && !stormy) return 'No mist or dusk to light on this field.';
    if (lanternCountFor(run) >= LANTERN_MAX_STACK) return 'The field is as bright as lanterns can make it.';
  }
  if (tool === 'raincoat') {
    if (!puzzle.stormSeconds) return 'The sky is clear — no forecast to stretch.';
    if (run.stormUntimed) return 'The field is already untimed.';
  }
  if (tool === 'huskClip') {
    const clip = clipFacingHusk(puzzle, run);
    if (!clip.ok) return clip.reason;
  }
  if (tool === 'scarecrow' && !run.wildlife) return 'No wildlife to shoo right now.';
  if (tool === 'butterBrush' || tool === 'cornPicker') return 'That helper is for cob harvest.';
  return null;
}

export function barnChargesFor(run: MazeRun, inventory: Inventory, tool: ToolId) {
  return Math.max(0, (run.barnFinds[tool] ?? 0) + (inventory[tool] ?? 0));
}

export type MazeToolResult =
  | { ok: true; run: MazeRun; consumeInventory: boolean; toast: string; tiles?: { col: number; row: number }[]; mowed?: { col: number; row: number }[]; cobId?: string }
  | { ok: false; reason: string };

export function applyMazeTool(puzzle: MazePuzzle, run: MazeRun, tool: ToolId, inventory: Inventory): MazeToolResult {
  const blocked = mazeToolReason(puzzle, run, tool);
  if (blocked) return { ok: false, reason: blocked };
  if (barnChargesFor(run, inventory, tool) < 1) return { ok: false, reason: 'The Barn is out of that helper.' };
  const fromFind = consumeBarnFind(run, tool);
  const charged = fromFind ?? run;
  if (tool === 'lantern') {
    const lanternCount = lanternCountFor(charged) + 1;
    const percent = lanternBrightenPercent(lanternCount);
    return {
      ok: true,
      run: { ...charged, lanternCount, lanternActive: true, usedLantern: true },
      consumeInventory: !fromFind,
      toast: lanternCount === 1
        ? `Lantern lit. The field is ${percent}% brighter.`
        : `Another lantern. The field is ${percent}% brighter.`,
    };
  }
  if (tool === 'raincoat') {
    return { ok: true, run: { ...charged, stormBonusMs: charged.stormBonusMs + RAINCOAT_BONUS_MS, usedRaincoat: true }, consumeInventory: !fromFind, toast: 'Raincoat on. The forecast stretches a little.' };
  }
  if (tool === 'huskClip') {
    const clip = clipFacingHusk(puzzle, charged);
    if (!clip.ok) return clip;
    return {
      ok: true,
      run: clip.run,
      cobId: clip.cobId,
      consumeInventory: !fromFind,
      toast: 'Husk clipped. The letter stays open for the rest of this field.',
    };
  }
  if (tool === 'scarecrow') {
    return { ok: true, run: { ...clearWildlife(charged), usedScarecrow: true }, consumeInventory: !fromFind, toast: 'Scarecrow posted. The pest moves on.' };
  }
  if (tool === 'mower') {
    const cut = cutMowerLine(puzzle, charged);
    if (!cut.ok) return { ok: false, reason: 'Face a corn wall to mow a line.' };
    return { ok: true, run: cut.run, consumeInventory: !fromFind, toast: 'Mower cut a path through the maize.', tiles: [{ col: Math.floor(charged.player.x), row: Math.floor(charged.player.y) }, ...cut.tiles] };
  }
  if (tool === 'tractor') {
    const drive = driveTractor(puzzle, charged);
    if (!drive.ok) return { ok: false, reason: 'The tractor cannot roll here.' };
    return {
      ok: true,
      run: drive.run,
      consumeInventory: !fromFind,
      toast: drive.harvested
        ? `Tractor rolled a swath and harvested ${drive.harvested} letter${drive.harvested === 1 ? '' : 's'}.`
        : 'Tractor mowed a 3-wide corn swath.',
      tiles: drive.path,
      mowed: drive.mowed,
    };
  }
  return { ok: false, reason: 'That helper is for cob harvest.' };
}
