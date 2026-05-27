import AIReadinessForm from '@/components/AIReadinessForm';

export const metadata = { title: 'AI Readiness — Scout' };

export default function AIReadinessPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-500">AI readiness</p>
      <h1 className="display-headline mt-2 text-5xl text-ink-900 sm:text-6xl">
        Can AI assistants <span className="display-italic">find</span> you?
      </h1>
      <p className="mt-4 max-w-2xl text-ink-700">
        Drop in your marketing site URL. Scout checks crawler policy, structured data, metadata,
        content depth, NAP, and SEO basics — and grades it A through F.
      </p>
      <div className="mt-10">
        <AIReadinessForm />
      </div>
    </div>
  );
}
