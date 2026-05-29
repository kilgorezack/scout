'use client';

import { useState } from 'react';
import { Sparkles, Star } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import type { ReportPayload } from '@/lib/report';
import DeepResearchDrawer from '@/components/DeepResearchDrawer';

const TECH_COLOR: Record<string, string> = {
  Fiber: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Cable: 'bg-amber-50 text-amber-700 border-amber-200',
  FWA: 'bg-violet-50 text-violet-700 border-violet-200',
  DSL: 'bg-ink-100 text-ink-700 border-ink-200',
  Satellite: 'bg-sky-50 text-sky-700 border-sky-200'
};

export default function CompetitorsTab({ report }: { report: ReportPayload }) {
  if (report.competitors.length === 0) {
    return (
      <div className="panel p-7">
        <p className="eyebrow">No competitors returned</p>
        <h3 className="display mt-2 text-2xl text-ink-900">Empty result from {report.dataSource}.</h3>
        {report.hotrodDiagnostics && (
          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">Providers scanned</dt>
              <dd className="font-mono text-ink-900">{report.hotrodDiagnostics.providersScanned}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">Matches found</dt>
              <dd className="font-mono text-ink-900">{report.hotrodDiagnostics.matchesFound}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">Elapsed</dt>
              <dd className="font-mono text-ink-900">{report.hotrodDiagnostics.totalMillis} ms</dd>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">Hexes per ZIP</dt>
              <dd className="font-mono text-xs text-ink-900">
                {Object.entries(report.hotrodDiagnostics.zipsResolved).map(([z, n]) => (
                  <span key={z} className="mr-2">{z}:{n}</span>
                ))}
              </dd>
            </div>
          </dl>
        )}
        {report.hotrodDiagnostics?.error && (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
            {report.hotrodDiagnostics.error}
          </p>
        )}
        <p className="mt-5 text-sm text-ink-600">
          If hexes per ZIP is 0, the ZIP→hex lookup failed (Census/Zippopotam unreachable). If providers
          scanned is 0, the Firebase bucket fetch failed. If matches found is 0 but the other counts
          look right, your ZIP genuinely has no providers in the BDC index — verify by spot-checking a
          neighboring ZIP.
        </p>
      </div>
    );
  }
  return <CompetitorsList report={report} />;
}

function CompetitorsList({ report }: { report: ReportPayload }) {
  const [openName, setOpenName] = useState<string | null>(null);
  const opened = report.competitors.find((c) => c.providerName === openName);

  // Pull news headlines for the opened competitor to feed to Gemini as context.
  const openedHeadlines = opened
    ? report.news
        .filter((n) => n.providerName === opened.providerName)
        .slice(0, 8)
        .map((n) => `${n.title} (${n.publishedAt})`)
    : [];

  // Footprint coverage denominator. `locationsServed` is proportional to the
  // area a provider covers (in the live BDC path it's the count of map hexes
  // it serves inside the ZIP × 15). The broadest provider in each ZIP — a
  // satellite or incumbent that passes ~every location — approximates the
  // total serviceable base there, so we take the max served per ZIP and sum
  // across the whole footprint. A provider's coverage % is then its served
  // locations over that total: satellite/nationwide players land at ~100%,
  // FWA high, a regional overbuilder low.
  const maxLocationsByZip = new Map<string, number>();
  for (const r of report.providersByZip) {
    maxLocationsByZip.set(r.zip, Math.max(maxLocationsByZip.get(r.zip) ?? 0, r.locationsServed));
  }
  const serviceableLocations = report.zips.reduce((sum, z) => sum + (maxLocationsByZip.get(z) ?? 0), 0);

  return (
    <>
      <div className="mb-7">
        <p className="eyebrow">Competitors</p>
        <h2 className="display mt-2 text-4xl text-ink-900">
          <span className="gradient-text">{report.competitors.length}</span> providers in your footprint
        </h2>
        <p className="mt-2 text-sm text-ink-500">
          Tap <span className="font-medium text-ink-700">Deep dive</span> on any card to generate a live Gemini-powered competitive briefing.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {report.competitors.map((c) => {
          const review = report.reviews[c.providerName];
          // Coverage of your footprint: this provider's served locations as a
          // share of the total serviceable locations across your ZIPs. Bounded
          // 0–100% by construction (a provider can't serve more than the max in
          // any ZIP), and meaningful even on single-ZIP reports.
          const coveragePct = serviceableLocations > 0
            ? Math.min(100, Math.round((c.totalLocations / serviceableLocations) * 100))
            : 0;
          return (
            <div key={c.providerName} className="panel p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-[16px] font-semibold leading-snug text-ink-900">{c.providerName}</h3>
                  <p className="mt-1 text-xs text-ink-500">
                    <span className="font-mono text-ink-800">{coveragePct}%</span> footprint coverage
                    <span className="text-ink-400"> · present in {c.zips.length} of {report.zips.length} ZIP{report.zips.length === 1 ? '' : 's'}</span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1 rounded-full border border-ink-200 bg-bg-subtle px-2.5 py-1 text-[11px] font-medium text-ink-700">
                  <Star size={11} className="fill-amber-400 stroke-amber-500" />
                  <span>{(review?.stars ?? 0).toFixed(1)}</span>
                  <span className="text-ink-300">·</span>
                  <span className="font-mono text-ink-600">{formatNumber(review?.reviewCount ?? 0)}</span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.technologies.map((t) => (
                  <span key={t} className={`pill ${TECH_COLOR[t] ?? ''}`}>{t}</span>
                ))}
              </div>

              <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-ink-100 pt-4 text-sm">
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">Down</dt>
                  <dd className="display mt-1 text-2xl leading-tight text-ink-900">{formatNumber(c.maxDownMbps)}</dd>
                  <dd className="text-[10px] text-ink-500">Mbps</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">Up</dt>
                  <dd className="display mt-1 text-2xl leading-tight text-ink-900">{formatNumber(c.maxUpMbps)}</dd>
                  <dd className="text-[10px] text-ink-500">Mbps</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">Locations</dt>
                  <dd className="display mt-1 text-2xl leading-tight text-ink-900">{formatNumber(c.totalLocations)}</dd>
                  <dd className="text-[10px] text-ink-500">served</dd>
                </div>
              </dl>

              <button
                type="button"
                onClick={() => setOpenName(c.providerName)}
                className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-fuchsia-200 bg-gradient-to-r from-pink-50 via-fuchsia-50 to-blue-50 px-3 py-1.5 text-[13px] font-medium text-fuchsia-700 transition hover:from-pink-100 hover:via-fuchsia-100 hover:to-blue-100"
              >
                <Sparkles size={13} />
                Deep dive
              </button>
            </div>
          );
        })}
      </div>

      <DeepResearchDrawer
        open={Boolean(opened)}
        onClose={() => setOpenName(null)}
        competitorName={opened?.providerName ?? ''}
        ownCompany={report.companyName}
        zips={report.zips}
        technologies={opened?.technologies}
        recentHeadlines={openedHeadlines}
      />
    </>
  );
}
