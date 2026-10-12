import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySession, type SessionPayload } from './lib/session';
import { dashboardFor, roleForPath } from './lib/roles';

const AUTH_PAGES = ['/login', '/signup'];
// Reachable whether or not the visitor is logged in.
const PUBLIC_PAGES = ['/forgot-password', '/reset-password'];

function homeFor(session: SessionPayload): string {
  if (!session.profileCompleted || !session.role) return '/onboarding';
  return dashboardFor(session.role);
}

function redirectTo(req: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, req.url));
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PAGES.includes(pathname)) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);

  // Logged-in users don't need the login/signup pages.
  if (AUTH_PAGES.includes(pathname)) {
    return session ? redirectTo(req, homeFor(session)) : NextResponse.next();
  }

  // Everything else in the matcher is protected.
  if (!session) {
    const res = redirectTo(req, '/login');
    if (token) res.cookies.delete(SESSION_COOKIE); // invalid or expired token
    return res;
  }

  const home = homeFor(session);

  if (pathname === '/onboarding') {
    return home === '/onboarding' ? NextResponse.next() : redirectTo(req, home);
  }

  // /dashboard/*, /account/*
  if (home === '/onboarding') return redirectTo(req, '/onboarding');

  const owner = roleForPath(pathname);
  if (owner && owner !== session.role) return redirectTo(req, home);

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/dashboard',
    '/account/:path*',
    '/onboarding',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
  ],
};
