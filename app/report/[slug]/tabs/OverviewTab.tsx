import { Lightbulb, MapPin, Users, Building2, type LucideIcon } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { ReportPayload } from '@/lib/report';

export default function OverviewTab({ report }: { report: ReportPayload }) {
  const totalLocations = report.competitors.reduce((s, c) => s + c.totalLocations, 0);
  const totalHouseholds = report.demographics.reduce((s, d) => s + d.households, 0);
  const totalBusinesses = report.demographics.reduce((s, d) => s + d.businessEstablishments, 0);
  const incomes = report.demographics.map((d) => d.medianHouseholdIncome).filter(Boolean).sort((a, b) => a - b);
  const medianIncome = incomes.length ? incomes[Math.floor(incomes.length / 2)] : 0;
  const top = report.opportunities[0];

  const techCounts = new Map<string, number>();
  for (const c of report.competitors) for (const t of c.technologies) techCounts.set(t, (techCounts.get(t) ?? 0) + 1);
  const techMix = Array.from(techCounts.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="panel lg:col-span-2 p-8">
        <p className="eyebrow">Executive summary</p>
        <p className="mt-4 text-[17px] leading-[1.65] text-ink-700">
          {summarize(report, { totalLocations, totalHouseholds, totalBusinesses, medianIncome })}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {techMix.map(([tech, count]) => (
            <div key={tech} className="rounded-2xl border border-ink-100 bg-bg-subtle px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">{tech}</div>
              <div className="display mt-1 text-2xl leading-none text-ink-900">{count}</div>
            </div>
          ))}
        </div>

        {top && (
          <div className="mt-7 overflow-hidden rounded-2xl border border-ink-100 bg-gradient-to-br from-pink-50 via-fuchsia-50 to-blue-50 p-6">
            <div className="flex items-center gap-2 text-fuchsia-700">
              <Lightbulb size={14} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">Top opportunity</span>
            </div>
            <p className="display mt-2 text-2xl text-ink-900">
              {top.solution.name} — {top.rationaleHeadline}
            </p>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-700">{top.rationaleDetail}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
        <Stat icon={MapPin} label="ZIPs analyzed" value={formatNumber(report.zips.length)} />
        <Stat icon={Users} label="Households" value={formatNumber(totalHouseholds)} />
        <Stat icon={Building2} label="SMB establishments" value={formatNumber(totalBusinesses)} />
        <Stat icon={Lightbulb} label="Median HH income" value={formatCurrency(medianIncome)} />
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="panel p-5">
      <div className="flex items-center gap-2 text-ink-500">
        <Icon size={13} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">{label}</span>
      </div>
      <div className="display mt-2 text-3xl leading-none text-ink-900">{value}</div>
    </div>
  );
}

function summarize(
  report: ReportPayload,
  s: { totalLocations: number; totalHouseholds: number; totalBusinesses: number; medianIncome: number }
): string {
  const company = report.companyName ?? 'You';
  const top3 = report.competitors.slice(0, 3).map((c) => c.providerName);
  const fiberCompetitors = report.competitors.filter((c) => c.technologies.includes('Fiber')).length;
  const fwaCompetitors = report.competitors.filter((c) => c.technologies.includes('FWA')).length;

  return [
    `${company} is analyzing ${report.zips.length} ZIP${report.zips.length === 1 ? '' : 's'} with ${formatNumber(s.totalHouseholds)} households and roughly ${formatNumber(s.totalBusinesses)} small business establishments (median HH income ${formatCurrency(s.medianIncome)}).`,
    `${report.competitors.length} competing providers overlap with this footprint — led by ${top3.join(', ') || '—'}.`,
    `${fiberCompetitors} compete on fiber and ${fwaCompetitors} compete via fixed wireless. Scout identified ${report.opportunities.length} ranked opportunit${report.opportunities.length === 1 ? 'y' : 'ies'} to defend or expand share.`
  ].join(' ');
}
