import { NextResponse } from 'next/server';
import {
  GATE_COOKIE,
  GATE_TTL_SECONDS,
  createGateToken,
  isCorrectPassword,
  isPasswordConfigured,
  safeRedirectPath
} from '@/lib/site-password';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_ATTEMPTS = 10;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

// Best-effort, per-instance throttle. Not a substitute for a strong password,
// but it takes online guessing off the table for a single shared secret.
const attempts = new Map<string, { count: number; resetAt: number }>();

function tooManyAttempts(ip: string, now: number): boolean {
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt <= now) {
    attempts.set(ip, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
    if (attempts.size > 5_000) {
      for (const [key, value] of attempts) if (value.resetAt <= now) attempts.delete(key);
    }
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

/** Enter the shared site password. */
export async function POST(req: Request) {
  if (!isPasswordConfigured()) {
    return NextResponse.json(
      { error: 'No site password is configured. Set SITE_PASSWORD and redeploy.' },
      { status: 503 }
    );
  }

  let body: { password?: unknown; next?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (tooManyAttempts(ip, Date.now())) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  if (!(await isCorrectPassword(body.password))) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
  }

  attempts.delete(ip);

  const res = NextResponse.json({ redirectTo: safeRedirectPath(body.next) });
  res.cookies.set({
    name: GATE_COOKIE,
    value: await createGateToken(),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: GATE_TTL_SECONDS
  });
  return res;
}

/** Re-lock this browser. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: GATE_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0
  });
  return res;
}
