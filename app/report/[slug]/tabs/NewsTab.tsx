import type { ReportPayload } from '@/lib/report';

const CATEGORY_LABEL: Record<string, string> = {
  smart_home: 'Smart home',
  mobile: 'Mobile',
  fwa: 'FWA',
  fiber_expansion: 'Fiber expansion',
  b2b: 'B2B / SMB',
  other: 'Other'
};

export default function NewsTab({ report }: { report: ReportPayload }) {
  if (report.news.length === 0) {
    return <p className="text-sm text-slate-600">No recent competitor launches on record.</p>;
  }
  return (
    <div className="scout-card divide-y divide-slate-100">
      {report.news.map((n, i) => (
        <div key={i} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-800">{n.providerName}</span>
              <span>·</span>
              <span>{n.publishedAt}</span>
              <span>·</span>
              <span className="scout-pill">{CATEGORY_LABEL[n.category] ?? n.category}</span>
            </div>
            <a
              href={n.url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block text-sm font-medium text-slate-900 hover:text-brand-700"
            >
              {n.title}
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
