import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const STORAGE_USER = 'bookingcart_user';
const STORAGE_TOKEN = 'bookingcart_google_id_token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const getGoogleIdToken = useCallback(() => {
    try {
      return localStorage.getItem(STORAGE_TOKEN) || '';
    } catch {
      return '';
    }
  }, [tick]);

  const authHeaders = useCallback(() => {
    const t = getGoogleIdToken();
    const h = { 'Content-Type': 'application/json' };
    if (t) h.Authorization = `Bearer ${t}`;
    return h;
  }, [getGoogleIdToken]);

  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem(STORAGE_USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [tick]);

  const value = useMemo(
    () => ({
      getGoogleIdToken,
      authHeaders,
      user,
      refresh
    }),
    [getGoogleIdToken, authHeaders, user, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
