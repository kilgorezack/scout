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
    <form className="scout-card p-6" onSubmit={onSubmit}>
      <label className="block">
        <span className="text-sm font-medium text-slate-800">ZIP codes</span>
        <span className="block text-xs text-slate-500">One per line, or comma-separated. 5-digit ZIPs only.</span>
        <textarea
          value={zipsRaw}
          onChange={(e) => setZipsRaw(e.target.value)}
          rows={6}
          placeholder={'94027\n30303\n73301'}
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        <span className="mt-1 block text-xs text-slate-500">
          {parsed.length} valid ZIP{parsed.length === 1 ? '' : 's'} detected.
        </span>
      </label>

      <label className="mt-4 block">
        <span className="text-sm font-medium text-slate-800">Your company name (optional)</span>
        <span className="block text-xs text-slate-500">Used to exclude you from the competitor list.</span>
        <input
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Acme Fiber"
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
      </label>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex items-center justify-end">
        <button type="submit" className="scout-btn" disabled={submitting || parsed.length === 0}>
          {submitting ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
          {submitting ? 'Building report…' : 'Generate report'}
        </button>
      </div>
    </form>
  );
}
