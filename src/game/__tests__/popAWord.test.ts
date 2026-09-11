import { describe, expect, it } from 'vitest';
import {
  objectPose,
  popResults,
  resolvePop,
  startPopSession,
  tapPop,
  targetLetter,
  tickPop,
  POP_TIME_CAP_MS,
  POP_WORD_BONUS_MS,
  POP_WORDS,
} from '../popAWord';

function until(run: ReturnType<typeof startPopSession>, pred: (next: typeof run) => boolean, steps = 120) {
  let next = run;
  for (let i = 0; i < steps && !pred(next); i += 1) next = tickPop(next, 50);
  return next;
}

function flyingTarget(run: ReturnType<typeof startPopSession>) {
  const letter = targetLetter(run);
  return run.activeObjects.find(object => object.flight === 'flying' && object.kind === 'letter' && object.letter === letter);
}

describe('Pop-a-Word', () => {
  it('shuffles the farm word list and does not always start on CORN', () => {
    const run = startPopSession('fair-test');
    expect(POP_WORDS).toContain(run.currentWord);
    expect(targetLetter(run)).toBe(run.currentWord[0]);
    expect(new Set(run.words)).toEqual(new Set(POP_WORDS));
    expect(run.timeRemainingMs).toBe(40_000);
    const firstWords = new Set(Array.from({ length: 12 }, (_, index) => startPopSession(`seed-${index}`).currentWord));
    expect(firstWords.size).toBeGreaterThan(1);
  });

  it('spawns the current target among live arcs', () => {
    const run = until(startPopSession('spawn'), next => !!flyingTarget(next));
    expect(flyingTarget(run)?.letter).toBe(targetLetter(run));
    expect(run.activeObjects.length).toBeGreaterThan(0);
    expect(run.activeObjects.length).toBeLessThanOrEqual(3);
  });

  it('fills the first two letters without ending the run', () => {
    let run = until(startPopSession('letters'), next => !!flyingTarget(next));
    const word = run.currentWord;
    const first = flyingTarget(run)!;
    const pose = objectPose(first, run.elapsedMs);
    const hit = tapPop(run, pose.x, pose.y);
    expect(hit.kind).toBe('correct');
    run = hit.run;
    expect(run.targetIndex).toBe(1);
    expect(targetLetter(run)).toBe(word[1]);
    expect(run.phase).toBe('playing');
    run = resolvePop(run, first.id);
    run = until(run, next => !!flyingTarget(next));
    const second = flyingTarget(run)!;
    const nextPose = objectPose(second, run.elapsedMs);
    const secondHit = tapPop(run, nextPose.x, nextPose.y);
    expect(secondHit.kind).toBe('correct');
    expect(secondHit.run.targetIndex).toBe(2);
    expect(secondHit.run.currentWord).toBe(word);
  });

  it('does not fail the session on a wrong letter or a missed target', () => {
    const wanted = targetLetter(startPopSession('miss'));
    let run = until(startPopSession('miss'), next => next.activeObjects.some(object => object.kind === 'letter' && object.letter !== wanted));
    const decoy = run.activeObjects.find(object => object.flight === 'flying' && object.letter && object.letter !== wanted);
    if (decoy) {
      const pose = objectPose(decoy, run.elapsedMs);
      const miss = tapPop(run, pose.x, pose.y);
      expect(miss.kind).toBe('wrong');
      run = miss.run;
      expect(run.combo).toBe(1);
      expect(run.phase).toBe('playing');
      expect(run.targetIndex).toBe(0);
    }
    run = until(run, next => next.elapsedMs > 2800);
    expect(run.phase).toBe('playing');
    expect(flyingTarget(run)?.letter).toBe(targetLetter(run));
  });

  it('completes a word, adds bonus time, then loads the next one', () => {
    let run = startPopSession('complete');
    const firstWord = run.currentWord;
    for (const letter of firstWord) {
      run = until(run, next => next.phase !== 'playing' || !!flyingTarget(next) && targetLetter(next) === letter);
      const object = flyingTarget(run)!;
      const pose = objectPose(object, run.elapsedMs);
      const hit = tapPop(run, pose.x, pose.y);
      expect(hit.kind).toBe('correct');
      run = resolvePop(hit.run, object.id);
    }
    expect(run.completedWords).toContain(firstWord);
    expect(run.phase).toBe('wordClear');
    expect(run.timeRemainingMs).toBeGreaterThan(40_000);
    expect(run.timeRemainingMs).toBeLessThanOrEqual(POP_TIME_CAP_MS);
    run = until(run, next => next.phase === 'playing' && next.currentWord !== firstWord, 80);
    expect(run.currentWord).not.toBe(firstWord);
    expect(run.targetIndex).toBe(0);
  });

  it('caps remaining time when word bonuses stack', () => {
    let run = startPopSession('cap');
    run = { ...run, timeRemainingMs: POP_TIME_CAP_MS - 500 };
    const firstWord = run.currentWord;
    for (const letter of firstWord) {
      run = until(run, next => next.phase !== 'playing' || !!flyingTarget(next) && targetLetter(next) === letter, 200);
      const object = flyingTarget(run)!;
      const pose = objectPose(object, run.elapsedMs);
      const hit = tapPop(run, pose.x, pose.y);
      expect(hit.kind).toBe('correct');
      run = resolvePop(hit.run, object.id);
    }
    expect(run.timeRemainingMs).toBe(POP_TIME_CAP_MS);
  });

  it('pops up quickly then hangs in the tap zone', () => {
    const run = until(startPopSession('hang'), next => !!flyingTarget(next));
    const object = flyingTarget(run)!;
    const afterRise = objectPose(object, object.bornAt + object.riseMs + 40);
    expect(afterRise.y).toBeGreaterThan(0.12);
    expect(afterRise.y).toBeLessThan(0.55);
    const midHang = objectPose(object, object.bornAt + object.riseMs + object.hangMs / 2);
    expect(Math.abs(midHang.y - object.peakY)).toBeLessThan(0.05);
    expect(object.riseMs).toBeLessThan(360);
  });

  it('ends on the timer and reports score stats', () => {
    let run = startPopSession('timer');
    run = until(run, next => next.phase === 'results', 900);
    expect(run.phase).toBe('results');
    expect(run.timeRemainingMs).toBe(0);
    const results = popResults(run);
    expect(results.score).toBeGreaterThanOrEqual(0);
    expect(results.wordsCompleted).toBeGreaterThanOrEqual(0);
    expect(results.elapsedMs).toBeGreaterThan(0);
    expect(results.accuracy).toBeGreaterThanOrEqual(0);
    expect(results.accuracy).toBeLessThanOrEqual(1);
  });
});
