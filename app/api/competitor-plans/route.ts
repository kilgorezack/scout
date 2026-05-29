import { NextResponse } from 'next/server';
import { researchCompetitorPlans, plansConfigured, type PlansInput } from '@/lib/competitor-plans';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  let body: Partial<PlansInput>;
  try {
    body = (await req.json()) as Partial<PlansInput>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.providerName || typeof body.providerName !== 'string') {
    return NextResponse.json({ error: 'providerName is required' }, { status: 400 });
  }
  if (!plansConfigured()) {
    return NextResponse.json(
      { error: 'Plan research is not configured. Set GEMINI_API_KEY and redeploy.' },
      { status: 503 }
    );
  }

  try {
    const plans = await researchCompetitorPlans({
      providerName: body.providerName,
      technologies: Array.isArray(body.technologies) ? body.technologies : undefined,
      zips: Array.isArray(body.zips) ? body.zips : undefined
    });
    return NextResponse.json(plans);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Plan research failed' },
      { status: 500 }
    );
  }
}
