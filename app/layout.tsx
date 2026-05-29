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
                  <svg viewBox="0 0 110 93.59" className="h-5 w-5" aria-hidden="true">
                    <path fill="#fff" d="M75.24,3.17c-.46.01-.89.21-1.21.54,0,0-1.92,2.04-3.59,4.2-.83,1.08-1.61,2.16-2.1,3.23-.25.54-.48,1.05-.44,1.85.02.4.16.91.5,1.33.18.22.4.39.63.52-.43.91-.75,1.94-1.05,3.04-.6,2.21-1.01,4.74-1.3,7.17-.14,1.15-.25,2.28-.34,3.33h0c-.19.39-.22.84-.1,1.25-.13,1.73-.19,3.15-.22,3.96l-11.34,10.27c-.51.18-5.83,2.09-11.93,5.39-5.97,3.22-12.55,7.53-15.29,13.2-3.91-.51-16.76-2.97-20.8-13.41-.33-.83-1.23-1.28-2.09-1.02-.86.25-1.38,1.12-1.19,1.99,0,0,1.18,5.65,4.74,11.42,3.41,5.53,9.22,11.35,18.23,12.28.34,1.06.81,1.97,1.35,2.74,1.02,1.47,2.13,2.35,3.01,2.92-.38,1.41-.76,3.64.41,6.54h0c.26.65.89,1.08,1.59,1.07h24.53c.65,0,1.25-.37,1.54-.96,0,0,.7-1.36.87-3.08.08-.86.05-1.86-.38-2.87-.04-.1-.1-.21-.15-.31.73-.32,1.54-.68,2.41-1.09,1.25-.59,2.53-1.22,3.63-1.84.24-.13.46-.26.68-.38.15,1.08.3,2.13.47,3.12.47,2.92.91,5.25,1.57,6.8,1.26,2.97,4.11,4.03,6.34,4.05s3.88-.55,4.81-1.04c1.9-.99,3.44-2.33,3.44-2.33h0c.65-.56.79-1.52.33-2.24l-.3-.47,7.02-1.76c.87-.22,1.43-1.08,1.27-1.96-.51-2.91-2.64-4.55-4.4-5.22-.92-.35-1.12-.25-1.75-.32l-1.19-10.89c2.79-3.18,4.99-6.85,6.28-9.42,2.2-4.41,3.27-10.87-.54-17.73-.65-1.17-.98-2.2-1.13-3.11h0c0-.12-.02-.25-.05-.37-.11-1.09.07-2,.33-2.76.36-1.06.85-1.72,1.09-2.01,1.12-.52,6.05-2.66,10.66-2.12.34.04.67-.02.97-.17,0,0,1.04-.56,1.73-1.7.61-.99,1.03-2.48.85-4.39.34-.41.79-.98,1.23-1.66.88-1.37,1.85-3.25,1.75-5.45h0c-.04-.88-.73-1.58-1.61-1.64l-10.87-.64c-.49-.84-1.29-2.01-2.86-3.23-1.82-1.42-4.54-2.6-8.12-2.56-1.19.01-2.49.17-3.87.48h0c-.14.04-.27.1-.39.18-1.4-1.73-2.79-2.52-2.79-2.52h0c-.26-.14-.57-.21-.87-.21h0ZM75.45,7.34c.34.28.38.19.92.89.83,1.06,1.65,2.9,2.28,5.22-2.1-.43-4.55-.93-6.82-1.42.34-.59.74-1.25,1.34-2.02,1.03-1.34,1.62-1.95,2.28-2.67h0ZM83.21,8.65c2.81-.06,4.66.85,5.97,1.86,1.74,1.35,2.37,2.85,2.37,2.85h0c.25.61.83,1.01,1.48,1.05l9.64.57c-.22.67-.3,1.33-.68,1.93-.68,1.06-1.37,1.77-1.37,1.77-.01.02-.03.04-.04.07-.12.13-.21.28-.29.44-.01.02-.03.05-.04.07-.07.19-.11.38-.11.59,0,.04,0,.08,0,.13,0,.07,0,.14,0,.21.29,1.65-.03,2.43-.29,2.85-.16.26-.17.23-.21.26-6.33-.42-12.06,2.59-12.06,2.59h0c-.14.08-.27.17-.39.28,0,0,0,0-.01,0,0,0-1.36,1.33-2.11,3.54-.3.89-.5,1.96-.5,3.14-2.91.98-6.51.07-9.6-1.38-2.28-1.07-4.16-2.33-5.18-3.07.08-.94.17-1.93.3-2.95.28-2.33.67-4.74,1.2-6.67.37-1.35.86-2.44,1.25-3.09,3.41.72,8.1,1.67,8.1,1.67h0c.55.11,1.11-.05,1.52-.43.41-.38.6-.93.53-1.48-.36-2.68-1.07-4.84-1.9-6.55.88-.17,1.68-.25,2.41-.27h0ZM69.54,32.38c1.1.7,2.46,1.5,4,2.22,3.32,1.55,7.57,2.85,11.59,1.7.25.79.59,1.6,1.06,2.43,3.25,5.84,2.3,10.87.47,14.53-1.47,2.94-4.81,7.92-8.21,11.04.18-1.55.38-3.07.62-4.46.39-2.33.91-4.34,1.33-5.22h0c.41-.86.04-1.88-.81-2.29-.41-.2-.88-.22-1.31-.07-.43.15-.78.47-.98.88-.75,1.57-1.21,3.68-1.62,6.14-.41,2.46-.73,5.24-.98,7.85-.49,5.22-.69,9.82-.69,9.82h0c-.01.36.08.71.27,1.01l4.73,7.35c-.53.4-.76.63-1.57,1.06.01,0-1.74.66-3.18.64-1.44-.01-2.5-.28-3.21-1.95-.33-.77-.88-3.17-1.34-6.01-.46-2.84-.89-6.22-1.27-9.48-.75-6.49-1.25-12.41-1.25-12.41-.04-.46-.25-.87-.6-1.17-.35-.3-.8-.44-1.25-.4-.95.08-1.65.91-1.57,1.86,0,0,.51,5.97,1.26,12.52.1.85.2,1.71.3,2.58-.1.08-.19.17-.27.28.14-.19-.62.51-1.58,1.05-.96.55-2.2,1.16-3.39,1.72-1.68.79-3.24,1.46-4.06,1.81-1.79-.59-3.99-.88-6.06-1.09,2.24-2.12,4.36-5.67,4.58-11.26.01-.46-.15-.9-.46-1.23-.31-.33-.74-.53-1.19-.55-.46-.01-.9.15-1.23.46-.34.31-.53.74-.55,1.19-.2,5.15-2.07,7.76-3.83,9.25-1.75,1.49-3.31,1.77-3.31,1.77h0c-.86.17-1.47.95-1.4,1.83.07.88.79,1.56,1.67,1.58,0,0,2.03.05,4.48.28,2.45.22,5.38.68,6.7,1.22.5.2.6.37.72.63.11.26.16.68.12,1.16-.05.48-.14.59-.27.95h-21.92c-.51-2.32.21-4.35.21-4.35.36-.87-.05-1.87-.92-2.24,0,0-1.57-.67-2.82-2.46-.46-.66-.87-1.45-1.13-2.43h0c0-.23-.06-.46-.15-.66-.28-1.63-.13-3.73.9-6.52,1.67-4.54,8.1-9.31,14.23-12.62,6.14-3.31,11.8-5.31,11.8-5.31.21-.07.41-.19.58-.34l12.11-10.97h0c.08-.07.14-.15.21-.23,0,0,.01-.02.02-.03.1-.13.18-.29.24-.45h0c.05-.16.08-.33.09-.49,0-.01,0-.02,0-.04,0,0,.03-.85.08-2.03h0ZM11.35,60.02c5.41,3.83,11.72,5.23,14.95,5.72-.41,1.61-.57,3.09-.53,4.44-6.99-1.04-11.46-5.51-14.42-10.15h0ZM80.33,67.29l1.03,9.41c.1.89.86,1.56,1.75,1.53,0,0,1.01,0,2.06.39.62.23,1.13.61,1.54,1.14l-6.18,1.55-3.06-4.76c.02-.4.16-3.51.51-7.56.81-.49,1.6-1.06,2.36-1.7h0Z" />
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
