// src/store/chat.ts

import type { Message, ConversationSchema, UIWidget, LoadingState } from "../types/index.js";
import * as chatApi from "../api/chat.js";

interface ChatState {
  conversations: ConversationSchema[];
  activeConversationId: string | null;
  messages: Message[];
  pendingWidget: UIWidget | null;
  isTyping: boolean;
  loadingState: LoadingState;
  error: string | null;
}

const state: ChatState = {
  conversations: [],
  activeConversationId: null,
  messages: [],
  pendingWidget: null,
  isTyping: false,
  loadingState: "idle",
  error: null,
};

type ChatListener = (state: ChatState) => void;
const listeners: ChatListener[] = [];

function notify(): void {
  const snapshot = { ...state, conversations: [...state.conversations], messages: [...state.messages] };
  listeners.forEach((cb) => cb(snapshot));
}

export function getChatState(): ChatState {
  return {
    ...state,
    conversations: [...state.conversations],
    messages: [...state.messages],
  };
}

export function subscribeToChat(cb: ChatListener): () => void {
  listeners.push(cb);
  return () => {
    const idx = listeners.indexOf(cb);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

export async function loadConversations(): Promise<void> {
  state.loadingState = "loading";
  state.error = null;
  notify();
  try {
    const convos = await chatApi.getConversations();
    state.conversations = convos;
    state.loadingState = "success";
  } catch (err) {
    state.loadingState = "error";
    state.error = err instanceof Error ? err.message : "Failed to load conversations.";
  }
  notify();
}

export async function selectConversation(id: string): Promise<void> {
  state.activeConversationId = id;
  state.messages = [];
  state.pendingWidget = null;
  state.loadingState = "loading";
  state.error = null;
  notify();
  try {
    const messages = await chatApi.getHistory(id);
    state.messages = messages;
    state.loadingState = "success";
  } catch (err) {
    state.loadingState = "error";
    state.error = err instanceof Error ? err.message : "Failed to load messages.";
  }
  notify();
}

export async function createNewConversation(): Promise<void> {
  state.loadingState = "loading";
  state.error = null;
  notify();
  try {
    const convo = await chatApi.createConversation();
    state.conversations = [convo, ...state.conversations];
    state.activeConversationId = convo.id;
    state.messages = [];
    state.pendingWidget = null;
    state.loadingState = "success";
  } catch (err) {
    state.loadingState = "error";
    state.error = err instanceof Error ? err.message : "Failed to create conversation.";
  }
  notify();
}

export async function sendMessage(
  text: string,
  widgetResponse?: { field_key: string; value: unknown }
): Promise<void> {
  if (!state.activeConversationId) return;

  const userMessage: Message = {
    id: crypto.randomUUID(),
    role: "user",
    content: text,
    timestamp: new Date().toISOString(),
    ui_widget: null,
  };
  state.messages = [...state.messages, userMessage];
  state.isTyping = true;
  state.pendingWidget = null;
  state.error = null;
  notify();

  try {
    const response = await chatApi.sendMessage({
      message: text,
      conversation_id: state.activeConversationId,
      widget_response: widgetResponse ?? null,
    });

    state.messages = [...state.messages, response.message];
    state.pendingWidget = response.widget;

    // Update conversation title if it changed (first message sets title)
    if (response.conversation_id) {
      state.conversations = state.conversations.map((c) =>
        c.id === response.conversation_id
          ? { ...c, turn_count: c.turn_count + 1 }
          : c
      );
    }
  } catch (err) {
    state.error = err instanceof Error ? err.message : "Failed to send message.";
  }

  state.isTyping = false;
  notify();
}

export function clearPendingWidget(): void {
  state.pendingWidget = null;
  notify();
}
