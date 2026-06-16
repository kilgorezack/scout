import { getSupabase } from './supabase';
import { hotrodConfigured, hotrodProvidersForZips, type HotrodDiagnostics } from './hotrod';

export type Technology = 'Fiber' | 'Cable' | 'FWA' | 'DSL' | 'Satellite';

export type ProviderInZip = {
  zip: string;
  providerName: string;
  technologies: Technology[];
  maxDownMbps: number;
  maxUpMbps: number;
  locationsServed: number;
};

// Collapse multiple rows for the same (zip, provider) — e.g. a provider with
// both a fiber and a fixed-wireless file in Hotrod — into a single entry
// that lists all of their technologies and keeps the best speeds.
function mergeRows(rows: ProviderInZip[]): ProviderInZip[] {
  const merged = new Map<string, ProviderInZip>();
  for (const r of rows) {
    const key = `${r.zip}|${r.providerName}`;
    const existing = merged.get(key);
    if (existing) {
      for (const t of r.technologies) {
        if (!existing.technologies.includes(t)) existing.technologies.push(t);
      }
      existing.maxDownMbps = Math.max(existing.maxDownMbps, r.maxDownMbps);
      existing.maxUpMbps = Math.max(existing.maxUpMbps, r.maxUpMbps);
      existing.locationsServed = Math.max(existing.locationsServed, r.locationsServed);
    } else {
      merged.set(key, { ...r, technologies: [...r.technologies] });
    }
  }
  return Array.from(merged.values());
}

export type ProvidersResult = {
  rows: ProviderInZip[];
  source: 'hotrod' | 'supabase' | 'none';
  hotrod?: HotrodDiagnostics;
};

export async function providersForZipsWithSource(zips: string[]): Promise<ProvidersResult> {
  // Hotrod (live FCC BDC) is authoritative when configured. There is NO
  // synthetic fallback — we only ever serve real provider data. If neither
  // Hotrod nor Supabase returns anything, the honest answer is an empty
  // result, not made-up competitors.
  if (hotrodConfigured()) {
    try {
      const r = await hotrodProvidersForZips(zips);
      if (r) {
        return { rows: mergeRows(r.rows), source: 'hotrod', hotrod: r.diagnostics };
      }
    } catch {
      // network error -> fall through to Supabase, then an empty result
    }
  }

  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from('bdc_zip_provider')
      .select('zip, provider_name, technology, max_down_mbps, max_up_mbps, locations')
      .in('zip', zips);
    if (!error && data && data.length > 0) {
      const merged = new Map<string, ProviderInZip>();
      for (const row of data) {
        const key = `${row.zip}|${row.provider_name}`;
        const existing = merged.get(key);
        if (existing) {
          if (!existing.technologies.includes(row.technology as Technology)) {
            existing.technologies.push(row.technology as Technology);
          }
          existing.maxDownMbps = Math.max(existing.maxDownMbps, row.max_down_mbps ?? 0);
          existing.maxUpMbps = Math.max(existing.maxUpMbps, row.max_up_mbps ?? 0);
          existing.locationsServed = Math.max(existing.locationsServed, row.locations ?? 0);
        } else {
          merged.set(key, {
            zip: row.zip,
            providerName: row.provider_name,
            technologies: [row.technology as Technology],
            maxDownMbps: row.max_down_mbps ?? 0,
            maxUpMbps: row.max_up_mbps ?? 0,
            locationsServed: row.locations ?? 0
          });
        }
      }
      return { rows: Array.from(merged.values()), source: 'supabase' };
    }
  }

  // No real data available from any source — return empty rather than
  // fabricating providers.
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
      error: 'No provider data available from Hotrod or Supabase for these ZIPs.'
    }
  };
}

export async function providersForZips(zips: string[]): Promise<ProviderInZip[]> {
  const r = await providersForZipsWithSource(zips);
  return r.rows;
}

export function summarizeByProvider(rows: ProviderInZip[]) {
  const byProvider = new Map<
    string,
    { providerName: string; technologies: Set<Technology>; zips: Set<string>; maxDown: number; maxUp: number; totalLocations: number }
  >();
  for (const r of rows) {
    let agg = byProvider.get(r.providerName);
    if (!agg) {
      agg = {
        providerName: r.providerName,
        technologies: new Set(),
        zips: new Set(),
        maxDown: 0,
        maxUp: 0,
        totalLocations: 0
      };
      byProvider.set(r.providerName, agg);
    }
    r.technologies.forEach((t) => agg!.technologies.add(t));
    agg.zips.add(r.zip);
    agg.maxDown = Math.max(agg.maxDown, r.maxDownMbps);
    agg.maxUp = Math.max(agg.maxUp, r.maxUpMbps);
    agg.totalLocations += r.locationsServed;
  }
  return Array.from(byProvider.values())
    .map((p) => ({
      providerName: p.providerName,
      technologies: Array.from(p.technologies),
      zips: Array.from(p.zips),
      maxDownMbps: p.maxDown,
      maxUpMbps: p.maxUp,
      totalLocations: p.totalLocations
    }))
    .sort((a, b) => b.totalLocations - a.totalLocations);
}
