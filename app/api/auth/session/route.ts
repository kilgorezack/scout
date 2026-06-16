import { NextResponse } from 'next/server';
import { verifyIdToken, SESSION_COOKIE } from '@/lib/auth-verify';

export const runtime = 'nodejs';

// Set the session cookie from a freshly-minted Firebase ID token. The client
// posts here after sign-in and whenever Firebase refreshes the token (~hourly).
export async function POST(req: Request) {
  let body: { idToken?: string };
  try {
    body = (await req.json()) as { idToken?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const claims = await verifyIdToken(body.idToken);
  if (!claims) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true, uid: claims.uid });
  res.cookies.set(SESSION_COOKIE, body.idToken as string, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    // Matches the Firebase ID token lifetime; the client refreshes it and
    // re-posts here before it lapses while the app is open.
    maxAge: 60 * 60
  });
  return res;
}

// Clear the session cookie on sign-out.
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
