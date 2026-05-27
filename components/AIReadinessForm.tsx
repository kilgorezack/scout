'use client';

import { useState } from 'react';
import { Loader2, Search, ChevronDown } from 'lucide-react';
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
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-semibold text-ink-900">{c.label}</h3>
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
                  <ul className="mt-3 space-y-1 text-xs text-fuchsia-700">
                    {c.suggestions.map((s, i) => (
                      <li key={i} className="flex gap-2">
                        <span>→</span>
                        <span>{s}</span>
                      </li>
                    ))}
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
