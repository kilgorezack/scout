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

  const status = report.demographicsStatus;

  return (
    <>
      <div className="mb-7">
        <p className="eyebrow">Demographics</p>
        <h2 className="display mt-2 text-4xl text-ink-900">
          The audience you&apos;re <span className="gradient-text">actually selling to.</span>
        </h2>
      </div>

      {status === 'no_key' && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Census demographics are unavailable. The U.S. Census API requires a free API key — set{' '}
          <span className="font-mono">CENSUS_API_KEY</span> in the environment to populate these figures.
          (We show nothing rather than estimated numbers.)
        </div>
      )}
      {status === 'no_zcta' && (
        <div className="mb-5 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          These ZIP{report.zips.length === 1 ? '' : 's'} have no Census ZIP Code Tabulation Area —
          typically PO-box or non-residential ZIPs (e.g. 83002) — so the Census doesn&apos;t publish
          ACS population/income for them. Business-establishment counts (ZIP Business Patterns) are
          still shown. Use a residential ZIP (e.g. 83001 for Jackson) for full demographics.
        </div>
      )}
      {status === 'rejected' && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          A <span className="font-mono">CENSUS_API_KEY</span> is configured, but the Census API returned
          no data — usually an unactivated or mistyped key, or the env var isn&apos;t live in this
          deployment. Verify the key (activation email link), confirm it&apos;s set for this environment,
          and redeploy. Test it directly:{' '}
          <span className="font-mono break-all">
            api.census.gov/data/2022/acs/acs5?get=NAME,B01003_001E&amp;for=zip%20code%20tabulation%20area:83001&amp;key=YOUR_KEY
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Population" value={formatNumber(totals.population)} />
        <Stat label="Households" value={formatNumber(totals.households)} />
        <Stat label="Housing units" value={formatNumber(totals.housingUnits)} />
        <Stat label="SMB establishments" value={formatNumber(totals.businesses)} />
      </div>

      <div className="mt-5 panel overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-bg-subtle text-left text-[10px] uppercase tracking-[0.16em] text-ink-500">
            <tr>
              <th className="px-4 py-3 font-semibold">ZIP</th>
              <th className="px-3 py-3 font-semibold">Population</th>
              <th className="px-3 py-3 font-semibold">Households</th>
              <th className="px-3 py-3 font-semibold">Housing units</th>
              <th className="px-3 py-3 font-semibold">Owner-occ.</th>
              <th className="px-3 py-3 font-semibold">Median HH income</th>
              <th className="px-3 py-3 font-semibold">SMB</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
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
    <div className="panel p-5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">{label}</div>
      <div className="display mt-2 text-3xl leading-none text-ink-900">{value}</div>
    </div>
  );
}
