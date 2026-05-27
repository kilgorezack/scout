'use client';

import AIReadinessForm from '@/components/AIReadinessForm';

export default function AIReadinessTab() {
  return (
    <>
      <div className="mb-7">
        <p className="eyebrow">AI readiness</p>
        <h2 className="display mt-2 text-4xl text-ink-900">
          Can AI assistants <span className="gradient-text">find and recommend</span> you?
        </h2>
        <p className="mt-3 max-w-2xl text-[15px] text-ink-600">
          Drop in your marketing site URL. Scout checks crawler policy, structured data, metadata,
          content depth, NAP, and SEO basics — and grades it A through F.
        </p>
      </div>
      <AIReadinessForm />
    </>
  );
}
