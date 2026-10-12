import { NextResponse, type NextRequest } from 'next/server';
import { CryptoProvider } from '@azure/msal-node';
import { MS_SCOPES, msalClient, msRedirectUri } from '@/lib/msal';
import { OAUTH_COOKIE, OAUTH_MAX_AGE, sessionCookieOptions, signOAuthState } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  // TODO: rate limit Microsoft login initiation per IP.
  try {
    const crypto = new CryptoProvider();
    const { verifier, challenge } = await crypto.generatePkceCodes();
    const state = crypto.createNewGuid();

    const authUrl = await msalClient().getAuthCodeUrl({
      scopes: MS_SCOPES,
      redirectUri: msRedirectUri(),
      state,
      codeChallenge: challenge,
      codeChallengeMethod: 'S256',
      responseMode: 'query',
      prompt: 'select_account',
    });

    const res = NextResponse.redirect(authUrl);
    res.cookies.set(OAUTH_COOKIE, await signOAuthState({ state, verifier }), {
      ...sessionCookieOptions,
      maxAge: OAUTH_MAX_AGE,
    });
    return res;
  } catch (err) {
    console.error('Microsoft login init failed', err);
    return NextResponse.redirect(new URL('/login?error=microsoft', req.url));
  }
}
