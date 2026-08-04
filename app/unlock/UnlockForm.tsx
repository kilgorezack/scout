'use client';

import { useState } from 'react';
import { ArrowRight, Lock } from 'lucide-react';

export default function UnlockForm({ next }: { next: string }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || busy) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, next })
      });
      const data: { redirectTo?: string; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Incorrect password.');
        setPassword('');
        setBusy(false);
        return;
      }
      // Hard load so the new cookie is sent and middleware authorizes the
      // destination in one shot — a soft navigation races the Set-Cookie.
      window.location.assign(data.redirectTo ?? next);
    } catch {
      setError('Something went wrong. Try again.');
      setBusy(false);
    }
  }

  return (
    <form className="mt-6" onSubmit={onSubmit}>
      <label className="block">
        <span className="sr-only">Site password</span>
        <div className="relative">
          <Lock size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="password"
            value={password}
            autoFocus
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-2xl border border-ink-200 bg-white/60 py-3 pl-11 pr-4 text-[15px] text-ink-900 placeholder:text-ink-400 transition focus:border-accent-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-accent-500/15"
          />
        </div>
      </label>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button type="submit" className="btn-primary mt-6 w-full justify-center" disabled={!password || busy}>
        {busy ? 'Unlocking…' : 'Unlock'} <ArrowRight size={16} />
      </button>
    </form>
  );
}
