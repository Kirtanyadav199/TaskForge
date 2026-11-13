import { apiFetch, setAccessToken } from "./client";
import type { User } from "@/lib/types";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponseData {
  accessToken: string;
  user: User;
}

export const authApi = {
  async register(input: RegisterInput): Promise<User> {
    const res = await apiFetch<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return res.data;
  },

  async login(input: LoginInput): Promise<LoginResponseData> {
    const res = await apiFetch<LoginResponseData>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setAccessToken(res.data.accessToken);
    return res.data;
  },

  async getMe(): Promise<User> {
    const res = await apiFetch<User>("/auth/me");
    return res.data;
  },

  async logout(): Promise<void> {
    try {
      await apiFetch<void>("/auth/logout", {
        method: "POST",
      });
    } finally {
      setAccessToken(null);
    }
  },
};
