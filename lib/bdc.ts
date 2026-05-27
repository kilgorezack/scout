import { getSupabase } from './supabase';
import { zipToState } from './zip-state';
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

// Each provider declares the geography it actually operates in.
//   `states: '*'`        → nationwide (satellites, the big FWAs)
//   `states: ['XX', …]`  → state-level footprint
//   `prefixes: ['592']`  → narrower 3-digit ZIP-prefix footprint (rural
//                          coops, municipals, small CLECs)
// If `prefixes` is set, it takes precedence over `states` — the provider
// only appears in ZIPs whose first three digits match. `reach` is the
// per-ZIP probability *within* the footprint.
type ProviderSpec = {
  name: string;
  tech: Technology;
  down: number;
  up: number;
  reach: number;
  states?: '*' | string[];
  prefixes?: string[];
};

const NATIONAL_PROVIDERS: ProviderSpec[] = [
  // Satellite + national FWA — actually nationwide footprints.
  { name: 'Starlink',               tech: 'Satellite', down: 220,  up: 20,   reach: 1.00, states: '*' },
  { name: 'HughesNet',              tech: 'Satellite', down: 100,  up: 5,    reach: 1.00, states: '*' },
  { name: 'Viasat',                 tech: 'Satellite', down: 150,  up: 3,    reach: 1.00, states: '*' },
  { name: 'T-Mobile Home Internet', tech: 'FWA',       down: 415,  up: 80,   reach: 0.85, states: '*' },
  // Verizon 5G Home: states with meaningful C-band 5G mid-band coverage.
  { name: 'Verizon 5G Home',        tech: 'FWA',       down: 1000, up: 75,   reach: 0.55, states: [
    'CA','NY','NJ','PA','MA','CT','RI','DE','MD','DC','VA','FL','TX','IL','OH','MI','GA','NC','AZ','CO','WA','OR','NV','UT','MN','WI','IN','MO','TN','SC','AL'
  ]},
  // AT&T Internet Air: AT&T mobile-backed FWA in AT&T markets.
  { name: 'AT&T Internet Air',      tech: 'FWA',       down: 300,  up: 50,   reach: 0.55, states: [
    'AL','AR','CA','FL','GA','IL','IN','KS','KY','LA','MI','MS','MO','NV','NC','OH','OK','SC','TN','TX','WI'
  ]},

  // Tier-1 cable MSOs — large but not universal footprints.
  // Comcast Xfinity (~39 states).
  { name: 'Comcast Xfinity',        tech: 'Cable',     down: 2000, up: 300,  reach: 0.88, states: [
    'AL','AR','AZ','CA','CO','CT','DC','DE','FL','GA','IL','IN','KS','KY','LA','MA','MD','ME','MI','MN','MS','NC','NH','NJ','NM','NY','OH','OR','PA','SC','TN','TX','UT','VA','VT','WA','WI','WV'
  ]},
  // Charter Spectrum (~41 states).
  { name: 'Charter Spectrum',       tech: 'Cable',     down: 1000, up: 35,   reach: 0.85, states: [
    'AL','AR','AZ','CA','CO','CT','FL','GA','HI','ID','IL','IN','KS','KY','LA','MA','MD','ME','MI','MN','MO','MS','MT','NC','NE','NH','NJ','NM','NV','NY','OH','OK','OR','PA','SC','TN','TX','UT','VA','VT','WA','WI','WV','WY'
  ]},
  // Cox Communications.
  { name: 'Cox Communications',     tech: 'Cable',     down: 2000, up: 100,  reach: 0.75, states: [
    'AZ','AR','CA','CT','FL','GA','IA','ID','KS','LA','MA','NE','NV','NC','OH','OK','RI','VA'
  ]},
  // Optimum (Altice) — NE + former Suddenlink markets in the South + Midwest.
  { name: 'Optimum (Altice)',       tech: 'Cable',     down: 1000, up: 100,  reach: 0.65, states: [
    'NY','NJ','CT','PA','NC','SC','TX','AR','LA','OK','AL','MS','WV','KY','TN','AZ','MO','VA'
  ]},

  // Tier-1 fiber / ILEC fiber — bound to actual ILEC footprints.
  // AT&T Fiber — across the 21-state AT&T ILEC footprint.
  { name: 'AT&T Fiber',             tech: 'Fiber',     down: 5000, up: 5000, reach: 0.55, states: [
    'AL','AR','CA','CT','FL','GA','IL','IN','KS','KY','LA','MI','MS','MO','NV','NC','OH','OK','SC','TN','TX','WI'
  ]},
  // Verizon Fios — Northeast + Mid-Atlantic.
  { name: 'Verizon Fios',           tech: 'Fiber',     down: 2300, up: 2300, reach: 0.65, states: [
    'NY','NJ','PA','MA','CT','RI','DE','MD','DC','VA'
  ]},
  // Frontier Fiber — ~25 states (post-divestitures).
  { name: 'Frontier Fiber',         tech: 'Fiber',     down: 5000, up: 5000, reach: 0.45, states: [
    'CA','TX','FL','CT','NY','IN','OH','IL','MI','WV','TN','AL','GA','SC','NC','PA','MN','WI','AZ','NV','UT','NM','IA','NE','MS'
  ]},
  // Quantum Fiber (Lumen) — former CenturyLink/US West fiber footprint.
  { name: 'Quantum Fiber (Lumen)',  tech: 'Fiber',     down: 8000, up: 8000, reach: 0.40, states: [
    'AZ','CO','FL','IA','ID','IL','LA','MN','MO','MT','NE','NV','NM','OR','SD','TX','UT','WA','WY'
  ]},
  // Kinetic by Windstream — 18-state rural / mid-sized footprint.
  { name: 'Kinetic by Windstream',  tech: 'Fiber',     down: 2000, up: 2000, reach: 0.45, states: [
    'AL','AR','FL','GA','IA','KS','KY','MN','MS','NC','NE','NM','NY','OH','OK','PA','SC','TX'
  ]},
  // Brightspeed — former CenturyLink Southeast/Midwest copper-to-fiber footprint.
  { name: 'Brightspeed',            tech: 'Fiber',     down: 2000, up: 2000, reach: 0.40, states: [
    'AL','FL','GA','IN','KS','LA','MI','MN','MS','MO','NC','NJ','OH','PA','SC','TN','TX','VA','WI'
  ]},
  // Ziply Fiber — Pacific Northwest (former Frontier NW footprint).
  { name: 'Ziply Fiber',            tech: 'Fiber',     down: 5000, up: 5000, reach: 0.55, states: ['WA','OR','ID','MT'] },
  // Google Fiber — limited metros.
  { name: 'Google Fiber',           tech: 'Fiber',     down: 8000, up: 8000, reach: 0.25, states: [
    'CA','GA','IA','KS','MO','NC','NV','TN','TX','UT','AL','AZ','CO','ID'
  ]},
  // MetroNet — Midwest + Southeast residential fiber overbuilder.
  { name: 'MetroNet',               tech: 'Fiber',     down: 5000, up: 5000, reach: 0.30, states: [
    'IN','MI','IA','OH','IL','KY','MN','NC','FL','KS','MO','NE'
  ]},
  // GoNetspeed — Northeast + Great Lakes.
  { name: 'GoNetspeed',             tech: 'Fiber',     down: 2000, up: 2000, reach: 0.25, states: ['NY','MA','ME','CT','RI','NH','OH','MI','PA'] },
  // Lumos Fiber — Mid-Atlantic / Carolinas.
  { name: 'Lumos Fiber',            tech: 'Fiber',     down: 2000, up: 2000, reach: 0.30, states: ['NC','SC','VA'] },

  // Regional cable
  { name: 'Mediacom',               tech: 'Cable',     down: 1000, up: 50,   reach: 0.50, states: [
    'IA','MO','IL','MN','SD','WI','IN','KS','MI','MS','NC','GA','AL','FL','AZ','CA','NJ','DE','OK','TN'
  ]},
  { name: 'Sparklight (Cable One)', tech: 'Cable',     down: 1000, up: 50,   reach: 0.45, states: [
    'AZ','AR','CA','GA','ID','IL','IN','IA','KS','MS','MO','NM','NC','OK','OR','TX'
  ]},
  { name: 'Astound Broadband',      tech: 'Cable',     down: 1500, up: 50,   reach: 0.45, states: ['CA','NY','IL','PA','WA','OR','MA','MD','TX','VA','DC','NJ'] },
  { name: 'WOW! Internet',          tech: 'Cable',     down: 1200, up: 50,   reach: 0.40, states: ['AL','FL','GA','IL','IN','MI','OH','SC','TN'] },
  { name: 'Breezeline',             tech: 'Cable',     down: 1500, up: 50,   reach: 0.40, states: ['PA','NH','MD','OH','VT','CT','NY','MA','ME','NJ','RI','FL','AL','SC','GA','VA','WV'] },

  // DSL ILECs (legacy copper) — kept tied to actual ILEC states.
  { name: 'CenturyLink',            tech: 'DSL',       down: 100,  up: 20,   reach: 0.55, states: [
    'AZ','CO','FL','IA','ID','IL','LA','MN','MT','NE','NM','NV','OR','SD','TX','UT','WA','WY'
  ]},
  { name: 'Windstream',             tech: 'DSL',       down: 100,  up: 20,   reach: 0.45, states: [
    'AL','AR','FL','GA','IA','KS','KY','MN','MS','NC','NE','NM','NY','OH','OK','PA','SC','TX'
  ]},
  { name: 'TDS Telecom',            tech: 'DSL',       down: 100,  up: 20,   reach: 0.35, states: ['NH','ME','VT','WI','MN','MI','IN','AL','TN'] },
  { name: 'Consolidated Communications', tech: 'DSL',  down: 100,  up: 20,   reach: 0.30, states: ['NH','ME','VT','MA','KS','PA','IL','MN','NY','CA','TX','MO'] },

  // WISPs — rural / plains.
  { name: 'Rise Broadband',         tech: 'FWA',       down: 250,  up: 25,   reach: 0.50, states: [
    'TX','OK','KS','NE','CO','NM','ND','SD','MN','IA','MO','NV','AZ','UT','ID','IL'
  ]},
  { name: 'Nextlink Internet',      tech: 'FWA',       down: 500,  up: 50,   reach: 0.35, states: ['TX','OK','KS','NE','IA','MO'] },

  // -----------------------------------------------------------------------
  // Rural / regional cooperatives & small ILECs — bound to specific
  // 3-digit ZIP prefixes (the relevant USPS SCFs). This is a partial list;
  // real BDC data covers thousands more. Wire up the Supabase
  // bdc_zip_provider table via scripts/etl/fcc_bdc.ts for complete coverage.
  // -----------------------------------------------------------------------

  // Montana
  { name: 'Nemont',                 tech: 'Fiber', down: 1000, up: 1000, reach: 0.90, prefixes: ['592'] },                  // NE MT / NW ND coop
  { name: 'Mid-Rivers Communications', tech: 'Fiber', down: 1000, up: 1000, reach: 0.85, prefixes: ['593'] },               // E MT (Miles City SCF)
  { name: 'Triangle Communications', tech: 'Fiber', down: 1000, up: 1000, reach: 0.80, prefixes: ['594','595'] },           // N Central MT
  { name: '3 Rivers Communications', tech: 'Fiber', down: 1000, up: 1000, reach: 0.80, prefixes: ['596','597'] },           // SW MT
  { name: 'Blackfoot Communications', tech: 'Fiber', down: 1000, up: 1000, reach: 0.75, prefixes: ['598','599'] },          // W MT

  // North Dakota
  { name: 'BEK Communications',     tech: 'Fiber', down: 1000, up: 1000, reach: 0.75, prefixes: ['584','585'] },            // Central / W ND
  { name: 'Consolidated Telcom (ND)', tech: 'Fiber', down: 1000, up: 1000, reach: 0.70, prefixes: ['580','581','582'] },    // E ND

  // Plains / Midwest cooperatives
  { name: 'Allo Communications',    tech: 'Fiber', down: 2000, up: 2000, reach: 0.60, states: ['NE','CO','AZ'] },           // NE/CO/AZ fiber overbuilder
  { name: 'Pinpoint Communications', tech: 'Fiber', down: 1000, up: 1000, reach: 0.70, prefixes: ['686','687','688'] },     // S NE
  { name: 'Pioneer Communications', tech: 'Fiber', down: 1000, up: 1000, reach: 0.70, prefixes: ['678','679'] },            // SW KS

  // Texas Hill Country / rural TX
  { name: 'Hill Country Telephone Coop', tech: 'Fiber', down: 1000, up: 1000, reach: 0.75, prefixes: ['786','788'] },        // TX Hill Country

  // Appalachia / SE
  { name: 'Shentel / Glo Fiber',    tech: 'Fiber', down: 2000, up: 2000, reach: 0.55, states: ['VA','WV','PA','MD'] },      // VA/WV/PA overbuilder
  { name: 'TruVista',               tech: 'Fiber', down: 1000, up: 1000, reach: 0.60, states: ['SC','GA'] },                // SC/GA rural
  { name: 'Hargray',                tech: 'Fiber', down: 2000, up: 2000, reach: 0.60, states: ['SC','GA','AL','FL'] },      // Lowcountry / SE

  // New England
  { name: 'NEK Broadband',          tech: 'Fiber', down: 1000, up: 1000, reach: 0.75, prefixes: ['058','059'] },            // VT Northeast Kingdom
  { name: 'VTel Wireless',          tech: 'Fiber', down: 1000, up: 1000, reach: 0.60, states: ['VT'] },                     // Vermont Telephone

  // Municipal
  { name: 'EPB Fiber Optics',       tech: 'Fiber', down: 25000, up: 25000, reach: 0.85, prefixes: ['373','374'] },          // Chattanooga TN
  { name: 'Greenlight Networks',    tech: 'Fiber', down: 2000, up: 2000, reach: 0.55, prefixes: ['144','146'] }              // Upstate NY (Rochester area)
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
  const state = zipToState(zip);
  const prefix = zip.slice(0, 3);
  const out: ProviderInZip[] = [];
  for (const p of NATIONAL_PROVIDERS) {
    // Prefix binding takes precedence over state binding when set.
    if (p.prefixes) {
      if (!p.prefixes.includes(prefix)) continue;
    } else if (p.states && p.states !== '*') {
      if (!state || !p.states.includes(state)) continue;
    }
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
  source: 'hotrod' | 'supabase' | 'stub';
  hotrod?: HotrodDiagnostics;
};

export async function providersForZipsWithSource(zips: string[]): Promise<ProvidersResult> {
  // Hotrod is authoritative when configured. We do NOT fall back to the stub
  // catalog when Hotrod is on — the stub leaks providers that aren't really
  // in the ZIP (e.g. Ziply Fiber showing up in NE Montana). An empty Hotrod
  // result is a valid answer.
  if (hotrodConfigured()) {
    try {
      const r = await hotrodProvidersForZips(zips);
      if (r) {
        return { rows: mergeRows(r.rows), source: 'hotrod', hotrod: r.diagnostics };
      }
    } catch {
      // network error -> fall through to Supabase, then stub
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

  return { rows: zips.flatMap(stubProvidersForZip), source: 'stub' };
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
