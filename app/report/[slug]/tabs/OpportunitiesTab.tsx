import { Lightbulb, TrendingUp, Shield, Cpu, type LucideIcon } from 'lucide-react';
import type { ReportPayload } from '@/lib/report';

const PRIORITY_STYLE: Record<string, string> = {
  high: 'bg-emerald-100 text-emerald-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-slate-100 text-slate-700'
};

const SOLUTION_ICON: Record<string, LucideIcon> = {
  'smart-home': Shield,
  'smart-town': Cpu,
  'smart-mdu': Cpu,
  'home-office': TrendingUp,
  'smart-biz': TrendingUp,
  'smart-biz-mobile': TrendingUp
};

export default function OpportunitiesTab({ report }: { report: ReportPayload }) {
  if (report.opportunities.length === 0) {
    return <p className="text-sm text-slate-600">No specific opportunities ranked yet — try a wider ZIP set.</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {report.opportunities.map((o) => {
        const Icon = SOLUTION_ICON[o.solution.id] ?? Lightbulb;
        return (
          <div key={o.id} className="scout-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-700">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Recommend: {o.solution.name}
                  </p>
                  <h3 className="text-base font-semibold text-slate-900">{o.rationaleHeadline}</h3>
                </div>
              </div>
              <span className={`scout-pill ${PRIORITY_STYLE[o.priority]}`}>{o.priority}</span>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-slate-700">{o.rationaleDetail}</p>
            <p className="mt-2 text-xs text-slate-500">{o.solution.blurb}</p>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Evidence</p>
              <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {o.evidence.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Target ZIPs</p>
              <p className="mt-1 font-mono text-xs text-slate-700">
                {o.targetZips.slice(0, 12).join(', ')}
                {o.targetZips.length > 12 ? ` … +${o.targetZips.length - 12} more` : ''}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
