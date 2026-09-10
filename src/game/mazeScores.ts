export type MazeFieldScore = {
  puzzleId: string;
  points: number;
  letters: number;
  bonus: number;
  elapsedMs: number;
  unaided: boolean;
  storm: boolean;
  coins: number;
  at: number;
};

function finiteInt(value: unknown, fallback = 0) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? n : fallback;
}

export function parseMazeFieldScore(puzzleId: string, value: unknown): MazeFieldScore | null {
  if (!puzzleId || !value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Partial<MazeFieldScore>;
  const points = Math.max(0, finiteInt(raw.points));
  const elapsedMs = Math.max(0, finiteInt(raw.elapsedMs));
  return {
    puzzleId,
    points,
    letters: Math.max(0, finiteInt(raw.letters)),
    bonus: Math.max(0, finiteInt(raw.bonus)),
    elapsedMs,
    unaided: raw.unaided === true,
    storm: raw.storm === true,
    coins: Math.max(0, finiteInt(raw.coins)),
    at: Math.max(0, finiteInt(raw.at, Date.now())),
  };
}

export function migrateMazeScores(value: unknown): Record<string, MazeFieldScore> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const next: Record<string, MazeFieldScore> = {};
  for (const [id, raw] of Object.entries(value as Record<string, unknown>)) {
    const parsed = parseMazeFieldScore(id, raw);
    if (parsed) next[id] = parsed;
  }
  return next;
}

export function migrateMazePendingSync(value: unknown): MazeFieldScore[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => {
      if (!item || typeof item !== 'object') return null;
      const id = typeof (item as MazeFieldScore).puzzleId === 'string' ? (item as MazeFieldScore).puzzleId : '';
      return parseMazeFieldScore(id, item);
    })
    .filter((item): item is MazeFieldScore => !!item);
}

export function isBetterMazeScore(next: MazeFieldScore, current?: MazeFieldScore | null) {
  if (!current) return true;
  if (next.points !== current.points) return next.points > current.points;
  return next.elapsedMs < current.elapsedMs;
}

export function queueMazeScoreSync(pending: MazeFieldScore[], entry: MazeFieldScore) {
  return [...pending.filter(item => item.puzzleId !== entry.puzzleId), entry];
}

export function recordMazeScore(
  scores: Record<string, MazeFieldScore>,
  pendingSync: MazeFieldScore[],
  entry: MazeFieldScore,
): { scores: Record<string, MazeFieldScore>; pendingSync: MazeFieldScore[]; recorded: boolean } {
  const current = scores[entry.puzzleId];
  if (!isBetterMazeScore(entry, current)) return { scores, pendingSync, recorded: false };
  return {
    scores: { ...scores, [entry.puzzleId]: entry },
    pendingSync: queueMazeScoreSync(pendingSync, entry),
    recorded: true,
  };
}

export function bestMazeScore(scores: Record<string, MazeFieldScore> | undefined, puzzleId: string) {
  return scores?.[puzzleId] ?? null;
}

export function mazeScoreTotals(scores: Record<string, MazeFieldScore> | undefined) {
  const list = Object.values(scores ?? {});
  return {
    fields: list.length,
    points: list.reduce((sum, item) => sum + item.points, 0),
    coins: list.reduce((sum, item) => sum + item.coins, 0),
  };
}

export function formatMazeScoreTime(elapsedMs: number) {
  const total = Math.max(0, Math.floor(elapsedMs / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
