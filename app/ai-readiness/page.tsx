import AIReadinessForm from '@/components/AIReadinessForm';

export const metadata = { title: 'AI Readiness — Scout' };

export default function AIReadinessPage() {
  return (
    <div className="relative">
      <div className="absolute inset-x-0 top-0 -z-10 h-[60vh] aurora opacity-70" />
      <div className="absolute inset-x-0 top-0 -z-10 h-[60vh] bg-gradient-to-b from-white/0 via-white/40 to-white" />

      <div className="mx-auto max-w-4xl px-6 py-20 sm:py-28">
        <div className="text-center">
          <p className="eyebrow">AI readiness</p>
          <h1 className="display mt-3 text-5xl text-ink-900 sm:text-7xl">
            Can AI assistants <span className="gradient-text">find you?</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-600">
            Drop in your marketing site URL. Scout checks crawler policy, structured data, metadata, content depth,
            NAP, and SEO basics — and grades it A through F.
          </p>
        </div>
        <div className="mt-12">
          <AIReadinessForm />
        </div>
      </div>
    </div>
  );
}
