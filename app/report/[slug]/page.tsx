import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buildReport, loadReportInput } from '@/lib/report';
import ReportTabs from './ReportTabs';

export const dynamic = 'force-dynamic';

export default async function ReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const input = await loadReportInput(slug);
  if (!input) notFound();
  const report = await buildReport(input);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">Market briefing</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            {report.companyName ?? 'Competitive Analysis'}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {report.zips.length} ZIP{report.zips.length === 1 ? '' : 's'} · {report.competitors.length} competitor
            {report.competitors.length === 1 ? '' : 's'} · {report.opportunities.length} opportunit
            {report.opportunities.length === 1 ? 'y' : 'ies'} identified
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/analyze" className="scout-btn-ghost">New analysis</Link>
        </div>
      </header>

      <ReportTabs report={report} />

      <p className="mt-12 text-center text-xs text-slate-500">
        Shareable link: <span className="font-mono">{slug}</span>
      </p>
    </div>
  );
}
