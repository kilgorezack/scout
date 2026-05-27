'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, ArrowRight } from 'lucide-react';
import { parseZips } from '@/lib/utils';

export default function AnalyzeForm() {
  const router = useRouter();
  const [zipsRaw, setZipsRaw] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = parseZips(zipsRaw);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (parsed.length === 0) {
      setError('Enter at least one valid 5-digit ZIP code.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zips: parsed, companyName: companyName.trim() || null })
      });
      if (!res.ok) throw new Error('Analyze request failed');
      const { slug } = (await res.json()) as { slug: string };
      router.push(`/report/${slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setSubmitting(false);
    }
  }

  return (
    <form className="scout-card p-7" onSubmit={onSubmit}>
      <label className="block">
        <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-ink-500">ZIP codes</span>
        <span className="mt-1 block text-sm text-ink-600">One per line or comma-separated. 5-digit only.</span>
        <textarea
          value={zipsRaw}
          onChange={(e) => setZipsRaw(e.target.value)}
          rows={6}
          placeholder={'94027\n30303\n73301'}
          className="mt-3 w-full rounded-xl border border-ink-900/10 bg-paper px-4 py-3 font-mono text-sm text-ink-900 placeholder:text-ink-400 focus:border-signal-500 focus:outline-none focus:ring-4 focus:ring-signal-500/15"
        />
        <span className="mt-2 block text-xs text-ink-500">
          <span className="font-mono">{parsed.length}</span> valid ZIP{parsed.length === 1 ? '' : 's'} detected.
        </span>
      </label>

      <label className="mt-6 block">
        <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-ink-500">Your company</span>
        <span className="mt-1 block text-sm text-ink-600">Optional. Used to exclude you from the competitor list.</span>
        <input
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Acme Fiber"
          className="mt-3 w-full rounded-xl border border-ink-900/10 bg-paper px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-signal-500 focus:outline-none focus:ring-4 focus:ring-signal-500/15"
        />
      </label>

      {error && (
        <div className="mt-5 rounded-xl border border-ember-300/40 bg-ember-50 px-4 py-3 text-sm text-ember-700">
          {error}
        </div>
      )}

      <div className="mt-7 flex items-center justify-between">
        <span className="text-xs text-ink-500">Free · No login · Shareable</span>
        <button type="submit" className="scout-btn" disabled={submitting || parsed.length === 0}>
          {submitting ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
          {submitting ? 'Building briefing…' : 'Generate briefing'}
        </button>
      </div>
    </form>
  );
}
