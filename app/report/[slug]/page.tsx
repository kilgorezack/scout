import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight, Plus } from 'lucide-react';
import { buildReport, loadReportInput } from '@/lib/report';
import ReportTabs from './ReportTabs';
import { formatCurrency, formatNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';
// Hotrod cold start fans out a few thousand small fetches against Firebase
// Storage. Give the function room.
export const maxDuration = 60;

export default async function ReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const input = await loadReportInput(slug);
  if (!input) notFound();
  const report = await buildReport(input);

  const totalHouseholds = report.demographics.reduce((s, d) => s + d.households, 0);
  const incomes = report.demographics.map((d) => d.medianHouseholdIncome).filter(Boolean).sort((a, b) => a - b);
  const medianIncome = incomes.length ? incomes[Math.floor(incomes.length / 2)] : 0;

  return (
    <div className="mx-auto max-w-7xl px-6 pb-20 pt-8">
      {/* HERO HEADER */}
      <section className="panel-dark relative overflow-hidden px-8 py-14 sm:px-14 sm:py-16">
        <div className="absolute inset-0 -z-0 aurora-dark opacity-80" />
        <div className="absolute inset-0 -z-0 bg-gradient-to-b from-transparent via-ink-900/20 to-ink-900/70" />

        <div className="relative flex flex-col gap-7">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
            <span>Market briefing</span>
            <span className="text-white/30">·</span>
            <span className="font-mono normal-case tracking-normal text-white/50">
              {report.zips.join(' · ')}
            </span>
            <span className="text-white/30">·</span>
            <SourceBadge source={report.dataSource} diagnostics={report.hotrodDiagnostics} />
          </div>

          <h1 className="display text-5xl text-white sm:text-7xl">
            {report.companyName ? (
              <>
                {report.companyName} vs.{' '}
                <span className="bg-gradient-to-r from-pink-300 via-fuchsia-300 to-blue-300 bg-clip-text text-transparent">
                  {report.competitors.length} competitors
                </span>
              </>
            ) : (
              <>
                The{' '}
                <span className="bg-gradient-to-r from-pink-300 via-fuchsia-300 to-blue-300 bg-clip-text text-transparent">
                  competitive
                </span>{' '}
                picture
              </>
            )}
          </h1>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <HeroStat label="ZIPs" value={formatNumber(report.zips.length)} />
            <HeroStat label="Competitors" value={formatNumber(report.competitors.length)} />
            <HeroStat label="Households" value={formatNumber(totalHouseholds)} />
            <HeroStat label="Median income" value={formatCurrency(medianIncome)} />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link href="/analyze" className="btn-accent !text-[14px]">
              <Plus size={14} /> New analysis
            </Link>
            <Link href="/ai-readiness" className="btn-glass !text-[14px]">
              Score my website <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <ReportTabs report={report} />

      <p className="mt-16 text-center text-xs text-ink-500">
        Shareable link · <span className="font-mono text-ink-700">/report/{slug.slice(0, 16)}{slug.length > 16 ? '…' : ''}</span>
      </p>
    </div>
  );
}

function SourceBadge({
  source,
  diagnostics
}: {
  source: 'hotrod' | 'supabase' | 'stub';
  diagnostics?: { providersScanned: number; matchesFound: number; totalMillis: number };
}) {
  const labels = {
    hotrod: { text: 'Live FCC BDC', tone: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30' },
    supabase: { text: 'Supabase BDC', tone: 'bg-accent-400/10 text-accent-300 border-accent-400/30' },
    stub: { text: 'Seeded sample data', tone: 'bg-amber-400/10 text-amber-300 border-amber-400/30' }
  } as const;
  const l = labels[source];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${l.tone}`}
      title={
        diagnostics
          ? `${diagnostics.providersScanned} providers scanned · ${diagnostics.matchesFound} matched · ${diagnostics.totalMillis}ms`
          : undefined
      }
    >
      {l.text}
      {diagnostics ? (
        <span className="font-mono normal-case tracking-normal opacity-70">· {diagnostics.matchesFound} hits</span>
      ) : null}
    </span>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-3 backdrop-blur-xl">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">{label}</div>
      <div className="display mt-1 text-3xl text-white">{value}</div>
    </div>
  );
}
