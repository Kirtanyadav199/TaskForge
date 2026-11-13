"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AuthContext, type AuthContextType } from "./auth-context";
import { authApi, type LoginInput, type RegisterInput } from "@/lib/api/auth";
import {
  refreshAccessToken,
  onAccessTokenChange,
  getAccessToken,
  setAccessToken,
} from "@/lib/api/client";
import type { User } from "@/lib/types";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getAccessToken());
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(true);

  const refreshAuth = useCallback(async () => {
    try {
      const newToken = await refreshAccessToken();
      if (newToken) {
        const me = await authApi.getMe();
        setUser(me);
        setToken(newToken);
      } else {
        setUser(null);
        setToken(null);
      }
    } catch {
      setUser(null);
      setToken(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initBootstrap() {
      try {
        const bootstrapToken = await refreshAccessToken();
        if (bootstrapToken && isMounted) {
          const me = await authApi.getMe();
          if (isMounted) {
            setUser(me);
            setToken(bootstrapToken);
          }
        } else if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    }

    initBootstrap();

    const unsubscribe = onAccessTokenChange((latestToken) => {
      if (isMounted) {
        setToken(latestToken);
        if (!latestToken) {
          setUser(null);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (input: LoginInput): Promise<User> => {
    const res = await authApi.login(input);
    setUser(res.user);
    setToken(res.accessToken);
    return res.user;
  }, []);

  const register = useCallback(
    async (input: RegisterInput): Promise<User> => {
      await authApi.register(input);
      // Backend register returns no token, so login immediately with credentials
      const res = await authApi.login({
        email: input.email,
        password: input.password,
      });
      setUser(res.user);
      setToken(res.accessToken);
      return res.user;
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      setAccessToken(null);
    } finally {
      setUser(null);
      setToken(null);
      queryClient.clear();
      router.push("/login");
    }
  }, [queryClient, router]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      accessToken: token,
      isBootstrapping,
      login,
      register,
      logout,
      refreshAuth,
    }),
    [user, token, isBootstrapping, login, register, logout, refreshAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
