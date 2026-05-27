'use client';

import { useEffect, useState } from 'react';

const STAGES = [
  { label: 'Geocoding ZIP boundaries', detail: 'Resolving ZCTA polygons + centroids' },
  { label: 'Scanning the FCC BDC index', detail: 'Cross-referencing ~2,000 providers' },
  { label: 'Pulling demographics', detail: 'Census ACS households + income' },
  { label: 'Ranking opportunities', detail: 'Matching market signals to Solutions' },
  { label: 'Composing the briefing', detail: 'Almost there…' }
];

// Cycle of slightly silly status messages — Claude Code style.
const MESSAGES = [
  'Reticulating fiber strands…',
  'Triangulating Starlink dishes…',
  'Bribing the FCC for a fresh map…',
  'Wrangling 2,173 ILECs into a spreadsheet…',
  'Decoding USPS sectional center codes…',
  'Whispering to ZCTAs…',
  'Asking Comcast politely for permission…',
  'Untangling cable spaghetti…',
  'Photographing competitor speed tests…',
  'Hex-tagging the basemap…',
  'Filing imaginary Form 477s…',
  'Negotiating with low-earth orbit…',
  'Bartering with rural co-ops…',
  'Polling the utility pole…',
  'Calibrating gigabit expectations…',
  'Counting actually-existing households…',
  'Pinging cell towers politely…',
  'Convincing T-Mobile to share its homework…',
  'Indexing the SmartHome opportunity surface…',
  'Recalibrating SmartTown coordinates…',
  'Drawing fiber overbuilds on a napkin…',
  'Translating tech codes into English…',
  'Splicing virtual fiber…',
  'Buffering… no wait, that’s our competitors…',
  'Asking Verizon’s 5G to hold still…',
  'Eyeballing the median household income…',
  'Sorting opportunities by audacity…',
  'Annotating launch-radar pings…',
  'Soldering hexagons together…',
  'Briefly checking on Project Kuiper…'
];

function pickShuffled<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function ReportLoading() {
  const [step, setStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [messages] = useState(() => pickShuffled(MESSAGES));
  const [msgIdx, setMsgIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const stepEvery = 3500;
    const stepTimer = setInterval(() => {
      setStep((s) => Math.min(s + 1, STAGES.length - 1));
    }, stepEvery);
    const tick = setInterval(() => setElapsed((e) => e + 100), 100);
    return () => {
      clearInterval(stepTimer);
      clearInterval(tick);
    };
  }, []);

  // Cycle funny messages every ~1.1s with a brief fade — fast enough that
  // even sub-second loads usually show at least one cycle.
  useEffect(() => {
    const id = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMsgIdx((i) => (i + 1) % messages.length);
        setFade(true);
      }, 180);
    }, 1100);
    return () => clearInterval(id);
  }, [messages.length]);

  // Start at 8% so the bar is visible on first paint; ramp toward ~95%
  // over the 45s Hotrod deadline.
  const pct = Math.min(95, 8 + (elapsed / 45_000) * 87);
  const seconds = (elapsed / 1000).toFixed(1);

  return (
    <div className="mx-auto max-w-7xl px-6 pb-20 pt-8">
      <section className="panel-dark relative overflow-hidden px-8 py-14 sm:px-14 sm:py-16">
        <div className="absolute inset-0 -z-0 aurora-dark opacity-80" />
        <div className="absolute inset-0 -z-0 bg-gradient-to-b from-transparent via-ink-900/20 to-ink-900/70" />

        <div className="relative flex flex-col gap-7">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
            <span>Building briefing</span>
            <span className="text-white/30">·</span>
            <span className="font-mono normal-case text-white/50">{seconds}s elapsed</span>
            <span className="text-white/30">·</span>
            <span className="font-mono normal-case text-white/80">{Math.round(pct)}%</span>
          </div>

          {/* Headline: cycling silly message is the hero */}
          <div className="min-h-[120px] sm:min-h-[160px]">
            <p
              className={`display text-4xl leading-tight text-white sm:text-6xl transition-opacity duration-200 ${
                fade ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <span className="bg-gradient-to-r from-pink-300 via-fuchsia-300 to-blue-300 bg-clip-text text-transparent">
                {messages[msgIdx]}
              </span>
            </p>
          </div>

          {/* Big chromatic progress bar */}
          <div className="space-y-3">
            <div className="relative h-4 w-full overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent-500 via-fuchsia-500 to-pink-500 shadow-[0_0_32px_-2px_rgba(236,72,153,0.7)] transition-all duration-200"
                style={{ width: `${pct}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 rounded-full opacity-60 mix-blend-overlay"
                style={{
                  width: `${pct}%`,
                  backgroundImage:
                    'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.2s linear infinite'
                }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/80">
                <Spinner />
                <span className="ml-2 font-medium text-white">{STAGES[step].label}</span>
                <span className="ml-2 text-white/50">— {STAGES[step].detail}</span>
              </span>
            </div>
          </div>

          {/* Stage checklist */}
          <ul className="space-y-2">
            {STAGES.map((s, i) => (
              <li
                key={s.label}
                className={`flex items-center gap-3 text-sm transition ${
                  i < step ? 'text-white/40' : i === step ? 'text-white' : 'text-white/30'
                }`}
              >
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                    i < step
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : i === step
                        ? 'bg-white/15 text-white'
                        : 'bg-white/5 text-white/40'
                  }`}
                >
                  {i < step ? '✓' : i === step ? <Spinner /> : i + 1}
                </span>
                <span>{s.label}</span>
                <span className="hidden text-xs text-white/40 sm:inline">{s.detail}</span>
              </li>
            ))}
          </ul>

          <p className="text-xs text-white/40">
            First scan against a fresh function instance can take a few seconds while the FCC BDC index
            warms. Subsequent runs from the same instance are near-instant.
          </p>
        </div>
      </section>

      {/* Skeleton tab strip */}
      <div className="mt-10">
        <div className="segmented inline-flex animate-pulse">
          {['Overview', 'Opportunities', 'Competitors', 'Coverage', 'Demographics', 'Launch radar', 'AI readiness'].map((t) => (
            <span key={t} className="segmented-item">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Skeleton body */}
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="panel lg:col-span-2 p-8">
          <div className="h-3 w-28 animate-pulse rounded bg-ink-100" />
          <div className="mt-5 space-y-2">
            <div className="h-4 animate-pulse rounded bg-ink-100" />
            <div className="h-4 w-11/12 animate-pulse rounded bg-ink-100" />
            <div className="h-4 w-10/12 animate-pulse rounded bg-ink-100" />
          </div>
          <div className="mt-6 grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-ink-100" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="panel p-5">
              <div className="h-3 w-20 animate-pulse rounded bg-ink-100" />
              <div className="mt-3 h-7 w-24 animate-pulse rounded bg-ink-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
