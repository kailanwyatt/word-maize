import { seededRandom } from './endless';

export const POP_WORDS = ['CORN', 'FARM', 'MAIZE', 'PLANT', 'HARVEST', 'FIELD', 'SEED'] as const;
export const POP_SESSION_MS = 40_000;
export const POP_WORD_BONUS_MS = 8_000;
export const POP_TIME_CAP_MS = 75_000;
export const POP_MAX_LIVE = 3;
export const POP_HIT_RADIUS = 0.11;
export const POP_WORD_CLEAR_MS = 650;
export const POP_CORRECT_POINTS = 10;
export const POP_WORD_BONUS = 50;
export const POP_MISS_PENALTY = 5;
export const POP_LANES = [0.24, 0.5, 0.76];

export type PopKind = 'letter' | 'plain' | 'popcorn';
export type PopPhase = 'playing' | 'wordClear' | 'results';
export type PopFlight = 'flying' | 'resolving';

export type PopObject = {
  id: string;
  kind: PopKind;
  letter: string | null;
  startX: number;
  startY: number;
  peakX: number;
  peakY: number;
  endX: number;
  riseMs: number;
  hangMs: number;
  fallMs: number;
  bob: number;
  rotation: number;
  rotationSpeed: number;
  scale: number;
  bornAt: number;
  flight: PopFlight;
};

export type PopRun = {
  seed: string;
  words: string[];
  wordIndex: number;
  currentWord: string;
  targetIndex: number;
  score: number;
  combo: number;
  bestCombo: number;
  timeRemainingMs: number;
  elapsedMs: number;
  nextSpawnAt: number;
  spawnSeq: number;
  activeObjects: PopObject[];
  completedWords: string[];
  taps: number;
  hits: number;
  phase: PopPhase;
  wordClearUntil: number;
  paused: boolean;
};

export type PopResults = {
  score: number;
  bestCombo: number;
  wordsCompleted: number;
  accuracy: number;
  elapsedMs: number;
};

export type PopTapResult = {
  run: PopRun;
  kind: 'none' | 'correct' | 'wrong' | 'plain';
  object?: PopObject;
};

const DECOYS = 'ABCDEFGHILMNOPRSTUVW';

function shuffleWords(seed: string) {
  const rng = seededRandom(`${seed}:words`);
  const words = [...POP_WORDS];
  for (let i = words.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }
  return words;
}

export function startPopSession(seed = 'fair'): PopRun {
  const words = shuffleWords(seed);
  return {
    seed,
    words,
    wordIndex: 0,
    currentWord: words[0],
    targetIndex: 0,
    score: 0,
    combo: 1,
    bestCombo: 1,
    timeRemainingMs: POP_SESSION_MS,
    elapsedMs: 0,
    nextSpawnAt: 0,
    spawnSeq: 0,
    activeObjects: [],
    completedWords: [],
    taps: 0,
    hits: 0,
    phase: 'playing',
    wordClearUntil: 0,
    paused: false,
  };
}

export function targetLetter(run: PopRun) {
  return run.currentWord[run.targetIndex] ?? '';
}

function easeOutCubic(u: number) {
  const t = 1 - Math.min(1, Math.max(0, u));
  return 1 - t * t * t;
}

function easeInCubic(u: number) {
  const t = Math.min(1, Math.max(0, u));
  return t * t * t;
}

export function objectPose(object: PopObject, elapsedMs: number) {
  const t = Math.max(0, elapsedMs - object.bornAt);
  const rise = object.riseMs;
  const hang = object.hangMs;
  const fall = object.fallMs;
  let x = object.peakX;
  let y = object.peakY;
  if (t <= rise) {
    const u = easeOutCubic(t / Math.max(1, rise));
    x = object.startX + (object.peakX - object.startX) * u;
    y = object.startY + (object.peakY - object.startY) * u;
  } else if (t <= rise + hang) {
    const u = (t - rise) / Math.max(1, hang);
    x = object.peakX + Math.sin(u * Math.PI) * object.bob * 0.45;
    y = object.peakY + Math.sin(u * Math.PI * 2) * object.bob;
  } else {
    const u = easeInCubic((t - rise - hang) / Math.max(1, fall));
    x = object.peakX + (object.endX - object.peakX) * u;
    y = object.peakY + (1.22 - object.peakY) * u;
  }
  return {
    x,
    y,
    rotation: object.rotation + object.rotationSpeed * (t / 1000),
    scale: object.scale,
  };
}

export function objectLifetimeMs(object: PopObject) {
  return object.riseMs + object.hangMs + object.fallMs;
}

export function popResults(run: PopRun): PopResults {
  return {
    score: run.score,
    bestCombo: run.bestCombo,
    wordsCompleted: run.completedWords.length,
    accuracy: run.taps === 0 ? 1 : run.hits / run.taps,
    elapsedMs: run.elapsedMs,
  };
}

function clone(run: PopRun): PopRun {
  return { ...run, words: [...run.words], completedWords: [...run.completedWords], activeObjects: run.activeObjects.map(object => ({ ...object })) };
}

function liveFlying(run: PopRun) {
  return run.activeObjects.filter(object => object.flight === 'flying');
}

function hasTargetInFlight(run: PopRun) {
  const letter = targetLetter(run);
  return liveFlying(run).some(object => object.kind === 'letter' && object.letter === letter);
}

function offscreen(object: PopObject, elapsedMs: number) {
  if (elapsedMs - object.bornAt >= objectLifetimeMs(object)) return true;
  return objectPose(object, elapsedMs).y > 1.18;
}

function laneOf(x: number) {
  let best = POP_LANES[0];
  let dist = Math.abs(x - best);
  for (const lane of POP_LANES) {
    const next = Math.abs(x - lane);
    if (next < dist) {
      best = lane;
      dist = next;
    }
  }
  return best;
}

function pickLane(run: PopRun, rng: () => number) {
  const used = new Set(liveFlying(run).map(object => laneOf(object.peakX)));
  const open = POP_LANES.filter(lane => !used.has(lane));
  const pool = open.length ? open : [...POP_LANES];
  return pool[Math.floor(rng() * pool.length)] ?? 0.5;
}

function spawnObject(run: PopRun, kind: PopKind, letter: string | null, rng: () => number): PopObject {
  run.spawnSeq += 1;
  const target = kind === 'letter' && letter === targetLetter(run);
  const peakX = pickLane(run, rng) + (rng() - 0.5) * 0.06;
  const peakY = target ? 0.26 + rng() * 0.16 : 0.2 + rng() * 0.3;
  const hangMs = target ? 780 + rng() * 160 : kind === 'popcorn' ? 320 + rng() * 120 : 380 + rng() * 160;
  return {
    id: `pop-${run.spawnSeq}`,
    kind,
    letter,
    startX: 0.42 + rng() * 0.16,
    startY: 0.94,
    peakX,
    peakY,
    endX: peakX + (rng() - 0.5) * 0.12,
    riseMs: 240 + rng() * 80,
    hangMs,
    fallMs: 340 + rng() * 80,
    bob: 0.012 + rng() * 0.01,
    rotation: rng() * 24 - 12,
    rotationSpeed: (rng() - 0.5) * 70,
    scale: 0.96 + rng() * 0.12,
    bornAt: run.elapsedMs,
    flight: 'flying',
  };
}

function pickDecoy(run: PopRun, rng: () => number) {
  const avoid = targetLetter(run);
  const pool = [...DECOYS].filter(letter => letter !== avoid);
  return pool[Math.floor(rng() * pool.length)] ?? 'A';
}

function spawnOne(run: PopRun, rng: () => number, forceTarget = false) {
  if (liveFlying(run).length >= POP_MAX_LIVE) return;
  if (forceTarget || !hasTargetInFlight(run)) {
    run.activeObjects.push(spawnObject(run, 'letter', targetLetter(run), rng));
    return;
  }
  const roll = rng();
  if (roll < 0.42) run.activeObjects.push(spawnObject(run, 'letter', pickDecoy(run, rng), rng));
  else if (roll < 0.74) run.activeObjects.push(spawnObject(run, 'plain', null, rng));
  else run.activeObjects.push(spawnObject(run, 'popcorn', null, rng));
}

function beginNextWord(run: PopRun) {
  const nextIndex = run.wordIndex + 1;
  const wrapped = nextIndex >= run.words.length
    ? [...run.words.slice(1), run.words[0]]
    : run.words;
  const wordIndex = nextIndex >= run.words.length ? 0 : nextIndex;
  const words = nextIndex >= run.words.length ? wrapped : run.words;
  run.words = words;
  run.wordIndex = wordIndex;
  run.currentWord = words[wordIndex];
  run.targetIndex = 0;
  run.phase = 'playing';
  run.activeObjects = [];
  run.nextSpawnAt = run.elapsedMs;
}

export function tickPop(run: PopRun, dtMs: number): PopRun {
  const next = clone(run);
  if (next.paused || next.phase === 'results' || dtMs <= 0) return next;
  const step = Math.min(48, dtMs);
  next.elapsedMs += step;
  const rng = seededRandom(`${next.seed}:${next.spawnSeq}:${Math.floor(next.elapsedMs / 16)}`);

  if (next.phase === 'playing') next.timeRemainingMs = Math.max(0, next.timeRemainingMs - step);

  next.activeObjects = next.activeObjects.filter(object => {
    if (object.flight === 'resolving') return true;
    return !offscreen(object, next.elapsedMs);
  });

  if (next.phase === 'wordClear') {
    if (next.elapsedMs >= next.wordClearUntil) beginNextWord(next);
    return next;
  }

  const spawning = next.phase === 'playing' && next.timeRemainingMs > 0;
  if (spawning) {
    if (!hasTargetInFlight(next) && liveFlying(next).length < POP_MAX_LIVE) {
      spawnOne(next, rng, true);
      next.nextSpawnAt = next.elapsedMs + 280 + Math.floor(rng() * 180);
    } else if (next.elapsedMs >= next.nextSpawnAt && liveFlying(next).length < POP_MAX_LIVE) {
      spawnOne(next, rng);
      next.nextSpawnAt = next.elapsedMs + 320 + Math.floor(rng() * 220);
    }
  }

  if (next.timeRemainingMs <= 0 && next.phase === 'playing' && !next.activeObjects.some(object => object.flight === 'resolving')) {
    next.phase = 'results';
    next.activeObjects = [];
  }
  return next;
}

function finishResolving(run: PopRun, id: string) {
  run.activeObjects = run.activeObjects.filter(object => object.id !== id);
}

export function resolvePop(run: PopRun, id: string): PopRun {
  const next = clone(run);
  finishResolving(next, id);
  if (next.timeRemainingMs <= 0 && next.phase === 'playing' && !next.activeObjects.some(object => object.flight === 'resolving')) {
    next.phase = 'results';
    next.activeObjects = [];
  }
  return next;
}

export function tapPop(run: PopRun, x: number, y: number): PopTapResult {
  if (run.paused || run.phase !== 'playing') return { run, kind: 'none' };
  let best: { object: PopObject; dist: number } | undefined;
  for (const object of run.activeObjects) {
    if (object.flight !== 'flying') continue;
    const pose = objectPose(object, run.elapsedMs);
    const dist = Math.hypot(pose.x - x, pose.y - y);
    const radius = POP_HIT_RADIUS * object.scale;
    if (dist <= radius && (!best || dist < best.dist)) best = { object, dist };
  }
  if (!best) return { run, kind: 'none' };

  const next = clone(run);
  const object = next.activeObjects.find(item => item.id === best!.object.id)!;
  const pose = objectPose(object, next.elapsedMs);
  object.flight = 'resolving';
  object.startX = pose.x;
  object.startY = pose.y;
  object.peakX = pose.x;
  object.peakY = pose.y;
  object.endX = pose.x;
  object.riseMs = 1;
  object.hangMs = 1;
  object.fallMs = 1;
  object.bornAt = next.elapsedMs;
  next.taps += 1;

  if (object.kind === 'letter' && object.letter === targetLetter(next)) {
    next.hits += 1;
    next.score += POP_CORRECT_POINTS * next.combo;
    next.combo += 1;
    next.bestCombo = Math.max(next.bestCombo, next.combo);
    next.targetIndex += 1;
    next.nextSpawnAt = next.elapsedMs;
    if (next.targetIndex >= next.currentWord.length) {
      next.score += POP_WORD_BONUS;
      next.timeRemainingMs = Math.min(POP_TIME_CAP_MS, next.timeRemainingMs + POP_WORD_BONUS_MS);
      next.completedWords.push(next.currentWord);
      next.phase = 'wordClear';
      next.wordClearUntil = next.elapsedMs + POP_WORD_CLEAR_MS;
      next.activeObjects = next.activeObjects.filter(item => item.flight === 'resolving');
    }
    return { run: next, kind: 'correct', object };
  }

  next.combo = 1;
  next.score = Math.max(0, next.score - POP_MISS_PENALTY);
  return { run: next, kind: object.kind === 'letter' ? 'wrong' : 'plain', object };
}

export function setPopPaused(run: PopRun, paused: boolean): PopRun {
  return { ...run, paused };
}
