import nationalSnap from './provider-reviews.json';
import stateSnap from './provider-reviews-by-state.json';
import { canonicalKey } from './provider-aliases';

export type ReviewScope = 'footprint' | 'national' | 'none';

export type ProviderReview = {
  providerName: string;
  // Headline rating: footprint-local when we have it, else national.
  stars: number;
  reviewCount: number;
  source: string;
  scope: ReviewScope;
  // National figures are always carried so the UI can show both.
  nationalStars: number;
  nationalReviewCount: number;
};

// National snapshot rows: [provider, weightedStars, totalReviews, locationCount].
type NationalRow = [string, number, number, number];
// State snapshot rows: [provider, state, weightedStars, totalReviews, locationCount].
type StateRow = [string, string, number, number, number];

type Aggregate = { stars: number; reviewCount: number; locations: number };

function mergeInto(target: Map<string, Aggregate>, key: string, a: Aggregate) {
  const prev = target.get(key);
  if (!prev) {
    target.set(key, { ...a });
    return;
  }
  const total = prev.reviewCount + a.reviewCount;
  target.set(key, {
    reviewCount: total,
    locations: prev.locations + a.locations,
    stars: total > 0 ? (prev.stars * prev.reviewCount + a.stars * a.reviewCount) / total : prev.stars
  });
}

// National index keyed by canonical brand key, built once per process.
let nationalIndex: Map<string, Aggregate> | null = null;
function getNationalIndex(): Map<string, Aggregate> {
  if (nationalIndex) return nationalIndex;
  const m = new Map<string, Aggregate>();
  for (const [name, stars, reviews, locations] of nationalSnap.providers as NationalRow[]) {
    mergeInto(m, canonicalKey(name), { stars, reviewCount: reviews, locations });
  }
  nationalIndex = m;
  return m;
}

// State index keyed by `${canonicalKey}|${STATE}`.
let stateIndex: Map<string, Aggregate> | null = null;
function getStateIndex(): Map<string, Aggregate> {
  if (stateIndex) return stateIndex;
  const m = new Map<string, Aggregate>();
  for (const [name, state, stars, reviews, locations] of stateSnap.rows as StateRow[]) {
    mergeInto(m, `${canonicalKey(name)}|${state.toUpperCase()}`, { stars, reviewCount: reviews, locations });
  }
  stateIndex = m;
  return m;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// Resolve reviews for a set of provider names. When `states` is supplied (the
// report's footprint), the headline rating is restricted to those states and
// falls back to the national rating when a provider has no local reviews.
export async function reviewsForProviders(
  providers: string[],
  states?: string[]
): Promise<Map<string, ProviderReview>> {
  const nat = getNationalIndex();
  const map = new Map<string, ProviderReview>();
  const footprint = (states ?? []).map((s) => s.toUpperCase()).filter(Boolean);
  const stIdx = footprint.length ? getStateIndex() : null;

  for (const name of providers) {
    const key = canonicalKey(name);
    const national = nat.get(key);

    let local: Aggregate | null = null;
    if (stIdx) {
      const combined = new Map<string, Aggregate>();
      for (const st of footprint) {
        const hit = stIdx.get(`${key}|${st}`);
        if (hit) mergeInto(combined, key, hit);
      }
      local = combined.get(key) ?? null;
    }

    const nationalStars = national ? round1(national.stars) : 0;
    const nationalReviewCount = national?.reviewCount ?? 0;

    if (local && local.reviewCount > 0) {
      map.set(name, {
        providerName: name,
        stars: round1(local.stars),
        reviewCount: local.reviewCount,
        source: 'google',
        scope: 'footprint',
        nationalStars,
        nationalReviewCount
      });
    } else if (national && national.reviewCount > 0) {
      map.set(name, {
        providerName: name,
        stars: nationalStars,
        reviewCount: nationalReviewCount,
        source: 'google',
        scope: 'national',
        nationalStars,
        nationalReviewCount
      });
    } else {
      map.set(name, {
        providerName: name,
        stars: 0,
        reviewCount: 0,
        source: 'placeholder',
        scope: 'none',
        nationalStars: 0,
        nationalReviewCount: 0
      });
    }
  }
  return map;
}

// Single-provider lookup (e.g. the user's own company for benchmarking).
export async function reviewForProvider(
  name: string,
  states?: string[]
): Promise<ProviderReview | null> {
  const map = await reviewsForProviders([name], states);
  const r = map.get(name);
  return r && r.scope !== 'none' ? r : null;
}
