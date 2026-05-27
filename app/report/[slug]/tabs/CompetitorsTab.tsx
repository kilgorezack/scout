import { Star } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import type { ReportPayload } from '@/lib/report';

const TECH_COLOR: Record<string, string> = {
  Fiber: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Cable: 'bg-amber-50 text-amber-700 border-amber-200',
  FWA: 'bg-violet-50 text-violet-700 border-violet-200',
  DSL: 'bg-ink-100 text-ink-700 border-ink-200',
  Satellite: 'bg-sky-50 text-sky-700 border-sky-200'
};

export default function CompetitorsTab({ report }: { report: ReportPayload }) {
  if (report.competitors.length === 0) {
    return <p className="text-sm text-ink-600">No competitors identified for this footprint.</p>;
  }
  return (
    <>
      <div className="mb-7">
        <p className="eyebrow">Competitors</p>
        <h2 className="display mt-2 text-4xl text-ink-900">
          <span className="gradient-text">{report.competitors.length}</span> providers in your footprint
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {report.competitors.map((c) => {
          const review = report.reviews[c.providerName];
          return (
            <div key={c.providerName} className="panel p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-[16px] font-semibold leading-snug text-ink-900">{c.providerName}</h3>
                  <p className="mt-1 text-xs text-ink-500">
                    Overlap in <span className="font-mono text-ink-800">{c.zips.length}</span> of {report.zips.length} ZIP{report.zips.length === 1 ? '' : 's'}
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
            </div>
          );
        })}
      </div>
    </>
  );
}
