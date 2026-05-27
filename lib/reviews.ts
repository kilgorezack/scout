import { getSupabase } from './supabase';

export type ProviderReview = {
  providerName: string;
  stars: number;
  reviewCount: number;
  source: string;
};

export async function reviewsForProviders(providers: string[]): Promise<Map<string, ProviderReview>> {
  const map = new Map<string, ProviderReview>();
  // Placeholder until Supabase reviews are populated: 0 stars, 0 reviews.
  for (const name of providers) {
    map.set(name, { providerName: name, stars: 0, reviewCount: 0, source: 'placeholder' });
  }

  const supabase = getSupabase();
  if (!supabase) return map;

  const { data } = await supabase
    .from('competitor_reviews')
    .select('provider_name, stars, review_count, source')
    .in('provider_name', providers);

  if (data) {
    for (const row of data) {
      map.set(row.provider_name, {
        providerName: row.provider_name,
        stars: Number(row.stars ?? 0),
        reviewCount: row.review_count ?? 0,
        source: row.source ?? 'google'
      });
    }
  }
  return map;
}
