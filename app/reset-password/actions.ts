'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { resetPasswordSchema, fieldErrors, type FieldErrors } from '@/lib/validation';
import { consumeResetToken, getResetTokenUser } from '@/lib/passwordReset';
import { passwordStrengthError, strengthUserInputs } from '@/lib/passwordStrength';
import { updatePassword } from '@/lib/users';

export type ResetPasswordState = { errors?: FieldErrors; invalidToken?: boolean };

export async function resetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  // TODO: rate limit reset attempts per IP.
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    if (errors.token) return { invalidToken: true };
    return { errors };
  }

  let userInputs: string[] = [];
  try {
    const user = await getResetTokenUser(parsed.data.token);
    userInputs = strengthUserInputs(user?.username, user?.email);
  } catch (err) {
    console.error('Reset token user lookup failed', err);
  }
  const weak = await passwordStrengthError(parsed.data.password, userInputs);
  if (weak) return { errors: { password: weak } };

  try {
    const hash = await bcrypt.hash(parsed.data.password, 12);
    // Claims the token (marks it used) only if it is still valid, so it can't be redeemed twice.
    const userId = await consumeResetToken(parsed.data.token);
    if (!userId) return { invalidToken: true };
    // Also sets password_changed_at, which invalidates every existing session for this user.
    await updatePassword(userId, hash);
  } catch (err) {
    console.error('Password reset failed', err);
    return { errors: { form: 'Something went wrong. Please try again.' } };
  }

  redirect('/login?reset=success');
}
