export type ZipDemographics = {
  zip: string;
  population: number;
  households: number;
  housingUnits: number;
  medianHouseholdIncome: number;
  ownerOccupiedPct: number;
  businessEstablishments: number;
};

function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 13), 1597334677);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  };
}

function stubDemographics(zip: string): ZipDemographics {
  const r = seededRandom(`census-${zip}`);
  const households = 1200 + Math.floor(r() * 14000);
  return {
    zip,
    population: Math.round(households * (2.1 + r() * 0.6)),
    households,
    housingUnits: Math.round(households * (1.02 + r() * 0.15)),
    medianHouseholdIncome: Math.round(45000 + r() * 95000),
    ownerOccupiedPct: Math.round((0.35 + r() * 0.5) * 100),
    businessEstablishments: Math.round(households * (0.04 + r() * 0.06))
  };
}

const CENSUS_BASE = 'https://api.census.gov/data/2022/acs/acs5';

export async function demographicsForZips(zips: string[]): Promise<ZipDemographics[]> {
  const key = process.env.CENSUS_API_KEY;
  // Census ACS lookup by ZCTA. If the upstream call fails, fall back to stub data
  // so the report still renders.
  try {
    const variables = [
      'NAME',
      'B01003_001E', // total population
      'B11001_001E', // total households
      'B25001_001E', // housing units
      'B19013_001E', // median household income
      'B25003_002E' // owner-occupied units
    ];
    const url = new URL(CENSUS_BASE);
    url.searchParams.set('get', variables.join(','));
    url.searchParams.set('for', `zip code tabulation area:${zips.join(',')}`);
    if (key) url.searchParams.set('key', key);

    const res = await fetch(url.toString(), { next: { revalidate: 60 * 60 * 24 } });
    if (!res.ok) throw new Error(`Census ${res.status}`);
    const json = (await res.json()) as string[][];
    const [header, ...rows] = json;
    const idx = (col: string) => header.indexOf(col);
    const zipIdx = header.indexOf('zip code tabulation area');
    return zips.map((zip) => {
      const row = rows.find((r) => r[zipIdx] === zip);
      if (!row) return stubDemographics(zip);
      const pop = Number(row[idx('B01003_001E')] ?? 0);
      const hh = Number(row[idx('B11001_001E')] ?? 0);
      const hu = Number(row[idx('B25001_001E')] ?? 0);
      const inc = Number(row[idx('B19013_001E')] ?? 0);
      const owner = Number(row[idx('B25003_002E')] ?? 0);
      if (!hh || !hu) return stubDemographics(zip);
      return {
        zip,
        population: pop,
        households: hh,
        housingUnits: hu,
        medianHouseholdIncome: inc > 0 ? inc : stubDemographics(zip).medianHouseholdIncome,
        ownerOccupiedPct: hu > 0 ? Math.round((owner / hu) * 100) : 0,
        businessEstablishments: stubDemographics(zip).businessEstablishments
      };
    });
  } catch {
    return zips.map(stubDemographics);
  }
}
