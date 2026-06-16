'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onIdTokenChanged, signOut, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

type AuthState = {
  user: User | null;
  loading: boolean;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  signOutUser: async () => {}
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fires on sign-in, sign-out, and ~hourly token refreshes. We mirror the
    // token into an HttpOnly session cookie the server/middleware can verify.
    return onIdTokenChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      try {
        if (u) {
          const idToken = await u.getIdToken();
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken })
          });
        } else {
          await fetch('/api/auth/session', { method: 'DELETE' });
        }
      } catch {
        // Network hiccup syncing the cookie — auth state still updates locally.
      }
    });
  }, []);

  async function signOutUser() {
    await signOut(auth); // triggers onIdTokenChanged(null) -> clears the cookie
  }

  return <AuthContext.Provider value={{ user, loading, signOutUser }}>{children}</AuthContext.Provider>;
}
