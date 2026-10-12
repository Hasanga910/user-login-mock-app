import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, sessionCookieOptions, signSession, verifySession, type SessionPayload } from './session';
import { findUserById } from './users';
import { dashboardFor, type Role } from './roles';
import type { PublicUser } from './types';

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/** Issues (or refreshes) the session cookie from the user's current DB state. */
export async function setSessionCookie(user: PublicUser): Promise<void> {
  const token = await signSession({
    sub: user.id,
    role: user.role,
    profileCompleted: user.profile_completed,
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions);
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Where a logged-in user belongs: onboarding until the profile is complete, then their role dashboard. */
export function homeFor(user: Pick<PublicUser, 'profile_completed' | 'role'>): string {
  if (!user.profile_completed || !user.role) return '/onboarding';
  return dashboardFor(user.role);
}

/**
 * True if the session was issued before the user's last password change.
 * JWT `iat` has whole-second precision, so compare in seconds; otherwise a login made
 * in the same second as a reset would be rejected.
 */
function sessionIsStale(session: SessionPayload, user: PublicUser): boolean {
  if (!user.password_changed_at) return false;
  const changedAt = Math.floor(new Date(user.password_changed_at).getTime() / 1000);
  return session.iat < changedAt;
}

/** Loads the current user from the database (authoritative), not just the JWT. */
export async function getCurrentUser(): Promise<PublicUser | null> {
  const session = await getSession();
  if (!session) return null;
  const user = await findUserById(session.sub);
  if (!user || sessionIsStale(session, user)) return null;
  return user;
}

export async function requireUser(): Promise<PublicUser> {
  const session = await getSession();
  if (!session) redirect('/login');
  const user = await findUserById(session.sub);
  // Valid token but the user row is gone, or the password changed after it was issued:
  // clear the stale cookie. (Redirecting to /login would loop, since the proxy only checks the JWT.)
  if (!user || sessionIsStale(session, user)) redirect('/api/auth/logout');
  return user;
}

/** Server-side role check for pages and data fetches. Uses the role stored in the DB. */
export async function requireRole(role: Role): Promise<PublicUser> {
  const user = await requireUser();
  if (!user.profile_completed || !user.role) redirect('/onboarding');
  if (user.role !== role) redirect(dashboardFor(user.role));
  return user;
}
