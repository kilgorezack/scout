'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useAuth } from './AuthProvider';

export default function NavAuth() {
  const { user, loading, signOutUser } = useAuth();
  const router = useRouter();

  if (loading) {
    return <span className="h-7 w-7 animate-pulse rounded-full bg-ink-100" aria-hidden />;
  }

  if (!user) {
    return (
      <a
        href="/login"
        className="hidden whitespace-nowrap rounded-full px-3.5 py-1.5 text-ink-700 transition hover:text-ink-900 sm:inline-flex"
      >
        Sign in
      </a>
    );
  }

  async function handleSignOut() {
    await signOutUser();
    router.push('/');
  }

  const label = user.email ?? user.displayName ?? 'Account';

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-[160px] truncate text-xs text-ink-500 sm:inline" title={label}>
        {label}
      </span>
      <button
        type="button"
        onClick={handleSignOut}
        className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 px-3 py-1.5 text-[13px] text-ink-700 transition hover:border-ink-300 hover:text-ink-900"
      >
        <LogOut size={13} />
        <span className="hidden sm:inline">Sign out</span>
      </button>
    </div>
  );
}
