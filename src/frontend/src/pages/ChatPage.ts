// src/pages/ChatPage.ts

import {
  getChatState,
  subscribeToChat,
  loadConversations,
  createNewConversation,
  sendMessage,
  clearPendingWidget,
} from "../store/chat.js";
import { Header } from "../components/layout/Header.js";
import { Sidebar } from "../components/layout/Sidebar.js";
import { ChatBubble } from "../components/chat/ChatBubble.js";
import { ChatInput } from "../components/chat/ChatInput.js";
import { TypingIndicator } from "../components/chat/TypingIndicator.js";
import { WidgetRenderer } from "../components/widgets/WidgetRenderer.js";

export function ChatPage(): HTMLElement {
  const shell = document.createElement("div");
  shell.className = "app-shell";

  // Sidebar
  const sidebarEl = Sidebar();
  shell.appendChild(sidebarEl);

  // Main content
  const main = document.createElement("div");
  main.className = "main-content";
  shell.appendChild(main);

  // Header
  const headerEl = Header();
  main.appendChild(headerEl);

  // Chat container
  const chatContainer = document.createElement("div");
  chatContainer.className = "chat-container";
  main.appendChild(chatContainer);

  // Messages
  const messagesEl = document.createElement("div");
  messagesEl.className = "chat-messages";
  messagesEl.setAttribute("aria-live", "polite");
  messagesEl.setAttribute("aria-label", "Conversation messages");
  chatContainer.appendChild(messagesEl);

  // Widget area
  const widgetArea = document.createElement("div");
  widgetArea.className = "chat-widget-area";
  chatContainer.appendChild(widgetArea);

  // Input bar
  const inputEl = ChatInput((text) => {
    sendMessage(text).catch(() => undefined);
  });
  chatContainer.appendChild(inputEl);

  let typingIndicatorEl: HTMLElement | null = null;
  let renderedMessageCount = 0;

  function renderMessages(): void {
    const { messages, isTyping, pendingWidget, loadingState, error } = getChatState();

    // Empty state
    if (messages.length === 0 && !isTyping && loadingState !== "loading") {
      if (messagesEl.querySelector(".empty-state")) return;
      messagesEl.innerHTML = "";
      renderedMessageCount = 0;

      const empty = document.createElement("div");
      empty.className = "empty-state";
      const emptyTitle = document.createElement("p");
      emptyTitle.className = "empty-state__title";
      emptyTitle.textContent = "Ask anything. This is your space.";
      empty.appendChild(emptyTitle);
      messagesEl.appendChild(empty);
      return;
    }

    // Clear empty state if messages arrive
    const emptyState = messagesEl.querySelector(".empty-state");
    if (emptyState && messages.length > 0) {
      emptyState.remove();
      renderedMessageCount = 0;
    }

    // Error state
    if (error) {
      const existing = messagesEl.querySelector(".chat-error");
      if (!existing) {
        const errEl = document.createElement("p");
        errEl.className = "error-message chat-error";
        errEl.setAttribute("role", "alert");
        errEl.textContent = error;
        messagesEl.appendChild(errEl);
      }
    }

    // Append only new messages
    if (messages.length > renderedMessageCount) {
      messages.slice(renderedMessageCount).forEach((msg) => {
        if (msg.role === "system") return;
        // Remove error banner if present before a new message
        messagesEl.querySelector(".chat-error")?.remove();
        const bubble = ChatBubble(msg);
        messagesEl.appendChild(bubble);
        renderedMessageCount++;
      });
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
  }

  // On mount: load conversations, create one if none exist
  async function init(): Promise<void> {
    await loadConversations();
    const { conversations, activeConversationId } = getChatState();
    if (conversations.length === 0) {
      await createNewConversation();
    } else if (!activeConversationId) {
      // Select most recent
      const { selectConversation } = await import("../store/chat.js");
      await selectConversation(conversations[0].id);
    }
  }

  init().catch(() => undefined);

  const unsubscribeChat = subscribeToChat(() => {
    renderMessages();
  });

  renderMessages();

  const cleanups = [
    unsubscribeChat,
    () => { (sidebarEl as HTMLElement & { __cleanup?: () => void }).__cleanup?.(); },
    () => { (headerEl as HTMLElement & { __cleanup?: () => void }).__cleanup?.(); },
    () => { (inputEl as HTMLElement & { __cleanup?: () => void }).__cleanup?.(); },
  ];

  (shell as HTMLElement & { __cleanup?: () => void }).__cleanup = () => {
    cleanups.forEach((fn) => fn());
  };

  return shell;
}
