import 'server-only';
import { db } from './supabase';
import { PUBLIC_USER_COLUMNS, type PublicUser } from './types';
import type { Role } from './roles';

const UNIQUE_VIOLATION = '23505';

export class UsernameTakenError extends Error {
  constructor() {
    super('Username already taken');
  }
}

export class EmailTakenError extends Error {
  constructor() {
    super('This email is already in use');
  }
}

/** Escapes LIKE wildcards so ilike behaves as a case-insensitive equality check. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function findUserById(id: string): Promise<PublicUser | null> {
  const { data, error } = await db().from('users').select(PUBLIC_USER_COLUMNS).eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as PublicUser | null) ?? null;
}

/** Credentials lookup for password login. The hash never leaves this module's callers on the server. */
export async function findCredentialsByUsername(
  username: string,
): Promise<{ user: PublicUser; passwordHash: string | null } | null> {
  const { data, error } = await db()
    .from('users')
    .select(`${PUBLIC_USER_COLUMNS}, password_hash`)
    .ilike('username', escapeLike(username))
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { password_hash, ...user } = data as PublicUser & { password_hash: string | null };
  return { user, passwordHash: password_hash };
}

export async function usernameExists(username: string): Promise<boolean> {
  const { count, error } = await db()
    .from('users')
    .select('id', { count: 'exact', head: true })
    .ilike('username', escapeLike(username));
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function createPasswordUser(username: string, passwordHash: string): Promise<void> {
  const { error } = await db().from('users').insert({
    username,
    password_hash: passwordHash,
    auth_provider: 'password',
    profile_completed: false,
  });
  if (error) {
    if (error.code === UNIQUE_VIOLATION) throw new UsernameTakenError();
    throw error;
  }
}

export async function findUserByMicrosoftOid(oid: string): Promise<PublicUser | null> {
  const { data, error } = await db()
    .from('users')
    .select(PUBLIC_USER_COLUMNS)
    .eq('microsoft_oid', oid)
    .maybeSingle();
  if (error) throw error;
  return (data as PublicUser | null) ?? null;
}

export async function findOrCreateMicrosoftUser(profile: {
  oid: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
}): Promise<PublicUser> {
  const existing = await findUserByMicrosoftOid(profile.oid);
  if (existing) return existing;

  const { data, error } = await db()
    .from('users')
    .insert({
      microsoft_oid: profile.oid,
      email: profile.email,
      first_name: profile.firstName,
      last_name: profile.lastName,
      auth_provider: 'microsoft',
      profile_completed: false,
    })
    .select(PUBLIC_USER_COLUMNS)
    .single();

  if (error) {
    // Concurrent first login created the row already.
    if (error.code === UNIQUE_VIOLATION) {
      const raced = await findUserByMicrosoftOid(profile.oid);
      if (raced) return raced;
    }
    throw error;
  }
  return data as PublicUser;
}

export async function touchLastLogin(id: string): Promise<void> {
  const { error } = await db().from('users').update({ last_login_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

/** Emails are unique among password users (case-insensitive; stored lowercase). */
export async function passwordEmailInUse(email: string, excludeUserId?: string): Promise<boolean> {
  let query = db()
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('auth_provider', 'password')
    .ilike('email', escapeLike(email));
  if (excludeUserId) query = query.neq('id', excludeUserId);
  const { count, error } = await query;
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function completeProfile(
  id: string,
  fields: { firstName: string; lastName: string; company: string; role: Role; email?: string },
): Promise<PublicUser> {
  const { data, error } = await db()
    .from('users')
    .update({
      first_name: fields.firstName,
      last_name: fields.lastName,
      company: fields.company,
      role: fields.role,
      ...(fields.email !== undefined && { email: fields.email }),
      profile_completed: true,
    })
    .eq('id', id)
    .select(PUBLIC_USER_COLUMNS)
    .single();
  if (error) {
    if (error.code === UNIQUE_VIOLATION) throw new EmailTakenError();
    throw error;
  }
  return data as PublicUser;
}

/** Sets the recovery email of a password user. */
export async function setPasswordUserEmail(id: string, email: string): Promise<void> {
  const { error } = await db().from('users').update({ email }).eq('id', id).eq('auth_provider', 'password');
  if (error) {
    if (error.code === UNIQUE_VIOLATION) throw new EmailTakenError();
    throw error;
  }
}

/** Finds a password user by username (case-insensitive) or recovery email. Usernames never contain '@'. */
export async function findPasswordUserForReset(identifier: string): Promise<PublicUser | null> {
  const query = db().from('users').select(PUBLIC_USER_COLUMNS).eq('auth_provider', 'password');
  const { data, error } = await (identifier.includes('@')
    ? query.ilike('email', escapeLike(identifier))
    : query.ilike('username', escapeLike(identifier))
  ).maybeSingle();
  if (error) throw error;
  return (data as PublicUser | null) ?? null;
}

/** Sets a new password and records when, so older sessions stop working. */
export async function updatePassword(id: string, passwordHash: string): Promise<void> {
  const { error } = await db()
    .from('users')
    .update({ password_hash: passwordHash, password_changed_at: new Date().toISOString() })
    .eq('id', id)
    .eq('auth_provider', 'password');
  if (error) throw error;
}
