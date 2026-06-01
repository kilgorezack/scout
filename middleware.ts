import { NextResponse, type NextRequest } from 'next/server';
import { verifyIdToken, SESSION_COOKIE } from '@/lib/auth-verify';

// Everything is gated behind sign-in except the marketing home page, the login
// page itself, the auth endpoint, and static assets.
const PUBLIC_PAGES = new Set(['/', '/login']);
const ASSET_RE = /\.(js|css|map|ico|png|jpg|jpeg|svg|webp|gif|woff2?|ttf|txt|xml|json|wasm)$/i;

function isPublic(pathname: string): boolean {
  if (PUBLIC_PAGES.has(pathname)) return true;
  if (pathname.startsWith('/api/auth')) return true;
  if (pathname.startsWith('/_next')) return true;
  if (ASSET_RE.test(pathname)) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const claims = await verifyIdToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (claims) return NextResponse.next();

  // Not signed in. APIs get a 401; pages bounce to /login with a return path.
  if (pathname.startsWith('/api') || pathname.startsWith('/coverage-api') || pathname.startsWith('/markets-api')) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = `next=${encodeURIComponent(pathname + req.nextUrl.search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Run on everything except Next's static output; the function itself
  // allow-lists the public routes above.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
