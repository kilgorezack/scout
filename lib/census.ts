export type ZipDemographics = {
  zip: string;
  population: number;
  households: number;
  housingUnits: number;
  medianHouseholdIncome: number;
  ownerOccupiedPct: number;
  businessEstablishments: number;
};

const ACS_BASE = 'https://api.census.gov/data/2022/acs/acs5';
// ZIP Business Patterns — the Census' ZIP-level establishment counts (2018 is
// the last ZBP vintage). Real source for businessEstablishments.
const ZBP_BASE = 'https://api.census.gov/data/2018/zbp';

const ACS_VARS = [
  'B01003_001E', // total population
  'B11001_001E', // total households
  'B25001_001E', // housing units
  'B19013_001E', // median household income
  'B25003_002E' // owner-occupied units
];

function zero(zip: string): ZipDemographics {
  return {
    zip,
    population: 0,
    households: 0,
    housingUnits: 0,
    medianHouseholdIncome: 0,
    ownerOccupiedPct: 0,
    businessEstablishments: 0
  };
}

// Env values frequently arrive with surrounding quotes or trailing whitespace/
// newlines (a classic dashboard paste mistake) — that silently invalidates the
// key. Sanitize before use.
function censusKey(): string | undefined {
  const raw = process.env.CENSUS_API_KEY;
  const cleaned = raw?.trim().replace(/^["']+|["']+$/g, '').trim();
  return cleaned ? cleaned : undefined;
}

export function censusKeyConfigured(): boolean {
  return Boolean(censusKey());
}

// IMPORTANT: build query strings by hand and encode ONLY spaces as %20. The
// Census API rejects '+' for spaces (what URLSearchParams emits), and we match
// the exact working request format (literal ':' and ',', spaces as %20). We
// also query ONE ZCTA per request — the API does not accept a comma-separated
// list of specific ZCTAs, and per-ZIP calls isolate failures.

// Real ACS demographics for one ZCTA, or null when unavailable (never faked).
async function acsForZip(zip: string, key?: string): Promise<Omit<ZipDemographics, 'businessEstablishments'> | null> {
  try {
    const url = `${ACS_BASE}?get=${ACS_VARS.join(',')}&for=${`zip code tabulation area:${zip}`.replace(/ /g, '%20')}${key ? `&key=${encodeURIComponent(key)}` : ''}`;
    const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 }, signal: AbortSignal.timeout(8000) });
    const body = await res.text();
    if (!res.ok || !body.trimStart().startsWith('[')) {
      // Surface the real Census error (e.g. "Invalid Key") in server logs —
      // never logs the key itself.
      console.warn(`[census] ACS ${zip} failed: HTTP ${res.status} — ${body.slice(0, 140).replace(/\s+/g, ' ').trim()}`);
      return null;
    }
    const json = JSON.parse(body) as string[][];
    const [header, row] = json;
    if (!row) return null;
    const idx = (col: string) => header.indexOf(col);
    const pop = Number(row[idx('B01003_001E')] ?? 0);
    const hh = Number(row[idx('B11001_001E')] ?? 0);
    const hu = Number(row[idx('B25001_001E')] ?? 0);
    const inc = Number(row[idx('B19013_001E')] ?? 0);
    const owner = Number(row[idx('B25003_002E')] ?? 0);
    return {
      zip,
      population: pop > 0 ? pop : 0,
      households: hh > 0 ? hh : 0,
      housingUnits: hu > 0 ? hu : 0,
      medianHouseholdIncome: inc > 0 ? inc : 0,
      ownerOccupiedPct: hu > 0 ? Math.round((owner / hu) * 100) : 0
    };
  } catch {
    return null;
  }
}

// Real establishment count for one ZIP, or 0 when unavailable. Never fabricated.
async function establishmentsForZip(zip: string, key?: string): Promise<number> {
  try {
    const url = `${ZBP_BASE}?get=ESTAB&for=zipcode:${zip}${key ? `&key=${encodeURIComponent(key)}` : ''}`;
    const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 * 30 }, signal: AbortSignal.timeout(6000) });
    const body = await res.text();
    if (!res.ok || !body.trimStart().startsWith('[')) return 0;
    const json = JSON.parse(body) as string[][];
    const [header, row] = json;
    const n = Number(row?.[header.indexOf('ESTAB')]);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export async function demographicsForZips(zips: string[]): Promise<ZipDemographics[]> {
  const key = censusKey();
  // Per-ZIP, fully parallel. ACS and ZBP are independent; either failing just
  // yields zeros for that field — we never invent numbers.
  return Promise.all(
    zips.map(async (zip) => {
      const [acs, estab] = await Promise.all([acsForZip(zip, key), establishmentsForZip(zip, key)]);
      return acs ? { ...acs, businessEstablishments: estab } : { ...zero(zip), businessEstablishments: estab };
    })
  );
}
