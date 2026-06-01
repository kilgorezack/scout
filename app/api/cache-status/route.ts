// Diagnostic: is the Firestore query cache actually wired up in THIS
// environment? Hit GET /api/cache-status to check without digging through
// logs. Reports config state only — never secrets.

import { NextResponse } from 'next/server';
import { firestoreCacheConfigured } from '@/lib/firestore-cache';
import { FIREBASE_PROJECT_ID } from '@/lib/firebase-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET() {
  const keyPresent = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  const configured = firestoreCacheConfigured();
  return NextResponse.json({
    cache: configured ? 'active' : 'disabled',
    serviceAccountKeyPresent: keyPresent,
    // present-but-not-configured almost always means the JSON failed to parse
    likelyIssue: keyPresent && !configured ? 'FIREBASE_SERVICE_ACCOUNT_KEY is set but did not parse/init — check it is the full service-account JSON' : null,
    project: FIREBASE_PROJECT_ID
  });
}
