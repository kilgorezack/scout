# Connecting your Supabase to Scout

Scout already knows how to read from Supabase — it just needs to be pointed at
your project. Follow these steps in order. The whole thing takes a few minutes
and you don't need to write any code.

## What Scout reads

Scout pulls from five tables. You don't have to memorize these — the schema
file creates them for you — but here's what each one feeds:

| Table | Feeds |
|---|---|
| `bdc_zip_provider` | Competitors + coverage (who serves which ZIPs, speeds) |
| `competitor_reviews` | Review star ratings |
| `competitor_news` | Launch radar |
| `competitor_plans` | Comparison table (the app fills this in automatically) |
| `reports` | Saved report history |

## Step 1 — Create the tables

1. Open your project at https://supabase.com/dashboard
2. Left sidebar → **SQL Editor** → **New query**
3. Open `supabase/schema.sql` from this repo, copy ALL of it, paste it in, and
   click **Run**.

This creates the five tables and turns on Row-Level Security so they aren't
publicly readable.

## Step 2 — Get your two credentials

In the Supabase dashboard:

- **Project URL** — Settings → **Data API** → *Project URL*
  (looks like `https://abcdefgh.supabase.co`)
- **Service role key** — Settings → **API Keys** → *service_role*
  ⚠️ This is a secret. Never paste it in chat, commit it, or put it in
  client-side code. Scout only uses it on the server.

## Step 3 — Add them to your deployment

Wherever Scout is hosted (e.g. Vercel → Project → Settings → Environment
Variables), add:

```
SUPABASE_URL = https://your-project.supabase.co
SUPABASE_KEY = your-service-role-key
```

Redeploy.

## Step 4 — Confirm it worked

Visit **`/api/data-status`** on your deployed site. You'll get a quick report:

- `"connected": true` → Scout reached Supabase.
- `"ready": true` → at least one table has data.
- a `tables` list showing the row count in each.

If `connected` is false, double-check the two env vars. If the tables exist but
are empty, that's expected until you load your data (Step 5).

## Step 5 — Load your data

If your valuable data is already in Supabase under *different* table names,
share the table/column names (Step 1's query output, or a screenshot of the
Table Editor) and we'll write a SQL script to copy it into Scout's tables.

If you're starting fresh, you can insert rows directly in the Table Editor or
via `INSERT` statements in the SQL Editor.
