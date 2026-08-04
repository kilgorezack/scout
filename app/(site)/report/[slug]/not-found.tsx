import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="relative">
      <div className="absolute inset-x-0 top-0 -z-10 h-[40vh] aurora opacity-60" />
      <div className="absolute inset-x-0 top-0 -z-10 h-[40vh] bg-gradient-to-b from-white/0 via-white/40 to-white" />
      <div className="mx-auto max-w-xl px-6 py-28 text-center">
        <p className="eyebrow">404</p>
        <h1 className="display mt-3 text-5xl text-ink-900">
          Briefing not <span className="gradient-text">found.</span>
        </h1>
        <p className="mt-4 text-ink-600">That link may be malformed. Run a new analysis to get a fresh briefing.</p>
        <div className="mt-8">
          <Link href="/analyze" className="btn-primary">Run a new analysis</Link>
        </div>
      </div>
    </div>
  );
}
