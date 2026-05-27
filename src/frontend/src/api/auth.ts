// src/api/auth.ts

import { apiFetch } from "./client.js";
import type { AuthTokens, User } from "../types/index.js";

export async function register(
  name: string,
  email: string,
  password: string
): Promise<AuthTokens> {
  return apiFetch<AuthTokens>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
    skipAuth: true,
  });
}

export async function login(email: string, password: string): Promise<AuthTokens> {
  return apiFetch<AuthTokens>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  });
}

export async function refresh(refreshToken: string): Promise<AuthTokens> {
  return apiFetch<AuthTokens>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
    skipAuth: true,
  });
}

export async function getMe(): Promise<User> {
  return apiFetch<User>("/users/me");
}

export async function updateTraits(traits: Record<string, unknown>): Promise<User> {
  return apiFetch<User>("/users/me/traits", {
    method: "PATCH",
    body: JSON.stringify(traits),
  });
}
