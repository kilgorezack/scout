import AIReadinessForm from '@/components/AIReadinessForm';

export const metadata = { title: 'AI Readiness — Scout' };

export default function AIReadinessPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">AI readiness scanner</h1>
      <p className="mt-2 max-w-2xl text-slate-600">
        Drop in your marketing site URL. Scout checks crawler policy, structured data, metadata,
        content depth, NAP, and SEO basics so AI assistants can find, cite, and recommend you.
      </p>
      <div className="mt-8">
        <AIReadinessForm />
      </div>
    </div>
  );
}
