// src/store/auth.ts

import type { User, LoadingState } from "../types/index.js";
import * as authApi from "../api/auth.js";
import {
  getAccessToken,
  setAccessToken,
  setRefreshToken,
  setUserId,
  clearTokens,
} from "../utils/storage.js";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loadingState: LoadingState;
  error: string | null;
}

const state: AuthState = {
  user: null,
  isAuthenticated: false,
  loadingState: "idle",
  error: null,
};

type AuthListener = (state: AuthState) => void;
const listeners: AuthListener[] = [];

function notify(): void {
  const snapshot = { ...state };
  listeners.forEach((cb) => cb(snapshot));
}

export function getAuthState(): AuthState {
  return { ...state };
}

export function subscribeToAuth(cb: AuthListener): () => void {
  listeners.push(cb);
  return () => {
    const idx = listeners.indexOf(cb);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

export async function initAuth(): Promise<void> {
  const token = getAccessToken();
  if (!token) {
    state.loadingState = "idle";
    notify();
    return;
  }
  state.loadingState = "loading";
  notify();
  try {
    const user = await authApi.getMe();
    state.user = user;
    state.isAuthenticated = true;
    state.loadingState = "success";
    state.error = null;
  } catch {
    clearTokens();
    state.user = null;
    state.isAuthenticated = false;
    state.loadingState = "error";
    state.error = "Session expired.";
  }
  notify();
}

export async function loginUser(email: string, password: string): Promise<void> {
  state.loadingState = "loading";
  state.error = null;
  notify();
  try {
    const tokens = await authApi.login(email, password);
    setAccessToken(tokens.access_token);
    const user = await authApi.getMe();
    setUserId(user.id);
    state.user = user;
    state.isAuthenticated = true;
    state.loadingState = "success";
    state.error = null;
  } catch (err) {
    state.loadingState = "error";
    state.error = err instanceof Error ? err.message : "Login failed.";
  }
  notify();
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<void> {
  state.loadingState = "loading";
  state.error = null;
  notify();
  try {
    const tokens = await authApi.register(name, email, password);
    setAccessToken(tokens.access_token);
    const user = await authApi.getMe();
    setUserId(user.id);
    state.user = user;
    state.isAuthenticated = true;
    state.loadingState = "success";
    state.error = null;
  } catch (err) {
    state.loadingState = "error";
    state.error = err instanceof Error ? err.message : "Registration failed.";
  }
  notify();
}

export function logoutUser(): void {
  clearTokens();
  state.user = null;
  state.isAuthenticated = false;
  state.loadingState = "idle";
  state.error = null;
  notify();
}
