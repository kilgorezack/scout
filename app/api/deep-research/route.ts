import { NextResponse } from 'next/server';
import { streamDeepResearch, geminiConfigured, type DeepResearchInput } from '@/lib/gemini';
import { getSupabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const maxDuration = 60;

const CACHE_TTL_DAYS = 7;

function cacheKey(input: DeepResearchInput): string {
  return [
    input.competitorName.trim().toLowerCase(),
    (input.ownCompany ?? '').trim().toLowerCase(),
    [...input.zips].sort().join(','),
    (input.websiteUrl ?? '').trim().toLowerCase()
  ].join('|');
}

async function readCached(key: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from('competitor_research')
    .select('briefing, created_at')
    .eq('cache_key', key)
    .maybeSingle();
  if (!data) return null;
  const ageMs = Date.now() - new Date(data.created_at).getTime();
  if (ageMs > CACHE_TTL_DAYS * 24 * 60 * 60 * 1000) return null;
  return data.briefing as string;
}

async function writeCached(key: string, briefing: string, input: DeepResearchInput): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase
    .from('competitor_research')
    .upsert({
      cache_key: key,
      competitor_name: input.competitorName,
      own_company: input.ownCompany,
      zips: input.zips,
      briefing,
      created_at: new Date().toISOString()
    })
    .then(() => undefined, () => undefined);
}

export async function POST(req: Request) {
  let body: Partial<DeepResearchInput>;
  try {
    body = (await req.json()) as Partial<DeepResearchInput>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.competitorName || typeof body.competitorName !== 'string') {
    return NextResponse.json({ error: 'competitorName is required' }, { status: 400 });
  }
  if (!Array.isArray(body.zips)) body.zips = [];

  if (!geminiConfigured()) {
    return new Response(
      'Deep research is not configured. Set GEMINI_API_KEY in Vercel env vars and redeploy.',
      { status: 503, headers: { 'Content-Type': 'text/plain' } }
    );
  }

  const input = body as DeepResearchInput;
  const key = cacheKey(input);

  // Serve from cache as a single SSE chunk.
  const cached = await readCached(key);
  if (cached) {
    return new Response(
      new ReadableStream<Uint8Array>({
        start(controller) {
          const enc = new TextEncoder();
          controller.enqueue(enc.encode(`event: cached\ndata: ${JSON.stringify({ cached: true })}\n\n`));
          for (const line of cached.split(/\r?\n/)) {
            controller.enqueue(enc.encode(`data: ${JSON.stringify({ text: line + '\n' })}\n\n`));
          }
          controller.enqueue(enc.encode(`event: done\ndata: ${JSON.stringify({ ok: true })}\n\n`));
          controller.close();
        }
      }),
      { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } }
    );
  }

  // Live stream from Gemini, accumulating to cache on completion.
  const enc = new TextEncoder();
  let accumulated = '';

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(enc.encode(`event: start\ndata: ${JSON.stringify({ ok: true })}\n\n`));
      try {
        for await (const chunk of streamDeepResearch(input)) {
          accumulated += chunk;
          controller.enqueue(enc.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
        }
        controller.enqueue(enc.encode(`event: done\ndata: ${JSON.stringify({ ok: true })}\n\n`));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        controller.enqueue(enc.encode(`event: error\ndata: ${JSON.stringify({ error: msg })}\n\n`));
      } finally {
        controller.close();
        if (accumulated.trim().length > 0) {
          writeCached(key, accumulated, input).catch(() => {});
        }
      }
    }
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
  });
}
