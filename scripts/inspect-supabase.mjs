// Inspect a connected Supabase project: list every table, its columns, row
// counts, and a couple of sample rows. Read-only. Run once a Supabase
// connection is configured to see what data is available before mapping it
// into Scout.
//
//   SUPABASE_URL=... SUPABASE_KEY=... node scripts/inspect-supabase.mjs
//
// Uses only PostgREST's built-in OpenAPI endpoint (GET /rest/v1/) for schema,
// so no extra dependencies and no SQL access needed. The service_role key is
// recommended so it can see every table regardless of RLS.

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL and/or SUPABASE_KEY in the environment.');
  process.exit(1);
}

const base = url.replace(/\/+$/, '');
const headers = { apikey: key, Authorization: `Bearer ${key}` };

async function getSchema() {
  const res = await fetch(`${base}/rest/v1/`, { headers });
  if (!res.ok) {
    throw new Error(`Schema fetch failed: HTTP ${res.status} ${await res.text()}`);
  }
  const spec = await res.json();
  // PostgREST returns an OpenAPI doc; `definitions` is keyed by table name.
  return spec.definitions ?? {};
}

async function countAndSample(table) {
  const res = await fetch(`${base}/rest/v1/${encodeURIComponent(table)}?select=*&limit=2`, {
    headers: { ...headers, Prefer: 'count=exact' }
  });
  if (!res.ok) {
    return { count: null, sample: [], error: `HTTP ${res.status}` };
  }
  // Content-Range looks like "0-1/1234" — the total is after the slash.
  const range = res.headers.get('content-range') || '';
  const count = range.includes('/') ? Number(range.split('/')[1]) : null;
  const sample = await res.json();
  return { count, sample, error: null };
}

function describeColumns(def) {
  const props = def.properties ?? {};
  return Object.entries(props).map(([name, meta]) => {
    const type = meta.format || meta.type || '?';
    const pk = /primary key/i.test(meta.description || '') ? ' (pk)' : '';
    return `${name}: ${type}${pk}`;
  });
}

async function main() {
  console.log(`\nInspecting ${base}\n${'='.repeat(60)}`);
  const defs = await getSchema();
  const tables = Object.keys(defs).sort();
  if (tables.length === 0) {
    console.log('No tables visible in the public schema.');
    return;
  }
  console.log(`Found ${tables.length} table(s): ${tables.join(', ')}\n`);

  for (const table of tables) {
    const { count, sample, error } = await countAndSample(table);
    console.log(`\n### ${table}  ${error ? `[${error}]` : `(${count ?? '?'} rows)`}`);
    for (const col of describeColumns(defs[table])) console.log(`   - ${col}`);
    if (sample.length) {
      console.log('   sample:');
      console.log(
        sample
          .map((r) => '     ' + JSON.stringify(r))
          .join('\n')
      );
    }
  }
  console.log(`\n${'='.repeat(60)}\nDone.\n`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
