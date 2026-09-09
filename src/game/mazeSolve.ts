import {
  availableCobs,
  currentTarget,
  harvestLetters,
  inspectCob,
  needsSolvePhase,
  type MazePuzzle,
  type MazeRun,
} from './maze';

export function normalizeMazeGuess(value: string) {
  return harvestLetters(value.toUpperCase());
}

export function solvePromptSlots(displayAnswer: string, givenMask: string | null, solved: boolean, harvestedCount: number) {
  if (solved) {
    let remaining = harvestedCount;
    return [...displayAnswer].map(ch => {
      if (ch === ' ') return { ch, filled: false, space: true as const, given: false };
      const filled = remaining > 0;
      if (filled) remaining -= 1;
      return { ch, filled, space: false as const, given: false };
    });
  }
  let maskIndex = 0;
  return [...displayAnswer].map(ch => {
    if (ch === ' ') return { ch, filled: false, space: true as const, given: false };
    const maskCh = givenMask?.[maskIndex++] ?? '_';
    const given = maskCh !== '_';
    return { ch: given ? maskCh : '', filled: given, space: false as const, given };
  });
}

export function submitMazeSolve(puzzle: MazePuzzle, run: MazeRun, guess: string):
  | { ok: true; run: MazeRun }
  | { ok: false; reason: 'mismatch' | 'shown' } {
  if (!needsSolvePhase(puzzle) || run.solved) return { ok: false, reason: 'shown' };
  if (normalizeMazeGuess(guess) !== harvestLetters(puzzle.answer)) return { ok: false, reason: 'mismatch' };
  return { ok: true, run: { ...run, solved: true, started: true } };
}

export function revealMazeAnswer(puzzle: MazePuzzle, run: MazeRun) {
  if (!needsSolvePhase(puzzle) || run.solved) return run;
  return { ...run, solved: true, started: true, usedAnswerHelp: true };
}

export function remindInspectedLetter(puzzle: MazePuzzle, run: MazeRun, cobId: string) {
  if (!run.solved) return { ok: false as const, reason: 'locked' as const };
  const cob = availableCobs(puzzle, run).find(item => item.id === cobId && run.inspectedCobIds.includes(item.id));
  if (!cob) return { ok: false as const, reason: 'missing' as const };
  const peeked = inspectCob(puzzle, { ...run, usedReminder: true }, cob.id, run.elapsedActiveMs);
  if (!peeked.ok) return { ok: false as const, reason: peeked.reason };
  return { ok: true as const, run: peeked.run, reveal: peeked.reveal };
}

export function findNextLetterHelp(puzzle: MazePuzzle, run: MazeRun) {
  const target = currentTarget(puzzle, run);
  if (!target) return { ok: false as const, reason: 'none' as const };
  const cob = availableCobs(puzzle, run).find(item => item.letter === target);
  if (!cob) return { ok: false as const, reason: 'none' as const };
  return {
    ok: true as const,
    run: {
      ...run,
      usedFindNext: true,
      helpMarker: { cobId: cob.id, hideAtElapsedMs: run.elapsedActiveMs + 10_000 },
    },
  };
}

export function beginMazeRun(run: MazeRun): MazeRun {
  return { ...run, started: true };
}
