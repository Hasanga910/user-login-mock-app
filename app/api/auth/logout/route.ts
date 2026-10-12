import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session';

function logout(req: NextRequest) {
  // 303 so a POST from the logout form becomes a GET to /login.
  const res = NextResponse.redirect(new URL('/login', req.url), 303);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}

// POST is used by the logout button. GET is used internally to clear a stale session
// (e.g. the user row was deleted) from a server component redirect.
export const POST = logout;
export const GET = logout;
