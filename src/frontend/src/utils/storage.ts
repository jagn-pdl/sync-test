// src/utils/storage.ts — localStorage wrapper

const KEYS = {
  ACCESS_TOKEN: "pa_access_token",
  REFRESH_TOKEN: "pa_refresh_token",
  USER_ID: "pa_user_id",
} as const;

export function getAccessToken(): string | null {
  return localStorage.getItem(KEYS.ACCESS_TOKEN);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(KEYS.ACCESS_TOKEN, token);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(KEYS.REFRESH_TOKEN);
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(KEYS.REFRESH_TOKEN, token);
}

export function clearTokens(): void {
  localStorage.removeItem(KEYS.ACCESS_TOKEN);
  localStorage.removeItem(KEYS.REFRESH_TOKEN);
  localStorage.removeItem(KEYS.USER_ID);
}

export function getUserId(): string | null {
  return localStorage.getItem(KEYS.USER_ID);
}

export function setUserId(id: string): void {
  localStorage.setItem(KEYS.USER_ID, id);
}
