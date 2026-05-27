import { formatNumber } from '@/lib/utils';
import type { ReportPayload } from '@/lib/report';

export default function CoverageTab({ report }: { report: ReportPayload }) {
  // Build a ZIP × competitor matrix.
  const competitors = report.competitors;
  const zipRows = report.zips.map((zip) => {
    const cells = competitors.map((c) => {
      const match = report.providersByZip.find(
        (p) => p.zip === zip && p.providerName === c.providerName
      );
      return { providerName: c.providerName, locations: match?.locationsServed ?? 0 };
    });
    const present = cells.filter((c) => c.locations > 0).length;
    return { zip, cells, present };
  });

  const maxLocations = Math.max(
    1,
    ...zipRows.flatMap((r) => r.cells.map((c) => c.locations))
  );

  return (
    <div className="scout-card overflow-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th className="sticky left-0 z-10 bg-slate-50 px-3 py-2.5">ZIP</th>
            <th className="px-3 py-2.5">Competitors</th>
            {competitors.map((c) => (
              <th key={c.providerName} className="whitespace-nowrap px-3 py-2.5">
                {c.providerName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {zipRows.map((row) => (
            <tr key={row.zip}>
              <td className="sticky left-0 bg-white px-3 py-2 font-mono text-xs text-slate-700">{row.zip}</td>
              <td className="px-3 py-2 text-xs text-slate-600">{row.present}</td>
              {row.cells.map((cell) => {
                const intensity = cell.locations / maxLocations;
                const bg = cell.locations
                  ? `rgba(28, 92, 245, ${0.08 + intensity * 0.55})`
                  : 'transparent';
                return (
                  <td key={cell.providerName} className="px-3 py-2 text-center text-xs" style={{ background: bg }}>
                    {cell.locations ? formatNumber(cell.locations) : '—'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
