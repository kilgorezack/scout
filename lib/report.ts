import { providersForZipsWithSource, summarizeByProvider, type ProviderInZip, type ProvidersResult } from './bdc';
import { reviewsForProviders, type ProviderReview } from './reviews';
import { newsForProviders, type CompetitorNews } from './news';
import { demographicsForZips, type ZipDemographics } from './census';
import { generateOpportunities, type Opportunity } from './opportunities';
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

  const competitors = summarizeByProvider(filtered);
  const providerNames = competitors.map((c) => c.providerName);

  const zeroDemographics = input.zips.map((z) => ({
    zip: z,
    population: 0,
    households: 0,
    housingUnits: 0,
    medianHouseholdIncome: 0,
    ownerOccupiedPct: 0,
    businessEstablishments: 0
  }));
  const [reviewsMap, news, demographics] = await Promise.all([
    withTimeout(reviewsForProviders(providerNames), 8_000, new Map()).catch(() => new Map()),
    withTimeout(newsForProviders(providerNames), 8_000, []).catch(() => []),
    withTimeout(demographicsForZips(input.zips), 10_000, zeroDemographics).catch(() => zeroDemographics)
  ]);

  const reviews: Record<string, ProviderReview> = {};
  for (const [k, v] of reviewsMap.entries()) reviews[k] = v;

  let opportunities: Opportunity[] = [];
  try {
    opportunities = generateOpportunities({
      providersByZip: filtered,
      demographics,
      news,
      ownCompany: input.companyName
    });
  } catch {
    opportunities = [];
  }

  return {
    ...input,
    providersByZip: filtered,
    competitors,
    reviews,
    news,
    demographics,
    opportunities,
    dataSource: providersResult.source,
    hotrodDiagnostics: providersResult.hotrod
  };
}
