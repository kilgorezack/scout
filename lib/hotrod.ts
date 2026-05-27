// Integration with the Hotrod Firebase Storage bucket — real FCC BDC data
// at H3 resolution 8, keyed by provider FRN + technology code.
//
//   providers.json                          → [{ id, name, techs[] }]
//   hexes/{providerId}_{techCode}.json      → ["882a1072b5fffff", …]
//
// Tech codes (FCC BDC):
//   10  ADSL / VDSL
//   40  Cable
//   50  Fiber to the End User
//   60  Satellite
//   70  Terrestrial Fixed Wireless
//
// Bucket is configured public-read; no auth needed.

import { latLngToCell, gridDisk, polygonToCells } from 'h3-js';
import type { ProviderInZip, Technology } from './bdc';

const BUCKET = process.env.HOTROD_BUCKET || 'hotrod-7a59d.firebasestorage.app';
const ENABLED = process.env.HOTROD_ENABLED !== 'false';
const RES = 8;
const RING_K = 12; // gridDisk fallback radius if polygon lookup fails

const url = {
  providers: () => `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/providers.json?alt=media`,
  hexes: (id: string, tech: string) =>
    `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(`hexes/${id}_${tech}.json`)}?alt=media`,
  zcta: (zip: string) =>
    // Census TIGERweb ArcGIS ZCTA5 layer. Returns the ZIP's polygon boundary as GeoJSON.
    `https://tigerweb.geo.census.gov/arcgis/rest/services/Census2020/PUMA_TAD_TAZ_UGA_ZCTA/MapServer/4/query?where=BASENAME%3D%27${zip}%27&outFields=BASENAME&returnGeometry=true&f=geojson&outSR=4326`,
  zipCentroid: (zip: string) =>
    // Zippopotam.us — free, no-auth, reliable for bare 5-digit US ZIPs.
    `https://api.zippopotam.us/us/${zip}`
};

type RemoteProvider = { id: string; name: string; techs: string[] };

export const TECH_LABEL: Record<string, Technology> = {
  '10': 'DSL',
  '40': 'Cable',
  '50': 'Fiber',
  '60': 'Satellite',
  '70': 'FWA'
};

const TECH_DEFAULT_SPEEDS: Record<string, { down: number; up: number }> = {
  '10': { down: 100,   up: 20 },
  '40': { down: 1200,  up: 100 },
  '50': { down: 2000,  up: 2000 },
  '60': { down: 200,   up: 20 },
  '70': { down: 300,   up: 30 }
};

let providersPromise: Promise<RemoteProvider[]> | null = null;
const hexSetCache = new Map<string, Promise<Set<string>>>();
const zipHexCache = new Map<string, Promise<Set<string>>>();

async function fetchJson<T>(u: string, revalidate = 60 * 60 * 24): Promise<T | null> {
  try {
    const res = await fetch(u, {
      next: { revalidate },
      signal: AbortSignal.timeout(20_000)
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function loadProviders(): Promise<RemoteProvider[]> {
  if (!providersPromise) {
    providersPromise = fetchJson<RemoteProvider[]>(url.providers()).then((r) => r ?? []);
  }
  return providersPromise;
}

function loadProviderHexes(id: string, tech: string): Promise<Set<string>> {
  const key = `${id}_${tech}`;
  let p = hexSetCache.get(key);
  if (!p) {
    p = fetchJson<string[]>(url.hexes(id, tech)).then((arr) => new Set(arr ?? []));
    hexSetCache.set(key, p);
  }
  return p;
}

// Census ArcGIS ZCTA polygon → array of [lng, lat] rings (GeoJSON ordering).
async function zipPolygon(zip: string): Promise<number[][][] | null> {
  type GeoJSONFeature = {
    geometry?:
      | { type: 'Polygon'; coordinates: number[][][] }
      | { type: 'MultiPolygon'; coordinates: number[][][][] };
  };
  const data = await fetchJson<{ features?: GeoJSONFeature[] }>(url.zcta(zip), 60 * 60 * 24 * 30);
  const geom = data?.features?.[0]?.geometry;
  if (!geom) return null;
  if (geom.type === 'Polygon') {
    return geom.coordinates as number[][][]; // [outerRing, ...holes]
  }
  if (geom.type === 'MultiPolygon') {
    // Flatten all polygon outer rings; polygonToCells handles each ring set.
    return geom.coordinates.flat() as number[][][];
  }
  return null;
}

async function zipCentroid(zip: string): Promise<[number, number] | null> {
  // Zippopotam.us returns { places: [{ latitude: "48.7064", longitude: "-105.967", ... }] }.
  const data = await fetchJson<{
    places?: Array<{ latitude?: string; longitude?: string }>;
  }>(url.zipCentroid(zip), 60 * 60 * 24 * 30);
  const p = data?.places?.[0];
  if (!p?.latitude || !p?.longitude) return null;
  const lat = parseFloat(p.latitude);
  const lng = parseFloat(p.longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return [lat, lng];
}

function getZipHexes(zip: string): Promise<Set<string>> {
  let p = zipHexCache.get(zip);
  if (!p) {
    p = (async () => {
      const cells = new Set<string>();

      // Run polygon and centroid lookups in parallel — union the results.
      // Polygon gives exact coverage when available; gridDisk around the
      // centroid is a robust safety net (and the only path for ZIPs whose
      // ZCTA boundary the TIGERweb service doesn't return).
      const [rings, c] = await Promise.all([zipPolygon(zip), zipCentroid(zip)]);

      if (rings && rings.length > 0) {
        for (const ring of rings) {
          if (!ring || ring.length < 4) continue;
          const polygon = [ring.map((p) => [p[1], p[0]] as [number, number])];
          try {
            for (const c of polygonToCells(polygon, RES)) cells.add(c);
          } catch {
            // ignore individual ring failures
          }
        }
      }

      if (c) {
        const center = latLngToCell(c[0], c[1], RES);
        for (const h of gridDisk(center, RING_K)) cells.add(h);
      }

      return cells;
    })();
    zipHexCache.set(zip, p);
  }
  return p;
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
}

export function hotrodConfigured(): boolean {
  return ENABLED && Boolean(BUCKET);
}

export type HotrodDiagnostics = {
  bucket: string;
  zipsResolved: Record<string, number>;
  providersScanned: number;
  matchesFound: number;
  totalMillis: number;
  error?: string;
};

export async function hotrodProvidersForZips(
  zips: string[]
): Promise<{ rows: ProviderInZip[]; diagnostics: HotrodDiagnostics } | null> {
  if (!hotrodConfigured()) return null;
  const t0 = Date.now();

  const zipHexMap = new Map<string, Set<string>>();
  await Promise.all(
    zips.map(async (z) => {
      zipHexMap.set(z, await getZipHexes(z));
    })
  );

  const allZipHexes = new Set<string>();
  for (const s of zipHexMap.values()) for (const h of s) allZipHexes.add(h);
  if (allZipHexes.size === 0) {
    return {
      rows: [],
      diagnostics: {
        bucket: BUCKET,
        zipsResolved: Object.fromEntries(zips.map((z) => [z, 0])),
        providersScanned: 0,
        matchesFound: 0,
        totalMillis: Date.now() - t0
      }
    };
  }

  const providers = await loadProviders();
  if (providers.length === 0) {
    return {
      rows: [],
      diagnostics: {
        bucket: BUCKET,
        zipsResolved: Object.fromEntries(zips.map((z) => [z, zipHexMap.get(z)?.size ?? 0])),
        providersScanned: 0,
        matchesFound: 0,
        totalMillis: Date.now() - t0,
        error: 'providers.json fetch returned empty'
      }
    };
  }

  type Task = { providerId: string; providerName: string; tech: string };
  const tasks: Task[] = [];
  for (const p of providers) {
    for (const t of p.techs) tasks.push({ providerId: p.id, providerName: p.name, tech: t });
  }

  type Hit = { providerName: string; tech: string; hexes: Set<string> };
  const hits: Hit[] = [];

  // Hard time budget — return what we have rather than letting the function
  // get killed by the Vercel timeout, which produces an opaque 500.
  const DEADLINE_MS = 45_000;
  const deadline = t0 + DEADLINE_MS;
  let timedOut = false;

  await mapPool(tasks, 150, async (t) => {
    if (Date.now() > deadline) {
      timedOut = true;
      return;
    }
    const hexes = await loadProviderHexes(t.providerId, t.tech);
    if (hexes.size === 0) return;
    let matched: Set<string> | null = null;
    for (const h of allZipHexes) {
      if (hexes.has(h)) (matched ??= new Set()).add(h);
    }
    if (matched) {
      hits.push({ providerName: t.providerName, tech: t.tech, hexes: matched });
    }
  });

  const rows: ProviderInZip[] = [];
  for (const hit of hits) {
    for (const zip of zips) {
      const zipHexes = zipHexMap.get(zip)!;
      let count = 0;
      for (const h of hit.hexes) if (zipHexes.has(h)) count++;
      if (count === 0) continue;
      const speeds = TECH_DEFAULT_SPEEDS[hit.tech] ?? { down: 1000, up: 100 };
      rows.push({
        zip,
        providerName: hit.providerName,
        technologies: [TECH_LABEL[hit.tech] ?? 'Fiber'],
        maxDownMbps: speeds.down,
        maxUpMbps: speeds.up,
        locationsServed: count * 15
      });
    }
  }

  return {
    rows,
    diagnostics: {
      bucket: BUCKET,
      zipsResolved: Object.fromEntries(zips.map((z) => [z, zipHexMap.get(z)?.size ?? 0])),
      providersScanned: providers.length,
      matchesFound: hits.length,
      totalMillis: Date.now() - t0,
      error: timedOut ? `Stopped after ${DEADLINE_MS}ms — returning partial results` : undefined
    }
  };
}
