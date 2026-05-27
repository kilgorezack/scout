import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Inter, Instrument_Serif } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap'
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'Scout — Broadband Competitive Intelligence',
  description:
    'Scout turns a list of ZIP codes into a complete competitive briefing for broadband service providers — overlap, technology mix, demographics, sentiment, launches, and ranked opportunities.',
  openGraph: {
    title: 'Scout — Broadband Competitive Intelligence',
    description:
      'A modern competitive intelligence platform for broadband service providers.',
    type: 'website'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${instrumentSerif.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <header className="sticky top-0 z-30 border-b border-ink-900/10 bg-paper/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
            <Link href="/" className="group flex items-center gap-2.5">
              <span className="relative grid h-9 w-9 place-items-center rounded-full bg-ink-900 text-paper-50">
                <span className="absolute inset-1 rounded-full border border-paper-50/30" />
                <span className="absolute inset-2 rounded-full border border-paper-50/20" />
                <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal-400 animate-pulse-dot" />
              </span>
              <span className="text-[17px] font-semibold tracking-tight text-ink-900">Scout</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link href="/analyze" className="hidden rounded-full px-3.5 py-1.5 text-ink-700 transition hover:bg-ink-900/[0.04] hover:text-ink-900 sm:inline-flex">
                Analyze
              </Link>
              <Link href="/ai-readiness" className="hidden rounded-full px-3.5 py-1.5 text-ink-700 transition hover:bg-ink-900/[0.04] hover:text-ink-900 sm:inline-flex">
                AI readiness
              </Link>
              <Link href="/analyze" className="scout-btn ml-2 !py-2 text-[13px]">
                Run analysis
              </Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="relative mt-24 border-t border-ink-900/10 bg-paper">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-10 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p>
              <span className="font-medium text-ink-700">Scout</span> · Competitive intelligence for broadband service providers
            </p>
            <p className="text-ink-400">FCC BDC · Census ACS · public reviews</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
