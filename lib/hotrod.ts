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

import { latLngToCell, gridDisk } from 'h3-js';
import type { ProviderInZip, Technology } from './bdc';

const BUCKET = process.env.HOTROD_BUCKET || 'hotrod-7a59d.firebasestorage.app';
const ENABLED = process.env.HOTROD_ENABLED !== 'false';
const RES = 8;
const RING_K = 12; // gridDisk radius; ~12-18 km coverage around centroid

const url = {
  providers: () => `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/providers.json?alt=media`,
  hexes: (id: string, tech: string) =>
    `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(`hexes/${id}_${tech}.json`)}?alt=media`,
  zipCentroid: (zip: string) =>
    `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(zip)}&benchmark=2020&format=json`
};

type RemoteProvider = { id: string; name: string; techs: string[] };

export const TECH_LABEL: Record<string, Technology> = {
  '10': 'DSL',
  '40': 'Cable',
  '50': 'Fiber',
  '60': 'Satellite',
  '70': 'FWA'
};

// Default placeholder speed per technology. Real BDC includes maxDown/maxUp
// per provider per location, but the user's Firebase index doesn't carry
// speeds — only hex coverage — so we use representative defaults.
const TECH_DEFAULT_SPEEDS: Record<string, { down: number; up: number }> = {
  '10': { down: 100,   up: 20 },
  '40': { down: 1200,  up: 100 },
  '50': { down: 2000,  up: 2000 },
  '60': { down: 200,   up: 20 },
  '70': { down: 300,   up: 30 }
};

// Module-level caches — survive within a warm serverless function instance.
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

async function zipCentroid(zip: string): Promise<[number, number] | null> {
  // Census public geocoder. Returns lng/lat under `coordinates.x` / `.y`.
  const data = await fetchJson<{
    result?: { addressMatches?: Array<{ coordinates?: { x: number; y: number } }> };
  }>(url.zipCentroid(zip), 60 * 60 * 24 * 30);
  const c = data?.result?.addressMatches?.[0]?.coordinates;
  if (!c) return null;
  return [c.y, c.x];
}

function getZipHexes(zip: string): Promise<Set<string>> {
  let p = zipHexCache.get(zip);
  if (!p) {
    p = (async () => {
      const c = await zipCentroid(zip);
      if (!c) return new Set<string>();
      const center = latLngToCell(c[0], c[1], RES);
      return new Set<string>(gridDisk(center, RING_K));
    })();
    zipHexCache.set(zip, p);
  }
  return p;
}

/**
 * Run a bounded-concurrency map over an array.
 */
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

export async function hotrodProvidersForZips(zips: string[]): Promise<ProviderInZip[] | null> {
  if (!hotrodConfigured()) return null;

  // 1. Compute the H3 hex set for each ZIP (centroid + gridDisk).
  const zipHexMap = new Map<string, Set<string>>();
  await Promise.all(
    zips.map(async (z) => {
      zipHexMap.set(z, await getZipHexes(z));
    })
  );

  const allZipHexes = new Set<string>();
  for (const s of zipHexMap.values()) for (const h of s) allZipHexes.add(h);
  if (allZipHexes.size === 0) return null;

  // 2. Load the full provider list (cached after first call).
  const providers = await loadProviders();
  if (providers.length === 0) return null;

  // 3. Build the (provider, tech) work list and run with bounded concurrency.
  type Task = { providerId: string; providerName: string; tech: string };
  const tasks: Task[] = [];
  for (const p of providers) {
    for (const t of p.techs) tasks.push({ providerId: p.id, providerName: p.name, tech: t });
  }

  type Hit = { provider: RemoteProvider; tech: string; hexes: Set<string> };
  const hits: Hit[] = [];

  await mapPool(tasks, 80, async (t) => {
    const hexes = await loadProviderHexes(t.providerId, t.tech);
    if (hexes.size === 0) return;
    let matched: Set<string> | null = null;
    for (const h of allZipHexes) {
      if (hexes.has(h)) {
        (matched ??= new Set()).add(h);
      }
    }
    if (matched) {
      hits.push({
        provider: { id: t.providerId, name: t.providerName, techs: [t.tech] },
        tech: t.tech,
        hexes: matched
      });
    }
  });

  // 4. Project each hit back onto the ZIPs that contain its matched hexes.
  const out: ProviderInZip[] = [];
  for (const hit of hits) {
    for (const zip of zips) {
      const zipHexes = zipHexMap.get(zip)!;
      let count = 0;
      for (const h of hit.hexes) if (zipHexes.has(h)) count++;
      if (count === 0) continue;
      const speeds = TECH_DEFAULT_SPEEDS[hit.tech] ?? { down: 1000, up: 100 };
      out.push({
        zip,
        providerName: hit.provider.name,
        technologies: [TECH_LABEL[hit.tech] ?? 'Fiber'],
        maxDownMbps: speeds.down,
        maxUpMbps: speeds.up,
        // H3 res-8 cells are ~0.7 km² each; rough placeholder of ~15 locations/hex.
        locationsServed: count * 15
      });
    }
  }
  return out;
}
