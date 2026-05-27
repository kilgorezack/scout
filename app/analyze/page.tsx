import AnalyzeForm from './AnalyzeForm';

export const metadata = { title: 'Run a market analysis — Scout' };

export default function AnalyzePage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-500">Step 01</p>
      <h1 className="display-headline mt-2 text-5xl text-ink-900 sm:text-6xl">
        Tell us where you <span className="display-italic">play</span>.
      </h1>
      <p className="mt-4 max-w-2xl text-ink-700">
        Drop in the ZIP codes you serve or want to enter. Scout pulls competitor coverage, demographics,
        sentiment, recent launches, and opportunities for your next move.
      </p>
      <div className="mt-10">
        <AnalyzeForm />
      </div>
    </div>
  );
}
