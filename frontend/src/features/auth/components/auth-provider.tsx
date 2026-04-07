"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ALoadSession, ALogin, ALogout } from "@/features/auth/actions";
import type {
  AuthUser,
  LoginActionResult,
  LogoutActionResult,
} from "@/features/auth/types";

export type { AuthUser };

type AuthContextValue = {
  user: AuthUser | null;
  isReady: boolean;
  login: (email: string, password: string) => Promise<LoginActionResult>;
  logout: () => Promise<LogoutActionResult>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const { user: next } = await ALoadSession();
        if (!cancelled) setUser(next);
      } finally {
        if (!cancelled) setIsReady(true);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await ALogin(email, password);
    if (result.ok) setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(async () => {
    const result = await ALogout();
    setUser(null);
    return result;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady,
      login,
      logout,
    }),
    [user, isReady, login, logout],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
