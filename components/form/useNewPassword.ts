'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { failedPasswordRules } from '@/lib/passwordRules';
import { loadZxcvbn, scorePassword, WEAK_PASSWORD_MESSAGE, type StrengthResult } from '@/lib/passwordStrength';
import { PASSWORDS_DONT_MATCH } from '@/lib/validation';

/**
 * State for a new password + confirm pair (signup and reset): live rule checks, lazy zxcvbn
 * scoring and the errors to show. Both fields are cleared whenever `resetOn` changes (pass the
 * action state), so passwords are never kept after a submit.
 */
export function useNewPassword(userInputs: string[], resetOn: unknown) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState({ password: false, confirm: false });
  const [strength, setStrength] = useState<{ key: string; result: StrengthResult } | null>(null);

  const [prevReset, setPrevReset] = useState(resetOn);
  if (resetOn !== prevReset) {
    setPrevReset(resetOn);
    setPassword('');
    setConfirm('');
    setTouched({ password: false, confirm: false });
    setStrength(null);
  }

  // Score whenever the password or the user inputs (e.g. the username being typed) change.
  const inputsKey = userInputs.join('\n');
  const key = `${inputsKey}\u0000${password}`;
  useEffect(() => {
    if (!password) return;
    let cancelled = false;
    const inputs = inputsKey ? inputsKey.split('\n') : [];
    scorePassword(password, inputs).then(
      (result) => {
        if (!cancelled) setStrength({ key: `${inputsKey}\u0000${password}`, result });
      },
      (err) => console.error('Password strength check failed', err),
    );
    return () => {
      cancelled = true;
    };
  }, [password, inputsKey]);

  /** The result for the current password and inputs; null while (re)scoring. */
  const current = strength?.key === key ? strength.result : null;
  const failed = failedPasswordRules(password);
  const rulesOk = password !== '' && failed.length === 0;
  const matches = confirm !== '' && confirm === password;
  const valid = rulesOk && current !== null && current.level !== 'weak' && matches;

  let passwordError: string | undefined;
  if (touched.password) {
    if (!password) passwordError = 'Enter a password';
    else if (failed.length) passwordError = failed[0].message;
    else if (current?.level === 'weak') passwordError = WEAK_PASSWORD_MESSAGE;
  }

  let confirmError: string | undefined;
  if (confirm && confirm !== password) confirmError = PASSWORDS_DONT_MATCH;
  else if (!confirm && touched.confirm) confirmError = 'Confirm your password';

  return {
    password,
    confirm,
    valid,
    /** Shown in the meter; keeps the last result while re-scoring to avoid flicker. */
    strength: password ? (current ?? strength?.result ?? null) : null,
    passwordError,
    confirmError,
    passwordProps: {
      value: password,
      onChange: (e: ChangeEvent<HTMLInputElement>) => setPassword(e.currentTarget.value),
      // Start downloading zxcvbn as soon as the field is used, not on page load.
      onFocus: () => void loadZxcvbn().catch(() => {}),
      onBlur: () => setTouched((t) => ({ ...t, password: true })),
    },
    confirmProps: {
      value: confirm,
      onChange: (e: ChangeEvent<HTMLInputElement>) => setConfirm(e.currentTarget.value),
      onBlur: () => setTouched((t) => ({ ...t, confirm: true })),
    },
    /** Shows both fields' errors, e.g. when a submit is attempted. */
    touchAll: () => setTouched({ password: true, confirm: true }),
  };
}

export type NewPassword = ReturnType<typeof useNewPassword>;
