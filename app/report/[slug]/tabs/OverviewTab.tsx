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

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 scout-card p-6">
        <h2 className="text-lg font-semibold text-slate-900">Executive summary</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          {summarize(report, { totalLocations, totalHouseholds, totalBusinesses, medianIncome })}
        </p>

        {top && (
          <div className="mt-6 rounded-lg border border-brand-100 bg-brand-50 p-4">
            <div className="flex items-center gap-2 text-brand-800">
              <Lightbulb size={16} />
              <span className="text-xs font-semibold uppercase tracking-wider">Top opportunity</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {top.solution.name} — {top.rationaleHeadline}
            </p>
            <p className="mt-1 text-sm text-slate-700">{top.rationaleDetail}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
        <Stat icon={MapPin} label="ZIPs analyzed" value={formatNumber(report.zips.length)} />
        <Stat icon={Users} label="Households in footprint" value={formatNumber(totalHouseholds)} />
        <Stat icon={Building2} label="SMB establishments" value={formatNumber(totalBusinesses)} />
        <Stat icon={Lightbulb} label="Median HH income" value={formatCurrency(medianIncome)} />
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="scout-card p-4">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon size={14} />
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function summarize(
  report: ReportPayload,
  s: { totalLocations: number; totalHouseholds: number; totalBusinesses: number; medianIncome: number }
): string {
  const company = report.companyName ?? 'You';
  const top3 = report.competitors.slice(0, 3).map((c) => c.providerName);
  const techMix = new Set<string>();
  report.competitors.forEach((c) => c.technologies.forEach((t) => techMix.add(t)));
  const fiberCompetitors = report.competitors.filter((c) => c.technologies.includes('Fiber')).length;
  const fwaCompetitors = report.competitors.filter((c) => c.technologies.includes('FWA')).length;

  return [
    `${company} is analyzing ${report.zips.length} ZIP${report.zips.length === 1 ? '' : 's'} with ${formatNumber(s.totalHouseholds)} households and roughly ${formatNumber(s.totalBusinesses)} small business establishments (median HH income ${formatCurrency(s.medianIncome)}).`,
    `${report.competitors.length} competing providers overlap with this footprint — led by ${top3.join(', ') || '—'}.`,
    `${fiberCompetitors} compete on fiber and ${fwaCompetitors} compete via fixed wireless. Scout identified ${report.opportunities.length} ranked opportunit${report.opportunities.length === 1 ? 'y' : 'ies'} to defend or expand share — see the Opportunities tab.`
  ].join(' ');
}
