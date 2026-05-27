import { providersForZips, summarizeByProvider, type ProviderInZip } from './bdc';
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
};

// Slugs encode the input directly so they're self-contained across cold
// starts and serverless boundaries. When Supabase is configured we also
// persist a record (handy for analytics / future "saved markets" features).
function base64UrlEncode(str: string): string {
  return Buffer.from(str, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function base64UrlDecode(s: string): string {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64').toString('utf8');
}

export function buildSlug(zips: string[], companyName: string | null): string {
  const payload = JSON.stringify({ z: zips, c: companyName, t: Date.now() });
  return base64UrlEncode(payload);
}

export function decodeSlug(slug: string): ReportInput | null {
  try {
    const raw = base64UrlDecode(slug);
    const parsed = JSON.parse(raw) as { z?: unknown; c?: unknown; t?: unknown };
    const zips = Array.isArray(parsed.z) ? parsed.z.filter((x): x is string => typeof x === 'string') : [];
    if (zips.length === 0) return null;
    const companyName = typeof parsed.c === 'string' ? parsed.c : null;
    const createdAt = typeof parsed.t === 'number' ? new Date(parsed.t).toISOString() : new Date().toISOString();
    return { slug, zips, companyName, createdAt };
  } catch {
    return null;
  }
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
  const providersByZip = await providersForZips(input.zips);
  const ownLower = (input.companyName ?? '').trim().toLowerCase();
  const filtered = ownLower
    ? providersByZip.filter((p) => !p.providerName.toLowerCase().includes(ownLower))
    : providersByZip;

  const competitors = summarizeByProvider(filtered);
  const providerNames = competitors.map((c) => c.providerName);

  const [reviewsMap, news, demographics] = await Promise.all([
    reviewsForProviders(providerNames),
    newsForProviders(providerNames),
    demographicsForZips(input.zips)
  ]);

  const reviews: Record<string, ProviderReview> = {};
  for (const [k, v] of reviewsMap.entries()) reviews[k] = v;

  const opportunities = generateOpportunities({
    providersByZip: filtered,
    demographics,
    news,
    ownCompany: input.companyName
  });

  return {
    ...input,
    providersByZip: filtered,
    competitors,
    reviews,
    news,
    demographics,
    opportunities
  };
}
