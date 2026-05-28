// Serves the vendored Hotrod single-page app from /public/hotrod/index.html
// with the runtime MapKit token + API base injected into a <script> tag the
// Hotrod bundle reads (window.SCOUT_CONFIG).
//
// All other Hotrod assets (JS / CSS / data) are served directly by Next.js
// from public/hotrod/* with no transformation, matching the /hotrod/ base
// path baked in at build time.

import fs from 'node:fs/promises';
import path from 'node:path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const file = path.join(process.cwd(), 'public', 'hotrod', 'index.html');
  let html: string;
  try {
    html = await fs.readFile(file, 'utf-8');
  } catch {
    return new Response('Hotrod build not found. Re-run the build step.', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  const mapkitToken = process.env.MAPKIT_TOKEN ?? '';
  const config = {
    mapkitToken,
    apiBase: '/hotrod-api'
  };

  const inject = `<script>window.SCOUT_CONFIG = ${JSON.stringify(config)};</script>`;
  const injected = html.replace('</head>', `${inject}\n</head>`);

  return new Response(injected, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Don't aggressively cache — the injection includes a secret token
      // that's per-deploy, not per-request, but we want fresh env on redeploy.
      'Cache-Control': 'no-store'
    }
  });
}
