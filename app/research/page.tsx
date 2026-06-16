import ResearchForm from './ResearchForm';

export const metadata = { title: 'Competitor Research — Scout' };

export default function ResearchPage() {
  return (
    <div className="relative">
      <div className="absolute inset-x-0 top-0 -z-10 h-[55vh] aurora opacity-70" />
      <div className="absolute inset-x-0 top-0 -z-10 h-[55vh] bg-gradient-to-b from-white/0 via-white/40 to-white" />

      <div className="mx-auto max-w-4xl px-6 py-20 sm:py-28">
        <div className="text-center">
          <p className="eyebrow">Competitor Research</p>
          <h1 className="display mt-3 text-5xl text-ink-900 sm:text-7xl">
            Deep-dive on <span className="gradient-text">any provider.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-600">
            Drop in a competitor&apos;s name (and their website if you have it). Scout uses Gemini 3 with live
            Google Search grounding to assemble a fresh competitive briefing — strategy, recent moves,
            strengths, weaknesses, sentiment, and battlecard talking points.
          </p>
        </div>
        <div className="mt-12">
          <ResearchForm />
        </div>
      </div>
    </div>
  );
}
