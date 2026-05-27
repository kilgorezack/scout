'use client';

import AIReadinessForm from '@/components/AIReadinessForm';

export default function AIReadinessTab() {
  return (
    <>
      <div className="mb-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-500">AI readiness</p>
        <h2 className="display-headline mt-1 text-3xl text-ink-900">
          Can AI assistants <span className="display-italic">find</span> and recommend you?
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-600">
          Drop in your marketing site URL. Scout checks crawler policy, structured data, metadata,
          content depth, NAP, and SEO basics — and grades it A through F.
        </p>
      </div>
      <AIReadinessForm />
    </>
  );
}
