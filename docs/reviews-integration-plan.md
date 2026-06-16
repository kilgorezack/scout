# Plan: Bring Google review / star-rating data into Scout

Status: **proposed** (no code or DB changes made yet)
Constraint: **Supabase is read-only** — no schema/data mutations except a single anon
read grant required for production access (see §2).
Goal: replace the 0-star placeholders with real ratings *and* ship new
review-driven features that add competitive-analysis value.

---

## 1. What we have

The live Supabase project contains a `public.provider_reviews` table that the
website does **not** currently use:

- **186,896 rows**, **2,170 distinct providers**, Google Business data.
- Per **location** (one row per Google listing), not per provider. Verizon alone
  has ~20,500 location rows.
- Columns: `provider`, `review_score` (stars), `review_count`, `place_id`, `cid`,
  `title`, `address`, `city`, `state`, `place_geoid`, `latitude`, `longitude`,
  `website`, `phone_number`, `updated_at`.
- Coverage: 183,875 rows have a score; 186,887 have lat/long; all 50 states.

Rolled up to a weighted star rating per provider, the data is strong and
realistic:

| Provider | Locations | Total reviews | Weighted stars |
|---|---|---|---|
| Verizon | 20,526 | 8.9M | 4.68 |
| AT&T | 21,950 | 8.1M | 4.43 |
| Xfinity | 8,099 | 3.0M | 3.37 |
| Spectrum | 7,530 | 2.8M | 3.14 |
| Mediacom Xtream | 938 | 382K | 1.99 |
| HughesNet | 11,125 | 905K | 2.32 |

## 2. The two gaps to close

### a. Wrong table name (website bug)
`lib/reviews.ts` queries `competitor_reviews` — **a table that does not exist**.
The real data is in `provider_reviews`. This is why every report shows
"0 stars / placeholder." Fixing the query is the core change.

### b. No anon read policy (production access)
`provider_reviews` has **RLS enabled but no policies**, so the anon key cannot
read it. `providers`, `plans`, `h3_cells`, `h3_cell_plans` all already have an
`allow_anon_read` SELECT policy; `provider_reviews` is the odd one out.

**Required change (read-only safe):** add one SELECT policy for `anon`,
mirroring the existing tables:

```sql
create policy allow_anon_read on public.provider_reviews
  for select to anon using (true);
```

This grants read access only — no data is modified. Alternative if you'd rather
not touch policies at all: query reviews server-side with the service-role key
(Next.js route handlers/server components only, key never shipped to the
browser). Recommendation: the anon read policy — it's consistent with the rest
of the schema and avoids handling the service-role key.

## 3. Name matching (the real engineering work)

Review names are bare brands; the site's catalog (`lib/bdc.ts`,
Hotrod, BDC) uses fuller names:

| Review name | Site catalog name(s) |
|---|---|
| `Verizon` | `Verizon Fios`, `Verizon 5G Home` |
| `AT&T` | `AT&T Fiber`, `AT&T Internet Air` |
| `Xfinity` | `Comcast Xfinity` |
| `Spectrum` | `Charter Spectrum` |
| `Optimum` | `Optimum (Altice)` |
| `Sparklight` | `Sparklight (Cable One)` |

Plan:
1. Build a normalization function (`normalizeProviderName`) that lowercases,
   strips suffixes (`Inc`, `LLC`, `Communications`, `Broadband`), and applies an
   explicit alias map for the brand/sub-brand cases above.
2. Match the site's providers to the **best** review group by normalized name,
   so `Verizon Fios` and `Verizon 5G Home` both inherit Verizon's rating (with a
   note that the rating is brand-level).
3. Keep the alias map in one file (`lib/provider-aliases.ts`) so it's easy to
   extend as we spot misses.

## 4. Rollup strategy (read-only friendly)

Because we can't create a view, aggregation happens in the **query layer**:

- Preferred: a lightweight server-side rollup. Fetch the rows for the matched
  providers (filtered by normalized name / state) and compute the
  review-count-weighted average in TypeScript. For footprint features, filter by
  geography first (§5) so we never pull all 186K rows.
- If query volume grows, revisit asking you to add a materialized view — but
  that's a future optimization, not needed for v1.

## 5. New features this data unlocks

Ranked by value-to-effort:

1. **Real star ratings on the Competitors tab** (replaces placeholders).
   Weighted avg + total review count per competitor. *Core.*
2. **Reputation-gap opportunities.** Feed ratings into the existing
   Opportunities engine: a low-rated incumbent in the footprint (e.g. HughesNet
   2.3★, Mediacom 2.0★, Spectrum 3.1★) is a displacement target. Generates
   ranked, data-backed "go after these subscribers" recommendations.
3. **Footprint-local ratings, not just national.** Each review row has lat/long.
   Convert to **H3 res8** (the site already uses `h3-js` and has an `h3_cells`
   table) and intersect with the analyzed ZIPs' cells — so a report can say
   "*In your footprint*, Spectrum averages 3.0★ across 42 locations," which is
   far more persuasive than the national number.
4. **Competitor location map.** Plot lat/long pins (with title, address, phone,
   website, rating) for competitors in the footprint. Strong visual for the
   Coverage/Competitors tabs.
5. **Reputation benchmark vs. the user's own company.** Where the user's brand
   appears in `provider_reviews`, show their rating against each competitor —
   "you're 4.2★ vs. the incumbent's 3.1★, lead with reliability."
6. **Best/worst-rated competitor callouts** on the Overview tab summary.

Display scope for v1 (per your choice): **stars + review count only.** Features
3–6 reuse that same rollup; the map (4) is the one that needs extra UI.

## 6. Proposed implementation order

1. Add anon read policy on `provider_reviews` (§2b).
2. `lib/provider-aliases.ts` — normalization + alias map.
3. Rewrite `lib/reviews.ts` to query `provider_reviews`, roll up weighted
   ratings, and match via the alias map. Keep the stub fallback for when env
   vars are absent.
4. Verify ratings render on the Competitors tab.
5. Reputation-gap signals into `lib/opportunities.ts` (feature 2).
6. Footprint-local ratings via H3 (feature 3).
7. Map + benchmark (features 4–5) as follow-ups.

## 7. Production wiring (deployed site)

The MCP access used here is for development only. For the deployed app to read
the data, set in the hosting env (e.g. Vercel):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

(Use `get_project_url` / `get_publishable_keys` to retrieve these.) Combined
with the §2b read policy, the existing `lib/supabase.ts` client will start
returning real data automatically.

## 8. Open questions

- Brand-level vs. sub-brand ratings: OK to show one Verizon rating for both
  "Verizon Fios" and "Verizon 5G Home"? (Reviews don't distinguish.)
- Footprint matching granularity: H3 res8 intersection (most precise) vs.
  simpler state/city match for v1?
- Should the user's own company rating be pulled in for benchmarking (feature 5)?
