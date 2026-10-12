'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { loginSchema } from '@/lib/validation';
import { findCredentialsByUsername, touchLastLogin } from '@/lib/users';
import { homeFor, setSessionCookie } from '@/lib/auth';

export type LoginState = { error?: string; values?: { username: string } };

const INVALID = 'Invalid username or password';
// Compared against when the user doesn't exist, so response timing doesn't reveal valid usernames.
const DUMMY_HASH = '$2a$12$1gPPFX4esIAqorggSIRB3OwOJaBFPTPDoAELsVb5Og6vlsGOM.uja';

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  // TODO: rate limit login attempts per IP and per username to slow brute-force attacks.
  const values = { username: String(formData.get('username') ?? '') };
  const parsed = loginSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { error: INVALID, values };

  let destination: string;
  try {
    const record = await findCredentialsByUsername(parsed.data.username);
    const ok = await bcrypt.compare(parsed.data.password, record?.passwordHash ?? DUMMY_HASH);
    if (!record || !record.passwordHash || !ok) return { error: INVALID, values };

    await touchLastLogin(record.user.id);
    await setSessionCookie(record.user);
    destination = homeFor(record.user);
  } catch (err) {
    console.error('Login failed', err);
    return { error: 'Something went wrong. Please try again.', values };
  }

  redirect(destination);
}
