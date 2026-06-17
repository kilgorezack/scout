import { getSupabase } from './supabase';
import { priceChangesForProviders } from './pricing';

export type NewsCategory = 'smart_home' | 'mobile' | 'fwa' | 'fiber_expansion' | 'b2b' | 'pricing' | 'other';

export type CompetitorNews = {
  providerName: string;
  title: string;
  url: string;
  publishedAt: string; // YYYY-MM-DD
  category: NewsCategory;
};

export async function newsForProviders(providers: string[]): Promise<CompetitorNews[]> {
  // Real editorial feed if a competitor_news table is populated.
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

  // Otherwise surface real, dated competitor pricing moves from plan_versions —
  // no fabricated launch feed.
  return priceChangesForProviders(providers, 30).map((c) => {
    const up = c.newPrice > c.oldPrice;
    const speed = c.downMbps ? `${c.downMbps.toLocaleString()}M ` : '';
    const plan = c.planName ? `${c.planName} ` : '';
    return {
      providerName: c.providerName,
      title: `${plan}${speed}${up ? 'price increase' : 'price cut'}: $${c.oldPrice} → $${c.newPrice} (observed ${c.observedFrom} → ${c.observedTo})`,
      url: '',
      publishedAt: c.observedTo,
      category: 'pricing' as NewsCategory
    };
  });
}
