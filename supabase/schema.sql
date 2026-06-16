-- Scout — Supabase schema
-- ---------------------------------------------------------------------------
-- Run this once in your Supabase project (Dashboard → SQL Editor → New query →
-- paste → Run). It creates the five tables Scout reads from and locks them
-- down so they're NOT publicly readable. Scout connects with a server-side key
-- that bypasses these policies, so the app keeps working while the browser /
-- anon key can't read anything.
--
-- Safe to re-run: every statement uses IF NOT EXISTS or CREATE OR REPLACE.

-- 1. Broadband coverage by ZIP + provider (FCC BDC-style rows).
create table if not exists public.bdc_zip_provider (
  id            bigint generated always as identity primary key,
  zip           text    not null,
  provider_name text    not null,
  technology    text,
  max_down_mbps numeric,
  max_up_mbps   numeric,
  locations     integer,
  created_at    timestamptz not null default now()
);
create index if not exists bdc_zip_provider_zip_idx on public.bdc_zip_provider (zip);
create index if not exists bdc_zip_provider_provider_idx on public.bdc_zip_provider (provider_name);

-- 2. Aggregated review scores per provider.
create table if not exists public.competitor_reviews (
  provider_name text primary key,
  stars         numeric,
  review_count  integer,
  source        text,
  updated_at    timestamptz not null default now()
);

-- 3. Recent competitor news / launches.
create table if not exists public.competitor_news (
  id            bigint generated always as identity primary key,
  provider_name text    not null,
  title         text    not null,
  url           text    not null,
  published_at  date,
  category      text,
  created_at    timestamptz not null default now()
);
create index if not exists competitor_news_provider_idx on public.competitor_news (provider_name);

-- 4. Cached structured plan/pricing research (written by the app).
create table if not exists public.competitor_plans (
  cache_key     text primary key,
  provider_name text,
  zips          jsonb,
  plans         jsonb,
  created_at    timestamptz not null default now()
);

-- 5. Saved report records (historical; slug is the source of truth).
create table if not exists public.reports (
  slug         text primary key,
  zips         jsonb,
  company_name text,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Lock everything down. RLS ON with no public policies means the anon/public
-- key can read nothing; Scout's server-side key still has full access.
alter table public.bdc_zip_provider  enable row level security;
alter table public.competitor_reviews enable row level security;
alter table public.competitor_news    enable row level security;
alter table public.competitor_plans   enable row level security;
alter table public.reports            enable row level security;
