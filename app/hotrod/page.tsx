// Hosts the vendored Hotrod single-page app inside Scout's layout.
//
// Strategy: we embed the entire body of Hotrod's built index.html (which
// already wraps content in <div class="hotrod-shell">) via
// dangerouslySetInnerHTML. The MapKit CDN <script> tags + the
// __mapKitReadyPromise inline script are PART of that body HTML and get
// written into the SSR output verbatim, so the browser executes them in
// the original order with their original attributes (including the
// critical data-callback and data-libraries on the MapKit CDN script).
//
// We also re-emit head <link rel=stylesheet> and the Hotrod bundle
// <script type=module> tag because they live in the original <head>
// (not the body) and Next.js eats child <link>/<script> elements at the
// root of a page — but dangerouslySetInnerHTML on a <div> preserves them.

import { readFileSync } from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata = {
  title: 'Coverage Map — Scout',
  description: 'Compare broadband provider coverage maps side-by-side, powered by Hotrod.'
};

type Parsed = {
  /** Everything in <head> except the title/meta — links and scripts to re-emit. */
  headInnerHtml: string;
  /** Everything between <body> and </body> — already includes <div class="hotrod-shell">. */
  bodyInnerHtml: string;
};

function parse(html: string): Parsed {
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  let head = headMatch ? headMatch[1] : '';
  const body = bodyMatch ? bodyMatch[1] : '';

  // Strip <title>, <meta>, <link rel=icon>, and preconnect <link>s — Scout's
  // root layout already owns those and we don't want duplicates.
  head = head
    .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\b[^>]*>/gi, '')
    .replace(/<link\b[^>]*rel=["'](?:icon|preconnect)["'][^>]*>/gi, '');

  return { headInnerHtml: head, bodyInnerHtml: body };
}

const HOTROD_HTML: string | null = (() => {
  try {
    return readFileSync(path.join(process.cwd(), 'public', 'hotrod', 'index.html'), 'utf-8');
  } catch {
    return null;
  }
})();

const PARSED: Parsed | null = HOTROD_HTML ? parse(HOTROD_HTML) : null;

export default function HotrodPage() {
  if (!PARSED) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="eyebrow">Coverage map</p>
        <h1 className="display mt-3 text-4xl text-ink-900">Build missing.</h1>
        <p className="mt-4 text-ink-600">
          The Hotrod static build (public/hotrod/index.html) wasn&apos;t found in this deploy.
        </p>
      </div>
    );
  }

  const config = {
    mapkitToken: process.env.MAPKIT_TOKEN ?? '',
    apiBase: '/hotrod-api'
  };

  return (
    <>
      {/* Override .hotrod-shell height to sit BELOW Scout's nav.
          The standalone Hotrod default is 100vh; Scout subtracts the nav. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .hotrod-shell { height: calc(100vh - 64px) !important; }
            /* Hide Scout's footer on the coverage-map page — the dashboard is
               meant to fill the viewport below the nav. */
            body > footer { display: none; }
          `
        }}
      />

      {/* SCOUT_CONFIG must exist before the Hotrod bundle reads it.
          dangerouslySetInnerHTML on <script> emits an executing script tag
          in the SSR HTML (React 18+ supports this on the server). */}
      <script
        dangerouslySetInnerHTML={{
          __html: `window.SCOUT_CONFIG = ${JSON.stringify(config)};`
        }}
      />

      {/* Re-emit head scripts + stylesheets verbatim so MapKit and the
          Hotrod bundle load with all their original attributes intact. */}
      <div
        suppressHydrationWarning
        style={{ display: 'none' }}
        dangerouslySetInnerHTML={{ __html: PARSED.headInnerHtml }}
      />

      {/* The actual Hotrod app: body content including the
          .hotrod-shell wrapper, all inline scripts (clarity, mapkit
          ready-promise setup), and the MapKit CDN script with its
          data-callback / data-libraries attributes preserved. */}
      <div
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: PARSED.bodyInnerHtml }}
      />
    </>
  );
}
