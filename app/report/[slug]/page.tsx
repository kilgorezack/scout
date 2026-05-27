import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight, Plus } from 'lucide-react';
import { buildReport, loadReportInput } from '@/lib/report';
import ReportTabs from './ReportTabs';
import { formatCurrency, formatNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const input = await loadReportInput(slug);
  if (!input) notFound();
  const report = await buildReport(input);

  const totalHouseholds = report.demographics.reduce((s, d) => s + d.households, 0);
  const incomes = report.demographics.map((d) => d.medianHouseholdIncome).filter(Boolean).sort((a, b) => a - b);
  const medianIncome = incomes.length ? incomes[Math.floor(incomes.length / 2)] : 0;

  return (
    <div className="mx-auto max-w-7xl px-5 pb-16 pt-10 sm:px-8">
      {/* HERO HEADER */}
      <section className="relative overflow-hidden rounded-3xl border border-ink-900/10 bg-ink-900 px-8 py-12 text-paper-50 sm:px-12 sm:py-14">
        <div className="absolute -right-32 -top-24 h-80 w-80 rounded-full bg-signal-500/25 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 h-80 w-80 rounded-full bg-ember-500/15 blur-3xl" />

        <div className="relative flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-paper-200/70">
            <span className="grid h-1.5 w-1.5 rounded-full bg-signal-400 animate-pulse-dot" />
            <span>Market briefing</span>
            <span className="text-paper-200/30">·</span>
            <span className="font-mono normal-case tracking-normal text-paper-200/60">
              {report.zips.map((z) => z).join(' · ')}
            </span>
          </div>

          <h1 className="display-headline text-5xl text-paper-50 sm:text-7xl">
            {report.companyName ? (
              <>
                {report.companyName} <span className="display-italic text-signal-300">vs.</span> the market
              </>
            ) : (
              <>
                The <span className="display-italic text-signal-300">competitive</span> picture
              </>
            )}
          </h1>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <HeroStat label="ZIPs" value={formatNumber(report.zips.length)} />
            <HeroStat label="Competitors" value={formatNumber(report.competitors.length)} />
            <HeroStat label="Households" value={formatNumber(totalHouseholds)} />
            <HeroStat label="Median income" value={formatCurrency(medianIncome)} />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href="/analyze" className="scout-btn-signal">
              <Plus size={14} /> New analysis
            </Link>
            <Link
              href="/ai-readiness"
              className="inline-flex items-center gap-1.5 rounded-full border border-paper-50/15 bg-paper-50/5 px-5 py-2.5 text-sm font-medium text-paper-50 backdrop-blur transition hover:bg-paper-50/10"
            >
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

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
      <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-paper-200/60">{label}</div>
      <div className="mt-1 font-display text-3xl leading-none tracking-tightest text-paper-50">{value}</div>
    </div>
  );
}
