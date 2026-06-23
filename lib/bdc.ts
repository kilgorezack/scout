import { getSupabase } from './supabase';
import { hotrodConfigured, hotrodProvidersForZips, getZipHexes, type HotrodDiagnostics } from './hotrod';

export type Technology = 'Fiber' | 'Cable' | 'FWA' | 'DSL' | 'Satellite';

export type ProviderInZip = {
  zip: string;
  providerName: string;
  technologies: Technology[];
  maxDownMbps: number;
  maxUpMbps: number;
  locationsServed: number;
  // Number of the ZIP's H3 hexes this provider covers (Hotrod path only).
  // Used with the ZIP's total hex count + Census housing to estimate premises.
  coverageHexes?: number;
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
      existing.coverageHexes = Math.max(existing.coverageHexes ?? 0, r.coverageHexes ?? 0);
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
    // FCC tech code → Technology label.
    const TECH_MAP: Record<number, Technology> = {
      10: 'DSL', 40: 'Cable', 50: 'Fiber',
      60: 'Satellite', 61: 'Satellite',
      70: 'FWA', 71: 'FWA', 72: 'FWA'
    };

    // Convert ZIPs to H3 res-8 hex sets (reuses hotrod's cached Census lookups).
    const zipHexMap = new Map<string, Set<string>>();
    await Promise.all(zips.map(async (z) => { zipHexMap.set(z, await getZipHexes(z)); }));
    const allHexes = [...new Set([...zipHexMap.values()].flatMap((s) => [...s]))];

    if (allHexes.length > 0) {
      // Step 1: fetch (h3_res8_id, plan_id) pairs for all ZIP hexes.
      // Only two lightweight columns — avoids the row-count explosion that
      // happens when joining providers/speeds inline. Limit set high enough
      // to cover dense urban ZIPs while staying within Supabase's query budget.
      const BATCH = 500;
      const hexPlanPairs: { h3_res8_id: string; plan_id: number }[] = [];

      for (let i = 0; i < allHexes.length; i += BATCH) {
        const batch = allHexes.slice(i, i + BATCH);
        const { data, error } = await supabase
          .from('h3_cell_plans')
          .select('h3_res8_id, plan_id')
          .in('h3_res8_id', batch)
          .limit(50000);
        if (error || !data) continue;
        for (const row of data as { h3_res8_id: string; plan_id: number }[]) {
          hexPlanPairs.push(row);
        }
      }

      if (hexPlanPairs.length > 0) {
        // Step 2: look up provider/tech/speed for the unique plan IDs found.
        const uniquePlanIds = [...new Set(hexPlanPairs.map((r) => r.plan_id))];
        type PlanDetail = {
          id: number;
          providers: { name: string } | null;
          speed_tiers: { download_mbps: number | null; upload_mbps: number | null } | null;
          technologies: { code: number } | null;
        };
        const planDetails = new Map<number, PlanDetail>();

        const PLAN_BATCH = 200;
        for (let i = 0; i < uniquePlanIds.length; i += PLAN_BATCH) {
          const batch = uniquePlanIds.slice(i, i + PLAN_BATCH);
          const { data, error } = await supabase
            .from('plans')
            .select('id, providers(name), speed_tiers(download_mbps, upload_mbps), technologies(code)')
            .in('id', batch);
          if (error || !data) continue;
          for (const row of data as unknown as PlanDetail[]) planDetails.set(row.id, row);
        }

        // Step 3: aggregate per (zip, provider) using the hex→plan→provider mapping.
        const merged = new Map<string, ProviderInZip>();
        for (const { h3_res8_id, plan_id } of hexPlanPairs) {
          const plan = planDetails.get(plan_id);
          if (!plan?.providers?.name) continue;
          const techCode = plan.technologies?.code ?? -1;
          if (!(techCode in TECH_MAP)) continue;
          const tech = TECH_MAP[techCode];

          for (const [zip, hexes] of zipHexMap) {
            if (!hexes.has(h3_res8_id)) continue;
            const key = `${zip}|${plan.providers.name}`;
            const existing = merged.get(key);
            if (existing) {
              if (!existing.technologies.includes(tech)) existing.technologies.push(tech);
              existing.maxDownMbps = Math.max(existing.maxDownMbps, plan.speed_tiers?.download_mbps ?? 0);
              existing.maxUpMbps = Math.max(existing.maxUpMbps, plan.speed_tiers?.upload_mbps ?? 0);
              existing.coverageHexes = (existing.coverageHexes ?? 0) + 1;
            } else {
              merged.set(key, {
                zip,
                providerName: plan.providers.name,
                technologies: [tech],
                maxDownMbps: plan.speed_tiers?.download_mbps ?? 0,
                maxUpMbps: plan.speed_tiers?.upload_mbps ?? 0,
                locationsServed: 0,
                coverageHexes: 1
              });
            }
          }
        }

        if (merged.size > 0) {
          const rows = Array.from(merged.values()).map((r) => ({
            ...r,
            locationsServed: (r.coverageHexes ?? 1) * 15
          }));
          return { rows: mergeRows(rows), source: 'supabase' };
        }
      }
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
