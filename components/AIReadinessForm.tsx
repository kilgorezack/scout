'use client';

import { useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import type { AIReadinessReport } from '@/lib/ai-readiness';

const GRADE_COLOR: Record<string, string> = {
  A: 'bg-emerald-100 text-emerald-800',
  B: 'bg-emerald-50 text-emerald-700',
  C: 'bg-amber-100 text-amber-800',
  D: 'bg-orange-100 text-orange-800',
  F: 'bg-red-100 text-red-800'
};

export default function AIReadinessForm() {
  const [url, setUrl] = useState('');
  const [report, setReport] = useState<AIReadinessReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setReport(null);
    setLoading(true);
    try {
      const res = await fetch('/api/ai-readiness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      if (!res.ok) throw new Error('Scan failed');
      setReport((await res.json()) as AIReadinessReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not scan that URL.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form className="scout-card flex flex-col gap-3 p-5 sm:flex-row" onSubmit={onSubmit}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-broadband-site.com"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        <button type="submit" className="scout-btn" disabled={loading || url.length < 4}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          {loading ? 'Scanning…' : 'Scan site'}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {report && report.fatalError && (
        <div className="scout-card p-5 text-sm text-red-700">{report.fatalError}</div>
      )}

      {report && !report.fatalError && (
        <div className="space-y-4">
          <div className="scout-card flex items-center justify-between p-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Overall</p>
              <p className="text-2xl font-bold text-slate-900">
                {report.totalScore} <span className="text-base font-medium text-slate-500">/ {report.maxScore}</span>
              </p>
              <p className="mt-1 text-xs text-slate-500 break-all">{report.url}</p>
            </div>
            <span className={`grid h-14 w-14 place-items-center rounded-full text-2xl font-bold ${GRADE_COLOR[report.grade]}`}>
              {report.grade}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {report.categories.map((c) => (
              <div key={c.id} className="scout-card p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">{c.label}</h3>
                  <span className="text-sm font-semibold text-slate-700">
                    {c.score} / {c.max}
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-brand-600"
                    style={{ width: `${Math.round((c.score / c.max) * 100)}%` }}
                  />
                </div>
                {c.details.length > 0 && (
                  <ul className="mt-3 space-y-1 text-xs text-slate-600">
                    {c.details.map((d, i) => (
                      <li key={i}>✓ {d}</li>
                    ))}
                  </ul>
                )}
                {c.suggestions.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-amber-700">
                    {c.suggestions.map((s, i) => (
                      <li key={i}>→ {s}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
