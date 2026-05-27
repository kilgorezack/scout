import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-5 py-24 text-center sm:px-8">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-500">404</p>
      <h1 className="display-headline mt-2 text-5xl text-ink-900">
        Briefing not <span className="display-italic">found</span>.
      </h1>
      <p className="mt-3 text-sm text-ink-600">
        That link may be malformed. Run a new analysis to get a fresh briefing.
      </p>
      <div className="mt-8">
        <Link href="/analyze" className="scout-btn">Run a new analysis</Link>
      </div>
    </div>
  );
}
