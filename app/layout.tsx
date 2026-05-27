import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Radar } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Scout — Broadband Competitive Analysis',
  description:
    'Scout helps broadband service providers analyze competitive overlap, demographics, AI readiness, and launch opportunities in their markets.',
  openGraph: {
    title: 'Scout — Broadband Competitive Analysis',
    description:
      'Run a ZIP-level competitive analysis on your broadband market. Competitors, tech mix, demographics, opportunities, and AI readiness — in one report.',
    type: 'website'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
                <Radar size={18} />
              </span>
              <span>Scout</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link href="/analyze" className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                Analyze
              </Link>
              <Link href="/ai-readiness" className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                AI Readiness
              </Link>
              <Link href="/analyze" className="scout-btn ml-2 hidden sm:inline-flex">
                Run analysis
              </Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-slate-200/70 py-8 text-center text-xs text-slate-500">
          Scout · Competitive analysis for broadband service providers
        </footer>
      </body>
    </html>
  );
}
