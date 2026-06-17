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

// Real establishment count for a ZIP, or 0 when unavailable. Never fabricated.
async function establishmentsForZip(zip: string, key?: string): Promise<number> {
  try {
    const url = new URL(ZBP_BASE);
    url.searchParams.set('get', 'ESTAB');
    url.searchParams.set('for', `zipcode:${zip}`);
    if (key) url.searchParams.set('key', key);
    const res = await fetch(url.toString(), {
      next: { revalidate: 60 * 60 * 24 * 30 },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok || !res.headers.get('content-type')?.includes('json')) return 0;
    const json = (await res.json()) as string[][];
    const [header, ...rows] = json;
    const n = Number(rows[0]?.[header.indexOf('ESTAB')]);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export async function demographicsForZips(zips: string[]): Promise<ZipDemographics[]> {
  const key = process.env.CENSUS_API_KEY;
  // Business establishments come from a separate (ZBP) endpoint; fetch in
  // parallel with ACS. Any failure resolves to 0 — we never invent numbers.
  const estabPromise = Promise.all(zips.map((z) => establishmentsForZip(z, key))).catch(() => zips.map(() => 0));

  try {
    const variables = [
      'B01003_001E', // total population
      'B11001_001E', // total households
      'B25001_001E', // housing units
      'B19013_001E', // median household income
      'B25003_002E' // owner-occupied units
    ];
    const url = new URL(ACS_BASE);
    url.searchParams.set('get', variables.join(','));
    url.searchParams.set('for', `zip code tabulation area:${zips.join(',')}`);
    if (key) url.searchParams.set('key', key);

    // Hard timeout — a hanging Census call must not stall the report build past
    // the function's maxDuration (which surfaces as "Connection closed").
    const res = await fetch(url.toString(), {
      next: { revalidate: 60 * 60 * 24 },
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) throw new Error(`Census ${res.status}`);
    // The Census API answers a keyless/invalid-key request with an HTML
    // "Missing Key" page under a 200, so guard against non-JSON before parsing.
    if (!res.headers.get('content-type')?.includes('json')) {
      throw new Error('Census API returned a non-JSON response (missing/invalid CENSUS_API_KEY?)');
    }
    const json = (await res.json()) as string[][];
    const [header, ...rows] = json;
    const idx = (col: string) => header.indexOf(col);
    const zipIdx = header.indexOf('zip code tabulation area');
    const estab = await estabPromise;
    const estabByZip = new Map(zips.map((z, i) => [z, estab[i] ?? 0]));

    return zips.map((zip) => {
      const row = rows.find((r) => r[zipIdx] === zip);
      const businessEstablishments = estabByZip.get(zip) ?? 0;
      if (!row) return { ...zero(zip), businessEstablishments };
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
        ownerOccupiedPct: hu > 0 ? Math.round((owner / hu) * 100) : 0,
        businessEstablishments
      };
    });
  } catch {
    const estab = await estabPromise;
    return zips.map((zip, i) => ({ ...zero(zip), businessEstablishments: estab[i] ?? 0 }));
  }
}
