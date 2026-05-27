import Link from 'next/link';
import { ArrowRight, MapPin, Sparkles, Building2, Globe, Newspaper, Star, Lock, ChevronRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-0 -z-10 aurora opacity-90 animate-aurora" />
        <div className="absolute inset-x-0 top-0 -z-10 h-[120%] bg-gradient-to-b from-white/0 via-white/40 to-white" />

        <div className="mx-auto max-w-7xl px-6 pb-24 pt-20 text-center sm:pt-28">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-ink-200/70 bg-white/60 px-3 py-1 text-[12px] font-medium text-ink-700 backdrop-blur-xl">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
            Built for broadband service providers
          </div>

          <h1 className="display mx-auto mt-7 max-w-5xl text-[clamp(2.75rem,7vw,5.75rem)] text-ink-900">
            Know your market
            <br />
            <span className="gradient-text">before they do.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-ink-600 sm:text-xl">
            Scout turns a list of ZIP codes into a complete competitive briefing. Overlap, technology mix,
            demographics, sentiment, recent launches — and ranked opportunities for your next move.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/analyze" className="btn-primary text-[15px]">
              Run a market analysis <ArrowRight size={16} />
            </Link>
            <Link href="/ai-readiness" className="btn-ghost text-[15px]">
              Score my website
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-ink-500">
            <span className="inline-flex items-center gap-1.5"><Lock size={12} /> No login</span>
            <span className="text-ink-300">·</span>
            <span>Shareable link</span>
            <span className="text-ink-300">·</span>
            <span>FCC BDC + Census ACS</span>
          </div>

          {/* Hero device-style preview */}
          <div className="relative mx-auto mt-16 max-w-5xl">
            <div className="absolute -inset-x-10 -bottom-10 -top-6 -z-10 rounded-[2.5rem] aurora opacity-70 blur-2xl" />
            <HeroPreview />
          </div>
        </div>
      </section>

      {/* FEATURE: OVERLAP */}
      <FeatureSection
        eyebrow="Overlap"
        title={
          <>
            Every provider in your <span className="gradient-text">footprint.</span>
          </>
        }
        body="See who competes with you, on what technology, at what speeds, and where the overlap is densest. Sourced from the FCC Broadband Data Collection."
        icon={MapPin}
        visual={<OverlapVisual />}
      />

      {/* FEATURE: OPPORTUNITIES */}
      <FeatureSection
        reverse
        dark
        eyebrow="Opportunities"
        title={
          <>
            Ranked moves for your <span className="bg-gradient-to-r from-pink-300 via-fuchsia-300 to-blue-300 bg-clip-text text-transparent">next launch.</span>
          </>
        }
        body="Whitespace, counter-launches, civic plays — each tied to evidence from your ZIPs. SmartHome, SmartTown, SmartMDU, Home OfficeIQ, SmartBiz."
        icon={Sparkles}
        visual={<OpportunitiesVisual />}
      />

      {/* FEATURE: AI READINESS */}
      <FeatureSection
        eyebrow="AI readiness"
        title={
          <>
            Can AI assistants find <span className="gradient-text">and recommend</span> you?
          </>
        }
        body="Scout checks crawler policy, structured data, content depth, and NAP clarity — and grades it A through F."
        icon={Globe}
        visual={<AIVisual />}
      />

      {/* SECONDARY GRID */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="mb-10 text-center">
          <p className="eyebrow">Also in the briefing</p>
          <h2 className="display mt-3 text-4xl text-ink-900 sm:text-5xl">Everything in one shareable link.</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <MiniFeature icon={Star} title="Sentiment" body="Google review scores for each rival in your market." />
          <MiniFeature icon={Building2} title="Demographics" body="Median income, households, housing units, SMB density — sized for the audience you actually sell to." />
          <MiniFeature icon={Newspaper} title="Launch radar" body="What competitors just launched — smart home, mobile bundles, FWA expansions, fiber overbuilds." />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="panel-dark relative overflow-hidden px-8 py-16 text-center sm:px-14 sm:py-20">
          <div className="absolute inset-0 -z-0 aurora-dark opacity-90" />
          <div className="absolute inset-0 -z-0 bg-gradient-to-b from-transparent via-ink-900/30 to-ink-900/90" />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Start with one ZIP, or a hundred</p>
            <h2 className="display mt-3 text-5xl text-white sm:text-6xl">
              Ready to see your market?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-white/70">
              Drop in the ZIPs you serve — or the ones you&apos;re thinking about entering. Scout assembles the briefing in seconds.
            </p>
            <Link href="/analyze" className="btn-accent mt-9">
              Run a market analysis <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ============= Subcomponents ============= */

function FeatureSection({
  eyebrow,
  title,
  body,
  icon: Icon,
  visual,
  reverse = false,
  dark = false
}: {
  eyebrow: string;
  title: React.ReactNode;
  body: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  visual: React.ReactNode;
  reverse?: boolean;
  dark?: boolean;
}) {
  return (
    <section className={`relative ${dark ? 'bg-ink-950' : ''}`}>
      {dark && <div className="absolute inset-0 -z-0 aurora-dark opacity-60" />}
      <div className={`relative mx-auto max-w-7xl px-6 py-24 sm:py-32`}>
        <div className={`grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20 ${reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}>
          <div>
            <div className={`inline-flex items-center gap-2 rounded-full border ${dark ? 'border-white/10 bg-white/5 text-white/80' : 'border-ink-200 bg-white/80 text-ink-700'} px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] backdrop-blur`}>
              <Icon size={12} />
              {eyebrow}
            </div>
            <h2 className={`display mt-6 text-4xl sm:text-6xl ${dark ? 'text-white' : 'text-ink-900'}`}>{title}</h2>
            <p className={`mt-6 max-w-lg text-lg leading-relaxed ${dark ? 'text-white/70' : 'text-ink-600'}`}>{body}</p>
          </div>
          <div>{visual}</div>
        </div>
      </div>
    </section>
  );
}

function MiniFeature({
  icon: Icon,
  title,
  body
}: {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  body: string;
}) {
  return (
    <div className="panel p-7">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent-500 via-fuchsia-500 to-purple-500 text-white shadow-glow">
        <Icon size={16} />
      </div>
      <h3 className="display mt-5 text-2xl text-ink-900">{title}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-600">{body}</p>
    </div>
  );
}

function HeroPreview() {
  return (
    <div className="panel relative overflow-hidden p-3 shadow-lift">
      <div className="rounded-2xl bg-ink-950 p-6 text-white">
        <div className="flex items-center justify-between text-xs text-white/60">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-dot" />
            <span className="font-mono">live briefing</span>
          </div>
          <span className="font-mono">94027 · 30303 · 73301 · 60601 · 78701</span>
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">Market</p>
            <h3 className="display mt-1 text-3xl text-white sm:text-4xl">
              Acme Fiber vs. <span className="bg-gradient-to-r from-pink-300 via-fuchsia-300 to-blue-300 bg-clip-text text-transparent">26 competitors</span>
            </h3>
          </div>
          <div className="flex gap-2">
            <Stat n="26" label="Comps" />
            <Stat n="5" label="ZIPs" />
            <Stat n="7" label="Plays" highlight />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            { name: 'Comcast Xfinity', tech: 'Cable', share: 92 },
            { name: 'AT&T Fiber', tech: 'Fiber', share: 78 },
            { name: 'T-Mobile Home Internet', tech: 'FWA', share: 95 },
            { name: 'Starlink', tech: 'Sat', share: 100 },
            { name: 'Verizon 5G Home', tech: 'FWA', share: 84 },
            { name: 'Charter Spectrum', tech: 'Cable', share: 71 }
          ].map((c, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm backdrop-blur">
              <div className="min-w-0 truncate">
                <span className="text-white">{c.name}</span>
                <span className="ml-2 text-[10px] uppercase tracking-wider text-white/50">{c.tech}</span>
              </div>
              <span className="font-mono text-xs text-white/70">{c.share}%</span>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-white/10 bg-gradient-to-r from-pink-500/15 via-fuchsia-500/15 to-blue-500/15 p-4 backdrop-blur">
          <div className="flex items-center gap-2 text-white/80">
            <Sparkles size={12} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">Top opportunity</span>
          </div>
          <p className="mt-2 text-sm text-white">
            <span className="font-semibold">SmartHome</span> counter-launch — competitors are racing to managed in-home WiFi across all 5 ZIPs.
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ n, label, highlight = false }: { n: string; label: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border px-3 py-2 backdrop-blur ${highlight ? 'border-fuchsia-400/30 bg-gradient-to-br from-pink-500/20 to-blue-500/20' : 'border-white/10 bg-white/5'}`}>
      <div className={`display text-2xl leading-none ${highlight ? 'text-white' : 'text-white'}`}>{n}</div>
      <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/60">{label}</div>
    </div>
  );
}

function OverlapVisual() {
  const cells = Array.from({ length: 30 });
  return (
    <div className="panel relative overflow-hidden p-6 shadow-lift">
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent-500/20 blur-3xl" />
      <p className="eyebrow">ZIP × competitor overlap</p>
      <div className="mt-4 grid grid-cols-6 gap-1.5">
        {cells.map((_, i) => {
          const intensity = ((i * 7) % 100) / 100;
          return (
            <div
              key={i}
              className="aspect-square rounded-md"
              style={{
                background: `rgba(0,113,227,${0.08 + intensity * 0.6})`
              }}
            />
          );
        })}
      </div>
      <div className="mt-5 flex items-center justify-between text-xs text-ink-500">
        <span>Low overlap</span>
        <div className="flex gap-1">
          {[0.1, 0.25, 0.45, 0.7, 0.95].map((a) => (
            <div key={a} className="h-3 w-6 rounded-sm" style={{ background: `rgba(0,113,227,${a})` }} />
          ))}
        </div>
        <span>High overlap</span>
      </div>
    </div>
  );
}

function OpportunitiesVisual() {
  const items = [
    { name: 'SmartHome', tag: 'Counter-launch', priority: 'high' },
    { name: 'Home OfficeIQ', tag: 'Premium tier', priority: 'high' },
    { name: 'SmartBiz Mobile', tag: 'Convergence', priority: 'medium' },
    { name: 'SmartMDU', tag: 'Density play', priority: 'low' }
  ];
  return (
    <div className="relative">
      <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-pink-500/25 via-fuchsia-500/20 to-blue-500/30 blur-2xl" />
      <div className="glass-dark relative overflow-hidden rounded-3xl p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Ranked opportunities</p>
        <div className="mt-4 space-y-2.5">
          {items.map((o, i) => (
            <div key={i} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-white/40">#{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <div className="text-[15px] font-semibold text-white">{o.name}</div>
                  <div className="text-[11px] text-white/60">{o.tag}</div>
                </div>
              </div>
              <span
                className={`pill !border-white/15 !bg-white/10 !text-white ${
                  o.priority === 'high' ? '!bg-gradient-to-r !from-pink-500/30 !to-orange-400/30' : ''
                }`}
              >
                {o.priority}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AIVisual() {
  const score = 78;
  const max = 100;
  const pct = score / max;
  const r = 70;
  const c = 2 * Math.PI * r;
  return (
    <div className="panel relative overflow-hidden p-8 shadow-lift">
      <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl" />
      <div className="absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-pink-500/20 blur-3xl" />
      <div className="relative flex items-center gap-8">
        <div className="relative">
          <svg width="180" height="180" viewBox="0 0 180 180">
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0071e3" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
            <circle cx="90" cy="90" r={r} fill="none" stroke="#f1f1f4" strokeWidth="14" />
            <circle
              cx="90"
              cy="90"
              r={r}
              fill="none"
              stroke="url(#ringGrad)"
              strokeWidth="14"
              strokeDasharray={`${c * pct} ${c}`}
              strokeLinecap="round"
              transform="rotate(-90 90 90)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="display text-5xl text-ink-900">{score}</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">/ {max}</div>
          </div>
        </div>
        <div className="space-y-2.5 text-sm">
          {[
            { label: 'Crawler policy', s: 18, m: 20 },
            { label: 'Structured data', s: 14, m: 20 },
            { label: 'Metadata', s: 13, m: 15 },
            { label: 'Content depth', s: 12, m: 15 },
            { label: 'NAP & coverage', s: 9, m: 15 },
            { label: 'Perf & SEO', s: 12, m: 15 }
          ].map((c) => (
            <div key={c.label}>
              <div className="flex items-center justify-between text-[11px] text-ink-600">
                <span>{c.label}</span>
                <span className="font-mono text-ink-700">{c.s}/{c.m}</span>
              </div>
              <div className="mt-1 h-1.5 w-44 overflow-hidden rounded-full bg-ink-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent-500 via-fuchsia-500 to-pink-500"
                  style={{ width: `${(c.s / c.m) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
