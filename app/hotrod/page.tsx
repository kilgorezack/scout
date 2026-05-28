// Hosts the vendored Hotrod single-page app inside Scout's layout — Scout's
// sticky nav stays above, Hotrod renders in a .hotrod-shell container below.
//
// Hotrod is a vanilla-JS Vite app, so we:
//   1. Read public/hotrod/index.html at module load
//   2. Extract its body content + any non-script <link> / <meta> tags
//   3. Render the body content as raw HTML inside <div className="hotrod-shell">
//   4. Re-emit Hotrod's CSS / inline scripts / module bundle via Next.js
//      <Script> tags so they actually execute (dangerouslySetInnerHTML never
//      runs <script> on its own).
//   5. Inject window.SCOUT_CONFIG (with the MapKit token + the /hotrod-api
//      base URL) BEFORE the bundle runs.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import Script from 'next/script';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata = {
  title: 'Coverage Map — Scout',
  description: 'Compare broadband provider coverage maps side-by-side, powered by Hotrod.'
};

type ParsedHtml = {
  bodyHtml: string;
  cssHrefs: string[];
  inlineHeadScripts: string[];
  externalScripts: { src: string; crossOrigin?: string; integrity?: string; isModule: boolean }[];
};

function parseHotrodHtml(html: string): ParsedHtml {
  // Body inner HTML.
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  let bodyHtml = bodyMatch ? bodyMatch[1] : '';

  // Strip all <script> tags from the body — we re-emit them via <Script>.
  const bodyScripts: ParsedHtml['externalScripts'] = [];
  const bodyInlineScripts: string[] = [];
  bodyHtml = bodyHtml.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (_full, attrs, inner) => {
    const srcMatch = (attrs as string).match(/\bsrc=["']([^"']+)["']/i);
    const isModule = /type=["']module["']/i.test(attrs);
    if (srcMatch) {
      bodyScripts.push({ src: srcMatch[1], isModule });
    } else if ((inner as string).trim()) {
      bodyInlineScripts.push(inner as string);
    }
    return '';
  });

  // Head scripts (e.g. MapKit JS CDN + inline mapkit-ready promise).
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const headHtml = headMatch ? headMatch[1] : '';

  const headExternal: ParsedHtml['externalScripts'] = [];
  const headInline: string[] = [];
  headHtml.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (_full, attrs, inner) => {
    const srcMatch = (attrs as string).match(/\bsrc=["']([^"']+)["']/i);
    const coMatch = (attrs as string).match(/\bcrossorigin=["']([^"']+)["']/i);
    const intMatch = (attrs as string).match(/\bintegrity=["']([^"']+)["']/i);
    const isModule = /type=["']module["']/i.test(attrs);
    if (srcMatch) {
      headExternal.push({
        src: srcMatch[1],
        crossOrigin: coMatch?.[1],
        integrity: intMatch?.[1],
        isModule
      });
    } else if ((inner as string).trim()) {
      headInline.push(inner as string);
    }
    return '';
  });

  // CSS hrefs from <link rel="stylesheet" ...>
  const cssHrefs: string[] = [];
  for (const match of headHtml.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi)) {
    const href = match[0].match(/\bhref=["']([^"']+)["']/i)?.[1];
    if (href) cssHrefs.push(href);
  }

  return {
    bodyHtml,
    cssHrefs,
    inlineHeadScripts: [...headInline, ...bodyInlineScripts],
    externalScripts: [...headExternal, ...bodyScripts]
  };
}

const HOTROD_HTML: string | null = (() => {
  try {
    return readFileSync(path.join(process.cwd(), 'public', 'hotrod', 'index.html'), 'utf-8');
  } catch {
    return null;
  }
})();

const PARSED: ParsedHtml | null = HOTROD_HTML ? parseHotrodHtml(HOTROD_HTML) : null;

export default function HotrodPage() {
  if (!PARSED) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="eyebrow">Coverage map</p>
        <h1 className="display mt-3 text-4xl text-ink-900">Build missing.</h1>
        <p className="mt-4 text-ink-600">
          The Hotrod static build (public/hotrod/index.html) wasn&apos;t found in this deploy.
          Re-run the vendored Vite build with <code>SCOUT_BUILD=1</code> and commit the
          contents of <code>public/hotrod/</code>.
        </p>
      </div>
    );
  }

  const config = {
    mapkitToken: process.env.MAPKIT_TOKEN ?? '',
    apiBase: '/hotrod-api'
  };
  const configJson = JSON.stringify(config);

  return (
    <>
      {/* Hotrod's stylesheets — load in head so they're applied before the body renders. */}
      {PARSED.cssHrefs.map((href) => (
        // eslint-disable-next-line @next/next/no-css-tags
        <link key={href} rel="stylesheet" href={href} />
      ))}

      {/* SCOUT_CONFIG must be set before the Hotrod bundle reads MAPKIT_TOKEN / API_BASE. */}
      <Script id="scout-hotrod-config" strategy="beforeInteractive">
        {`window.SCOUT_CONFIG = ${configJson};`}
      </Script>

      {/* Hotrod's inline head scripts (e.g. the __mapKitReadyPromise setup that
          needs to run BEFORE the MapKit CDN script fires). */}
      {PARSED.inlineHeadScripts.map((src, i) => (
        <Script key={`inline-${i}`} id={`hotrod-inline-${i}`} strategy="beforeInteractive">
          {src}
        </Script>
      ))}

      {/* Hotrod's external scripts (MapKit CDN + its own bundle). */}
      {PARSED.externalScripts.map((s, i) => (
        <Script
          key={`ext-${i}`}
          id={`hotrod-ext-${i}`}
          src={s.src}
          type={s.isModule ? 'module' : undefined}
          crossOrigin={s.crossOrigin as 'anonymous' | 'use-credentials' | undefined}
          integrity={s.integrity}
          strategy="afterInteractive"
        />
      ))}

      {/* The Hotrod app DOM, mounted inside a .hotrod-shell container so it
          sits below Scout's nav and is positioned relative to the container. */}
      <div className="hotrod-shell" dangerouslySetInnerHTML={{ __html: PARSED.bodyHtml }} />
    </>
  );
}
