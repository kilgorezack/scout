import { NextResponse, type NextRequest } from 'next/server';
import { verifyIdToken, SESSION_COOKIE } from '@/lib/auth-verify';
import { GATE_COOKIE, isGateOpen } from '@/lib/site-password';

// Two gates, in order.
//
// 1. The shared site password. Nothing loads before it is entered — not the
//    home page, not even the account sign-in page. Only the unlock screen
//    itself and Next's own chunks are exempt.
// 2. Per-user Firebase sign-in, for everything except the login page.

const UNLOCK_PATH = '/unlock';
const GATE_ROUTES = new Set([UNLOCK_PATH, '/api/gate']);

const PUBLIC_PAGES = new Set(['/login']);

function isApi(pathname: string): boolean {
  return (
    pathname.startsWith('/api') ||
    pathname.startsWith('/coverage-api') ||
    pathname.startsWith('/markets-api')
  );
}

function isPublicAfterUnlock(pathname: string): boolean {
  if (PUBLIC_PAGES.has(pathname)) return true;
  if (pathname.startsWith('/api/auth')) return true;
  if (pathname.startsWith('/_next')) return true;
  return false;
}

/** Gate responses must never sit in a shared cache. */
function noStore(res: NextResponse): NextResponse {
  res.headers.set('Cache-Control', 'no-store, must-revalidate');
  return res;
}

function bounceTo(req: NextRequest, pathname: string, target: string): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  url.search = target === '/' ? '' : `next=${encodeURIComponent(target)}`;
  return NextResponse.redirect(url);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ---- Gate 1: shared site password ----
  const gateExempt = GATE_ROUTES.has(pathname) || pathname.startsWith('/_next');
  const unlocked = await isGateOpen(req.cookies.get(GATE_COOKIE)?.value);

  if (pathname === UNLOCK_PATH && unlocked) {
    return noStore(NextResponse.redirect(new URL('/', req.url)));
  }
  // The unlock screen and the endpoint it posts to must stay reachable while
  // locked — and they skip the account gate too, or they'd be unreachable.
  if (gateExempt) return noStore(NextResponse.next());

  if (!unlocked) {
    if (isApi(pathname)) {
      return noStore(NextResponse.json({ error: 'Site is locked' }, { status: 401 }));
    }
    return noStore(bounceTo(req, UNLOCK_PATH, pathname + req.nextUrl.search));
  }

  // ---- Gate 2: per-user account ----
  if (isPublicAfterUnlock(pathname)) return NextResponse.next();

  const claims = await verifyIdToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (claims) return NextResponse.next();

  // Not signed in. APIs get a 401; pages bounce to /login with a return path.
  if (isApi(pathname)) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  return bounceTo(req, '/login', pathname + req.nextUrl.search);
}

export const config = {
  // Run on everything except Next's static output; the function itself
  // allow-lists the routes that stay reachable.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
