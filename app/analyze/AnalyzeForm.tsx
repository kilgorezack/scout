'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { parseZips } from '@/lib/utils';
import { buildSlug } from '@/lib/slug';

export default function AnalyzeForm() {
  const router = useRouter();
  const [zipsRaw, setZipsRaw] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const parsed = parseZips(zipsRaw);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (parsed.length === 0) {
      setError('Enter at least one valid 5-digit ZIP code.');
      return;
    }
    // The slug is self-contained — compute it client-side and navigate
    // instantly so the report's loading.tsx appears the moment the user
    // clicks. Fire the persistence POST in the background; never block on it.
    const company = companyName.trim() || null;
    const slug = buildSlug(parsed, company);
    void fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zips: parsed, companyName: company })
    }).catch(() => {});
    router.push(`/report/${slug}`);
  }

  return (
    <form className="glass rounded-3xl p-8" onSubmit={onSubmit}>
      <label className="block">
        <span className="eyebrow">ZIP codes</span>
        <span className="mt-1 block text-[15px] text-ink-600">One per line or comma-separated. 5-digit only.</span>
        <textarea
          value={zipsRaw}
          onChange={(e) => setZipsRaw(e.target.value)}
          rows={6}
          placeholder={'94027\n30303\n73301'}
          className="mt-3 w-full rounded-2xl border border-ink-200 bg-white/60 px-4 py-3 font-mono text-sm text-ink-900 placeholder:text-ink-400 transition focus:border-accent-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-accent-500/15"
        />
        <span className="mt-2 block text-xs text-ink-500">
          <span className="font-mono text-ink-700">{parsed.length}</span> valid ZIP{parsed.length === 1 ? '' : 's'} detected.
        </span>
      </label>

      <label className="mt-6 block">
        <span className="eyebrow">Your company</span>
        <span className="mt-1 block text-[15px] text-ink-600">Optional. Used to exclude you from the competitor list.</span>
        <input
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Acme Fiber"
          className="mt-3 w-full rounded-2xl border border-ink-200 bg-white/60 px-4 py-3 text-[15px] text-ink-900 placeholder:text-ink-400 transition focus:border-accent-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-accent-500/15"
        />
      </label>

      {error && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-7 flex items-center justify-between">
        <span className="text-xs text-ink-500">Free · No login · Shareable</span>
        <button type="submit" className="btn-primary" disabled={parsed.length === 0}>
          Generate briefing <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
}
