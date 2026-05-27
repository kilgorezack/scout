import { formatCurrency, formatNumber } from '@/lib/utils';
import type { ReportPayload } from '@/lib/report';

export default function DemographicsTab({ report }: { report: ReportPayload }) {
  const totals = report.demographics.reduce(
    (acc, d) => ({
      population: acc.population + d.population,
      households: acc.households + d.households,
      housingUnits: acc.housingUnits + d.housingUnits,
      businesses: acc.businesses + d.businessEstablishments
    }),
    { population: 0, households: 0, housingUnits: 0, businesses: 0 }
  );

  return (
    <>
      <div className="mb-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-500">Demographics</p>
        <h2 className="display-headline mt-1 text-3xl text-ink-900">
          The audience you&apos;re <span className="display-italic">actually</span> selling to
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Population" value={formatNumber(totals.population)} />
        <Stat label="Households" value={formatNumber(totals.households)} />
        <Stat label="Housing units" value={formatNumber(totals.housingUnits)} />
        <Stat label="SMB establishments" value={formatNumber(totals.businesses)} />
      </div>

      <div className="mt-5 scout-card overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-paper text-left text-[10px] uppercase tracking-[0.16em] text-ink-500">
            <tr>
              <th className="px-4 py-3 font-medium">ZIP</th>
              <th className="px-3 py-3 font-medium">Population</th>
              <th className="px-3 py-3 font-medium">Households</th>
              <th className="px-3 py-3 font-medium">Housing units</th>
              <th className="px-3 py-3 font-medium">Owner-occ.</th>
              <th className="px-3 py-3 font-medium">Median HH income</th>
              <th className="px-3 py-3 font-medium">SMB</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-900/5">
            {report.demographics.map((d) => (
              <tr key={d.zip}>
                <td className="px-4 py-2.5 font-mono text-xs font-medium text-ink-800">{d.zip}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-ink-700">{formatNumber(d.population)}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-ink-700">{formatNumber(d.households)}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-ink-700">{formatNumber(d.housingUnits)}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-ink-700">{d.ownerOccupiedPct}%</td>
                <td className="px-3 py-2.5 font-mono text-xs text-ink-700">{formatCurrency(d.medianHouseholdIncome)}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-ink-700">{formatNumber(d.businessEstablishments)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="scout-card p-5">
      <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-500">{label}</div>
      <div className="mt-1.5 font-display text-3xl leading-none tracking-tightest text-ink-900">{value}</div>
    </div>
  );
}
