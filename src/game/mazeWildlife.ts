import {
  availableCobs,
  cobsInRange,
  harvestLetters,
  liveCobs,
  type MazePuzzle,
  type MazeRun,
  type MazeWildlifeKind,
} from './maze';
import { mazeDistances } from './mazeCampaign';

export const WILDLIFE_WARNING: Record<MazeWildlifeKind, number> = {
  crow: 10_000,
  squirrel: 8_000,
  caterpillar: 12_000,
};

export function wildlifeSchedule(tag = 'none'): MazeWildlifeKind[] {
  if (!tag || tag === 'none') return [];
  if (tag === 'crow+caterpillar') return ['crow', 'caterpillar'];
  if (tag === 'three-sequential') return ['crow', 'squirrel', 'caterpillar'];
  const [kind, count] = tag.split('-');
  if (kind === 'crow' || kind === 'squirrel' || kind === 'caterpillar') {
    return Array.from({ length: Math.max(1, Number(count) || 1) }, () => kind);
  }
  return [];
}

function hashPick(seed: string, index: number) {
  let hash = 2166136261;
  for (const char of `${seed}:${index}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}

function lastRequiredProtected(puzzle: MazePuzzle, run: MazeRun, cobId: string) {
  const leftover = harvestLetters(puzzle.answer).slice(run.nextAnswerIndex);
  if (leftover.length !== 1) return false;
  const letter = leftover[0];
  const matching = availableCobs(puzzle, run).filter(cob => cob.letter === letter);
  return matching.length === 1 && matching[0].id === cobId;
}

function eligibleWildlifeTargets(puzzle: MazePuzzle, run: MazeRun) {
  return availableCobs(puzzle, run).filter(cob => {
    if (run.harvestedCobIds.includes(cob.id)) return false;
    if (lastRequiredProtected(puzzle, run, cob.id)) return false;
    if (cobsInRange(puzzle, run).some(item => item.id === cob.id)) return false;
    return true;
  });
}

function pickHost(puzzle: MazePuzzle, run: MazeRun, cobId: string) {
  const cob = liveCobs(puzzle, run).find(item => item.id === cobId);
  if (!cob) return null;
  const occupied = new Set(liveCobs(puzzle, run).filter(item => !run.harvestedCobIds.includes(item.id)).map(item => `${item.wall.col},${item.wall.row}`));
  const distances = mazeDistances(puzzle, cob.inspect, run.mowedKeys);
  const hosts = (puzzle.reservedHosts ?? []).filter(host => {
    if (occupied.has(`${host.col},${host.row}`)) return false;
    const inspect = [[0, -1], [1, 0], [0, 1], [-1, 0]]
      .map(([dc, dr]) => ({ col: host.col + dc, row: host.row + dr }))
      .find(cell => (distances.get(`${cell.col},${cell.row}`) ?? 99) >= 4 && (distances.get(`${cell.col},${cell.row}`) ?? 0) <= 8);
    return !!inspect;
  });
  if (!hosts.length) return null;
  const host = hosts[hashPick(puzzle.seed, run.wildlifeResolved) % hosts.length];
  const inspect = [[0, -1], [1, 0], [0, 1], [-1, 0]]
    .map(([dc, dr]) => ({ col: host.col + dc, row: host.row + dr }))
    .find(cell => distances.has(`${cell.col},${cell.row}`))!;
  return { wall: host, inspect };
}

export function tickWildlife(puzzle: MazePuzzle, run: MazeRun): MazeRun {
  const schedule = wildlifeSchedule(puzzle.wildlife);
  if (run.completed || !schedule.length) return run;
  let next = run.helpMarker && run.elapsedActiveMs >= run.helpMarker.hideAtElapsedMs ? { ...run, helpMarker: null } : run;
  if (puzzle.stormSeconds && !next.stormUntimed && next.elapsedActiveMs >= (puzzle.stormSeconds - 60) * 1000 && next.wildlife?.kind === 'crow') {
    next = { ...next, wildlife: null, wildlifeResolved: next.wildlifeResolved + 1 };
  }
  if (next.wildlife) {
    if (next.wildlife.phase === 'warning' && next.elapsedActiveMs >= next.wildlife.resolveAtMs) {
      if (next.wildlife.kind === 'squirrel') {
        const dest = next.wildlife.to ?? pickHost(puzzle, next, next.wildlife.cobId);
        const cob = liveCobs(puzzle, next).find(item => item.id === next.wildlife!.cobId);
        if (!dest || !cob) return { ...next, wildlife: null, wildlifeResolved: next.wildlifeResolved + 1 };
        return {
          ...next,
          wildlife: { ...next.wildlife, phase: 'active', to: dest, from: cob },
          cobMoves: { ...next.cobMoves, [cob.id]: dest },
          vacated: [...next.vacated, cob.wall],
        };
      }
      return { ...next, wildlife: { ...next.wildlife, phase: 'active' } };
    }
    return next;
  }
  const kind = schedule[next.wildlifeResolved];
  if (!kind || next.harvestedCobIds.length < 1) return next;
  const delay = (puzzle.wildlifeIntro ? 15_000 : 25_000) + next.wildlifeResolved * 25_000;
  if (next.elapsedActiveMs < delay) return next;
  const targets = eligibleWildlifeTargets(puzzle, next);
  if (!targets.length) return { ...next, wildlifeResolved: next.wildlifeResolved + 1 };
  const cob = targets[hashPick(puzzle.seed, next.wildlifeResolved + next.harvestedCobIds.length) % targets.length];
  const to = kind === 'squirrel' ? pickHost(puzzle, next, cob.id) : undefined;
  if (kind === 'squirrel' && !to) return { ...next, wildlifeResolved: next.wildlifeResolved + 1 };
  return {
    ...next,
    wildlife: {
      kind,
      cobId: cob.id,
      phase: 'warning',
      startMs: next.elapsedActiveMs,
      resolveAtMs: next.elapsedActiveMs + WILDLIFE_WARNING[kind],
      to: to ?? undefined,
    },
  };
}

export function wildlifeInRange(puzzle: MazePuzzle, run: MazeRun) {
  if (!run.wildlife) return false;
  return cobsInRange(puzzle, run, 0.9).some(cob => cob.id === run.wildlife?.cobId)
    || (run.wildlife.from && Math.hypot(run.player.x - (run.wildlife.from.inspect.col + 0.5), run.player.y - (run.wildlife.from.inspect.row + 0.5)) <= 0.9);
}

export function clearWildlife(run: MazeRun): MazeRun {
  if (!run.wildlife) return run;
  return { ...run, wildlife: null, wildlifeResolved: run.wildlifeResolved + 1 };
}

export function wildlifeActionLabel(kind: MazeWildlifeKind) {
  return kind === 'caterpillar' ? 'BRUSH' : 'SHOO';
}

export function wildlifeHoldMs(kind: MazeWildlifeKind) {
  return kind === 'caterpillar' ? 1200 : 800;
}
