import { NextResponse } from 'next/server';
import { getSupabase, supabaseConfigured } from '@/lib/supabase';

// Lightweight setup/diagnostics endpoint. Visit /api/data-status after wiring
// up Supabase to confirm the connection works and see which tables Scout found
// (and how many rows each holds). It returns row COUNTS only — never row data —
// so it's safe to hit without leaking records. Add ?sample=1 together with a
// matching ?token= (DATA_STATUS_TOKEN) to also pull a couple of example rows
// when you're debugging the data shape.

// The tables Scout reads from. Keep in sync with lib/*.ts.
const EXPECTED_TABLES = [
  'bdc_zip_provider',
  'competitor_reviews',
  'competitor_news',
  'competitor_plans',
  'reports'
] as const;

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!supabaseConfigured()) {
    return NextResponse.json({
      connected: false,
      message:
        'Supabase is not configured. Set SUPABASE_URL and SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY) in your environment.'
    });
  }

  const supabase = getSupabase()!;
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const tokenOk = Boolean(process.env.DATA_STATUS_TOKEN) && token === process.env.DATA_STATUS_TOKEN;
  const wantSample = searchParams.get('sample') === '1' && tokenOk;

  const tables = await Promise.all(
    EXPECTED_TABLES.map(async (table) => {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      if (error) {
        return { table, exists: false, rows: 0, error: error.message };
      }
      const result: Record<string, unknown> = { table, exists: true, rows: count ?? 0 };
      if (wantSample && (count ?? 0) > 0) {
        const { data } = await supabase.from(table).select('*').limit(2);
        result.sample = data ?? [];
      }
      return result;
    })
  );

  const ready = tables.some((t) => t.exists && (t.rows as number) > 0);

  return NextResponse.json({
    connected: true,
    ready,
    message: ready
      ? 'Supabase is connected and at least one Scout table has data.'
      : 'Supabase is connected, but Scout\'s expected tables are missing or empty. Run supabase/schema.sql, then load your data.',
    tables
  });
}
