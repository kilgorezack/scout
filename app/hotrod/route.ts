// Serves the vendored Hotrod single-page app from /public/hotrod/index.html
// with the runtime MapKit token + API base injected into a <script> tag the
// Hotrod bundle reads (window.SCOUT_CONFIG).
//
// All other Hotrod assets (JS / CSS / data) are served directly by Next.js
// from public/hotrod/* with no transformation, matching the /hotrod/ base
// path baked in at build time.

import { readFileSync } from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Read once at module load (cold start) so the file lookup happens against the
// function's bundled file tree, not at request time. next.config.js uses
// outputFileTracingIncludes to ensure this file ships with the function.
const HOTROD_HTML: string | null = (() => {
  try {
    return readFileSync(
      path.join(process.cwd(), 'public', 'hotrod', 'index.html'),
      'utf-8'
    );
  } catch {
    return null;
  }
})();

export async function GET() {
  if (!HOTROD_HTML) {
    return new Response(
      'Hotrod build not found in this deploy. Make sure public/hotrod/index.html is committed and outputFileTracingIncludes is configured.',
      { status: 500, headers: { 'Content-Type': 'text/plain' } }
    );
  }

  const config = {
    mapkitToken: process.env.MAPKIT_TOKEN ?? '',
    apiBase: '/hotrod-api'
  };

  const inject = `<script>window.SCOUT_CONFIG = ${JSON.stringify(config)};</script>`;
  const injected = HOTROD_HTML.replace('</head>', `${inject}\n</head>`);

  return new Response(injected, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}
