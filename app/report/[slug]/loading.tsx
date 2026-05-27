'use client';

import { useEffect, useState } from 'react';

const STAGES = [
  { label: 'Geocoding ZIP boundaries', detail: 'Resolving ZCTA polygons + centroids' },
  { label: 'Scanning the FCC BDC index', detail: 'Cross-referencing ~2,000 providers' },
  { label: 'Pulling demographics', detail: 'Census ACS households + income' },
  { label: 'Ranking opportunities', detail: 'Matching market signals to Solutions' },
  { label: 'Composing the briefing', detail: 'Almost there…' }
];

export default function ReportLoading() {
  const [step, setStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);

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

  // 45s is the Hotrod deadline; ramp the bar to ~95% over that interval.
  const pct = Math.min(95, (elapsed / 45_000) * 100);

  return (
    <div className="mx-auto max-w-7xl px-6 pb-20 pt-8">
      {/* Skeleton hero */}
      <section className="panel-dark relative overflow-hidden px-8 py-14 sm:px-14 sm:py-16">
        <div className="absolute inset-0 -z-0 aurora-dark opacity-80" />
        <div className="absolute inset-0 -z-0 bg-gradient-to-b from-transparent via-ink-900/20 to-ink-900/70" />

        <div className="relative flex flex-col gap-7">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
            <span>Building briefing</span>
            <span className="text-white/30">·</span>
            <span className="font-mono normal-case text-white/50">
              {(elapsed / 1000).toFixed(1)}s elapsed
            </span>
          </div>

          <h1 className="display text-5xl text-white sm:text-7xl">
            <span className="bg-gradient-to-r from-pink-300 via-fuchsia-300 to-blue-300 bg-clip-text text-transparent">
              Scanning
            </span>{' '}
            your market…
          </h1>

          {/* Progress bar */}
          <div className="space-y-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent-500 via-fuchsia-500 to-pink-500 transition-all duration-200"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-sm text-white/70">
              <span className="font-medium text-white">{STAGES[step].label}</span>
              <span className="ml-2 text-white/50">— {STAGES[step].detail}</span>
            </p>
          </div>

          {/* Stage checklist */}
          <ul className="space-y-2">
            {STAGES.map((s, i) => (
              <li
                key={s.label}
                className={`flex items-center gap-3 text-sm transition ${
                  i < step
                    ? 'text-white/40'
                    : i === step
                      ? 'text-white'
                      : 'text-white/30'
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
                <span className="text-xs text-white/40">{s.detail}</span>
              </li>
            ))}
          </ul>

          <p className="text-xs text-white/40">
            First scan against a fresh function instance can take 20–45s while the FCC BDC index warms.
            Subsequent runs from the same instance are near-instant.
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
