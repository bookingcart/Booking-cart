'use client';

import { createContext, useCallback, useContext, useMemo } from 'react';
import { useSession, signOut as baSignOut, signIn as baSignIn } from '@/lib/auth-client';

interface AuthContextValue {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    role?: string | null;
  } | null;
  isAdmin: boolean;
  isPending: boolean;
  /** Returns headers with Authorization cookie session — kept for legacy API calls */
  authHeaders: () => Record<string, string>;
  signIn: typeof baSignIn;
  signOut: () => Promise<void>;
  /** @deprecated kept for legacy script compatibility */
  getGoogleIdToken: () => string;
  /** @deprecated noop — kept for legacy script compatibility */
  refresh: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();

  const user = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: (session.user as any).role ?? 'user',
      }
    : null;

  const isAdmin = user?.role === 'admin';

  const authHeaders = useCallback((): Record<string, string> => {
    return { 'Content-Type': 'application/json' };
  }, []);

  // Legacy shim — better-auth uses cookie-based sessions; no token to expose
  const getGoogleIdToken = useCallback(() => '', []);
  const refresh = useCallback(() => {}, []);

  const signOut = useCallback(async () => {
    await baSignOut();
    // Sync legacy localStorage keys so public/js scripts see the sign-out
    try {
      localStorage.removeItem('bookingcart_user');
      localStorage.removeItem('bookingcart_google_id_token');
      localStorage.removeItem('bc_user');
    } catch {}
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAdmin,
      isPending,
      authHeaders,
      signIn: baSignIn,
      signOut,
      getGoogleIdToken,
      refresh,
    }),
    [user, isAdmin, isPending, authHeaders, signOut, getGoogleIdToken, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
