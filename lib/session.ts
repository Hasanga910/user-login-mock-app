// Edge-safe session helpers (used by proxy and server code).
// Reads JWT_SECRET from process.env directly because the proxy cannot import 'server-only' modules.
import { SignJWT, jwtVerify } from 'jose';
import { isRole, type Role } from './roles';

export const SESSION_COOKIE = 'session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = {
  sub: string;
  role: Role | null;
  profileCompleted: boolean;
  /** Issued-at, seconds since epoch. Compared against users.password_changed_at. */
  iat: number;
};

function secretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters');
  }
  return new TextEncoder().encode(secret);
}

export const sessionCookieOptions = {
  httpOnly: true,
  // Secure in production. Browsers like Safari drop Secure cookies on http://localhost.
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_MAX_AGE,
};

export async function signSession(payload: Omit<SessionPayload, 'iat'>): Promise<string> {
  return new SignJWT({ role: payload.role, profileCompleted: payload.profileCompleted })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] });
    if (typeof payload.sub !== 'string' || typeof payload.iat !== 'number') return null;
    return {
      sub: payload.sub,
      role: isRole(payload.role) ? payload.role : null,
      profileCompleted: payload.profileCompleted === true,
      iat: payload.iat,
    };
  } catch {
    return null;
  }
}

// Short-lived signed cookie holding OAuth state + PKCE verifier between redirect and callback.
export const OAUTH_COOKIE = 'ms_oauth';
export const OAUTH_MAX_AGE = 60 * 10;

export async function signOAuthState(data: { state: string; verifier: string }): Promise<string> {
  return new SignJWT(data)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${OAUTH_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifyOAuthState(
  token: string | undefined,
): Promise<{ state: string; verifier: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] });
    if (typeof payload.state !== 'string' || typeof payload.verifier !== 'string') return null;
    return { state: payload.state, verifier: payload.verifier };
  } catch {
    return null;
  }
}
