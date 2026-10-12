import { NextResponse, type NextRequest } from 'next/server';
import { MS_SCOPES, msalClient, msRedirectUri } from '@/lib/msal';
import {
  OAUTH_COOKIE,
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
  verifyOAuthState,
} from '@/lib/session';
import { findOrCreateMicrosoftUser, touchLastLogin } from '@/lib/users';
import { homeFor } from '@/lib/auth';

export const runtime = 'nodejs';

type GraphMe = { givenName?: string | null; surname?: string | null; mail?: string | null };

async function fetchGraphProfile(accessToken: string): Promise<GraphMe | null> {
  try {
    const res = await fetch('https://graph.microsoft.com/v1.0/me?$select=givenName,surname,mail', {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    return res.ok ? ((await res.json()) as GraphMe) : null;
  } catch {
    return null;
  }
}

function splitName(name: string | undefined): { first: string | null; last: string | null } {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: null, last: null };
  return { first: parts[0], last: parts.length > 1 ? parts.slice(1).join(' ') : null };
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

export async function GET(req: NextRequest) {
  const fail = () => {
    const res = NextResponse.redirect(new URL('/login?error=microsoft', req.url));
    res.cookies.delete(OAUTH_COOKIE);
    return res;
  };

  const params = req.nextUrl.searchParams;
  const code = params.get('code');
  const returnedState = params.get('state');
  if (params.get('error') || !code || !returnedState) return fail();

  const stored = await verifyOAuthState(req.cookies.get(OAUTH_COOKIE)?.value);
  if (!stored || stored.state !== returnedState) return fail();

  try {
    const result = await msalClient().acquireTokenByCode({
      code,
      scopes: MS_SCOPES,
      redirectUri: msRedirectUri(),
      codeVerifier: stored.verifier,
    });

    const claims = (result.idTokenClaims ?? {}) as Record<string, unknown>;
    const oid = str(claims.oid);
    if (!oid) return fail();

    const name = str(claims.name);
    const graph = result.accessToken ? await fetchGraphProfile(result.accessToken) : null;
    const fallback = splitName(name);
    const email = str(claims.preferred_username) ?? str(claims.email) ?? graph?.mail ?? null;

    const user = await findOrCreateMicrosoftUser({
      oid,
      email,
      firstName: graph?.givenName || fallback.first,
      lastName: graph?.surname || fallback.last,
    });
    await touchLastLogin(user.id);

    const res = NextResponse.redirect(new URL(homeFor(user), req.url));
    res.cookies.delete(OAUTH_COOKIE);
    res.cookies.set(
      SESSION_COOKIE,
      await signSession({ sub: user.id, role: user.role, profileCompleted: user.profile_completed }),
      sessionCookieOptions,
    );
    return res;
  } catch (err) {
    console.error('Microsoft callback failed', err);
    return fail();
  }
}
