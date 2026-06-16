import { providersForZipsWithSource, summarizeByProvider, type ProviderInZip, type ProvidersResult } from './bdc';
import { reviewsForProviders, reviewForProvider, type ProviderReview } from './reviews';
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

export async function buildReport(input: ReportInput): Promise<ReportPayload> {
  // Every awaited call below is wrapped so a single failure can't blank the
  // whole briefing — we'd rather render with partial data than a 500.
  let providersResult: ProvidersResult;
  try {
    providersResult = await providersForZipsWithSource(input.zips);
  } catch (e) {
    providersResult = {
      rows: [],
      source: 'hotrod',
      hotrod: {
        bucket: '',
        zipsResolved: Object.fromEntries(input.zips.map((z) => [z, 0])),
        candidatesFromIndex: 0,
        providersScanned: 0,
        matchesFound: 0,
        totalMillis: 0,
        error: e instanceof Error ? e.message : 'Unknown error'
      }
    };
  }
  const providersByZip = providersResult.rows;
  const ownLower = (input.companyName ?? '').trim().toLowerCase();
  const filtered = ownLower
    ? providersByZip.filter((p) => !p.providerName.toLowerCase().includes(ownLower))
    : providersByZip;

  const competitors = summarizeByProvider(filtered);
  const providerNames = competitors.map((c) => c.providerName);

  // Footprint states drive locally-scoped Google ratings.
  const footprintStates = Array.from(
    new Set(input.zips.map((z) => zipToState(z)).filter((s): s is string => Boolean(s)))
  );

  const [reviewsMap, ownReview, news, demographics] = await Promise.all([
    reviewsForProviders(providerNames, footprintStates).catch(() => new Map()),
    (input.companyName ? reviewForProvider(input.companyName, footprintStates) : Promise.resolve(null)).catch(
      () => null
    ),
    newsForProviders(providerNames).catch(() => []),
    demographicsForZips(input.zips).catch(() => input.zips.map((z) => ({
      zip: z,
      population: 0,
      households: 0,
      housingUnits: 0,
      medianHouseholdIncome: 0,
      ownerOccupiedPct: 0,
      businessEstablishments: 0
    })))
  ]);

  const reviews: Record<string, ProviderReview> = {};
  for (const [k, v] of reviewsMap.entries()) reviews[k] = v;

  let opportunities: Opportunity[] = [];
  try {
    opportunities = generateOpportunities({
      providersByZip: filtered,
      demographics,
      news,
      ownCompany: input.companyName,
      reviews
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
    footprintStates,
    news,
    demographics,
    opportunities,
    dataSource: providersResult.source,
    hotrodDiagnostics: providersResult.hotrod
  };
}
