import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Credentials are read server-side only. All Supabase access in Scout happens
// in server components / API routes, so the key never needs to reach the
// browser. Prefer the server-only env names; fall back to the legacy public
// names so existing deploys keep working. Using server-only vars keeps the
// database safe even when Row-Level Security isn't enabled on every table.
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!url || !key) return null;
  if (!client) client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export function supabaseConfigured(): boolean {
  return Boolean(url && key);
}
