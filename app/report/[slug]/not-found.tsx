import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Report not found</h1>
      <p className="mt-2 text-sm text-slate-600">
        That link may have expired, or the analysis was never persisted. Run a new one to get fresh data.
      </p>
      <div className="mt-6">
        <Link href="/analyze" className="scout-btn">Run a new analysis</Link>
      </div>
    </div>
  );
}
