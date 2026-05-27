// src/pages/OnboardingPage.ts

import {
  getChatState,
  subscribeToChat,
  createNewConversation,
  sendMessage,
  clearPendingWidget,
} from "../store/chat.js";
import { ChatBubble } from "../components/chat/ChatBubble.js";
import { ChatInput } from "../components/chat/ChatInput.js";
import { TypingIndicator } from "../components/chat/TypingIndicator.js";
import { WidgetRenderer } from "../components/widgets/WidgetRenderer.js";
import { navigate } from "../router.js";

export function OnboardingPage(): HTMLElement {
  const page = document.createElement("div");
  page.className = "onboarding-container animate-fade-in";

  // Header copy
  const header = document.createElement("div");
  header.className = "onboarding-header";
  header.style.cssText = "padding: var(--space-6) 0 var(--space-4); text-align: center;";

  const heading = document.createElement("h2");
  heading.style.cssText = "font-size: var(--text-2xl);";
  heading.textContent = "Let's get to know you.";
  header.appendChild(heading);

  const sub = document.createElement("p");
  sub.style.cssText = "font-family: var(--font-mono); font-size: var(--text-sm); color: var(--color-text-secondary); margin-top: var(--space-2);";
  sub.textContent = "A few questions to get started.";
  header.appendChild(sub);

  page.appendChild(header);

  // Messages area
  const messagesEl = document.createElement("div");
  messagesEl.className = "chat-messages";
  messagesEl.setAttribute("aria-live", "polite");
  messagesEl.setAttribute("aria-label", "Conversation");
  page.appendChild(messagesEl);

  // Widget area
  const widgetArea = document.createElement("div");
  widgetArea.className = "chat-widget-area";
  page.appendChild(widgetArea);

  // Continue button (shown after 3 exchanges)
  const continueBtn = document.createElement("button");
  continueBtn.type = "button";
  continueBtn.className = "btn btn-secondary";
  continueBtn.textContent = "Continue to your space →";
  continueBtn.style.cssText = [
    "display: none",
    "margin: var(--space-4) auto",
    "width: fit-content",
  ].join("; ");
  continueBtn.setAttribute("aria-label", "Continue to chat");
  continueBtn.addEventListener("click", () => navigate("/chat"));
  page.appendChild(continueBtn);

  // Input bar
  const inputEl = ChatInput((text) => {
    sendMessage(text).catch(() => undefined);
  });
  page.appendChild(inputEl);

  let typingIndicatorEl: HTMLElement | null = null;
  let creationGuard = false;

  function renderMessages(): void {
    const { messages, isTyping, pendingWidget, activeConversationId, conversations } = getChatState();

    // Render messages
    const existingCount = messagesEl.querySelectorAll(".chat-bubble-wrapper").length;
    if (messages.length > existingCount) {
      // Append only new messages
      messages.slice(existingCount).forEach((msg) => {
        if (msg.role === "system") return;
        const bubble = ChatBubble(msg);
        messagesEl.appendChild(bubble);
      });
    } else if (messages.length === 0) {
      messagesEl.innerHTML = "";
    }

    // Typing indicator
    if (isTyping && !typingIndicatorEl) {
      typingIndicatorEl = TypingIndicator();
      messagesEl.appendChild(typingIndicatorEl);
    } else if (!isTyping && typingIndicatorEl) {
      typingIndicatorEl.remove();
      typingIndicatorEl = null;
    }

    // Widget
    widgetArea.innerHTML = "";
    if (pendingWidget) {
      const widgetEl = WidgetRenderer(pendingWidget, (val) => {
        clearPendingWidget();
        sendMessage("", val).catch(() => undefined);
      });
      widgetArea.appendChild(widgetEl);
    }

    // Auto-scroll
    requestAnimationFrame(() => {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });

    // Show continue button after 3 exchanges
    const activeConvo = conversations.find((c) => c.id === activeConversationId);
    if (activeConvo && activeConvo.turn_count >= 3) {
      continueBtn.style.display = "block";
    }
  }

  // Create first conversation on mount (guard against double-creation)
  const { activeConversationId } = getChatState();
  if (!activeConversationId && !creationGuard) {
    creationGuard = true;
    createNewConversation().catch(() => undefined);
  }

  const unsubscribeChat = subscribeToChat(() => renderMessages());
  renderMessages();

  const cleanups = [
    unsubscribeChat,
    () => { (inputEl as HTMLElement & { __cleanup?: () => void }).__cleanup?.(); },
  ];

  (page as HTMLElement & { __cleanup?: () => void }).__cleanup = () => {
    cleanups.forEach((fn) => fn());
  };

  return page;
}
