'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { signupSchema, fieldErrors, type FieldErrors } from '@/lib/validation';
import { passwordStrengthError, strengthUserInputs } from '@/lib/passwordStrength';
import { createPasswordUser, usernameExists, UsernameTakenError } from '@/lib/users';

export type SignupState = { errors?: FieldErrors; values?: { username: string } };

export async function signupAction(_prev: SignupState, formData: FormData): Promise<SignupState> {
  // TODO: rate limit signups per IP (e.g. Upstash/Redis) before doing any work.
  const parsed = signupSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });
  const values = { username: String(formData.get('username') ?? '') };
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const { username, password } = parsed.data;
  const weak = await passwordStrengthError(password, strengthUserInputs(username));
  if (weak) return { errors: { password: weak }, values };

  try {
    if (await usernameExists(username)) {
      return { errors: { username: 'Username already taken' }, values };
    }
    const hash = await bcrypt.hash(password, 12);
    await createPasswordUser(username, hash);
  } catch (err) {
    if (err instanceof UsernameTakenError) return { errors: { username: 'Username already taken' }, values };
    console.error('Signup failed', err);
    return { errors: { form: 'Something went wrong. Please try again.' }, values };
  }

  // No auto-login: send the user to the login page.
  redirect('/login?signup=success');
}
