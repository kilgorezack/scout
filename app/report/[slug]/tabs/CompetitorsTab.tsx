import { Star } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import type { ReportPayload } from '@/lib/report';

const TECH_COLOR: Record<string, string> = {
  Fiber: 'bg-signal-100 text-signal-800 border-signal-200',
  Cable: 'bg-ember-100 text-ember-700 border-ember-200',
  FWA: 'bg-violet-100 text-violet-800 border-violet-200',
  DSL: 'bg-ink-100 text-ink-700 border-ink-200',
  Satellite: 'bg-sky-100 text-sky-800 border-sky-200'
};

export default function CompetitorsTab({ report }: { report: ReportPayload }) {
  if (report.competitors.length === 0) {
    return <p className="text-sm text-ink-600">No competitors identified for this footprint.</p>;
  }
  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-500">Competitors</p>
          <h2 className="display-headline mt-1 text-3xl text-ink-900">
            <span className="display-italic">{report.competitors.length}</span> providers in your footprint
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {report.competitors.map((c) => {
          const review = report.reviews[c.providerName];
          return (
            <div key={c.providerName} className="scout-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-[15px] font-semibold leading-snug text-ink-900">{c.providerName}</h3>
                  <p className="mt-0.5 text-xs text-ink-500">
                    Overlap in <span className="font-mono text-ink-800">{c.zips.length}</span> of {report.zips.length} ZIP{report.zips.length === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1 rounded-full border border-ink-900/10 bg-paper px-2.5 py-1 text-[11px] font-medium text-ink-700">
                  <Star size={11} className="fill-ember-400 stroke-ember-500" />
                  <span>{(review?.stars ?? 0).toFixed(1)}</span>
                  <span className="text-ink-300">·</span>
                  <span className="font-mono text-ink-600">{formatNumber(review?.reviewCount ?? 0)}</span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.technologies.map((t) => (
                  <span key={t} className={`scout-pill ${TECH_COLOR[t] ?? ''}`}>{t}</span>
                ))}
              </div>

              <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-ink-900/5 pt-4 text-sm">
                <div>
                  <dt className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-500">Down</dt>
                  <dd className="font-display text-xl leading-tight text-ink-900">{formatNumber(c.maxDownMbps)}</dd>
                  <dd className="text-[10px] text-ink-500">Mbps</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-500">Up</dt>
                  <dd className="font-display text-xl leading-tight text-ink-900">{formatNumber(c.maxUpMbps)}</dd>
                  <dd className="text-[10px] text-ink-500">Mbps</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-500">Locations</dt>
                  <dd className="font-display text-xl leading-tight text-ink-900">{formatNumber(c.totalLocations)}</dd>
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
