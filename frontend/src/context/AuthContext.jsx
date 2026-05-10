import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

const STORAGE_KEY = 'ttm_auth';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setToken(parsed.token || null);
        setUser(parsed.user || null);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  const persist = (payload) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setToken(payload.token);
    setUser(payload.user);
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const payload = { token: data.data.token, user: data.data.user };
    persist(payload);
    return data.data.user;
  };

  const signup = async (name, email, password) => {
    const { data } = await api.post('/auth/signup', { name, email, password });
    const payload = { token: data.data.token, user: data.data.user };
    persist(payload);
    return data.data.user;
  };

  const syncUser = (partial) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const merged = { ...parsed.user, ...partial };
      const nextPayload = { token: parsed.token, user: merged };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPayload));
      setUser(merged);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setToken(null);
      setUser(null);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore network errors — still clear locally */
    }
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      hydrated,
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === 'admin',
      login,
      signup,
      logout,
      syncUser,
    }),
    [hydrated, user, token]
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
