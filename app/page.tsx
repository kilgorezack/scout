import Link from 'next/link';
import { ArrowRight, MapPin, Sparkles, Building2, Globe, Newspaper, Star } from 'lucide-react';

const features = [
  {
    icon: MapPin,
    title: 'ZIP-level competitive overlap',
    body: 'See every provider serving your footprint, their technology mix, and the speeds they advertise — sourced from the FCC Broadband Data Collection.'
  },
  {
    icon: Star,
    title: 'Customer sentiment',
    body: 'Google review scores for each competitor in your market, so you know where service quality is winning or losing subscribers.'
  },
  {
    icon: Building2,
    title: 'Demographics & TAM',
    body: 'Median income, households, housing units, and business density per ZIP — sized for the audience you actually sell to.'
  },
  {
    icon: Newspaper,
    title: 'Launch radar',
    body: 'Tracks competitor product launches and network expansions so you can react before they take share.'
  },
  {
    icon: Sparkles,
    title: 'Opportunities engine',
    body: 'Identifies whitespace and counter-launch moves — SmartHome, SmartTown, Home OfficeIQ, SmartBiz — ranked for your specific market.'
  },
  {
    icon: Globe,
    title: 'AI readiness score',
    body: 'Drop in your marketing site and Scout grades how well AI assistants can find, cite, and recommend you to prospective subscribers.'
  }
];

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-to-b from-brand-50 to-transparent" />
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="scout-pill bg-brand-100 text-brand-800">For broadband service providers</span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
              Know your market before your competitors do.
            </h1>
            <p className="mt-5 text-lg text-slate-600">
              Scout turns a list of ZIP codes into a complete competitive briefing — overlap, technology
              mix, demographics, reviews, recent launches, and ranked opportunities for your next move.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/analyze" className="scout-btn">
                Run a market analysis <ArrowRight size={16} />
              </Link>
              <Link href="/ai-readiness" className="scout-btn-ghost">
                Score my website&apos;s AI readiness
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-500">No login required. Share or export your report as PDF.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} className="scout-card p-6">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-700">
                <Icon size={20} />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
