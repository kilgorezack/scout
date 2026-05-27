import { formatNumber } from '@/lib/utils';
import type { ReportPayload } from '@/lib/report';

export default function CoverageTab({ report }: { report: ReportPayload }) {
  const competitors = report.competitors;
  const zipRows = report.zips.map((zip) => {
    const cells = competitors.map((c) => {
      const match = report.providersByZip.find((p) => p.zip === zip && p.providerName === c.providerName);
      return { providerName: c.providerName, locations: match?.locationsServed ?? 0 };
    });
    const present = cells.filter((c) => c.locations > 0).length;
    return { zip, cells, present };
  });

  const maxLocations = Math.max(1, ...zipRows.flatMap((r) => r.cells.map((c) => c.locations)));

  return (
    <>
      <div className="mb-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-500">Coverage</p>
        <h2 className="display-headline mt-1 text-3xl text-ink-900">
          Where each provider <span className="display-italic">overlaps</span> with your footprint
        </h2>
      </div>

      <div className="scout-card overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-paper text-left text-[10px] uppercase tracking-[0.16em] text-ink-500">
            <tr>
              <th className="sticky left-0 z-10 bg-paper px-4 py-3 font-medium">ZIP</th>
              <th className="px-3 py-3 font-medium">Comps</th>
              {competitors.map((c) => (
                <th key={c.providerName} className="whitespace-nowrap px-3 py-3 font-medium">
                  {c.providerName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-900/5">
            {zipRows.map((row) => (
              <tr key={row.zip}>
                <td className="sticky left-0 bg-paper-50 px-4 py-2.5 font-mono text-xs font-medium text-ink-800">{row.zip}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-ink-700">{row.present}</td>
                {row.cells.map((cell) => {
                  const intensity = cell.locations / maxLocations;
                  const bg = cell.locations ? `rgba(79, 70, 229, ${0.05 + intensity * 0.45})` : 'transparent';
                  return (
                    <td
                      key={cell.providerName}
                      className="px-3 py-2.5 text-center font-mono text-xs text-ink-700"
                      style={{ background: bg }}
                    >
                      {cell.locations ? formatNumber(cell.locations) : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
