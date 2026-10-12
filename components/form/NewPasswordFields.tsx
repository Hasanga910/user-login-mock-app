'use client';

import type { FieldErrors } from '@/lib/validation';
import FieldError from './FieldError';
import PasswordChecklist from './PasswordChecklist';
import PasswordInput from './PasswordInput';
import PasswordStrengthMeter from './PasswordStrengthMeter';
import type { NewPassword } from './useNewPassword';

/**
 * New password + confirm password, with the strength bar and rules checklist.
 * `errors` are server errors; they show until the user types a new password.
 */
export default function NewPasswordFields({
  pw,
  errors,
  passwordLabel = 'Password',
}: {
  pw: NewPassword;
  errors: FieldErrors;
  passwordLabel?: string;
}) {
  const passwordError = pw.passwordError ?? (pw.password ? undefined : errors.password);
  const confirmError = pw.confirmError ?? (pw.confirm ? undefined : errors.confirmPassword);

  return (
    <>
      <div>
        <label htmlFor="password" className="label">{passwordLabel}</label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          required
          aria-invalid={passwordError ? true : undefined}
          aria-describedby={passwordError ? 'password-error' : undefined}
          {...pw.passwordProps}
        />
        <PasswordStrengthMeter password={pw.password} result={pw.strength} />
        <FieldError name="password" error={passwordError} />
        <PasswordChecklist password={pw.password} />
      </div>
      <div>
        <label htmlFor="confirmPassword" className="label">Confirm password</label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          required
          aria-invalid={confirmError ? true : undefined}
          aria-describedby={confirmError ? 'confirmPassword-error' : undefined}
          {...pw.confirmProps}
        />
        <FieldError name="confirmPassword" error={confirmError} />
      </div>
    </>
  );
}
