import { ArrowDownRight, ArrowUpRight, DollarSign, Star } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { TIER_ORDER } from '@/lib/pricing';
import type { ReportPayload } from '@/lib/report';

function money(n: number | null | undefined): string {
  return n == null ? '—' : `$${n.toFixed(n % 1 === 0 ? 0 : 2)}`;
}

export default function PricingTab({ report }: { report: ReportPayload }) {
  const rows = report.competitors
    .map((c) => ({ name: c.providerName, pricing: report.pricing[c.providerName], review: report.reviews[c.providerName] }))
    .filter((x) => x.pricing && x.pricing.planCount > 0);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-ink-600">
        No published pricing on record for the competitors in this footprint yet.
      </p>
    );
  }

  // Market 1-Gig benchmark.
  const gigRows = rows.filter((r) => r.pricing!.gigPrice != null).sort((a, b) => a.pricing!.gigPrice! - b.pricing!.gigPrice!);
  const cheapestGig = gigRows[0];
  const dearestGig = gigRows[gigRows.length - 1];
  const own = report.ownPricing;

  // Buckets actually present across the footprint, in speed order.
  const presentBuckets = TIER_ORDER.filter((b) => rows.some((r) => r.pricing!.tiers.some((t) => t.bucket === b)));

  return (
    <div className="space-y-8">
      {/* MARKET SUMMARY */}
      <div>
        <p className="eyebrow">Pricing</p>
        <h2 className="display mt-2 text-4xl text-ink-900">
          What the <span className="gradient-text">{rows.length}</span> priced competitors charge here.
        </h2>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Cheapest 1-Gig" value={money(cheapestGig?.pricing!.gigPrice)} sub={cheapestGig?.name} />
          <Metric label="Priciest 1-Gig" value={money(dearestGig?.pricing!.gigPrice)} sub={dearestGig?.name} />
          <Metric
            label="Median $/Mbps"
            value={medianPpm(rows.map((r) => r.pricing!.medianPricePerMbps).filter((x): x is number => x != null))}
          />
          {own?.gigPrice != null && (
            <Metric label={`${report.companyName ?? 'You'} 1-Gig`} value={money(own.gigPrice)} tone="own" />
          )}
        </div>
      </div>

      {/* PRICE LADDER BY SPEED TIER */}
      <div className="panel overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left">
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">Provider</th>
              {presentBuckets.map((b) => (
                <th key={b} className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">{b}</th>
              ))}
              <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">$/Mbps</th>
              <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">Rating</th>
            </tr>
          </thead>
          <tbody>
            {rows
              .slice()
              .sort((a, b) => (a.pricing!.gigPrice ?? a.pricing!.medianPricePerMbps ?? 999) - (b.pricing!.gigPrice ?? b.pricing!.medianPricePerMbps ?? 999))
              .map((r) => {
                const p = r.pricing!;
                return (
                  <tr key={r.name} className="border-b border-ink-50 last:border-0">
                    <td className="px-5 py-3 font-medium text-ink-900">{r.name}</td>
                    {presentBuckets.map((b) => {
                      const t = p.tiers.find((x) => x.bucket === b);
                      return (
                        <td key={b} className="px-4 py-3 text-right font-mono text-ink-700">
                          {t ? money(t.medianPrice) : <span className="text-ink-300">·</span>}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-right font-mono text-ink-600">{p.medianPricePerMbps != null ? `$${p.medianPricePerMbps.toFixed(2)}` : '—'}</td>
                    <td className="px-5 py-3 text-right">
                      {r.review && r.review.scope !== 'none' ? (
                        <span className="inline-flex items-center gap-1 text-ink-700">
                          <Star size={11} className="fill-amber-400 stroke-amber-500" />
                          {r.review.stars.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-ink-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
        <p className="px-5 py-3 text-[11px] text-ink-400">
          Prices are median published rates by speed tier (national). “·” = no plan on record in that tier.
        </p>
      </div>

      {/* PRICE x SATISFACTION QUADRANT */}
      <PriceValuePlot rows={rows} />

      {/* RECENT PRICING MOVES */}
      {report.priceChanges.length > 0 && (
        <div>
          <p className="eyebrow">Pricing moves</p>
          <h3 className="display mt-2 text-2xl text-ink-900">Recent competitor price changes</h3>
          <div className="mt-4 space-y-2">
            {report.priceChanges.map((ch, i) => {
              const up = ch.newPrice > ch.oldPrice;
              const delta = Math.abs(ch.newPrice - ch.oldPrice);
              const pct = ch.oldPrice ? Math.round((delta / ch.oldPrice) * 100) : 0;
              return (
                <div key={i} className="flex items-center justify-between gap-4 rounded-2xl border border-ink-100 bg-bg-subtle px-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink-900">
                      {ch.providerName}
                      <span className="text-ink-400"> · </span>
                      <span className="text-ink-600">{ch.planName}</span>
                      {ch.downMbps ? <span className="text-ink-400"> · {formatNumber(ch.downMbps)}M</span> : null}
                    </div>
                    <div className="text-[11px] text-ink-500">{new Date(ch.changedAt).toLocaleDateString()}</div>
                  </div>
                  <div className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-semibold ${up ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                    {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                    <span className="font-mono">{money(ch.oldPrice)} → {money(ch.newPrice)}</span>
                    <span className="opacity-70">({up ? '+' : '−'}{pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'own' }) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${tone === 'own' ? 'border-accent-200 bg-accent-50' : 'border-ink-100 bg-bg-subtle'}`}>
      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">
        <DollarSign size={11} /> {label}
      </div>
      <div className="display mt-1 text-2xl leading-none text-ink-900">{value}</div>
      {sub && <div className="mt-1 truncate text-[11px] text-ink-500">{sub}</div>}
    </div>
  );
}

function medianPpm(vals: number[]): string {
  if (!vals.length) return '—';
  const s = [...vals].sort((a, b) => a - b);
  const m = s[Math.floor(s.length / 2)];
  return `$${m.toFixed(2)}`;
}

// Price (x, $/Mbps) vs Google rating (y). The bottom-right quadrant —
// expensive AND poorly rated — is the prime displacement target.
function PriceValuePlot({
  rows
}: {
  rows: { name: string; pricing: import('@/lib/pricing').ProviderPricing | undefined; review: import('@/lib/reviews').ProviderReview | undefined }[]
}) {
  const pts = rows
    .filter((r) => r.pricing?.medianPricePerMbps != null && r.review && r.review.scope !== 'none' && r.review.stars > 0)
    .map((r) => ({ name: r.name, x: r.pricing!.medianPricePerMbps!, y: r.review!.stars }));

  if (pts.length < 2) return null;

  const xs = pts.map((p) => p.x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const spanX = maxX - minX || 1;
  const px = (x: number) => ((x - minX) / spanX) * 88 + 6; // 6%..94%
  const py = (y: number) => (1 - (y - 1) / 4) * 84 + 4; // rating 1..5 -> 88%..4%

  return (
    <div>
      <p className="eyebrow">Positioning</p>
      <h3 className="display mt-2 text-2xl text-ink-900">Price vs. satisfaction</h3>
      <p className="mt-1 text-sm text-ink-600">
        Lower-left is cheap; upper area is well-rated. <span className="font-medium text-rose-600">Bottom-right (pricey + poorly rated)</span> are your best switch-and-save targets.
      </p>
      <div className="relative mt-4 h-72 rounded-2xl border border-ink-100 bg-bg-subtle">
        {/* axis labels */}
        <span className="absolute left-2 top-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">Higher rated ↑</span>
        <span className="absolute bottom-2 right-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">Pricier $/Mbps →</span>
        {pts.map((p) => {
          const target = p.y <= 3.2 && p.x >= (minX + maxX) / 2;
          return (
            <div key={p.name} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${px(p.x)}%`, top: `${py(p.y)}%` }}>
              <div className={`h-2.5 w-2.5 rounded-full ${target ? 'bg-rose-500 ring-4 ring-rose-200' : 'bg-accent-500'}`} />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] font-medium text-ink-600">{p.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
