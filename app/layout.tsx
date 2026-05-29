import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { Inter } from 'next/font/google';

const CLARITY_PROJECT_ID = 'wxz5ocmlrb';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'Scout — Broadband Competitive Intelligence',
  description:
    'Scout turns a list of ZIP codes into a complete competitive briefing for broadband service providers.',
  openGraph: {
    title: 'Scout — Broadband Competitive Intelligence',
    description: 'A modern competitive intelligence platform for broadband service providers.',
    type: 'website'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <Script id="ms-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");`}
        </Script>
      </head>
      <body className="min-h-screen font-sans antialiased">
        <header className="sticky top-0 z-50">
          <div className="mx-auto max-w-7xl px-4 pt-3 sm:px-6">
            <div className="glass flex h-12 items-center justify-between rounded-full px-2 pl-4 pr-2">
              <Link href="/" className="flex items-center gap-2.5">
                <span className="relative grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-accent-500 via-fuchsia-500 to-purple-600 shadow-glow">
                  {/* Scout dog mark, centered inside the gradient circle. */}
                  <svg viewBox="0 0 200 200" className="h-5 w-5" aria-hidden="true">
                    <path fill="#fff" d="M106.71,143.68c-2.54,10.64.32,22.27-1.13,32.92l-10.49,12.91c-1.59,1.95-5.85,2.48-7.91.36L12.46,113.01c-2.97-3.06-3.34-6.25-.61-9.49l39.07-46.53c1.85-17.03,7.12-32.85,17.02-46.95,2.09-2.97,8.06-.08,10.3,2.08,8.55,8.23,14.13,17.94,19.75,28.33l18.53.24,16.1,12.8,46.76,4.6c4.78.47,9,4.82,10.08,8.53,1.47,5.01-.11,9.73-3.42,13.53l-23.66,27.18c-5.15,2.43-12.71,6.57-18.13,7.44-7.88,1.27-14.56.34-23.22.8-3.9,10.35-11.98,18.31-14.31,28.12ZM141.71,104.3c16.54-4.4,20.48-14.3,31.9-26.56l-6.91-9.79-37.97-3.83-15.81-12.01c-1.87-1.42-8.38-.95-9.94.11-1.56,2.02-3.52,4.55-5.33,5.21s-5.34-2.13-6.22-4.17c-4.88-11.24-10.04-20.97-18.24-31.01-7.23,13.46-11.9,27.11-11.16,42.21.09,1.85-.66,5.17-1.7,6.35-1.04,1.18-4.41,1.18-6.98.46l-30.69,36.4,67.64,69.68c8.68-4.76,1.98-21.36,5.27-36.25,2-9.07,9.61-16.37,12.77-25.48l-11.97-.42c-1.9-.07-4.77-3.21-4.83-5.07-.08-2.75,2.66-5.71,5.82-5.72l44.33-.11Z" />
                    <path fill="#fff" d="M112.7,60.71c-2.83-1.1-6.16.69-7.23,3.47-.77,1.99.62,5.67,2.75,6.58,2.42,1.03,6.08-.03,7.52-2.29,1.46-2.29.18-6.5-3.03-7.76Z" />
                  </svg>
                </span>
                <span className="text-[15px] font-semibold tracking-tight text-ink-900">Scout</span>
              </Link>
              <nav className="flex items-center gap-1 text-sm">
                <Link href="/research" className="hidden whitespace-nowrap rounded-full px-3.5 py-1.5 text-ink-700 transition hover:text-ink-900 sm:inline-flex">
                  Research
                </Link>
                {/* Plain <a> so navigation triggers a full page load — the
                    Hotrod/Signal apps inject script tags via
                    dangerouslySetInnerHTML that only execute on initial HTML
                    parse, not on a client-side Next.js route change. */}
                <a href="/coverage" className="hidden whitespace-nowrap rounded-full px-3.5 py-1.5 text-ink-700 transition hover:text-ink-900 sm:inline-flex">
                  Coverage
                </a>
                <a href="/markets" className="hidden whitespace-nowrap rounded-full px-3.5 py-1.5 text-ink-700 transition hover:text-ink-900 sm:inline-flex">
                  Markets
                </a>
                <Link href="/ai-readiness" className="hidden whitespace-nowrap rounded-full px-3.5 py-1.5 text-ink-700 transition hover:text-ink-900 sm:inline-flex">
                  AI readiness
                </Link>
                <Link href="/analyze" className="btn-primary whitespace-nowrap !py-1.5 !px-4 text-[13px]">
                  Run analysis
                </Link>
              </nav>
            </div>
          </div>
        </header>
        <main className="relative">{children}</main>
        <footer className="relative mt-32 border-t border-ink-100">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-12 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              <span className="font-medium text-ink-700">Scout</span> · Competitive intelligence for broadband service providers
            </p>
            <p className="text-ink-400">FCC BDC · Census ACS · public reviews</p>
            <p className="text-ink-400">© 2026 Summit Digital Labs</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
