// Server-side Cloud Firestore cache for expensive Gemini ("AI") queries.
//
// This is a generic, best-effort read-through cache. It mirrors the
// graceful-degradation contract the rest of Scout relies on: when the
// service-account secret is absent (or anything goes wrong), reads return
// null and writes no-op, so endpoints simply fall back to running live —
// the app never breaks because the cache is missing.
//
// Required env (only for the cache to be active):
//   FIREBASE_SERVICE_ACCOUNT_KEY — the full service-account JSON (one line)
//     for the Firebase project. Generate it in the Firebase console under
//     Project settings → Service accounts → Generate new private key.
//
// Firestore writes need the Admin SDK + a service account, so this module
// must only be imported from `runtime = 'nodejs'` route handlers (never the
// edge runtime or client components).

import { createHash } from 'crypto';
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { FIREBASE_PROJECT_ID } from './firebase-config';

let db: Firestore | null | undefined; // undefined = not yet initialized

function parseServiceAccount(): Record<string, unknown> | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    // Allow base64-encoded JSON too — convenient for some env-var UIs.
    try {
      return JSON.parse(Buffer.from(raw, 'base64').toString('utf8')) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

const TAG = '[firestore-cache]';

/** Lazily initialize Firestore. Returns null when unconfigured/misconfigured. */
function getDb(): Firestore | null {
  if (db !== undefined) return db;

  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.warn(`${TAG} disabled: FIREBASE_SERVICE_ACCOUNT_KEY is not set — queries run live, nothing is cached.`);
    db = null;
    return null;
  }

  const serviceAccount = parseServiceAccount();
  if (!serviceAccount) {
    console.error(`${TAG} disabled: FIREBASE_SERVICE_ACCOUNT_KEY is set but is not valid JSON (or base64 JSON).`);
    db = null;
    return null;
  }

  try {
    const app: App = getApps().length
      ? getApps()[0]
      : initializeApp({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          credential: cert(serviceAccount as any),
          projectId: FIREBASE_PROJECT_ID
        });
    db = getFirestore(app);
    // Without this, a single `undefined` field value (e.g. an absent
    // own_company) makes the whole write throw — which would silently drop
    // one record while others succeed.
    try {
      db.settings({ ignoreUndefinedProperties: true });
    } catch {
      // settings() throws if called after first use; safe to ignore.
    }
    console.info(`${TAG} initialized for project "${FIREBASE_PROJECT_ID}".`);
    return db;
  } catch (e) {
    console.error(`${TAG} init failed:`, e instanceof Error ? e.message : e);
    db = null;
    return null;
  }
}

export function firestoreCacheConfigured(): boolean {
  return getDb() !== null;
}

/** Stable, filesystem/Firestore-safe document id derived from an arbitrary key. */
function docId(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Read a cached value. Returns null on miss, when the entry is older than
 * `ttlDays`, or when the cache is unconfigured/unavailable.
 */
export async function getCached<T>(
  collection: string,
  key: string,
  ttlDays: number
): Promise<T | null> {
  const firestore = getDb();
  if (!firestore) return null;
  try {
    const snap = await firestore.collection(collection).doc(docId(key)).get();
    if (!snap.exists) return null;
    const data = snap.data() as { value?: T; created_at?: string } | undefined;
    if (!data || data.value === undefined || !data.created_at) return null;
    const ageMs = Date.now() - new Date(data.created_at).getTime();
    if (Number.isNaN(ageMs) || ageMs > ttlDays * 24 * 60 * 60 * 1000) return null;
    return data.value;
  } catch (e) {
    console.warn(`${TAG} read failed on "${collection}":`, e instanceof Error ? e.message : e);
    return null;
  }
}

/**
 * Write a cached value. Fire-and-forget: never throws, so callers can await
 * it without guarding. `meta` is merged in for human-readable auditing in the
 * Firestore console (e.g. competitor name) — it is not used for lookups.
 */
export async function setCached<T>(
  collection: string,
  key: string,
  value: T,
  meta: Record<string, unknown> = {}
): Promise<void> {
  const firestore = getDb();
  if (!firestore) return;
  try {
    await firestore
      .collection(collection)
      .doc(docId(key))
      .set({ ...meta, cache_key: key, value, created_at: new Date().toISOString() });
    console.info(`${TAG} wrote to "${collection}" (${docId(key)}).`);
  } catch (e) {
    // best-effort — a failed cache write must never break the response
    console.error(`${TAG} write failed on "${collection}":`, e instanceof Error ? e.message : e);
  }
}
