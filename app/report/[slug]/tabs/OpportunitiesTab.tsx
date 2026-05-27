import { Lightbulb, TrendingUp, Shield, Cpu, type LucideIcon } from 'lucide-react';
import type { ReportPayload } from '@/lib/report';

const PRIORITY_STYLE: Record<string, string> = {
  high: 'bg-gradient-to-r from-pink-500/15 to-orange-400/15 text-fuchsia-700 border-fuchsia-200',
  medium: 'bg-accent-50 text-accent-700 border-accent-200',
  low: 'bg-ink-100 text-ink-600 border-ink-200'
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
    return <p className="text-sm text-ink-600">No specific opportunities ranked yet — try a wider ZIP set.</p>;
  }
  return (
    <>
      <div className="mb-7">
        <p className="eyebrow">Opportunities</p>
        <h2 className="display mt-2 text-4xl text-ink-900">
          <span className="gradient-text">{report.opportunities.length}</span> ranked moves for your next launch.
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {report.opportunities.map((o, i) => {
          const Icon = SOLUTION_ICON[o.solution.id] ?? Lightbulb;
          return (
            <div key={o.id} className="panel p-7">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-accent-500 via-fuchsia-500 to-purple-500 text-white shadow-glow">
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]">
                      <span className="text-ink-500">#{String(i + 1).padStart(2, '0')}</span>
                      <span className="text-ink-300">·</span>
                      <span className="text-accent-700">Recommend {o.solution.name}</span>
                    </div>
                    <h3 className="display mt-2 text-xl leading-tight text-ink-900">{o.rationaleHeadline}</h3>
                  </div>
                </div>
                <span className={`pill ${PRIORITY_STYLE[o.priority]}`}>{o.priority}</span>
              </div>

              <p className="mt-4 text-[15px] leading-relaxed text-ink-700">{o.rationaleDetail}</p>
              <p className="mt-2 text-xs text-ink-500">{o.solution.blurb}</p>

              <div className="mt-5 border-t border-ink-100 pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">Evidence</p>
                <ul className="mt-2 space-y-1.5 text-sm text-ink-700">
                  {o.evidence.map((e, j) => (
                    <li key={j} className="flex gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gradient-to-br from-accent-500 to-fuchsia-500" />
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">Target ZIPs</p>
                <p className="mt-1 font-mono text-xs text-ink-700">
                  {o.targetZips.slice(0, 12).join(' · ')}
                  {o.targetZips.length > 12 ? ` … +${o.targetZips.length - 12} more` : ''}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
