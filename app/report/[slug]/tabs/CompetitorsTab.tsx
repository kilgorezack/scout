import { Star } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import type { ReportPayload } from '@/lib/report';

const TECH_COLOR: Record<string, string> = {
  Fiber: 'bg-emerald-100 text-emerald-800',
  Cable: 'bg-amber-100 text-amber-800',
  FWA: 'bg-violet-100 text-violet-800',
  DSL: 'bg-slate-100 text-slate-700',
  Satellite: 'bg-sky-100 text-sky-800'
};

export default function CompetitorsTab({ report }: { report: ReportPayload }) {
  if (report.competitors.length === 0) {
    return <p className="text-sm text-slate-600">No competitors identified for this footprint.</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {report.competitors.map((c) => {
        const review = report.reviews[c.providerName];
        return (
          <div key={c.providerName} className="scout-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{c.providerName}</h3>
                <p className="text-xs text-slate-500">
                  Overlap in {c.zips.length} of {report.zips.length} ZIP{report.zips.length === 1 ? '' : 's'}
                </p>
              </div>
              <div className="flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700">
                <Star size={12} className="fill-amber-400 stroke-amber-500" />
                <span>{(review?.stars ?? 0).toFixed(1)}</span>
                <span className="text-slate-400">·</span>
                <span>{formatNumber(review?.reviewCount ?? 0)} reviews</span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {c.technologies.map((t) => (
                <span key={t} className={`scout-pill ${TECH_COLOR[t] ?? ''}`}>{t}</span>
              ))}
            </div>

            <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Max down</dt>
                <dd className="font-semibold text-slate-900">{formatNumber(c.maxDownMbps)} Mbps</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Max up</dt>
                <dd className="font-semibold text-slate-900">{formatNumber(c.maxUpMbps)} Mbps</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Locations</dt>
                <dd className="font-semibold text-slate-900">{formatNumber(c.totalLocations)}</dd>
              </div>
            </dl>
          </div>
        );
      })}
    </div>
  );
}
