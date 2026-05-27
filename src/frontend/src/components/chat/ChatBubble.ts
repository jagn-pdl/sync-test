// src/components/chat/ChatBubble.ts

import type { Message } from "../../types/index.js";
import { formatTimestamp } from "../../utils/format.js";

export function ChatBubble(message: Message): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = `chat-bubble-wrapper chat-bubble-wrapper--${message.role}`;

  if (message.role === "user") {
    wrapper.classList.add("animate-slide-in-right");
  } else if (message.role === "assistant") {
    wrapper.classList.add("animate-slide-in-left");
  }

  const bubble = document.createElement("div");
  bubble.className = `chat-bubble chat-bubble--${message.role}`;
  bubble.setAttribute("role", "article");
  bubble.setAttribute(
    "aria-label",
    `${message.role === "user" ? "Your" : "Assistant"} message`
  );

  const content = document.createElement("p");
  content.className = "chat-bubble__content";
  content.textContent = message.content;
  bubble.appendChild(content);

  wrapper.appendChild(bubble);

  const timestamp = document.createElement("time");
  timestamp.className = "chat-bubble__timestamp";
  timestamp.dateTime = message.timestamp;
  timestamp.textContent = formatTimestamp(message.timestamp);
  wrapper.appendChild(timestamp);

  return wrapper;
}
