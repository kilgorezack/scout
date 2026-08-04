/**
 * Shared site password — the outer gate.
 *
 * This sits in front of everything, including the Firebase sign-in page: a
 * visitor must enter the one shared password before any page will load. It is
 * deliberately separate from `lib/auth-verify.ts`, which handles per-user
 * accounts once they are inside.
 *
 * Runs in middleware (Edge) as well as in route handlers, so it is built on
 * Web Crypto only — no `node:crypto`. The cookie is a signed, self-describing
 * token (`<expiry>.<hmac>`), so nothing is stored server-side and the gate
 * works across any number of serverless instances.
 */

export const GATE_COOKIE = 'scout_gate';

/** How long one successful password entry keeps the site unlocked. */
export const GATE_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

const encoder = new TextEncoder();

function sitePassword(): string {
  return process.env.SITE_PASSWORD?.trim() ?? '';
}

/** With no password configured the gate stays shut — it never falls open. */
export function isPasswordConfigured(): boolean {
  return sitePassword().length > 0;
}

function gateSecret(): string {
  // Defaulting to the password means rotating it locks everyone out again.
  return process.env.SITE_SESSION_SECRET?.trim() || sitePassword();
}

function base64url(buffer: ArrayBuffer): string {
  let binary = '';
  for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmac(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return base64url(await crypto.subtle.sign('HMAC', key, encoder.encode(message)));
}

async function sha256(value: string): Promise<string> {
  return base64url(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
}

/** Constant-time compare. Callers pass fixed-length digests/signatures. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function isCorrectPassword(candidate: unknown): Promise<boolean> {
  if (!isPasswordConfigured() || typeof candidate !== 'string') return false;
  // Hash both sides first so the comparison is over equal-length values no
  // matter how long the submitted string is.
  const [submitted, expected] = await Promise.all([sha256(candidate), sha256(sitePassword())]);
  return safeEqual(submitted, expected);
}

export async function createGateToken(nowMs: number = Date.now()): Promise<string> {
  const expiresAt = Math.floor(nowMs / 1000) + GATE_TTL_SECONDS;
  const payload = String(expiresAt);
  return `${payload}.${await hmac(payload, gateSecret())}`;
}

export async function isGateOpen(
  token: string | undefined,
  nowMs: number = Date.now()
): Promise<boolean> {
  if (!token || !isPasswordConfigured()) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;
  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || expiresAt * 1000 <= nowMs) return false;
  return safeEqual(signature, await hmac(payload, gateSecret()));
}

/**
 * Sanitise a post-unlock redirect target so `?next=` can't bounce a visitor to
 * another origin. Only same-origin absolute paths survive.
 */
export function safeRedirectPath(value: unknown, fallback = '/'): string {
  if (typeof value !== 'string') return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
  if (value === '/unlock' || value.startsWith('/unlock?')) return fallback;
  return value;
}
