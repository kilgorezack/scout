// Hosts the vendored Signal React SPA inside Scout's layout — Scout's
// sticky nav stays above, Signal renders in a .signal-shell container below.
//
// Same integration shape as /hotrod: read public/signal/index.html at
// module load, write the body innerHTML via dangerouslySetInnerHTML
// (so the included <script type=module> tag actually executes on
// initial parse), re-emit head <link rel=stylesheet> + the MapKit CDN
// script via dangerouslySetInnerHTML so the page works on first paint.

import { readFileSync } from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata = {
  title: 'Signal — Scout',
  description: 'Broadband market intelligence for international markets — Australia, UK, Canada, South Africa.'
};

type Parsed = { headInnerHtml: string; bodyInnerHtml: string };

function parse(html: string): Parsed {
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  let head = headMatch ? headMatch[1] : '';
  const body = bodyMatch ? bodyMatch[1] : '';

  // Strip <title>, <meta>, <link rel=icon>, <link rel=preconnect>, and the
  // already-installed Microsoft Clarity script — Scout's root layout owns
  // those. We keep the stylesheet link, the MapKit CDN script, and the
  // bundle script.
  head = head
    .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\b[^>]*>/gi, '')
    .replace(/<link\b[^>]*rel=["'](?:icon|preconnect)["'][^>]*>/gi, '')
    .replace(/<!--\s*Microsoft Clarity[\s\S]*?<\/script>/gi, '');

  return { headInnerHtml: head, bodyInnerHtml: body };
}

const SIGNAL_HTML: string | null = (() => {
  try {
    return readFileSync(path.join(process.cwd(), 'public', 'signal', 'index.html'), 'utf-8');
  } catch {
    return null;
  }
})();

const PARSED: Parsed | null = SIGNAL_HTML ? parse(SIGNAL_HTML) : null;

export default function SignalPage() {
  if (!PARSED) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="eyebrow">Signal</p>
        <h1 className="display mt-3 text-4xl text-ink-900">Build missing.</h1>
        <p className="mt-4 text-ink-600">
          The Signal static build (public/signal/index.html) wasn&apos;t found in this deploy.
        </p>
      </div>
    );
  }

  // Signal reads SCOUT_CONFIG to force light theme + use /signal-api/.
  const config = { apiBase: '/signal-api', embedded: true };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            /* Hide the global 'Run analysis' button on /signal — feels
               wrong here. */
            body > header a.btn-primary { display: none !important; }

            /* Keep the global nav above any Signal floating UI. */
            body > header { z-index: 1000 !important; }

            /* Signal mount: full viewport, isolation so its z-indexes can't
               escape the shell and compete with Scout's nav. The Signal app
               mounts into #root inside this shell. */
            .signal-shell {
              position: relative;
              width: 100%;
              height: 100vh;
              margin-top: -64px;
              isolation: isolate;
              overflow: hidden;
              background: #fbfbfd;
            }
            .signal-shell #root {
              position: absolute;
              inset: 0;
            }

            /* Push Signal's own top nav (and any other top-aligned UI) below
               Scout's global nav so the global nav stays unobscured. Signal
               uses its own .signal-nav / .top-bar classes — both are
               handled with !important top offset. */
            .signal-shell .signal-nav,
            .signal-shell .top-bar,
            .signal-shell .market-switcher,
            .signal-shell .theme-toggle {
              top: 80px !important;
            }

            /* Match Signal's light-theme accent to Scout's iOS-style blue. */
            .signal-shell [data-theme="light"],
            .signal-shell {
              --accent: #0071e3 !important;
              --accent-hover: #0060c7 !important;
              --accent-biz: #8b5cf6 !important;
            }

            /* Hide Scout's global footer on /signal so the dashboard fills
               the viewport. */
            body > footer { display: none; }
          `
        }}
      />

      {/* SCOUT_CONFIG must be set BEFORE Signal's bundle reads it. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `window.SCOUT_CONFIG = ${JSON.stringify(config)};
                   /* Force Signal's light theme on the html element so its
                      data-theme CSS variables apply immediately. */
                   document.documentElement.setAttribute('data-theme', 'light');`
        }}
      />

      {/* Re-emit head <link>/<script> tags so the stylesheet loads and the
          MapKit CDN + Signal bundle execute on initial parse. */}
      <div
        suppressHydrationWarning
        style={{ display: 'none' }}
        dangerouslySetInnerHTML={{ __html: PARSED.headInnerHtml }}
      />

      {/* Signal mounts into #root inside the shell. */}
      <div
        className="signal-shell"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: PARSED.bodyInnerHtml }}
      />
    </>
  );
}
