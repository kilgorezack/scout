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
      {/* Page-scoped CSS overrides for the /hotrod route. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            /* Hide the 'Run analysis' CTA button on the Coverage Map page —
               it's contextually wrong here. The button is the only
               .btn-primary anchor inside the global header. */
            body > header a.btn-primary { display: none !important; }

            /* Bump the global nav above any of Hotrod's floating UI. Some
               Hotrod controls use z-index up to ~500; we want the nav above
               all of them. */
            body > header { z-index: 1000 !important; }

            /* Extend the Hotrod shell behind the nav so the nav's glass
               backdrop-blur shows the map blurred through it (liquid-glass
               look). isolation:isolate confines the shell's child z-indexes
               into a new stacking context so they can't compete with the
               nav. */
            .hotrod-shell {
              margin-top: -64px !important;
              height: 100vh !important;
              isolation: isolate !important;
            }

            /* ───────────────────────────────────────────────────────────
               Floating glass sidebar (Scout-style)
               ─────────────────────────────────────────────────────────── */
            .hotrod-shell .sidebar {
              top: 80px !important;
              left: 16px !important;
              height: calc(100vh - 96px) !important;
              width: 340px !important;
              border-radius: 22px !important;
              border: 1px solid rgba(255, 255, 255, 0.55) !important;
              background: rgba(255, 255, 255, 0.72) !important;
              backdrop-filter: blur(24px) saturate(160%) !important;
              -webkit-backdrop-filter: blur(24px) saturate(160%) !important;
              box-shadow:
                inset 0 1px 0 rgba(255, 255, 255, 0.7),
                0 1px 2px rgba(11, 15, 26, 0.04),
                0 20px 48px -16px rgba(11, 15, 26, 0.22) !important;
              overflow: hidden !important;
            }

            /* Tabs at the top of the sidebar — switch from underline pattern
               to Scout's segmented-pill look. */
            .hotrod-shell .sidebar-tabs {
              padding: 10px 12px 8px !important;
              border-bottom: none !important;
              gap: 4px !important;
              background: transparent !important;
            }
            .hotrod-shell .sidebar-tab {
              padding: 7px 0 !important;
              border-bottom: none !important;
              border-radius: 999px !important;
              font-weight: 500 !important;
              color: #515154 !important;
              transition: background 180ms ease, color 180ms ease !important;
            }
            .hotrod-shell .sidebar-tab:hover {
              background: rgba(11, 15, 26, 0.04) !important;
              color: #1d1d1f !important;
            }
            .hotrod-shell .sidebar-tab.active {
              background: #1d1d1f !important;
              color: #ffffff !important;
              border-bottom: none !important;
              font-weight: 600 !important;
            }

            /* The Add Provider CTA: use Scout's chromatic gradient. */
            .hotrod-shell .btn-add-provider {
              background: linear-gradient(135deg, #0071e3 0%, #8b5cf6 50%, #ec4899 100%) !important;
              border-radius: 14px !important;
              padding: 11px 16px !important;
              font-weight: 600 !important;
              box-shadow:
                inset 0 1px 0 rgba(255, 255, 255, 0.25),
                0 8px 24px -10px rgba(139, 92, 246, 0.55) !important;
              border: none !important;
              transition: transform 160ms ease, box-shadow 160ms ease !important;
            }
            .hotrod-shell .btn-add-provider:hover {
              transform: translateY(-1px) !important;
              box-shadow:
                inset 0 1px 0 rgba(255, 255, 255, 0.3),
                0 12px 32px -10px rgba(139, 92, 246, 0.7) !important;
            }

            /* Sidebar inner padding around the Add Provider button. */
            .hotrod-shell .sidebar-actions {
              padding: 8px 14px 14px !important;
            }

            /* Footer inside sidebar — keep it visually quieter against glass. */
            .hotrod-shell .sidebar-footer {
              background: transparent !important;
              border-top: 1px solid rgba(11, 15, 26, 0.07) !important;
              padding: 12px 16px !important;
            }

            /* Provider list area scroll polish (transparent track on glass) */
            .hotrod-shell .provider-list::-webkit-scrollbar-track {
              background: transparent !important;
            }

            /* ───────────────────────────────────────────────────────────
               Floating controls (right side)
               ─────────────────────────────────────────────────────────── */
            .hotrod-shell .map-toolbar {
              top: 80px !important;
              right: 16px !important;
            }
            .hotrod-shell .map-toolbar-btn {
              background: rgba(255, 255, 255, 0.72) !important;
              backdrop-filter: blur(24px) saturate(160%) !important;
              -webkit-backdrop-filter: blur(24px) saturate(160%) !important;
              border: 1px solid rgba(255, 255, 255, 0.55) !important;
              color: #1d1d1f !important;
              box-shadow:
                inset 0 1px 0 rgba(255, 255, 255, 0.7),
                0 8px 20px -8px rgba(11, 15, 26, 0.18) !important;
            }
            .hotrod-shell .map-toolbar-btn:hover {
              background: rgba(255, 255, 255, 0.9) !important;
            }
            .hotrod-shell .map-toolbar-btn.active {
              background: #1d1d1f !important;
              color: #ffffff !important;
            }

            /* Draw hint and other floaters: same offset rule. */
            .hotrod-shell .draw-hint,
            .hotrod-shell #overbuild-legend,
            .hotrod-shell .area-search-results,
            .hotrod-shell .toast-host {
              top: 80px !important;
            }

            /* MapKit's built-in zoom controls (bottom-right) — let them
               adopt a glassy look too. */
            .hotrod-shell .mk-zoom-control {
              backdrop-filter: blur(20px) !important;
              -webkit-backdrop-filter: blur(20px) !important;
            }

            /* Hide Scout's footer on this page — the dashboard fills the
               viewport. */
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
