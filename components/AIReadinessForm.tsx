'use client';

import { useState } from 'react';
import { Loader2, Search, ChevronDown, Info } from 'lucide-react';
import type { AIReadinessReport } from '@/lib/ai-readiness';

const GRADE_GRADIENT: Record<string, string> = {
  A: 'from-emerald-400 to-accent-500',
  B: 'from-accent-400 to-fuchsia-500',
  C: 'from-amber-400 to-fuchsia-500',
  D: 'from-orange-400 to-pink-500',
  F: 'from-pink-500 to-red-500'
};

const RUBRIC = [
  {
    id: 'crawlers',
    label: 'Crawler policy',
    max: 20,
    rules: [
      ['robots.txt is reachable', '+4'],
      ['AI bots (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) are not blocked', '+8'],
      ['robots.txt declares a Sitemap directive', '+2'],
      ['/llms.txt is published', '+6']
    ]
  },
  {
    id: 'schema',
    label: 'Structured data (JSON-LD)',
    max: 20,
    rules: [
      ['Organization schema', '+5'],
      ['LocalBusiness schema', '+4'],
      ['Service schema', '+4'],
      ['FAQPage schema', '+4'],
      ['BreadcrumbList schema', '+3']
    ]
  },
  {
    id: 'metadata',
    label: 'Metadata quality',
    max: 15,
    rules: [
      ['<title> between 15–70 characters', '+4'],
      ['meta description 60–200 characters', '+3'],
      ['Open Graph og:title + og:image set', '+3'],
      ['twitter:card declared', '+2'],
      ['<link rel="canonical"> set', '+3']
    ]
  },
  {
    id: 'content',
    label: 'Content depth',
    max: 15,
    rules: [
      ['≥800 words of body copy', '+5'],
      ['300–799 words of body copy', '+2'],
      ['Exactly one <h1> and ≥2 <h2>', '+4'],
      ['FAQ-style content detected', '+3'],
      ['≥8 service keywords (fiber/gigabit/wifi/…)', '+3']
    ]
  },
  {
    id: 'nap',
    label: 'Name, address & coverage',
    max: 15,
    rules: [
      ['Phone number visible on page', '+4'],
      ['Street address visible', '+3'],
      ['ZIP code visible', '+2'],
      ['Service-area / availability language', '+6']
    ]
  },
  {
    id: 'perf',
    label: 'Performance & SEO basics',
    max: 15,
    rules: [
      ['Site served over HTTPS', '+4'],
      ['sitemap.xml reachable', '+4'],
      ['Mobile viewport meta set', '+3'],
      ['<html lang> set', '+2'],
      ['<link rel="preload"> hints present', '+2']
    ]
  }
];

// Plain-language "why this matters / how to do it" for each category, shown in
// a tooltip on the section heading. Kept jargon-light on purpose.
const SECTION_EXPLAINERS: Record<string, { why: string; how: string }> = {
  crawlers: {
    why: 'Checks whether AI crawlers and search bots are allowed in and can find your pages. If they’re blocked or can’t navigate your site, you simply won’t show up in AI answers or search.',
    how: 'Allow the major AI bots in robots.txt, point them to a sitemap, and publish an llms.txt fact sheet about your business.'
  },
  schema: {
    why: 'Structured data is a hidden, machine-readable summary of your business. It lets assistants describe you accurately instead of guessing from your page text.',
    how: 'Add JSON-LD snippets for your organization, location, services, and FAQs.'
  },
  metadata: {
    why: 'These tags are the title, summary, and preview image AI and search engines show for your site — your first impression in results and shared links.',
    how: 'Set a clear page title, a meta description, social-preview tags, and a canonical URL.'
  },
  content: {
    why: 'Assistants can only recommend what your page actually says. Thin pages give them nothing to work with, so they surface a competitor instead.',
    how: 'Write substantive copy, use clear headings, add an FAQ, and plainly name the services you sell.'
  },
  nap: {
    why: 'Your name, address, phone, and coverage area are the signals assistants use to match you to “providers near me” and to a specific ZIP code.',
    how: 'Show a phone number and address, and add a clear service-area list or address-availability checker.'
  },
  perf: {
    why: 'Baseline technical health — security, mobile-friendliness, and discoverability — that affects whether you’re trusted and fully indexed.',
    how: 'Serve the site over HTTPS, publish a sitemap, and set the mobile viewport and page language.'
  }
};

// Per-recommendation explainers. Each suggestion string from the scorer is
// matched (by a distinctive keyword) to the first entry whose test passes.
const EXPLAINERS: { test: RegExp; why: string; how: string }[] = [
  {
    test: /llms\.txt/i,
    why: 'An llms.txt is a plain-text cheat sheet that tells AI assistants (ChatGPT, Claude, Perplexity) the key facts about you in one place — what you sell, where you serve, your plans and pricing. Without it they have to piece you together from scattered pages and often get it wrong or skip you.',
    how: 'Create a text file named llms.txt at your domain root (yoursite.com/llms.txt). In plain sentences, list your company name, the cities/ZIPs you serve, your plans and speeds, pricing, and a contact/sign-up link. Keep it short and factual.'
  },
  {
    test: /Unblock.*crawler|AI crawler/i,
    why: 'Your robots.txt is currently telling AI crawlers (GPTBot, ClaudeBot, PerplexityBot) to stay out. If assistants can’t read your site, they can’t recommend you when someone asks “who offers fiber in my area?”',
    how: 'In robots.txt, remove the “Disallow: /” lines under those AI bot names, or add “Allow: /” for them. Allowing even one major AI crawler is enough to start being cited.'
  },
  {
    test: /Sitemap:`? directive|`Sitemap:`/i,
    why: 'A sitemap is a map of all your pages. Telling crawlers where it is helps them find and index everything — including deeper plan and coverage pages — faster.',
    how: 'Add one line to robots.txt: “Sitemap: https://yoursite.com/sitemap.xml”.'
  },
  {
    test: /Publish a robots\.txt/i,
    why: 'robots.txt is the first file crawlers and AI bots look for. If it’s missing, some bots crawl less to play it safe — and you lose the chance to point them at your sitemap.',
    how: 'Add a file named robots.txt at your domain root. A minimal version: “User-agent: *”, “Allow: /”, then “Sitemap: https://yoursite.com/sitemap.xml”.'
  },
  {
    test: /JSON-LD/i,
    why: 'Structured data (JSON-LD) states facts about your business in a format machines read perfectly — name, location, services, FAQs. It removes guesswork, so assistants and Google can confidently describe and surface you.',
    how: 'Add a small <script type="application/ld+json"> block in your page head using schema.org templates — Organization (name, logo, contact), LocalBusiness (address, hours, area served), Service (each plan), FAQPage (your Q&As), BreadcrumbList (page hierarchy). Google’s Rich Results Test validates it.'
  },
  {
    test: /<title>/i,
    why: 'Your title is the headline assistants and search engines show for your site. A vague or missing title makes you look generic; a clear one tells everyone exactly who you are and where.',
    how: 'Set a <title> in the page head, 15–70 characters, with your brand + main service + area. Example: “Acme Fiber — Gigabit Internet in Springfield, IL”.'
  },
  {
    test: /meta description/i,
    why: 'The meta description is the short blurb shown under your title and in link previews. It’s a free elevator pitch — assistants often reuse it word-for-word.',
    how: 'Add <meta name="description" content="…"> in the head, 60–200 characters, summarizing what you offer and where, with a reason to click.'
  },
  {
    test: /Open Graph|og:title/i,
    why: 'Open Graph tags control how your link looks when shared (texts, social, chat previews) — the title and image. Good ones look credible; missing ones produce blank, unclickable cards.',
    how: 'Add <meta property="og:title"> and <meta property="og:image"> (a 1200×630 image) in the head. Most site builders and SEO plugins have fields for these.'
  },
  {
    test: /twitter:card/i,
    why: 'Like Open Graph but for X/Twitter and some chat apps — it makes shared links render as a rich preview with an image instead of a bare URL.',
    how: 'Add <meta name="twitter:card" content="summary_large_image"> in the head. Your Open Graph image gets reused for the preview.'
  },
  {
    test: /canonical/i,
    why: 'A canonical tag tells search engines and assistants which URL is the “official” one when the same page is reachable several ways (with/without www, tracking links). It stops your ranking signals from being split.',
    how: 'Add <link rel="canonical" href="https://yoursite.com/page"> in the head, pointing to the clean, preferred URL of that page.'
  },
  {
    test: /Expand homepage copy|indexable text/i,
    why: 'Assistants can only describe what’s actually written on the page. A thin homepage gives them little to work with, so you get skipped for competitors with richer pages.',
    how: 'Add 300+ words of real, useful text — your plans, speeds, coverage area, install process, and support. Don’t bury everything inside images.'
  },
  {
    test: /<h1>|<h2>/i,
    why: 'Headings give your page a clear outline that machines use to understand it and pull out sections. One clear H1 plus topical H2s makes your content easy to parse and quote.',
    how: 'Use a single <h1> for the page’s main title, then <h2> for each section (Plans, Coverage, Pricing, FAQ). Don’t use headings just to make text big.'
  },
  {
    test: /FAQ/i,
    why: 'FAQ content directly answers the questions people ask assistants (“Do you offer fiber in 12345?”). The Q&A format is exactly what assistants love to lift and cite.',
    how: 'Add an FAQ section with real questions and short answers (availability, pricing, install time, contracts). Bonus: mark it up with FAQPage schema.'
  },
  {
    test: /service offerings|services explicit/i,
    why: 'If your homepage doesn’t plainly name what you sell (fiber, gigabit, WiFi, TV, mobile), assistants can’t confidently match you to someone searching for those services.',
    how: 'State your offerings in the page text and headings — e.g., “Fiber internet up to 2 Gbps, whole-home WiFi, and streaming TV.”'
  },
  {
    test: /phone number/i,
    why: 'A visible phone number is a strong trust and local-business signal, and assistants surface it when people want to contact a provider.',
    how: 'Put your phone number in the header or footer as real text (not inside an image), ideally as a tap-to-call “tel:” link.'
  },
  {
    test: /physical address/i,
    why: 'A physical address signals you’re a real, local provider — which helps local search and assistants answering “providers near me.”',
    how: 'Add your business address to the footer as text. If you have no storefront, list your service area instead.'
  },
  {
    test: /availability check|service area description/i,
    why: 'Coverage language (“check availability”, “enter your address”, a service-area list) is the single biggest signal for a broadband provider — it tells assistants where you actually serve so they can match you to a location.',
    how: 'Add an address/ZIP availability checker, or clearly list the cities and ZIPs you serve, and make “Check availability” prominent.'
  },
  {
    test: /HTTPS/i,
    why: 'HTTPS (the padlock) is a baseline trust and ranking signal. Sites without it get flagged “not secure” and demoted.',
    how: 'Enable SSL on your site — most hosts offer a free certificate (Let’s Encrypt) in one click — then force all traffic to https://.'
  },
  {
    test: /sitemap\.xml/i,
    why: 'A sitemap is a machine-readable list of all your pages, so crawlers index your whole site instead of only what they stumble onto.',
    how: 'Generate a sitemap.xml (most CMSs and SEO plugins do this automatically), host it at yoursite.com/sitemap.xml, and reference it in robots.txt.'
  },
  {
    test: /viewport/i,
    why: 'The viewport tag makes your site render properly on phones. Most visitors — and mobile-first crawlers — are on mobile; without it the page looks broken and gets penalized.',
    how: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> in the page head.'
  },
  {
    test: /`lang`|lang attribute|lang on/i,
    why: 'The lang attribute tells browsers and assistants what language your page is in, which improves accessibility and how your content is read and translated.',
    how: 'Set the language on your root tag: <html lang="en">.'
  }
];

function findExplainer(suggestion: string): { why: string; how: string } | null {
  return EXPLAINERS.find((e) => e.test.test(suggestion)) ?? null;
}

export default function AIReadinessForm() {
  const [url, setUrl] = useState('');
  const [report, setReport] = useState<AIReadinessReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRubric, setShowRubric] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setReport(null);
    setLoading(true);
    try {
      const res = await fetch('/api/ai-readiness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      if (!res.ok) throw new Error('Scan failed');
      setReport((await res.json()) as AIReadinessReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not scan that URL.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <form className="glass flex flex-col gap-2 rounded-full p-2 sm:flex-row sm:items-center" onSubmit={onSubmit}>
        <div className="flex flex-1 items-center gap-2 pl-3">
          <Search size={16} className="shrink-0 text-ink-400" />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-broadband-site.com"
            className="flex-1 bg-transparent py-2.5 text-[15px] text-ink-900 placeholder:text-ink-400 focus:outline-none"
          />
        </div>
        <button type="submit" className="btn-primary" disabled={loading || url.length < 4}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          {loading ? 'Scanning…' : 'Scan site'}
        </button>
      </form>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {report && report.fatalError && (
        <div className="panel p-5 text-sm text-red-700">{report.fatalError}</div>
      )}

      {report && !report.fatalError && (
        <div className="space-y-5">
          {/* Score hero */}
          <div className="panel-dark relative overflow-hidden p-8 sm:p-10">
            <div className="absolute inset-0 -z-0 aurora-dark opacity-80" />
            <div className="relative flex flex-col items-center justify-between gap-8 sm:flex-row">
              <div className="flex flex-col items-center gap-1 text-center sm:items-start sm:text-left">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Overall score</p>
                <div className="flex items-baseline gap-2">
                  <span className="display text-7xl text-white">{report.totalScore}</span>
                  <span className="text-2xl font-medium text-white/50">/ {report.maxScore}</span>
                </div>
                <p className="mt-2 break-all font-mono text-xs text-white/50">{report.url}</p>
              </div>
              <ScoreRing
                value={report.totalScore}
                max={report.maxScore}
                grade={report.grade}
              />
            </div>
          </div>

          {/* Category grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {report.categories.map((c) => (
              <div key={c.id} className="panel p-6">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="flex items-center gap-1.5 text-[15px] font-semibold text-ink-900">
                    {c.label}
                    {SECTION_EXPLAINERS[c.id] && (
                      <InfoHint why={SECTION_EXPLAINERS[c.id].why} how={SECTION_EXPLAINERS[c.id].how} align="left" />
                    )}
                  </h3>
                  <span className="font-mono text-sm text-ink-700">{c.score} / {c.max}</span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent-500 via-fuchsia-500 to-pink-500 transition-all"
                    style={{ width: `${Math.round((c.score / c.max) * 100)}%` }}
                  />
                </div>
                {c.details.length > 0 && (
                  <ul className="mt-4 space-y-1 text-xs text-ink-700">
                    {c.details.map((d, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-emerald-500">✓</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {c.suggestions.length > 0 && (
                  <ul className="mt-3 space-y-1.5 text-xs text-fuchsia-700">
                    {c.suggestions.map((s, i) => {
                      const ex = findExplainer(s);
                      return (
                        <li key={i} className="flex items-start gap-2">
                          <span aria-hidden>→</span>
                          <span className="flex-1">{s}</span>
                          {ex && <InfoHint why={ex.why} how={ex.how} align="right" />}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How it's scored — always available */}
      <div className="panel overflow-hidden">
        <button
          onClick={() => setShowRubric((s) => !s)}
          className="flex w-full items-center justify-between px-6 py-4 text-left transition hover:bg-bg-subtle"
        >
          <div>
            <p className="eyebrow">How it&apos;s scored</p>
            <p className="mt-1 text-[15px] text-ink-700">
              100 points across 6 categories. Tap to see the exact rubric.
            </p>
          </div>
          <ChevronDown size={18} className={`text-ink-500 transition ${showRubric ? 'rotate-180' : ''}`} />
        </button>
        {showRubric && (
          <div className="border-t border-ink-100 px-6 py-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {RUBRIC.map((cat) => (
                <div key={cat.id}>
                  <div className="flex items-baseline justify-between">
                    <h4 className="text-[15px] font-semibold text-ink-900">{cat.label}</h4>
                    <span className="font-mono text-xs text-ink-500">max {cat.max}</span>
                  </div>
                  <ul className="mt-2 space-y-1 text-[13px] text-ink-700">
                    {cat.rules.map(([rule, pts]) => (
                      <li key={rule} className="flex justify-between gap-3">
                        <span>{rule}</span>
                        <span className="font-mono text-ink-500">{pts}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-ink-100 bg-bg-subtle px-4 py-3 text-xs text-ink-600">
              <span className="font-semibold text-ink-900">Grade thresholds:</span>{' '}
              A ≥ 90% · B ≥ 75% · C ≥ 60% · D ≥ 40% · F &lt; 40%.{' '}
              Heuristic only — no headless browser, no Core Web Vitals. Treat as a quick credibility check
              that LLMs have the signals they need to surface you.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoHint({ why, how, align = 'left' }: { why: string; how: string; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false);
  const pos = align === 'right' ? 'right-0' : 'left-0';
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label="Why this matters and how to do it"
        aria-expanded={open}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.preventDefault();
          setOpen((o) => !o);
        }}
        className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-ink-400 transition hover:text-accent-500"
      >
        <Info size={13} />
      </button>
      {open && (
        <span
          role="tooltip"
          className={`absolute top-6 ${pos} z-30 w-72 cursor-default rounded-xl border border-ink-200 bg-white p-3 text-left font-normal normal-case shadow-lift`}
        >
          <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-600">Why it matters</span>
          <span className="mt-1 block text-xs leading-relaxed text-ink-600">{why}</span>
          <span className="mt-2.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-fuchsia-600">How to do it</span>
          <span className="mt-1 block text-xs leading-relaxed text-ink-600">{how}</span>
        </span>
      )}
    </span>
  );
}

function ScoreRing({ value, max, grade }: { value: number; max: number; grade: string }) {
  const pct = max > 0 ? value / max : 0;
  const r = 78;
  const c = 2 * Math.PI * r;
  const grad = GRADE_GRADIENT[grade] ?? GRADE_GRADIENT.F;
  return (
    <div className="relative">
      <svg width="200" height="200" viewBox="0 0 200 200">
        <defs>
          <linearGradient id="ringGradMain" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={grad.includes('emerald') ? '#34d399' : grad.includes('accent-400') ? '#60a5fa' : grad.includes('amber') ? '#fbbf24' : grad.includes('orange') ? '#fb923c' : '#ec4899'} />
            <stop offset="100%" stopColor={grad.includes('accent-500') ? '#0071e3' : grad.includes('pink-500') ? '#ec4899' : grad.includes('red-500') ? '#ef4444' : '#a855f7'} />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="14" />
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke="url(#ringGradMain)"
          strokeWidth="14"
          strokeDasharray={`${c * pct} ${c}`}
          strokeLinecap="round"
          transform="rotate(-90 100 100)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="display text-6xl text-white">{grade}</div>
        <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">grade</div>
      </div>
    </div>
  );
}
