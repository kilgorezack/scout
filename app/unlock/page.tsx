import type { Metadata } from 'next';
import UnlockForm from './UnlockForm';
import { isPasswordConfigured, safeRedirectPath } from '@/lib/site-password';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Locked — Scout',
  robots: { index: false, follow: false }
};

export default async function UnlockPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const next = safeRedirectPath(Array.isArray(params.next) ? params.next[0] : params.next);

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-6 py-16">
      <div className="absolute inset-0 -z-10 aurora opacity-90 animate-aurora" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/0 via-white/40 to-white" />

      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5">
          <span className="relative grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-accent-500 via-fuchsia-500 to-purple-600 shadow-glow">
            <svg viewBox="0 0 200 200" className="h-5 w-5" aria-hidden="true">
              <path fill="#fff" d="M106.71,143.68c-2.54,10.64.32,22.27-1.13,32.92l-10.49,12.91c-1.59,1.95-5.85,2.48-7.91.36L12.46,113.01c-2.97-3.06-3.34-6.25-.61-9.49l39.07-46.53c1.85-17.03,7.12-32.85,17.02-46.95,2.09-2.97,8.06-.08,10.3,2.08,8.55,8.23,14.13,17.94,19.75,28.33l18.53.24,16.1,12.8,46.76,4.6c4.78.47,9,4.82,10.08,8.53,1.47,5.01-.11,9.73-3.42,13.53l-23.66,27.18c-5.15,2.43-12.71,6.57-18.13,7.44-7.88,1.27-14.56.34-23.22.8-3.9,10.35-11.98,18.31-14.31,28.12ZM141.71,104.3c16.54-4.4,20.48-14.3,31.9-26.56l-6.91-9.79-37.97-3.83-15.81-12.01c-1.87-1.42-8.38-.95-9.94.11-1.56,2.02-3.52,4.55-5.33,5.21s-5.34-2.13-6.22-4.17c-4.88-11.24-10.04-20.97-18.24-31.01-7.23,13.46-11.9,27.11-11.16,42.21.09,1.85-.66,5.17-1.7,6.35-1.04,1.18-4.41,1.18-6.98.46l-30.69,36.4,67.64,69.68c8.68-4.76,1.98-21.36,5.27-36.25,2-9.07,9.61-16.37,12.77-25.48l-11.97-.42c-1.9-.07-4.77-3.21-4.83-5.07-.08-2.75,2.66-5.71,5.82-5.72l44.33-.11Z" />
              <path fill="#fff" d="M112.7,60.71c-2.83-1.1-6.16.69-7.23,3.47-.77,1.99.62,5.67,2.75,6.58,2.42,1.03,6.08-.03,7.52-2.29,1.46-2.29.18-6.5-3.03-7.76Z" />
            </svg>
          </span>
          <span className="text-[17px] font-semibold tracking-tight text-ink-900">Scout</span>
        </div>

        <div className="glass mt-7 rounded-3xl p-8">
          <p className="eyebrow">Private site</p>
          <h1 className="display mt-2 text-3xl text-ink-900">Enter the password.</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
            Scout is private. Every page needs the site password before it will load.
          </p>

          {isPasswordConfigured() ? (
            <UnlockForm next={next} />
          ) : (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              No site password is configured, so nothing can be unlocked. Set the{' '}
              <span className="font-mono text-[13px]">SITE_PASSWORD</span> environment variable in
              your hosting settings and redeploy.
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-ink-500">
          Competitive intelligence for broadband service providers
        </p>
      </div>
    </div>
  );
}
