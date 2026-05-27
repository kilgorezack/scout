'use client';

import AIReadinessForm from '@/components/AIReadinessForm';

export default function AIReadinessTab() {
  return (
    <div className="space-y-4">
      <div className="scout-card p-5">
        <h2 className="text-base font-semibold text-slate-900">Score your website&apos;s AI readiness</h2>
        <p className="mt-1 text-sm text-slate-600">
          Drop in your marketing site URL. Scout checks crawler policy, structured data, metadata,
          content depth, NAP, and SEO basics so AI assistants can find and cite you.
        </p>
      </div>
      <AIReadinessForm />
    </div>
  );
}
