// src/components/chat/ChatInput.ts

import { getChatState, subscribeToChat } from "../../store/chat.js";

export function ChatInput(onSend: (text: string) => void): HTMLElement {
  const bar = document.createElement("div");
  bar.className = "chat-input-bar";

  const textarea = document.createElement("textarea");
  textarea.className = "chat-input";
  textarea.placeholder = "Say something…";
  textarea.rows = 1;
  textarea.setAttribute("aria-label", "Message input");
  textarea.setAttribute("autocomplete", "off");

  const sendBtn = document.createElement("button");
  sendBtn.type = "button";
  sendBtn.className = "chat-send-btn btn btn-primary";
  sendBtn.setAttribute("aria-label", "Send message");
  sendBtn.textContent = "Send";

  function autoResize(): void {
    textarea.style.height = "auto";
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight, 10) || 20;
    const maxHeight = lineHeight * 5;
    textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + "px";
  }

  function syncDisabled(): void {
    const { isTyping } = getChatState();
    textarea.disabled = isTyping;
    sendBtn.disabled = isTyping;
  }

  function handleSend(): void {
    const text = textarea.value.trim();
    if (!text) return;
    textarea.value = "";
    autoResize();
    onSend(text);
  }

  textarea.addEventListener("input", autoResize);

  textarea.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  sendBtn.addEventListener("click", handleSend);

  syncDisabled();
  const unsubscribe = subscribeToChat(() => syncDisabled());

  bar.appendChild(textarea);
  bar.appendChild(sendBtn);

  (bar as HTMLElement & { __cleanup?: () => void }).__cleanup = unsubscribe;

  return bar;
}
