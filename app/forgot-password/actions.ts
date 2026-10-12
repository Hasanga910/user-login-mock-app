'use server';

import { after } from 'next/server';
import { forgotPasswordSchema, fieldErrors, type FieldErrors } from '@/lib/validation';
import { findPasswordUserForReset } from '@/lib/users';
import { createResetToken } from '@/lib/passwordReset';
import { sendPasswordResetEmail } from '@/lib/email';
import { env } from '@/lib/env';

export type ForgotPasswordState = { message?: string; errors?: FieldErrors; values?: { identifier: string } };

// Identical for every outcome so the form never reveals which usernames or emails exist.
const GENERIC = "If an account with a recovery email exists, we've sent a reset link.";

export async function forgotPasswordAction(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  // TODO: rate limit reset requests per IP and per identifier to prevent email flooding.
  const values = { identifier: String(formData.get('identifier') ?? '') };
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  try {
    // Only password users match; Microsoft users reset their password with Microsoft.
    const user = await findPasswordUserForReset(parsed.data.identifier);
    if (user?.email) {
      const token = await createResetToken(user.id);
      const link = new URL('/reset-password', env().APP_URL);
      link.searchParams.set('token', token);
      const to = user.email;
      // Send after the response so its timing doesn't reveal that an account was found.
      after(() => sendPasswordResetEmail(to, link.toString()).catch((err) => console.error('Reset email failed', err)));
    }
  } catch (err) {
    console.error('Forgot password failed', err);
  }

  return { message: GENERIC };
}
