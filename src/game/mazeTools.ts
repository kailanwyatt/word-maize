import { consumeBarnFind, type MazePuzzle, type MazeRun } from './maze';
import { cutMowerLine } from './mazeMower';
import { driveTractor } from './mazeTractor';
import { parseMazeVisibility } from './mazeVisibility';
import { clearWildlife } from './mazeWildlife';
import type { Inventory, ToolId } from './types';

export const RAINCOAT_BONUS_MS = 90_000;

export function mazeToolReason(puzzle: MazePuzzle, run: MazeRun, tool: ToolId): string | null {
  if (run.completed) return 'This field is already harvested.';
  if (tool === 'lantern') {
    const sight = parseMazeVisibility(puzzle.visibility);
    const stormy = !!puzzle.stormSeconds;
    if (sight.mode === 'day' && !stormy) return 'No mist or dusk to light on this field.';
    if (run.lanternActive) return 'The lantern is already lit.';
  }
  if (tool === 'raincoat') {
    if (!puzzle.stormSeconds) return 'The sky is clear — no forecast to stretch.';
    if (run.stormUntimed) return 'The field is already untimed.';
  }
  if (tool === 'huskClip' && run.huskClipActive) return 'Peeks are already longer.';
  if (tool === 'scarecrow' && !run.wildlife) return 'No wildlife to shoo right now.';
  if (tool === 'butterBrush' || tool === 'cornPicker') return 'That helper is for cob harvest.';
  return null;
}

export function barnChargesFor(run: MazeRun, inventory: Inventory, tool: ToolId) {
  return Math.max(0, (run.barnFinds[tool] ?? 0) + (inventory[tool] ?? 0));
}

export type MazeToolResult =
  | { ok: true; run: MazeRun; consumeInventory: boolean; toast: string }
  | { ok: false; reason: string };

export function applyMazeTool(puzzle: MazePuzzle, run: MazeRun, tool: ToolId, inventory: Inventory): MazeToolResult {
  const blocked = mazeToolReason(puzzle, run, tool);
  if (blocked) return { ok: false, reason: blocked };
  if (barnChargesFor(run, inventory, tool) < 1) return { ok: false, reason: 'The Barn is out of that helper.' };
  const fromFind = consumeBarnFind(run, tool);
  const charged = fromFind ?? run;
  if (tool === 'lantern') {
    return { ok: true, run: { ...charged, lanternActive: true, usedLantern: true }, consumeInventory: !fromFind, toast: 'Lantern lit. The rows open farther.' };
  }
  if (tool === 'raincoat') {
    return { ok: true, run: { ...charged, stormBonusMs: charged.stormBonusMs + RAINCOAT_BONUS_MS, usedRaincoat: true }, consumeInventory: !fromFind, toast: 'Raincoat on. The forecast stretches a little.' };
  }
  if (tool === 'huskClip') {
    return { ok: true, run: { ...charged, huskClipActive: true, usedHuskClip: true }, consumeInventory: !fromFind, toast: 'Husk clip set. Peeks last longer.' };
  }
  if (tool === 'scarecrow') {
    return { ok: true, run: { ...clearWildlife(charged), usedScarecrow: true }, consumeInventory: !fromFind, toast: 'Scarecrow posted. The pest moves on.' };
  }
  if (tool === 'mower') {
    const cut = cutMowerLine(puzzle, charged);
    if (!cut.ok) return { ok: false, reason: 'Face a corn wall to mow a line.' };
    return { ok: true, run: cut.run, consumeInventory: !fromFind, toast: 'Mower cut a path through the maize.' };
  }
  if (tool === 'tractor') {
    const drive = driveTractor(puzzle, charged);
    if (!drive.ok) return { ok: false, reason: 'The tractor cannot roll here.' };
    return { ok: true, run: drive.run, consumeInventory: !fromFind, toast: drive.harvested ? `Tractor rolled and harvested ${drive.harvested} letter${drive.harvested === 1 ? '' : 's'}.` : 'Tractor cut a short strip.' };
  }
  return { ok: false, reason: 'That helper is for cob harvest.' };
}
