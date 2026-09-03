import { MIN_WORD_LENGTH, validateWord } from './dictionary';
import { Kernel } from './types';

export type TapRejectReason = 'hidden' | 'harvested' | 'locked';

export type TapResult = {
  path: Kernel[];
  accepted: boolean;
  reason?: TapRejectReason;
};

export type TapAttempt = {
  kernel: Kernel;
  visible: boolean;
};

export function selectionWord(path: Kernel[]): string {
  return path.map(kernel => kernel.letter).join('');
}

export function tapKernel(
  path: Kernel[],
  attempt: TapAttempt,
  _columns: number,
  options: { locked?: boolean } = {},
): TapResult {
  const { kernel, visible } = attempt;
  if (options.locked) return { path, accepted: false, reason: 'locked' };
  if (kernel.harvested) return { path, accepted: false, reason: 'harvested' };
  if (!visible) return { path, accepted: false, reason: 'hidden' };

  if (!path.length) return { path: [kernel], accepted: true };

  const index = path.findIndex(item => item.id === kernel.id);
  if (index === path.length - 1) return { path: path.slice(0, -1), accepted: true };
  if (index >= 0) return { path: path.slice(0, index + 1), accepted: true };

  return { path: [...path, kernel], accepted: true };
}

export function canSubmitSelection(
  path: Kernel[],
  options: { minLength?: number; busy?: boolean } = {},
): boolean {
  if (options.busy) return false;
  return path.length >= (options.minLength ?? MIN_WORD_LENGTH);
}

export type Submission =
  | { harvest: true; word: string; harvestIds: string[]; path: Kernel[] }
  | { harvest: false; path: Kernel[]; reason: 'too-short' | 'not-found' | 'busy' };

export function evaluateSubmission(
  path: Kernel[],
  dictionary?: Set<string>,
  busy = false,
): Submission {
  if (busy || !canSubmitSelection(path)) {
    return { harvest: false, path, reason: busy ? 'busy' : 'too-short' };
  }
  const result = validateWord(selectionWord(path), dictionary);
  if (!result.valid) return { harvest: false, path, reason: result.reason };
  return { harvest: true, word: result.word, harvestIds: path.map(kernel => kernel.id), path };
}
