import AnalyzeForm from './AnalyzeForm';

export const metadata = { title: 'Run a market analysis — Scout' };

export default function AnalyzePage() {
  return (
    <div className="relative">
      <div className="absolute inset-x-0 top-0 -z-10 h-[60vh] aurora opacity-70" />
      <div className="absolute inset-x-0 top-0 -z-10 h-[60vh] bg-gradient-to-b from-white/0 via-white/40 to-white" />

      <div className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
        <div className="text-center">
          <p className="eyebrow">Step 01</p>
          <h1 className="display mt-3 text-5xl text-ink-900 sm:text-6xl">
            Tell us <span className="gradient-text">where you play.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-ink-600">
            Drop in the ZIP codes you serve or want to enter. Scout pulls competitor coverage, demographics,
            sentiment, recent launches, and opportunities.
          </p>
        </div>
        <div className="mt-12">
          <AnalyzeForm />
        </div>
      </div>
    </div>
  );
}
