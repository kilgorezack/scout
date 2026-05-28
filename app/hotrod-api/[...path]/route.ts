// Proxy /hotrod-api/* -> the existing Hotrod backend (hotrod.summitlabs.one/api/*).
//
// Keeping the backend at its current deploy means we don't have to port Hono
// routes, vendor server-side deps, or hold a Firebase service account in
// Scout's env. The frontend, which we now host at scout.summitlabs.one/hotrod,
// makes same-origin XHRs to /hotrod-api/* and Scout transparently forwards
// them. If/when we want a single-deploy story, this proxy is the seam to
// replace.

const UPSTREAM_BASE = process.env.HOTROD_API_BASE || 'https://hotrod.summitlabs.one/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// Some Hotrod endpoints (tiles, coverage) can be slow.
export const maxDuration = 60;

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxy(req: Request, ctx: RouteContext) {
  const { path } = await ctx.params;
  const reqUrl = new URL(req.url);
  const target = `${UPSTREAM_BASE}/${path.join('/')}${reqUrl.search}`;

  const init: RequestInit = {
    method: req.method,
    headers: filterRequestHeaders(req.headers),
    redirect: 'manual',
    signal: AbortSignal.timeout(55_000)
  };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch (e) {
    return Response.json(
      { error: 'Hotrod backend unreachable', detail: e instanceof Error ? e.message : String(e) },
      { status: 502 }
    );
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: filterResponseHeaders(upstream.headers)
  });
}

function filterRequestHeaders(headers: Headers): Headers {
  // Drop hop-by-hop + host headers before forwarding upstream.
  const out = new Headers();
  for (const [k, v] of headers) {
    const lk = k.toLowerCase();
    if (lk === 'host' || lk === 'connection' || lk === 'content-length') continue;
    out.set(k, v);
  }
  return out;
}

function filterResponseHeaders(headers: Headers): Headers {
  const out = new Headers();
  for (const [k, v] of headers) {
    const lk = k.toLowerCase();
    if (lk === 'content-encoding' || lk === 'transfer-encoding' || lk === 'connection') continue;
    out.set(k, v);
  }
  return out;
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const PATCH = proxy;
export const HEAD = proxy;
