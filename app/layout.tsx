import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Inter } from 'next/font/google';

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
      <body className="min-h-screen font-sans antialiased">
        <header className="sticky top-0 z-50">
          <div className="mx-auto max-w-7xl px-4 pt-3 sm:px-6">
            <div className="glass flex h-12 items-center justify-between rounded-full px-2 pl-4 pr-2">
              <Link href="/" className="flex items-center gap-2.5">
                <span className="relative grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-accent-500 via-fuchsia-500 to-purple-600 shadow-glow">
                  <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] animate-pulse-dot" />
                </span>
                <span className="text-[15px] font-semibold tracking-tight text-ink-900">Scout</span>
              </Link>
              <nav className="flex items-center gap-1 text-sm">
                <Link href="/analyze" className="hidden rounded-full px-3.5 py-1.5 text-ink-700 transition hover:text-ink-900 sm:inline-flex">
                  Analyze
                </Link>
                <Link href="/research" className="hidden rounded-full px-3.5 py-1.5 text-ink-700 transition hover:text-ink-900 sm:inline-flex">
                  Research
                </Link>
                <Link href="/hotrod" className="hidden rounded-full px-3.5 py-1.5 text-ink-700 transition hover:text-ink-900 sm:inline-flex">
                  Coverage map
                </Link>
                <Link href="/ai-readiness" className="hidden rounded-full px-3.5 py-1.5 text-ink-700 transition hover:text-ink-900 sm:inline-flex">
                  AI readiness
                </Link>
                <Link href="/analyze" className="btn-primary !py-1.5 !px-4 text-[13px]">
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
