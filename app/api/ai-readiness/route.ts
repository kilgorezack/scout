import { NextResponse } from 'next/server';
import { scoreAIReadiness } from '@/lib/ai-readiness';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  let body: { url?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }
  if (typeof body.url !== 'string' || body.url.trim().length < 4) {
    return NextResponse.json({ error: 'Provide a URL.' }, { status: 400 });
  }
  const report = await scoreAIReadiness(body.url);
  return NextResponse.json(report);
}
