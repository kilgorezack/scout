// Rebuild lib/provider-reviews.json — a snapshot rollup of the Supabase
// public.provider_reviews table into a per-provider, review-count-weighted star
// rating. Scout reads this baked snapshot at runtime (see lib/reviews.ts) so the
// 186k-row review table never has to be queried or exposed to the browser.
//
// Run when the underlying review data changes:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/build-reviews-index.mjs
//
// The service-role key is required because provider_reviews has RLS enabled with
// no anon read policy (by design — only this aggregate is shipped). The key is
// used here at build time only and is never bundled into the app.

import { writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const PAGE = 1000;
const agg = new Map(); // provider -> { scoreXcount, count, locations }

for (let from = 0; ; from += PAGE) {
  const { data, error } = await supabase
    .from('provider_reviews')
    .select('provider, review_score, review_count')
    .not('provider', 'is', null)
    .not('review_score', 'is', null)
    .range(from, from + PAGE - 1);

  if (error) {
    console.error('Query failed:', error.message);
    process.exit(1);
  }
  if (!data || data.length === 0) break;

  for (const r of data) {
    const count = Number(r.review_count) || 0;
    const score = Number(r.review_score) || 0;
    const cur = agg.get(r.provider) || { scoreXcount: 0, count: 0, locations: 0 };
    cur.scoreXcount += score * count;
    cur.count += count;
    cur.locations += 1;
    agg.set(r.provider, cur);
  }
  console.error(`fetched ${from + data.length} rows…`);
  if (data.length < PAGE) break;
}

const providers = [...agg.entries()]
  .filter(([, v]) => v.count > 0)
  .map(([provider, v]) => [
    provider,
    Math.round((v.scoreXcount / v.count) * 100) / 100,
    v.count,
    v.locations
  ])
  .sort((a, b) => b[2] - a[2]);

const out = {
  note: 'Snapshot rollup of public.provider_reviews: [provider, weightedStars, totalReviews, locationCount]. Weighted by review_count. Regenerate with scripts/build-reviews-index.mjs.',
  providers
};

writeFileSync(new URL('../lib/provider-reviews.json', import.meta.url), JSON.stringify(out));
console.error(`Wrote lib/provider-reviews.json with ${providers.length} providers.`);
