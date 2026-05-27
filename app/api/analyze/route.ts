import { NextResponse } from 'next/server';
import { isValidZip } from '@/lib/utils';
import { buildSlug, persistReportInput } from '@/lib/report';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  let body: { zips?: unknown; companyName?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const rawZips = Array.isArray(body.zips) ? (body.zips as unknown[]) : [];
  const zips = Array.from(
    new Set(rawZips.filter((z): z is string => typeof z === 'string' && isValidZip(z)))
  );
  if (zips.length === 0) {
    return NextResponse.json({ error: 'At least one valid 5-digit ZIP is required.' }, { status: 400 });
  }
  const companyName = typeof body.companyName === 'string' && body.companyName.trim() ? body.companyName.trim() : null;

  const slug = buildSlug(zips, companyName);
  // Best-effort persistence; never blocks the response.
  await persistReportInput({ slug, zips, companyName, createdAt: new Date().toISOString() }).catch(() => {});

  return NextResponse.json({ slug });
}
