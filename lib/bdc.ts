import { getSupabase } from './supabase';
import { zipToState } from './zip-state';

export type Technology = 'Fiber' | 'Cable' | 'FWA' | 'DSL' | 'Satellite';

export type ProviderInZip = {
  zip: string;
  providerName: string;
  technologies: Technology[];
  maxDownMbps: number;
  maxUpMbps: number;
  locationsServed: number;
};

// Each provider declares the states it actually operates in. A provider is
// only considered for a ZIP if that ZIP's state is in its footprint.
// `reach` is then the per-ZIP probability *within* that footprint — capturing
// the fact that even within their states, providers don't pass every address.
// `states: '*'` = nationwide (satellites, the big FWAs).
type ProviderSpec = {
  name: string;
  tech: Technology;
  down: number;
  up: number;
  reach: number;
  states: '*' | string[];
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
  { name: 'Nextlink Internet',      tech: 'FWA',       down: 500,  up: 50,   reach: 0.35, states: ['TX','OK','KS','NE','IA','MO'] }
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
  const out: ProviderInZip[] = [];
  for (const p of NATIONAL_PROVIDERS) {
    if (p.states !== '*') {
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
