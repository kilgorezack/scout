import { getSupabase } from './supabase';

export type Technology = 'Fiber' | 'Cable' | 'FWA' | 'DSL' | 'Satellite';

export type ProviderInZip = {
  zip: string;
  providerName: string;
  technologies: Technology[];
  maxDownMbps: number;
  maxUpMbps: number;
  locationsServed: number;
};

// Reach is the probability a provider shows up in any given ZIP.
// Tier-1 cable + FWA + satellite providers are effectively always present;
// regional cable/fiber/DSL appear probabilistically.
const NATIONAL_PROVIDERS: Array<{ name: string; tech: Technology; down: number; up: number; reach: number }> = [
  // Always-on backbone (satellite + national FWA)
  { name: 'Starlink',                    tech: 'Satellite', down: 220,  up: 20,   reach: 1.00 },
  { name: 'HughesNet',                   tech: 'Satellite', down: 100,  up: 5,    reach: 1.00 },
  { name: 'Viasat',                      tech: 'Satellite', down: 150,  up: 3,    reach: 1.00 },
  { name: 'T-Mobile Home Internet',      tech: 'FWA',       down: 415,  up: 80,   reach: 0.95 },
  { name: 'Verizon 5G Home',             tech: 'FWA',       down: 1000, up: 75,   reach: 0.85 },
  { name: 'AT&T Internet Air',           tech: 'FWA',       down: 300,  up: 50,   reach: 0.70 },

  // Tier-1 cable MSOs
  { name: 'Comcast Xfinity',             tech: 'Cable',     down: 2000, up: 300,  reach: 0.80 },
  { name: 'Charter Spectrum',            tech: 'Cable',     down: 1000, up: 35,   reach: 0.78 },
  { name: 'Cox Communications',          tech: 'Cable',     down: 2000, up: 100,  reach: 0.45 },
  { name: 'Optimum (Altice)',            tech: 'Cable',     down: 1000, up: 100,  reach: 0.35 },

  // Tier-1 fiber / ILEC fiber
  { name: 'AT&T Fiber',                  tech: 'Fiber',     down: 5000, up: 5000, reach: 0.55 },
  { name: 'Verizon Fios',                tech: 'Fiber',     down: 2300, up: 2300, reach: 0.30 },
  { name: 'Frontier Fiber',              tech: 'Fiber',     down: 5000, up: 5000, reach: 0.32 },
  { name: 'Quantum Fiber (Lumen)',       tech: 'Fiber',     down: 8000, up: 8000, reach: 0.30 },
  { name: 'Kinetic by Windstream',       tech: 'Fiber',     down: 2000, up: 2000, reach: 0.28 },
  { name: 'Brightspeed',                 tech: 'Fiber',     down: 2000, up: 2000, reach: 0.22 },
  { name: 'Ziply Fiber',                 tech: 'Fiber',     down: 5000, up: 5000, reach: 0.15 },
  { name: 'Google Fiber',                tech: 'Fiber',     down: 8000, up: 8000, reach: 0.10 },
  { name: 'MetroNet',                    tech: 'Fiber',     down: 5000, up: 5000, reach: 0.12 },
  { name: 'GoNetspeed',                  tech: 'Fiber',     down: 2000, up: 2000, reach: 0.10 },
  { name: 'Lumos Fiber',                 tech: 'Fiber',     down: 2000, up: 2000, reach: 0.10 },

  // Regional cable
  { name: 'Mediacom',                    tech: 'Cable',     down: 1000, up: 50,   reach: 0.22 },
  { name: 'Sparklight (Cable One)',      tech: 'Cable',     down: 1000, up: 50,   reach: 0.18 },
  { name: 'Astound Broadband',           tech: 'Cable',     down: 1500, up: 50,   reach: 0.18 },
  { name: 'WOW! Internet',               tech: 'Cable',     down: 1200, up: 50,   reach: 0.14 },
  { name: 'Breezeline',                  tech: 'Cable',     down: 1500, up: 50,   reach: 0.12 },

  // DSL ILECs (legacy copper)
  { name: 'CenturyLink',                 tech: 'DSL',       down: 100,  up: 20,   reach: 0.40 },
  { name: 'Windstream',                  tech: 'DSL',       down: 100,  up: 20,   reach: 0.25 },
  { name: 'TDS Telecom',                 tech: 'DSL',       down: 100,  up: 20,   reach: 0.20 },
  { name: 'Consolidated Communications', tech: 'DSL',       down: 100,  up: 20,   reach: 0.18 },

  // WISPs
  { name: 'Rise Broadband',              tech: 'FWA',       down: 250,  up: 25,   reach: 0.25 },
  { name: 'Nextlink Internet',           tech: 'FWA',       down: 500,  up: 50,   reach: 0.15 }
];

function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 13), 1597334677);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  };
}

function stubProvidersForZip(zip: string): ProviderInZip[] {
  const rnd = seededRandom(`bdc-${zip}`);
  const totalLocations = 1500 + Math.floor(rnd() * 7500);
  const out: ProviderInZip[] = [];
  for (const p of NATIONAL_PROVIDERS) {
    if (rnd() > p.reach) continue;
    const share = 0.15 + rnd() * 0.7;
    out.push({
      zip,
      providerName: p.name,
      technologies: [p.tech],
      maxDownMbps: p.down,
      maxUpMbps: p.up,
      locationsServed: Math.round(totalLocations * share)
    });
  }
  return out;
}

export async function providersForZips(zips: string[]): Promise<ProviderInZip[]> {
  const supabase = getSupabase();
  if (!supabase) return zips.flatMap(stubProvidersForZip);

  const { data, error } = await supabase
    .from('bdc_zip_provider')
    .select('zip, provider_name, technology, max_down_mbps, max_up_mbps, locations')
    .in('zip', zips);

  if (error || !data || data.length === 0) return zips.flatMap(stubProvidersForZip);

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
  return Array.from(merged.values());
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
