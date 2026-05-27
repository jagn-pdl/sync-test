// src/types/index.ts — PersonalAssistant shared contracts

export interface User {
  id: string;           // UUID
  email: string;
  name: string;
  created_at: string;   // ISO8601
  profile_compacted_at: string | null;
}

export interface UserProfile {
  user_id: string;
  traits: {
    age: number | null;
    height_cm: number | null;
    weight_kg: number | null;
    lifestyle: string | null;
    goals: string[];
    domains_of_concern: string[];
    [key: string]: unknown;
  };
  compacted_summary: string;
  conversation_count: number;
  last_updated: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  ui_widget: UIWidget | null;
}

export type UIWidgetType =
  | "slider"
  | "radio_group"
  | "checkbox_group"
  | "date_picker"
  | "scale_rating"
  | "text_input"
  | "number_input"
  | "multi_select"
  | "confirm";

export interface UIWidget {
  widget_id: string;
  type: UIWidgetType;
  label: string;
  description: string | null;
  options: string[] | null;
  min: number | null;
  max: number | null;
  step: number | null;
  unit: string | null;
  required: boolean;
  field_key: string;
}

export interface ChatRequest {
  message: string;
  conversation_id: string;
  widget_response: { field_key: string; value: unknown } | null;
}

export interface ChatResponse {
  message: Message;
  widget: UIWidget | null;
  conversation_id: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
}

export interface ConversationSchema {
  id: string;
  title: string | null;
  created_at: string;
  turn_count: number;
}

export interface ApiError {
  detail: string;
}

export type LoadingState = "idle" | "loading" | "success" | "error";
