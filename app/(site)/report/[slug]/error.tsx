'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function ReportError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Report error:', error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <p className="eyebrow">Briefing failed</p>
      <h1 className="display mt-3 text-4xl text-ink-900">Something broke while building your report.</h1>
      <p className="mt-4 text-sm text-ink-600">
        {error?.message || 'Unknown error.'}
      </p>
      {error?.digest && (
        <p className="mt-2 font-mono text-xs text-ink-400">digest: {error.digest}</p>
      )}
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button onClick={() => reset()} className="btn-primary">Try again</button>
        <Link href="/analyze" className="btn-ghost">Run a new analysis</Link>
      </div>
    </div>
  );
}
