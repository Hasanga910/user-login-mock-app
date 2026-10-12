// zxcvbn password strength scoring, shared by the browser (strength bar) and server actions
// (blocking weak passwords). Client-safe: the zxcvbn packages are loaded with dynamic import()
// so they stay out of the initial client bundle.
import type { ZxcvbnFactory } from '@zxcvbn-ts/core';

export type StrengthLevel = 'weak' | 'fair' | 'good' | 'strong';

export type StrengthResult = {
  score: 0 | 1 | 2 | 3 | 4;
  level: StrengthLevel;
  /** zxcvbn's warning, or its first suggestion, if any. */
  feedback?: string;
};

export const STRENGTH_LEVELS: Record<StrengthLevel, { label: string; step: 1 | 2 | 3 | 4 }> = {
  weak: { label: 'Weak', step: 1 },
  fair: { label: 'Fair', step: 2 },
  good: { label: 'Good', step: 3 },
  strong: { label: 'Strong', step: 4 },
};

export const WEAK_PASSWORD_MESSAGE = 'This password is too easy to guess. Try a longer or less common one.';

export function levelFor(score: number): StrengthLevel {
  if (score >= 4) return 'strong';
  if (score === 3) return 'good';
  if (score === 2) return 'fair';
  return 'weak';
}

let factory: Promise<ZxcvbnFactory> | null = null;

/** Loads and configures zxcvbn once. Safe to call repeatedly (e.g. on every focus). */
export function loadZxcvbn(): Promise<ZxcvbnFactory> {
  factory ??= Promise.all([
    import('@zxcvbn-ts/core'),
    import('@zxcvbn-ts/language-common'),
    import('@zxcvbn-ts/language-en'),
  ])
    .then(
      ([core, common, en]) =>
        new core.ZxcvbnFactory({
          dictionary: { ...common.dictionary, ...en.dictionary },
          graphs: common.adjacencyGraphs,
          translations: en.translations,
        }),
    )
    .catch((err) => {
      factory = null; // allow a retry, e.g. after a network blip
      throw err;
    });
  return factory;
}

/** Turns the username/email into zxcvbn user inputs so passwords containing them score lower. */
export function strengthUserInputs(...values: (string | null | undefined)[]): string[] {
  const out = new Set<string>();
  for (const raw of values) {
    const v = raw?.trim().toLowerCase();
    if (!v) continue;
    out.add(v);
    const at = v.indexOf('@');
    if (at > 0) out.add(v.slice(0, at));
  }
  return [...out];
}

export async function scorePassword(password: string, userInputs: string[] = []): Promise<StrengthResult> {
  const zxcvbn = await loadZxcvbn();
  const result = zxcvbn.check(password, userInputs);
  const feedback = result.feedback.warning || result.feedback.suggestions[0] || undefined;
  return { score: result.score, level: levelFor(result.score), feedback };
}

/** Server-side check: the weak-password message, or undefined if the password is strong enough. */
export async function passwordStrengthError(password: string, userInputs: string[] = []): Promise<string | undefined> {
  const { level } = await scorePassword(password, userInputs);
  return level === 'weak' ? WEAK_PASSWORD_MESSAGE : undefined;
}
