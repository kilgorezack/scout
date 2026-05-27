import Link from 'next/link';
import { ArrowRight, MapPin, Sparkles, Building2, Globe, Newspaper, Star, Activity, Lock } from 'lucide-react';

export default function HomePage() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Background grid + gradient */}
        <div className="absolute inset-0 -z-10 grid-bg [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
        <div className="absolute -top-40 left-1/2 -z-10 h-[640px] w-[1100px] -translate-x-1/2 rounded-full bg-gradient-to-br from-signal-200/40 via-paper-100 to-ember-100/40 blur-3xl" />

        <div className="mx-auto max-w-7xl px-5 pb-20 pt-16 sm:px-8 sm:pt-24">
          <div className="grid grid-cols-1 items-end gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-ink-900/10 bg-paper-50/60 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-700 backdrop-blur">
                <span className="grid h-1.5 w-1.5 place-items-center rounded-full bg-signal-500 animate-pulse-dot" />
                Built for broadband service providers
              </div>

              <h1 className="display-headline mt-6 text-5xl text-ink-900 sm:text-7xl">
                Know your market <span className="display-italic text-signal-700">before</span> your competitors do.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-700">
                Scout turns a list of ZIP codes into a complete competitive briefing. Overlap, technology mix, demographics, sentiment, recent launches — and ranked opportunities for your next move.
              </p>

              <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row">
                <Link href="/analyze" className="scout-btn">
                  Run a market analysis <ArrowRight size={16} />
                </Link>
                <Link href="/ai-readiness" className="scout-btn-ghost">
                  Score my website&apos;s AI readiness
                </Link>
              </div>

              <div className="mt-6 flex items-center gap-5 text-xs text-ink-500">
                <span className="inline-flex items-center gap-1.5"><Lock size={12} /> No login</span>
                <span>·</span>
                <span>Shareable link + PDF</span>
                <span>·</span>
                <span>Sourced from FCC BDC + Census ACS</span>
              </div>
            </div>

            {/* Hero preview card */}
            <div className="lg:col-span-5">
              <HeroPreview />
            </div>
          </div>
        </div>
      </section>

      {/* BENTO */}
      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-500">What&apos;s in the briefing</p>
            <h2 className="display-headline mt-2 text-4xl text-ink-900 sm:text-5xl">
              A complete market <span className="display-italic">picture</span>, in one shareable link.
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <BentoCard
            className="md:col-span-4 bg-ink-900 text-paper-50 border-ink-900"
            eyebrow="Overlap"
            title="Every provider in your footprint, mapped to the ZIPs they actually serve."
            body="See who competes with you, on what technology, at what speeds, and where the overlap is densest — sourced from the FCC Broadband Data Collection."
            icon={MapPin}
            dark
          />
          <BentoCard
            className="md:col-span-2"
            eyebrow="Sentiment"
            title="Google review scores per competitor."
            body="Service quality is the cheapest competitive moat. Know where each rival is winning or losing."
            icon={Star}
          />
          <BentoCard
            className="md:col-span-2"
            eyebrow="Demographics"
            title="TAM, sized for the audience you actually sell to."
            body="Median income, households, housing units, and SMB establishments per ZIP."
            icon={Building2}
          />
          <BentoCard
            className="md:col-span-2 bg-ember-50 border-ember-200"
            eyebrow="Launch radar"
            title="What competitors just launched in your market."
            body="Smart home, mobile bundles, FWA expansions, fiber overbuilds — tracked and tagged."
            icon={Newspaper}
            highlight
          />
          <BentoCard
            className="md:col-span-2"
            eyebrow="Opportunities"
            title="Ranked moves for your next launch."
            body="Whitespace, counter-launches, civic plays — each tied to evidence from your ZIPs."
            icon={Sparkles}
          />
          <BentoCard
            className="md:col-span-3"
            eyebrow="AI readiness"
            title="Are AI assistants citing you, or your competitor?"
            body="Scout checks crawler policy, structured data, content depth, and NAP clarity — and grades it A through F."
            icon={Globe}
          />
          <BentoCard
            className="md:col-span-3 bg-signal-600 text-white border-signal-700"
            eyebrow="Always shareable"
            title="One URL. Every stakeholder. No login."
            body="Reports are self-contained in the link. Share with marketing, ops, the board — or export to PDF."
            icon={Activity}
            dark
          />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mb-24 max-w-7xl px-5 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-ink-900/10 bg-ink-900 px-8 py-14 text-paper-50 sm:px-14">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-signal-500/30 blur-3xl" />
          <div className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-ember-500/20 blur-3xl" />
          <div className="relative max-w-2xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-paper-200/70">Start with one ZIP, or a hundred</p>
            <h2 className="display-headline mt-3 text-4xl sm:text-5xl">
              Ready to <span className="display-italic">see</span> your market?
            </h2>
            <p className="mt-4 text-paper-200/80">
              Drop in the ZIPs you serve — or the ones you&apos;re thinking about entering. Scout assembles the briefing in seconds.
            </p>
            <Link href="/analyze" className="scout-btn-signal mt-8">
              Run a market analysis <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function BentoCard({
  className = '',
  eyebrow,
  title,
  body,
  icon: Icon,
  dark = false,
  highlight = false
}: {
  className?: string;
  eyebrow: string;
  title: string;
  body: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  dark?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl border p-6 transition ${dark ? '' : 'border-ink-900/10 bg-paper-50'} ${className}`}>
      <div className={`mb-5 inline-flex h-9 w-9 items-center justify-center rounded-lg ${dark ? 'bg-white/10 text-paper-50' : highlight ? 'bg-ember-200/60 text-ember-700' : 'bg-ink-900 text-paper-50'}`}>
        <Icon size={16} />
      </div>
      <p className={`text-[10px] font-medium uppercase tracking-[0.18em] ${dark ? 'text-paper-200/70' : 'text-ink-500'}`}>
        {eyebrow}
      </p>
      <h3 className={`mt-2 display-headline text-2xl leading-[1.15] ${dark ? '' : 'text-ink-900'}`}>{title}</h3>
      <p className={`mt-3 text-sm leading-relaxed ${dark ? 'text-paper-200/80' : 'text-ink-600'}`}>{body}</p>
    </div>
  );
}

function HeroPreview() {
  return (
    <div className="relative">
      {/* Decorative back-card */}
      <div className="absolute -inset-3 -z-10 rotate-[1.5deg] rounded-3xl border border-ink-900/10 bg-paper-200/40" />
      <div className="scout-card-dark relative overflow-hidden p-6">
        <div className="flex items-center justify-between text-xs text-paper-200/70">
          <div className="flex items-center gap-2">
            <span className="grid h-2 w-2 place-items-center rounded-full bg-signal-400 animate-pulse-dot" />
            <span className="font-mono">live briefing</span>
          </div>
          <span className="font-mono">94027 · 30303 · 73301</span>
        </div>

        <p className="mt-5 text-[10px] font-medium uppercase tracking-[0.18em] text-paper-200/60">Market</p>
        <h3 className="display-headline mt-1 text-3xl text-paper-50">
          Acme Fiber <span className="display-italic text-signal-300">vs.</span> 14 competitors
        </h3>

        <div className="mt-6 grid grid-cols-3 gap-3 text-paper-50">
          <Stat n="14" label="Competitors" />
          <Stat n="3" label="ZIPs" />
          <Stat n="7" label="Opportunities" highlight />
        </div>

        <div className="mt-6 space-y-2">
          {[
            { name: 'Comcast Xfinity', tech: 'Cable', share: '78%' },
            { name: 'AT&T Fiber', tech: 'Fiber', share: '55%' },
            { name: 'T-Mobile Home Internet', tech: 'FWA', share: '95%' },
            { name: 'Starlink', tech: 'Satellite', share: '100%' }
          ].map((c, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-signal-400" />
                <span className="text-paper-50">{c.name}</span>
                <span className="text-[10px] uppercase tracking-wider text-paper-200/50">{c.tech}</span>
              </div>
              <span className="font-mono text-xs text-paper-200/80">{c.share}</span>
            </div>
          ))}
          <p className="pt-1 text-xs text-paper-200/50">+ 10 more in this footprint</p>
        </div>

        <div className="mt-6 rounded-xl border border-ember-300/30 bg-ember-500/10 p-4">
          <div className="flex items-center gap-2 text-ember-200">
            <Sparkles size={12} />
            <span className="text-[10px] font-medium uppercase tracking-[0.18em]">Top opportunity</span>
          </div>
          <p className="mt-2 text-sm text-paper-50">
            Counter-launch <span className="display-italic text-ember-200">SmartHome</span> — competitors are racing to managed WiFi in 3/3 of your ZIPs.
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ n, label, highlight = false }: { n: string; label: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${highlight ? 'border-ember-300/30 bg-ember-500/10' : 'border-white/10 bg-white/5'}`}>
      <div className={`display-headline text-3xl leading-none ${highlight ? 'text-ember-200' : 'text-paper-50'}`}>{n}</div>
      <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-paper-200/60">{label}</div>
    </div>
  );
}
