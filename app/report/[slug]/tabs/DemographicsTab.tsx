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
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Population" value={formatNumber(totals.population)} />
        <Stat label="Households" value={formatNumber(totals.households)} />
        <Stat label="Housing units" value={formatNumber(totals.housingUnits)} />
        <Stat label="SMB establishments" value={formatNumber(totals.businesses)} />
      </div>

      <div className="scout-card overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-3 py-2.5">ZIP</th>
              <th className="px-3 py-2.5">Population</th>
              <th className="px-3 py-2.5">Households</th>
              <th className="px-3 py-2.5">Housing units</th>
              <th className="px-3 py-2.5">Owner-occupied</th>
              <th className="px-3 py-2.5">Median HH income</th>
              <th className="px-3 py-2.5">SMB establishments</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {report.demographics.map((d) => (
              <tr key={d.zip}>
                <td className="px-3 py-2 font-mono text-xs text-slate-700">{d.zip}</td>
                <td className="px-3 py-2">{formatNumber(d.population)}</td>
                <td className="px-3 py-2">{formatNumber(d.households)}</td>
                <td className="px-3 py-2">{formatNumber(d.housingUnits)}</td>
                <td className="px-3 py-2">{d.ownerOccupiedPct}%</td>
                <td className="px-3 py-2">{formatCurrency(d.medianHouseholdIncome)}</td>
                <td className="px-3 py-2">{formatNumber(d.businessEstablishments)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="scout-card p-4">
      <div className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}
