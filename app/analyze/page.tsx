import AnalyzeForm from './AnalyzeForm';

export const metadata = { title: 'Run a market analysis — Scout' };

export default function AnalyzePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Run a market analysis</h1>
      <p className="mt-2 text-slate-600">
        Enter the ZIP codes you serve or want to enter. Scout pulls competitor coverage, demographics,
        sentiment, recent launches, and opportunities for your next move.
      </p>
      <div className="mt-8">
        <AnalyzeForm />
      </div>
    </div>
  );
}
