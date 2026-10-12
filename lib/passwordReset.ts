import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { db } from './supabase';

export const RESET_TOKEN_TTL_MINUTES = 30;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Creates a reset token for the user and returns the raw token (to be emailed).
 * Only the SHA-256 hash is stored. Any older unused tokens for the user are invalidated.
 */
export async function createResetToken(userId: string): Promise<string> {
  const now = new Date();

  const { error: invalidateError } = await db()
    .from('password_reset_tokens')
    .update({ used_at: now.toISOString() })
    .eq('user_id', userId)
    .is('used_at', null);
  if (invalidateError) throw invalidateError;

  const token = randomBytes(32).toString('base64url');
  const { error } = await db()
    .from('password_reset_tokens')
    .insert({
      user_id: userId,
      token_hash: hashToken(token),
      expires_at: new Date(now.getTime() + RESET_TOKEN_TTL_MINUTES * 60 * 1000).toISOString(),
    });
  if (error) throw error;
  return token;
}

/** True if the token exists, is unused and has not expired. Does not consume it. */
export async function isValidResetToken(token: string): Promise<boolean> {
  const { count, error } = await db()
    .from('password_reset_tokens')
    .select('id', { count: 'exact', head: true })
    .eq('token_hash', hashToken(token))
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString());
  if (error) throw error;
  return (count ?? 0) > 0;
}

/**
 * Atomically marks a valid token as used and returns its user id, or null if the token
 * is unknown, used or expired. A single conditional update means two concurrent
 * submissions can't both redeem the same token.
 */
export async function consumeResetToken(token: string): Promise<string | null> {
  const now = new Date().toISOString();
  const { data, error } = await db()
    .from('password_reset_tokens')
    .update({ used_at: now })
    .eq('token_hash', hashToken(token))
    .is('used_at', null)
    .gt('expires_at', now)
    .select('user_id')
    .maybeSingle();
  if (error) throw error;
  return (data as { user_id: string } | null)?.user_id ?? null;
}

/**
 * Read-only: the username and email of a valid (unused, unexpired) token's user, or null.
 * Used to penalise new passwords that contain them. Does not consume the token.
 */
export async function getResetTokenUser(token: string): Promise<{ username: string | null; email: string | null } | null> {
  const { data, error } = await db()
    .from('password_reset_tokens')
    .select('users(username, email)')
    .eq('token_hash', hashToken(token))
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (error) throw error;
  const user = (data as { users: { username: string | null; email: string | null } | null } | null)?.users;
  return user ? { username: user.username, email: user.email } : null;
}
