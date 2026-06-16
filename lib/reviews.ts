import snapshot from './provider-reviews.json';
import { canonicalKey } from './provider-aliases';

export type ProviderReview = {
  providerName: string;
  stars: number;
  reviewCount: number;
  source: string;
};

// Snapshot rows: [provider, weightedStars, totalReviews, locationCount].
// Generated from public.provider_reviews by scripts/build-reviews-index.mjs.
type SnapshotRow = [string, number, number, number];

type Aggregate = { stars: number; reviewCount: number; locations: number };

// Build a canonical-key index over the baked snapshot once per process.
// Multiple snapshot rows can collapse onto one brand key (e.g. "Verizon" vs.
// "Verizon Business") — we combine them with a review-count weighted average.
let index: Map<string, Aggregate> | null = null;

function getIndex(): Map<string, Aggregate> {
  if (index) return index;
  const m = new Map<string, Aggregate>();
  for (const [name, stars, reviews, locations] of snapshot.providers as SnapshotRow[]) {
    const key = canonicalKey(name);
    const prev = m.get(key);
    if (prev) {
      const total = prev.reviewCount + reviews;
      m.set(key, {
        reviewCount: total,
        locations: prev.locations + locations,
        stars: total > 0 ? (prev.stars * prev.reviewCount + stars * reviews) / total : prev.stars
      });
    } else {
      m.set(key, { stars, reviewCount: reviews, locations });
    }
  }
  index = m;
  return m;
}

export async function reviewsForProviders(providers: string[]): Promise<Map<string, ProviderReview>> {
  const idx = getIndex();
  const map = new Map<string, ProviderReview>();
  for (const name of providers) {
    const hit = idx.get(canonicalKey(name));
    if (hit && hit.reviewCount > 0) {
      map.set(name, {
        providerName: name,
        stars: Math.round(hit.stars * 10) / 10,
        reviewCount: hit.reviewCount,
        source: 'google'
      });
    } else {
      // No review match — keep a 0-star placeholder so the UI renders cleanly.
      map.set(name, { providerName: name, stars: 0, reviewCount: 0, source: 'placeholder' });
    }
  }
  return map;
}
