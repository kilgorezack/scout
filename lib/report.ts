import { providersForZipsWithSource, summarizeByProvider, type ProviderInZip, type ProvidersResult } from './bdc';
import { reviewsForProviders, reviewForProvider, type ProviderReview } from './reviews';
import {
  pricingForProviders,
  pricingForProvider,
  priceChangesForProviders,
  type ProviderPricing,
  type PriceChange
} from './pricing';
import { maxSpeedForProvider } from './speeds';
import { newsForProviders, type CompetitorNews } from './news';
import { demographicsForZips, type ZipDemographics } from './census';
import { generateOpportunities, type Opportunity } from './opportunities';
import { zipToState } from './zip-state';
import { getSupabase } from './supabase';

export type ReportInput = {
  slug: string;
  zips: string[];
  companyName: string | null;
  createdAt: string;
};

export type ReportPayload = ReportInput & {
  providersByZip: ProviderInZip[];
  competitors: ReturnType<typeof summarizeByProvider>;
  reviews: Record<string, ProviderReview>;
  ownReview: ProviderReview | null;
  pricing: Record<string, ProviderPricing>;
  ownPricing: ProviderPricing | null;
  priceChanges: PriceChange[];
  footprintStates: string[];
  news: CompetitorNews[];
  demographics: ZipDemographics[];
  opportunities: Opportunity[];
  dataSource: ProvidersResult['source'];
  hotrodDiagnostics?: ProvidersResult['hotrod'];
};

import { buildSlug as buildSlugShared, decodeSlug as decodeSlugShared } from './slug';

export const buildSlug = buildSlugShared;

export function decodeSlug(slug: string): ReportInput | null {
  const d = decodeSlugShared(slug);
  if (!d) return null;
  return { slug, zips: d.zips, companyName: d.companyName, createdAt: d.createdAt };
}

export async function persistReportInput(input: ReportInput): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from('reports').upsert({
    slug: input.slug,
    zips: input.zips,
    company_name: input.companyName,
    created_at: input.createdAt
  });
}

export async function loadReportInput(slug: string): Promise<ReportInput | null> {
  // Slug is self-describing — decode it directly. Supabase row is a
  // historical record, not the source of truth, so we don't need to hit it.
  return decodeSlug(slug);
}

// Resolve `p`, but never wait longer than `ms` — on timeout, resolve `fallback`
// instead. This guards the report build against any single upstream call
// hanging (a stalled fetch never rejects, so `.catch` alone can't save us) and
// blowing the function's maxDuration, which surfaces to the user as
// "Connection closed".
function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))
  ]);
}

function emptyProviders(zips: string[], error: string): ProvidersResult {
  return {
    rows: [],
    source: 'none',
    hotrod: {
      bucket: '',
      zipsResolved: Object.fromEntries(zips.map((z) => [z, 0])),
      candidatesFromIndex: 0,
      providersScanned: 0,
      matchesFound: 0,
      totalMillis: 0,
      error
    }
  };
}

export async function buildReport(input: ReportInput): Promise<ReportPayload> {
  // Every awaited call below is wrapped so a single failure — or a hang — can't
  // blank the whole briefing. We'd rather render with partial data than a 500
  // or a timed-out connection.
  let providersResult: ProvidersResult;
  try {
    providersResult = await withTimeout(
      providersForZipsWithSource(input.zips),
      45_000,
      emptyProviders(input.zips, 'Provider lookup timed out')
    );
  } catch (e) {
    providersResult = emptyProviders(input.zips, e instanceof Error ? e.message : 'Unknown error');
  }
  const providersByZip = providersResult.rows;
  const ownLower = (input.companyName ?? '').trim().toLowerCase();
  const filtered = ownLower
    ? providersByZip.filter((p) => !p.providerName.toLowerCase().includes(ownLower))
    : providersByZip;

  // Distinct competitor names — enough to fetch reviews/news/pricing without
  // needing the (locations-dependent) summary yet.
  const providerNames = Array.from(new Set(filtered.map((p) => p.providerName)));

  // Footprint states drive locally-scoped Google ratings.
  const footprintStates = Array.from(
    new Set(input.zips.map((z) => zipToState(z)).filter((s): s is string => Boolean(s)))
  );

  const zeroDemographics = input.zips.map((z) => ({
    zip: z,
    population: 0,
    households: 0,
    housingUnits: 0,
    medianHouseholdIncome: 0,
    ownerOccupiedPct: 0,
    businessEstablishments: 0
  }));
  const [reviewsMap, ownReview, news, demographics] = await Promise.all([
    withTimeout(reviewsForProviders(providerNames, footprintStates), 8_000, new Map()).catch(() => new Map()),
    withTimeout(
      input.companyName ? reviewForProvider(input.companyName, footprintStates) : Promise.resolve(null),
      8_000,
      null
    ).catch(() => null),
    withTimeout(newsForProviders(providerNames), 8_000, []).catch(() => []),
    withTimeout(demographicsForZips(input.zips), 10_000, zeroDemographics).catch(() => zeroDemographics)
  ]);

  // Estimate premises served from real Census housing × the provider's coverage
  // fraction of each ZIP (Hotrod path), replacing the crude hex-count heuristic.
  if (providersResult.source === 'hotrod') {
    const housingByZip = new Map(demographics.map((d) => [d.zip, d.housingUnits]));
    const zipTotalHexes = providersResult.hotrod?.zipsResolved ?? {};
    for (const r of filtered) {
      const total = zipTotalHexes[r.zip] ?? 0;
      const housing = housingByZip.get(r.zip) ?? 0;
      const cov = r.coverageHexes ?? 0;
      if (total > 0 && housing > 0 && cov > 0) {
        r.locationsServed = Math.round(housing * Math.min(1, cov / total));
      }
    }
  }

  const competitors = summarizeByProvider(filtered);

  // Override technology-default speeds with each provider's real max
  // residential speed from the Supabase plans snapshot when we have it.
  for (const c of competitors) {
    const sp = maxSpeedForProvider(c.providerName, c.technologies);
    if (sp) {
      c.maxDownMbps = sp.down;
      c.maxUpMbps = sp.up;
    }
  }

  const reviews: Record<string, ProviderReview> = {};
  for (const [k, v] of reviewsMap.entries()) reviews[k] = v;

  // Pricing is a baked national snapshot (no network), matched to the
  // footprint's competitors by the same canonical-name logic as reviews.
  const pricing: Record<string, ProviderPricing> = {};
  for (const [k, v] of pricingForProviders(providerNames).entries()) pricing[k] = v;
  const ownPricing = input.companyName ? pricingForProvider(input.companyName) : null;
  const priceChanges = priceChangesForProviders(providerNames, 12);

  let opportunities: Opportunity[] = [];
  try {
    opportunities = generateOpportunities({
      providersByZip: filtered,
      demographics,
      news,
      ownCompany: input.companyName,
      reviews,
      priceChanges
    });
  } catch {
    opportunities = [];
  }

  return {
    ...input,
    providersByZip: filtered,
    competitors,
    reviews,
    ownReview,
    pricing,
    ownPricing,
    priceChanges,
    footprintStates,
    news,
    demographics,
    opportunities,
    dataSource: providersResult.source,
    hotrodDiagnostics: providersResult.hotrod
  };
}
