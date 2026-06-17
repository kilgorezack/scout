import pricingSnap from './provider-pricing.json';
import changesSnap from './provider-price-changes.json';
import { canonicalKey } from './provider-aliases';

export type Tier = { bucket: string; medianPrice: number; n: number };

export type ProviderPricing = {
  providerName: string;
  planCount: number;
  medianPricePerMbps: number | null;
  gigPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  tiers: Tier[];
};

export type PriceChange = {
  providerName: string;
  planName: string;
  downMbps: number | null;
  oldPrice: number;
  newPrice: number;
  // Data-capture (scrape) window the change was observed between — NOT the
  // provider's official announcement date.
  observedFrom: string;
  observedTo: string;
};

// Snapshot row shapes (see scripts/build-pricing-index.mjs).
type SummaryRow = [string, number, number | null, number | null, number | null, number | null];
type TierRow = [string, string, number, number];
type ChangeRow = [string, string, number | null, number, number, string, string];

export const TIER_ORDER = ['100M', '300M', '500M', '1G', '2G', '5G+'];

type Acc = {
  planCount: number;
  ppmWeighted: number;
  ppmWeight: number;
  gigWeighted: number;
  gigWeight: number;
  min: number | null;
  max: number | null;
  tiers: Map<string, { priceWeighted: number; n: number }>;
};

// Build a canonical-key pricing index once per process. Multiple BDC providers
// can normalize to one brand key (e.g. "AT&T") — we merge them with
// plan-count / tier-count weighting so brand-level pricing stays stable and
// lines up with the brand-level Google ratings.
let pricingIndex: Map<string, ProviderPricing> | null = null;

function buildPricingIndex(): Map<string, ProviderPricing> {
  if (pricingIndex) return pricingIndex;
  const acc = new Map<string, Acc>();
  const get = (k: string): Acc => {
    let a = acc.get(k);
    if (!a) {
      a = { planCount: 0, ppmWeighted: 0, ppmWeight: 0, gigWeighted: 0, gigWeight: 0, min: null, max: null, tiers: new Map() };
      acc.set(k, a);
    }
    return a;
  };

  for (const [name, planCount, ppm, gig, min, max] of pricingSnap.summary as SummaryRow[]) {
    const a = get(canonicalKey(name));
    a.planCount += planCount;
    if (ppm != null) { a.ppmWeighted += ppm * planCount; a.ppmWeight += planCount; }
    if (gig != null) { a.gigWeighted += gig * planCount; a.gigWeight += planCount; }
    if (min != null) a.min = a.min == null ? min : Math.min(a.min, min);
    if (max != null) a.max = a.max == null ? max : Math.max(a.max, max);
  }
  for (const [name, bucket, medPrice, n] of pricingSnap.tiers as TierRow[]) {
    const t = get(canonicalKey(name)).tiers;
    const prev = t.get(bucket) ?? { priceWeighted: 0, n: 0 };
    prev.priceWeighted += medPrice * n;
    prev.n += n;
    t.set(bucket, prev);
  }

  const out = new Map<string, ProviderPricing>();
  for (const [key, a] of acc) {
    const tiers: Tier[] = TIER_ORDER.filter((b) => a.tiers.has(b)).map((b) => {
      const t = a.tiers.get(b)!;
      return { bucket: b, medianPrice: Math.round((t.priceWeighted / t.n) * 100) / 100, n: t.n };
    });
    out.set(key, {
      providerName: key,
      planCount: a.planCount,
      medianPricePerMbps: a.ppmWeight ? Math.round((a.ppmWeighted / a.ppmWeight) * 1000) / 1000 : null,
      gigPrice: a.gigWeight ? Math.round((a.gigWeighted / a.gigWeight) * 100) / 100 : null,
      minPrice: a.min,
      maxPrice: a.max,
      tiers
    });
  }
  pricingIndex = out;
  return out;
}

export function pricingForProviders(providers: string[]): Map<string, ProviderPricing> {
  const idx = buildPricingIndex();
  const map = new Map<string, ProviderPricing>();
  for (const name of providers) {
    const hit = idx.get(canonicalKey(name));
    if (hit && hit.planCount > 0) map.set(name, { ...hit, providerName: name });
  }
  return map;
}

export function pricingForProvider(name: string): ProviderPricing | null {
  const hit = buildPricingIndex().get(canonicalKey(name));
  return hit && hit.planCount > 0 ? { ...hit, providerName: name } : null;
}

// Recent real pricing moves for the given providers, newest first.
export function priceChangesForProviders(providers: string[], limit = 12): PriceChange[] {
  const keys = new Set(providers.map(canonicalKey));
  const display = new Map(providers.map((p) => [canonicalKey(p), p]));
  const out: PriceChange[] = [];
  for (const [provider, planName, down, oldPrice, newPrice, observedFrom, observedTo] of changesSnap.changes as ChangeRow[]) {
    const k = canonicalKey(provider);
    if (!keys.has(k)) continue;
    out.push({
      providerName: display.get(k) ?? provider,
      planName,
      downMbps: down,
      oldPrice,
      newPrice,
      observedFrom,
      observedTo
    });
  }
  // changesSnap is already newest-first; keep that order.
  return out.slice(0, limit);
}
