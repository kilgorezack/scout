'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  onIdTokenChanged
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

function safeNext(): string {
  if (typeof window === 'undefined') return '/analyze';
  const p = new URLSearchParams(window.location.search).get('next');
  // Only allow same-site relative paths.
  if (p && p.startsWith('/') && !p.startsWith('//')) return p;
  return '/analyze';
}

// Turn Firebase's error codes into plain language.
function friendly(code: string): string {
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found'))
    return 'Email or password is incorrect.';
  if (code.includes('email-already-in-use')) return 'An account with that email already exists — try signing in.';
  if (code.includes('weak-password')) return 'Password should be at least 6 characters.';
  if (code.includes('invalid-email')) return 'That doesn’t look like a valid email address.';
  if (code.includes('popup-closed')) return 'Sign-in window closed before finishing.';
  if (code.includes('popup-blocked')) return 'Your browser blocked the sign-in popup.';
  return 'Something went wrong. Please try again.';
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If the user is already signed in (or finishes signing in), make sure the
  // session cookie is set before navigating to the protected destination.
  useEffect(() => {
    return onIdTokenChanged(auth, async (u) => {
      if (!u) return;
      try {
        const idToken = await u.getIdToken();
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken })
        });
      } catch {
        /* AuthProvider will retry the cookie sync */
      }
      router.replace(safeNext());
    });
  }, [router]);

  async function withEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'signup') await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
      // onIdTokenChanged handles the cookie + redirect.
    } catch (err) {
      setError(friendly(err instanceof Error && 'code' in err ? String((err as { code: string }).code) : ''));
      setBusy(false);
    }
  }

  async function withGoogle() {
    setBusy(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(friendly(err instanceof Error && 'code' in err ? String((err as { code: string }).code) : ''));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <div className="panel p-8">
        <p className="eyebrow">{mode === 'signup' ? 'Create your account' : 'Welcome back'}</p>
        <h1 className="display mt-2 text-3xl text-ink-900">
          {mode === 'signup' ? 'Sign up for Scout' : 'Sign in to Scout'}
        </h1>
        <p className="mt-2 text-sm text-ink-500">An account is required to run analyses and view reports.</p>

        <button
          type="button"
          onClick={withGoogle}
          disabled={busy}
          className="btn-ghost mt-6 w-full justify-center disabled:opacity-50"
        >
          <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.5 2.5 30.1 0 24 0 14.6 0 6.4 5.4 2.6 13.2l7.8 6.1C12.2 13.5 17.6 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.1 5.4-4.6 7l7.1 5.5c4.2-3.9 6.6-9.6 6.6-17z" />
            <path fill="#FBBC05" d="M10.4 28.3c-.5-1.4-.8-2.9-.8-4.3s.3-3 .8-4.3l-7.8-6.1C1 16.7 0 20.2 0 24s1 7.3 2.6 10.4l7.8-6.1z" />
            <path fill="#34A853" d="M24 48c6.1 0 11.3-2 15-5.5l-7.1-5.5c-2 1.4-4.6 2.2-7.9 2.2-6.4 0-11.8-4-13.6-9.8l-7.8 6.1C6.4 42.6 14.6 48 24 48z" />
          </svg>
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-ink-400">
          <span className="h-px flex-1 bg-ink-100" /> or <span className="h-px flex-1 bg-ink-100" />
        </div>

        <form onSubmit={withEmail} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-accent-400 focus:outline-none"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-accent-400 focus:outline-none"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full justify-center disabled:opacity-50">
            {busy && <Loader2 size={15} className="animate-spin" />}
            {mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
            setError(null);
          }}
          className="mt-4 w-full text-center text-xs text-ink-500 transition hover:text-ink-800"
        >
          {mode === 'signin' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
