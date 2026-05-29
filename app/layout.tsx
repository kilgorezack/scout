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
                  {/* Gradient mark — drop your own logo/SVG in here. */}
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
