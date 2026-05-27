// src/api/profile.ts

import { apiFetch } from "./client.js";

export interface ProfileResponse {
  user_id: string;
  compacted_summary: string;
  traits: Record<string, unknown>;
  conversation_count: number;
}

export async function getProfile(): Promise<ProfileResponse> {
  return apiFetch<ProfileResponse>("/profile");
}

export async function triggerCompaction(): Promise<ProfileResponse> {
  return apiFetch<ProfileResponse>("/profile/compact", { method: "POST" });
}
