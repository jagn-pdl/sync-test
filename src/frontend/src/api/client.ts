// src/api/client.ts — base fetch wrapper

import type { ApiError } from "../types/index.js";
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  clearTokens,
} from "../utils/storage.js";

let isRefreshing = false;

async function refreshTokens(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json() as { access_token: string; refresh_token?: string };
    setAccessToken(data.access_token);
    if (data.refresh_token) setRefreshToken(data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
  const { skipAuth = false, ...init } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `/api${path}`;
  let res = await fetch(url, { ...init, headers });

  if (res.status === 401 && !skipAuth && !isRefreshing) {
    isRefreshing = true;
    const refreshed = await refreshTokens();
    isRefreshing = false;

    if (refreshed) {
      const newToken = getAccessToken();
      if (newToken) headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(url, { ...init, headers });
    } else {
      clearTokens();
      window.location.hash = "#/login";
      throw new Error("Session expired. Please log in again.");
    }
  }

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const errBody = await res.json() as ApiError;
      detail = errBody.detail ?? detail;
    } catch {
      // use default detail
    }
    throw new Error(detail);
  }

  return res.json() as Promise<T>;
}
