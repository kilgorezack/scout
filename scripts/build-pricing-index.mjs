// Rebuild lib/provider-pricing.json and lib/provider-price-changes.json from
// Supabase (plans, speed_tiers, providers, plan_versions). Scout reads these
// baked snapshots at runtime (see lib/pricing.ts) so no DB access is needed in
// production.
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/build-pricing-index.mjs
//
// All four tables are small enough to fetch fully and join in JS.

import { writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

async function fetchAll(table, columns) {
  const PAGE = 1000;
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from(table).select(columns).range(from, from + PAGE - 1);
    if (error) { console.error(`${table}:`, error.message); process.exit(1); }
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE) break;
  }
  console.error(`${table}: ${rows.length}`);
  return rows;
}

const sane = (price, down) => price >= 20 && price <= 500 && down >= 10 && down <= 10000;
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const round = (n, d) => Math.round(n * 10 ** d) / 10 ** d;
function bucket(down) {
  if (down >= 90 && down <= 150) return '100M';
  if (down >= 200 && down <= 400) return '300M';
  if (down >= 450 && down <= 700) return '500M';
  if (down >= 940 && down <= 1200) return '1G';
  if (down >= 1800 && down <= 2200) return '2G';
  if (down >= 4500) return '5G+';
  return null;
}

const providers = new Map((await fetchAll('providers', 'id,name')).map((p) => [p.id, p.name]));
const speedTiers = await fetchAll('speed_tiers', 'id,download_mbps,upload_mbps');
const speeds = new Map(speedTiers.map((s) => [s.id, s.download_mbps]));
const speedsUp = new Map(speedTiers.map((s) => [s.id, s.upload_mbps]));
const techCat = new Map(
  (await fetchAll('technologies', 'id,code')).map((t) => {
    const c = t.code;
    const cat =
      c === 10 ? 'DSL' : c === 40 ? 'Cable' : c === 50 ? 'Fiber' : c === 60 || c === 61 ? 'Satellite' : c === 70 || c === 71 || c === 72 ? 'FWA' : 'Other';
    return [t.id, cat];
  })
);
const plans = await fetchAll('plans', 'provider_id,speed_tier_id,technology_id,price_usd');

// Per-provider summary + tiers, plus real max residential speed.
const byProv = new Map();
const speedByProvTech = new Map(); // `provider|cat` -> { down, up }
for (const p of plans) {
  const name = providers.get(p.provider_id);
  const down = speeds.get(p.speed_tier_id);
  const up = speedsUp.get(p.speed_tier_id);
  const price = p.price_usd;
  const cat = techCat.get(p.technology_id);

  // Max residential speed per technology: any priced ($20–500) plan, 1–10,000 Mbps.
  if (name && cat && cat !== 'Other' && down != null && price != null && price >= 20 && price <= 500 && down >= 1 && down <= 10000) {
    const k = `${name}|${cat}`;
    const s = speedByProvTech.get(k) ?? { down: 0, up: 0 };
    s.down = Math.max(s.down, down);
    s.up = Math.max(s.up, up ?? 0);
    speedByProvTech.set(k, s);
  }

  if (!name || down == null || price == null || !sane(price, down)) continue;
  let a = byProv.get(name);
  if (!a) { a = { prices: [], ppm: [], gig: [], tiers: new Map() }; byProv.set(name, a); }
  a.prices.push(price);
  a.ppm.push(price / down);
  if (down >= 940 && down <= 1200) a.gig.push(price);
  const b = bucket(down);
  if (b) { const t = a.tiers.get(b) ?? []; t.push(price); a.tiers.set(b, t); }
}

const summary = [];
const tiers = [];
for (const [name, a] of byProv) {
  summary.push([
    name,
    a.prices.length,
    a.ppm.length ? round(median(a.ppm), 4) : null,
    a.gig.length ? round(median(a.gig), 2) : null,
    round(Math.min(...a.prices), 2),
    round(Math.max(...a.prices), 2)
  ]);
  for (const [b, arr] of a.tiers) tiers.push([name, b, round(median(arr), 2), arr.length]);
}

// Price changes from plan_versions (consecutive versions, price delta >= $1).
const versions = await fetchAll('plan_versions', 'plan_id,version_number,versioned_at,price_usd,plan_name,provider_id,speed_tier_id');
const byPlan = new Map();
for (const v of versions) {
  const arr = byPlan.get(v.plan_id) ?? [];
  arr.push(v);
  byPlan.set(v.plan_id, arr);
}
const day = (ts) => (ts ? String(ts).slice(0, 10) : null);
const changes = [];
for (const arr of byPlan.values()) {
  arr.sort((x, y) => x.version_number - y.version_number);
  for (let i = 1; i < arr.length; i++) {
    const prev = arr[i - 1].price_usd;
    const cur = arr[i].price_usd;
    if (prev == null || cur == null) continue;
    if (Math.abs(cur - prev) < 1) continue;
    if (![prev, cur].every((p) => p >= 20 && p <= 500)) continue;
    const name = providers.get(arr[i].provider_id);
    if (!name) continue;
    // observedFrom..observedTo = the scrape window the change was detected in.
    changes.push([
      name,
      arr[i].plan_name,
      speeds.get(arr[i].speed_tier_id) ?? null,
      round(prev, 2),
      round(cur, 2),
      day(arr[i - 1].versioned_at),
      day(arr[i].versioned_at)
    ]);
  }
}
changes.sort((a, b) => new Date(b[6]) - new Date(a[6]));

writeFileSync(
  new URL('../lib/provider-pricing.json', import.meta.url),
  JSON.stringify({ note: 'National pricing rollup. summary:[provider,planCount,medianPricePerMbps,gigPrice,minPrice,maxPrice]; tiers:[provider,bucket,medianPrice,n].', summary, tiers })
);
writeFileSync(
  new URL('../lib/provider-price-changes.json', import.meta.url),
  JSON.stringify({ note: 'Plan price changes from plan_versions: [provider,planName,downMbps,oldPrice,newPrice,observedFrom,observedTo]. Dates are scrape-capture dates; the change occurred within that window.', changes: changes.slice(0, 4000) })
);
const speedRows = [...speedByProvTech.entries()].map(([k, s]) => {
  const i = k.lastIndexOf('|');
  return [k.slice(0, i), k.slice(i + 1), s.down, s.up];
});
writeFileSync(
  new URL('../lib/provider-speeds.json', import.meta.url),
  JSON.stringify({ note: 'Max residential speed per provider per technology from plans ($20-500): [provider, tech, maxDownMbps, maxUpMbps].', speeds: speedRows })
);
console.error(`Wrote ${summary.length} providers, ${tiers.length} tier rows, ${changes.length} price changes, ${speedRows.length} speed rows.`);
