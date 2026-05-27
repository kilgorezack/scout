import { ArrowUpRight } from 'lucide-react';
import type { ReportPayload } from '@/lib/report';

const CATEGORY_LABEL: Record<string, string> = {
  smart_home: 'Smart home',
  mobile: 'Mobile',
  fwa: 'FWA',
  fiber_expansion: 'Fiber expansion',
  b2b: 'B2B / SMB',
  other: 'Other'
};

const CATEGORY_COLOR: Record<string, string> = {
  smart_home: 'bg-accent-50 text-accent-700 border-accent-200',
  mobile: 'bg-violet-50 text-violet-700 border-violet-200',
  fwa: 'bg-sky-50 text-sky-700 border-sky-200',
  fiber_expansion: 'bg-amber-50 text-amber-700 border-amber-200',
  b2b: 'bg-bg-muted text-ink-700 border-ink-200',
  other: 'bg-bg-muted text-ink-700 border-ink-200'
};

export default function NewsTab({ report }: { report: ReportPayload }) {
  if (report.news.length === 0) {
    return <p className="text-sm text-ink-600">No recent competitor launches on record.</p>;
  }
  return (
    <>
      <div className="mb-7">
        <p className="eyebrow">Launch radar</p>
        <h2 className="display mt-2 text-4xl text-ink-900">
          What competitors <span className="gradient-text">have shipped lately.</span>
        </h2>
      </div>

      <div className="panel divide-y divide-ink-100">
        {report.news.map((n, i) => (
          <a
            key={i}
            href={n.url}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col gap-2 px-6 py-4 transition hover:bg-bg-subtle sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-ink-500">
                <span className="font-semibold text-ink-900">{n.providerName}</span>
                <span className="text-ink-300">·</span>
                <span className="font-mono">{n.publishedAt}</span>
                <span className="text-ink-300">·</span>
                <span className={`pill ${CATEGORY_COLOR[n.category] ?? ''}`}>{CATEGORY_LABEL[n.category] ?? n.category}</span>
              </div>
              <p className="mt-1.5 text-[15px] font-medium leading-snug text-ink-900 transition group-hover:text-accent-600">{n.title}</p>
            </div>
            <ArrowUpRight size={16} className="shrink-0 text-ink-400 transition group-hover:text-accent-600" />
          </a>
        ))}
      </div>
    </>
  );
}
