// Isomorphic slug encoding — usable in both the browser (so the analyze
// form can navigate to the report page instantly without waiting for an
// API round-trip) and Node (so the report server component can decode it).

function b64encode(str: string): string {
  if (typeof window !== 'undefined') {
    // browser: btoa needs Latin-1; encode UTF-8 first.
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin);
  }
  return Buffer.from(str, 'utf8').toString('base64');
}

function b64decode(s: string): string {
  if (typeof window !== 'undefined') {
    const bin = atob(s);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(s, 'base64').toString('utf8');
}

function urlSafe(s: string): string {
  return s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function unUrlSafe(s: string): string {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return s.replace(/-/g, '+').replace(/_/g, '/') + pad;
}

export function buildSlug(zips: string[], companyName: string | null): string {
  const payload = JSON.stringify({ z: zips, c: companyName, t: Date.now() });
  return urlSafe(b64encode(payload));
}

export type DecodedSlug = { zips: string[]; companyName: string | null; createdAt: string };

export function decodeSlug(slug: string): DecodedSlug | null {
  try {
    const raw = b64decode(unUrlSafe(slug));
    const parsed = JSON.parse(raw) as { z?: unknown; c?: unknown; t?: unknown };
    const zips = Array.isArray(parsed.z) ? parsed.z.filter((x): x is string => typeof x === 'string') : [];
    if (zips.length === 0) return null;
    const companyName = typeof parsed.c === 'string' ? parsed.c : null;
    const createdAt = typeof parsed.t === 'number' ? new Date(parsed.t).toISOString() : new Date().toISOString();
    return { zips, companyName, createdAt };
  } catch {
    return null;
  }
}
