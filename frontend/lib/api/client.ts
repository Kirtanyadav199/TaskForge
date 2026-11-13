import type { ApiResponse } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api`
  : "http://localhost:5000/api";

export class ApiError extends Error {
  public status: number;
  public data?: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// In-memory token storage (never localStorage / sessionStorage)
let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

type AuthChangeListener = (token: string | null) => void;
const listeners = new Set<AuthChangeListener>();

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  listeners.forEach((listener) => listener(token));
}

export function onAccessTokenChange(listener: AuthChangeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Single-flight refresh: keeps one module-level promise so concurrent requests
 * or React StrictMode duplicate calls await the same refresh operation without
 * burning rotated refresh tokens.
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!res.ok) {
        setAccessToken(null);
        return null;
      }

      const json = await res.json();
      if (json.success && json.data?.accessToken) {
        const token = json.data.accessToken as string;
        setAccessToken(token);
        return token;
      }

      setAccessToken(null);
      return null;
    } catch {
      setAccessToken(null);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

const AUTH_BYPASS_REFRESH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
];

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: "include",
  };

  const response = await fetch(url, fetchOptions);

  // If 401 on standard authenticated routes, perform one single-flight refresh and retry
  const isAuthBypass = AUTH_BYPASS_REFRESH_PATHS.some((path) =>
    url.includes(path)
  );

  if (response.status === 401 && !isAuthBypass) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retryHeaders = new Headers(options.headers || {});
      if (!retryHeaders.has("Content-Type") && !(options.body instanceof FormData)) {
        retryHeaders.set("Content-Type", "application/json");
      }
      retryHeaders.set("Authorization", `Bearer ${newToken}`);

      const retryResponse = await fetch(url, {
        ...options,
        headers: retryHeaders,
        credentials: "include",
      });

      if (!retryResponse.ok) {
        let errMessage = "Request failed";
        let errData: unknown;
        try {
          const errJson = await retryResponse.json();
          errMessage = errJson.message || errMessage;
          errData = errJson;
        } catch {
          // ignore json parse error
        }
        throw new ApiError(retryResponse.status, errMessage, errData);
      }

      return (await retryResponse.json()) as ApiResponse<T>;
    } else {
      // Refresh failed: clear state and redirect to login
      setAccessToken(null);
      if (typeof window !== "undefined") {
        const next = encodeURIComponent(
          window.location.pathname + window.location.search
        );
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = `/login?next=${next}`;
      }
      throw new ApiError(401, "Session expired");
    }
  }

  if (!response.ok) {
    let errMessage = response.statusText || "Request failed";
    let errData: unknown;
    try {
      const errJson = await response.json();
      errMessage = errJson.message || errMessage;
      errData = errJson;
    } catch {
      // ignore json parse error
    }
    throw new ApiError(response.status, errMessage, errData);
  }

  return (await response.json()) as ApiResponse<T>;
}
