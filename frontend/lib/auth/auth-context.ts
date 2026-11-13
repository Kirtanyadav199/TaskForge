"use client";

import { createContext, useContext } from "react";
import type { User } from "@/lib/types";
import type { LoginInput, RegisterInput } from "@/lib/api/auth";

export interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isBootstrapping: boolean;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
