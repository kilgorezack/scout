'use client';

import { useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import type { AIReadinessReport } from '@/lib/ai-readiness';

const GRADE_COLOR: Record<string, string> = {
  A: 'bg-signal-600 text-white',
  B: 'bg-signal-500 text-white',
  C: 'bg-ember-400 text-ink-900',
  D: 'bg-ember-500 text-white',
  F: 'bg-ink-900 text-paper-50'
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
    <div className="space-y-5">
      <form className="scout-card flex flex-col gap-3 p-3 sm:flex-row sm:items-center" onSubmit={onSubmit}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-broadband-site.com"
          className="flex-1 rounded-full bg-transparent px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
        />
        <button type="submit" className="scout-btn" disabled={loading || url.length < 4}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          {loading ? 'Scanning…' : 'Scan site'}
        </button>
      </form>

      {error && (
        <div className="rounded-2xl border border-ember-300/40 bg-ember-50 px-4 py-3 text-sm text-ember-700">{error}</div>
      )}

      {report && report.fatalError && (
        <div className="scout-card p-5 text-sm text-ember-700">{report.fatalError}</div>
      )}

      {report && !report.fatalError && (
        <div className="space-y-4">
          <div className="scout-card-dark flex items-center justify-between p-6">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-paper-200/60">Overall score</p>
              <p className="mt-1 font-display text-5xl leading-none tracking-tightest text-paper-50">
                {report.totalScore}<span className="text-2xl text-paper-200/50"> / {report.maxScore}</span>
              </p>
              <p className="mt-2 break-all font-mono text-xs text-paper-200/50">{report.url}</p>
            </div>
            <span className={`grid h-16 w-16 place-items-center rounded-full font-display text-3xl ${GRADE_COLOR[report.grade]}`}>
              {report.grade}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {report.categories.map((c) => (
              <div key={c.id} className="scout-card p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-semibold text-ink-900">{c.label}</h3>
                  <span className="font-mono text-sm text-ink-700">
                    {c.score} / {c.max}
                  </span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                  <div
                    className="h-full bg-signal-600 transition-all"
                    style={{ width: `${Math.round((c.score / c.max) * 100)}%` }}
                  />
                </div>
                {c.details.length > 0 && (
                  <ul className="mt-3 space-y-1 text-xs text-ink-700">
                    {c.details.map((d, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-signal-600">✓</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {c.suggestions.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-ember-700">
                    {c.suggestions.map((s, i) => (
                      <li key={i} className="flex gap-2">
                        <span>→</span>
                        <span>{s}</span>
                      </li>
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
