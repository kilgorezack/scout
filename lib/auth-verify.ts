// Server-side verification of a Firebase ID token. Uses Google's public token
// certificates via jose, so it needs NO service-account secret and runs in
// both the Edge (middleware) and Node (API route) runtimes.
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { FIREBASE_PROJECT_ID } from './firebase-config';

export const SESSION_COOKIE = '__session';

// Firebase publishes the public keys used to sign ID tokens here. jose caches
// the key set and honours its cache headers, so this is fetched rarely.
const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

export type SessionClaims = {
  uid: string;
  email?: string;
  name?: string;
};

export async function verifyIdToken(token: string | undefined | null): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID
    });
    if (typeof payload.sub !== 'string' || !payload.sub) return null;
    return {
      uid: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      name: typeof payload.name === 'string' ? payload.name : undefined
    };
  } catch {
    return null;
  }
}
