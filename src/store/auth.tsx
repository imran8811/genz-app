import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '@/api/auth';
import { STORAGE_KEYS } from '@/config';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean; // initial hydration from storage
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    password_confirmation: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate from storage on boot.
  useEffect(() => {
    (async () => {
      try {
        const [t, u] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.token),
          AsyncStorage.getItem(STORAGE_KEYS.user),
        ]);
        if (t) setToken(t);
        if (u) setUser(JSON.parse(u) as User);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function persist(t: string, u: User) {
    setToken(t);
    setUser(u);
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.token, t],
      [STORAGE_KEYS.user, JSON.stringify(u)],
    ]);
  }

  async function clear() {
    setToken(null);
    setUser(null);
    await AsyncStorage.multiRemove([STORAGE_KEYS.token, STORAGE_KEYS.user]);
  }

  const value = useMemo<AuthState>(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: !!token,
      login: async (email, password) => {
        const res = await authApi.login(email, password);
        await persist(res.token, res.user);
      },
      register: async (input) => {
        const res = await authApi.register(input);
        await persist(res.token, res.user);
      },
      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          /* best-effort; clear locally regardless */
        }
        await clear();
      },
    }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
