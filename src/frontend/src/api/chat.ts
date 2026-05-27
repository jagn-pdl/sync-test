// src/api/chat.ts

import { apiFetch } from "./client.js";
import type { ChatRequest, ChatResponse, Message, ConversationSchema } from "../types/index.js";

export async function sendMessage(req: ChatRequest): Promise<ChatResponse> {
  return apiFetch<ChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function getHistory(conversationId: string): Promise<Message[]> {
  return apiFetch<Message[]>(`/chat/history/${conversationId}`);
}

export async function getConversations(): Promise<ConversationSchema[]> {
  return apiFetch<ConversationSchema[]>("/conversations");
}

export async function createConversation(): Promise<ConversationSchema> {
  return apiFetch<ConversationSchema>("/conversations", { method: "POST" });
}
