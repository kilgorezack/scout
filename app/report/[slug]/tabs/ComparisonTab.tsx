'use client';

import { useState } from 'react';
import { Loader2, Sparkles, ExternalLink } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import type { ReportPayload } from '@/lib/report';
import type { CompetitorPlans } from '@/lib/competitor-plans';

type RowState = { status: 'idle' | 'loading' | 'done' | 'error'; data?: CompetitorPlans; error?: string };

const CONFIDENCE_TONE: Record<string, string> = {
  high: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-ink-100 text-ink-600 border-ink-200'
};

export default function ComparisonTab({ report }: { report: ReportPayload }) {
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [configError, setConfigError] = useState<string | null>(null);

  if (report.competitors.length === 0) {
    return (
      <div className="panel p-7">
        <p className="eyebrow">Comparison</p>
        <h3 className="display mt-2 text-2xl text-ink-900">No competitors to compare.</h3>
        <p className="mt-3 text-sm text-ink-600">
          This table compares the providers found in your footprint. None were returned for these ZIPs.
        </p>
      </div>
    );
  }

  // Footprint coverage denominator — same basis as the Competitors tab.
  const maxLocationsByZip = new Map<string, number>();
  for (const r of report.providersByZip) {
    maxLocationsByZip.set(r.zip, Math.max(maxLocationsByZip.get(r.zip) ?? 0, r.locationsServed));
  }
  const serviceableLocations = report.zips.reduce((sum, z) => sum + (maxLocationsByZip.get(z) ?? 0), 0);

  async function researchOne(providerName: string, technologies: string[]) {
    setRows((r) => ({ ...r, [providerName]: { status: 'loading' } }));
    try {
      const res = await fetch('/api/competitor-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerName, technologies, zips: report.zips })
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        if (res.status === 503) setConfigError(body.error ?? 'Plan research is not configured.');
        setRows((r) => ({ ...r, [providerName]: { status: 'error', error: body.error ?? `Failed (${res.status})` } }));
        return;
      }
      const data = (await res.json()) as CompetitorPlans;
      setRows((r) => ({ ...r, [providerName]: { status: 'done', data } }));
    } catch (e) {
      setRows((r) => ({ ...r, [providerName]: { status: 'error', error: e instanceof Error ? e.message : 'Failed' } }));
    }
  }

  // Research every not-yet-researched competitor, a few at a time so we don't
  // fire 30 Gemini calls at once.
  async function researchAll() {
    const pending = report.competitors.filter((c) => {
      const st = rows[c.providerName]?.status;
      return st !== 'done' && st !== 'loading';
    });
    const LIMIT = 3;
    let i = 0;
    async function worker() {
      while (i < pending.length) {
        const c = pending[i++];
        await researchOne(c.providerName, c.technologies);
      }
    }
    await Promise.all(Array.from({ length: Math.min(LIMIT, pending.length) }, worker));
  }

  const anyLoading = Object.values(rows).some((r) => r.status === 'loading');

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Comparison</p>
          <h2 className="display mt-2 text-4xl text-ink-900">
            Compare <span className="gradient-text">{report.competitors.length}</span> providers
          </h2>
        </div>
        <button
          onClick={researchAll}
          disabled={anyLoading}
          className="btn-primary self-start whitespace-nowrap !py-2 !px-4 text-[13px] sm:self-auto"
        >
          {anyLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {anyLoading ? 'Researching…' : 'Research all plans'}
        </button>
      </div>

      {/* Provenance — what's verified vs. AI-researched. */}
      <div className="rounded-2xl border border-ink-100 bg-bg-subtle px-4 py-3 text-xs leading-relaxed text-ink-600">
        <span className="font-semibold text-ink-900">Technology, max speed and footprint coverage</span> come
        straight from FCC BDC. <span className="font-semibold text-ink-900">Speed tiers, price, data cap and
        contract</span> aren&apos;t in BDC — they&apos;re researched live from public sources on demand and shown
        with citations. Treat plan details as a starting point and click a source to verify before quoting a customer.
      </div>

      {configError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {configError}
        </div>
      )}

      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[940px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-500">
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Tech</th>
              <th className="px-4 py-3 whitespace-nowrap">Max (BDC)</th>
              <th className="px-4 py-3">Coverage</th>
              <th className="bg-fuchsia-50/40 px-4 py-3">Speed tiers</th>
              <th className="bg-fuchsia-50/40 px-4 py-3">Price</th>
              <th className="bg-fuchsia-50/40 px-4 py-3">Data cap</th>
              <th className="bg-fuchsia-50/40 px-4 py-3">Contract</th>
              <th className="bg-fuchsia-50/40 px-4 py-3">Sources</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {report.competitors.map((c) => {
              const st = rows[c.providerName] ?? { status: 'idle' as const };
              const d = st.data;
              const coveragePct = serviceableLocations > 0
                ? Math.min(100, Math.round((c.totalLocations / serviceableLocations) * 100))
                : 0;
              const ai = (val?: string) =>
                st.status === 'done' ? <span className="text-ink-800">{val && val !== 'Unknown' ? val : '—'}</span>
                : st.status === 'loading' ? <Loader2 size={13} className="animate-spin text-ink-300" />
                : <span className="text-ink-300">—</span>;
              return (
                <tr key={c.providerName} className="border-b border-ink-50 align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink-900">{c.providerName}</div>
                    {st.status === 'done' && d && (
                      <span className={`mt-1 inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${CONFIDENCE_TONE[d.confidence]}`}>
                        {d.confidence} confidence
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-700">{c.technologies.join(', ')}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-700">
                    {formatNumber(c.maxDownMbps)}<span className="text-ink-400">/{formatNumber(c.maxUpMbps)}</span>
                    <span className="ml-1 text-[10px] text-ink-400">Mbps</span>
                  </td>
                  <td className="px-4 py-3 text-ink-700">{coveragePct}%</td>
                  <td className="bg-fuchsia-50/30 px-4 py-3">{ai(d?.speedTiers)}</td>
                  <td className="bg-fuchsia-50/30 px-4 py-3">{ai(d?.priceRange)}</td>
                  <td className="bg-fuchsia-50/30 px-4 py-3">{ai(d?.dataCap)}</td>
                  <td className="bg-fuchsia-50/30 px-4 py-3">
                    {st.status === 'done' && d ? (
                      <span
                        className={
                          d.contractRequired === 'No' ? 'font-medium text-emerald-600'
                          : d.contractRequired === 'Yes' ? 'font-medium text-amber-700'
                          : 'text-ink-400'
                        }
                      >
                        {d.contractRequired}
                      </span>
                    ) : ai()}
                  </td>
                  <td className="bg-fuchsia-50/30 px-4 py-3">
                    {st.status === 'done' && d && d.sources.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {d.sources.map((s, i) => (
                          <a
                            key={i}
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={s.title}
                            className="inline-flex items-center gap-0.5 rounded-md border border-ink-200 px-1.5 py-0.5 text-[11px] text-accent-600 transition hover:border-accent-300 hover:bg-accent-50"
                          >
                            {i + 1}
                            <ExternalLink size={9} />
                          </a>
                        ))}
                      </div>
                    ) : ai()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => researchOne(c.providerName, c.technologies)}
                      disabled={st.status === 'loading'}
                      className="whitespace-nowrap rounded-full border border-ink-200 px-3 py-1 text-xs font-medium text-ink-700 transition hover:border-accent-300 hover:text-accent-600 disabled:opacity-50"
                    >
                      {st.status === 'loading' ? 'Researching…' : st.status === 'done' ? 'Refresh' : st.status === 'error' ? 'Retry' : 'Research'}
                    </button>
                    {st.status === 'error' && (
                      <div className="mt-1 max-w-[160px] text-[10px] text-red-600">{st.error}</div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {report.competitors.some((c) => rows[c.providerName]?.data?.notes) && (
        <div className="panel p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">Notes</p>
          <ul className="mt-2 space-y-1.5 text-xs text-ink-700">
            {report.competitors.map((c) => {
              const n = rows[c.providerName]?.data?.notes;
              if (!n) return null;
              return (
                <li key={c.providerName}>
                  <span className="font-medium text-ink-900">{c.providerName}:</span> {n}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
