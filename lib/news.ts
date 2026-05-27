import { getSupabase } from './supabase';

export type NewsCategory = 'smart_home' | 'mobile' | 'fwa' | 'fiber_expansion' | 'b2b' | 'other';

export type CompetitorNews = {
  providerName: string;
  title: string;
  url: string;
  publishedAt: string; // YYYY-MM-DD
  category: NewsCategory;
};

const MOCK_NEWS: CompetitorNews[] = [
  {
    providerName: 'Verizon 5G Home',
    title: 'Verizon expands 5G Home Internet to 30 new metros',
    url: 'https://www.verizon.com/about/news',
    publishedAt: '2026-03-12',
    category: 'fwa'
  },
  {
    providerName: 'T-Mobile Home Internet',
    title: 'T-Mobile launches Home Internet Plus with mesh WiFi 6 gateway',
    url: 'https://www.t-mobile.com/news',
    publishedAt: '2026-02-04',
    category: 'smart_home'
  },
  {
    providerName: 'Comcast Xfinity',
    title: 'Xfinity rolls out Storm-Ready WiFi with cellular backup',
    url: 'https://corporate.comcast.com/press',
    publishedAt: '2026-01-22',
    category: 'smart_home'
  },
  {
    providerName: 'Charter Spectrum',
    title: 'Spectrum Mobile crosses 10M lines, expands SMB bundles',
    url: 'https://corporate.charter.com/newsroom',
    publishedAt: '2026-04-08',
    category: 'mobile'
  },
  {
    providerName: 'AT&T Fiber',
    title: 'AT&T Fiber adds 1.5M new locations in 2025',
    url: 'https://about.att.com/story',
    publishedAt: '2026-01-30',
    category: 'fiber_expansion'
  },
  {
    providerName: 'Cox Communications',
    title: 'Cox Business launches managed WiFi tier for SMB',
    url: 'https://newsroom.cox.com',
    publishedAt: '2025-11-15',
    category: 'b2b'
  },
  {
    providerName: 'Frontier Fiber',
    title: 'Frontier passes 8M fiber locations; 7-gig tier coming',
    url: 'https://investor.frontier.com',
    publishedAt: '2026-02-18',
    category: 'fiber_expansion'
  },
  {
    providerName: 'Optimum',
    title: 'Optimum debuts Smart WiFi 7 gateway',
    url: 'https://www.optimum.com/about',
    publishedAt: '2026-03-02',
    category: 'smart_home'
  }
];

export async function newsForProviders(providers: string[]): Promise<CompetitorNews[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data } = await supabase
      .from('competitor_news')
      .select('provider_name, title, url, published_at, category')
      .in('provider_name', providers)
      .order('published_at', { ascending: false })
      .limit(50);
    if (data && data.length > 0) {
      return data.map((r) => ({
        providerName: r.provider_name,
        title: r.title,
        url: r.url,
        publishedAt: String(r.published_at),
        category: r.category as NewsCategory
      }));
    }
  }
  const set = new Set(providers);
  return MOCK_NEWS.filter((n) => set.has(n.providerName)).sort((a, b) =>
    a.publishedAt < b.publishedAt ? 1 : -1
  );
}
