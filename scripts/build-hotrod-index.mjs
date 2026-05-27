// Build a coarse inverted index for the Hotrod (FCC BDC) hex data.
//
//   ZIP -> H3 res-8 hexes (lots)
//   each res-8 hex has 1 res-5 parent
//   index: res-5 parent -> [{ providerId, providerName, tech }, ...]
//
// Runtime path becomes:
//   1. Compute the ZIP's res-8 hexes (as today)
//   2. Get the set of res-5 parents
//   3. Look up candidate providers in the parents (small set)
//   4. Fetch only those candidate hex files to verify exact intersection
//
// Output: lib/hotrod-index.json  (committed; rebuilt manually with
//   `node scripts/build-hotrod-index.mjs` when BDC source data updates).

import { writeFileSync } from 'node:fs';
import { cellToParent } from 'h3-js';

const BUCKET = 'hotrod-7a59d.firebasestorage.app';
const PROVIDERS_URL = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/providers.json?alt=media`;
const HEX_URL = (id, tech) =>
  `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(`hexes/${id}_${tech}.json`)}?alt=media`;

const PARENT_RES = 5;
const CONCURRENCY = 100;

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function mapPool(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      out[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return out;
}

console.log('Fetching providers.json…');
const providers = await fetchJson(PROVIDERS_URL);
console.log(`  ${providers.length} providers`);

const tasks = [];
for (const p of providers) {
  for (const t of p.techs) {
    tasks.push({ providerId: p.id, providerName: p.name, tech: t });
  }
}
console.log(`Fetching ${tasks.length} hex files (concurrency ${CONCURRENCY})…`);

// parent (res-5) -> Set<"providerId|tech">
const parentIndex = new Map();
let done = 0;
let bytes = 0;
const t0 = Date.now();

await mapPool(tasks, CONCURRENCY, async (t) => {
  try {
    const res = await fetch(HEX_URL(t.providerId, t.tech));
    if (!res.ok) return;
    const text = await res.text();
    bytes += text.length;
    const hexes = JSON.parse(text);
    for (const h of hexes) {
      let parent;
      try { parent = cellToParent(h, PARENT_RES); } catch { continue; }
      let set = parentIndex.get(parent);
      if (!set) { set = new Set(); parentIndex.set(parent, set); }
      set.add(`${t.providerId}|${t.tech}`);
    }
  } catch (e) {
    console.error(`  ! ${t.providerId}_${t.tech}: ${e.message}`);
  }
  done++;
  if (done % 200 === 0) {
    const rate = done / ((Date.now() - t0) / 1000);
    console.log(`  ${done}/${tasks.length} (${rate.toFixed(0)}/s, ${(bytes/1e6).toFixed(1)}MB read)`);
  }
});
console.log(`Done. ${parentIndex.size} parent cells, ${(bytes/1e6).toFixed(1)}MB total fetched, ${((Date.now()-t0)/1000).toFixed(1)}s`);

// Serialize: { providers: [{id, name, techs}], parents: { [parent]: ["id|tech", ...] } }
const out = {
  generatedAt: new Date().toISOString(),
  parentRes: PARENT_RES,
  providers: providers,  // keep the full provider list so runtime can resolve names
  parents: Object.fromEntries(
    [...parentIndex.entries()].map(([p, set]) => [p, [...set]])
  )
};

const outPath = new URL('../lib/hotrod-index.json', import.meta.url);
writeFileSync(outPath, JSON.stringify(out));
const sizeMB = (JSON.stringify(out).length / 1e6).toFixed(2);
console.log(`Wrote ${outPath.pathname} (${sizeMB} MB)`);
