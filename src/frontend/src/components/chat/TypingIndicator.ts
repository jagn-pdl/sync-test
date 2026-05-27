// src/components/chat/TypingIndicator.ts

export function TypingIndicator(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "chat-bubble-wrapper chat-bubble-wrapper--assistant animate-slide-in-left";
  wrapper.setAttribute("aria-live", "polite");
  wrapper.setAttribute("aria-label", "Assistant is typing");

  const indicator = document.createElement("div");
  indicator.className = "typing-indicator";

  for (let i = 0; i < 3; i++) {
    const dot = document.createElement("span");
    dot.className = "typing-indicator__dot";
    indicator.appendChild(dot);
  }

  wrapper.appendChild(indicator);
  return wrapper;
}
