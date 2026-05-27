// src/components/layout/Sidebar.ts

import {
  getChatState,
  subscribeToChat,
  selectConversation,
  createNewConversation,
} from "../../store/chat.js";
import { truncate } from "../../utils/format.js";

export function Sidebar(): HTMLElement {
  const sidebar = document.createElement("aside");
  sidebar.className = "sidebar";
  sidebar.setAttribute("aria-label", "Conversations");

  function renderList(): void {
    const list = sidebar.querySelector<HTMLElement>(".sidebar__list");
    if (!list) return;
    list.innerHTML = "";

    const { conversations, activeConversationId } = getChatState();

    if (conversations.length === 0) {
      const empty = document.createElement("p");
      empty.className = "sidebar__empty";
      empty.textContent = "No conversations yet.";
      list.appendChild(empty);
      return;
    }

    conversations.forEach((convo) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className =
        "sidebar__item" + (convo.id === activeConversationId ? " sidebar__item--active" : "");
      item.setAttribute("aria-current", convo.id === activeConversationId ? "page" : "false");

      const title = document.createTextNode(
        truncate(convo.title ?? "Untitled conversation", 36)
      );
      item.appendChild(title);

      item.addEventListener("click", () => {
        selectConversation(convo.id).catch(() => {/* handled in store */});
      });
      list.appendChild(item);
    });
  }

  // Logo/brand
  const brand = document.createElement("div");
  brand.className = "sidebar__logo";
  const brandText = document.createElement("span");
  const accent = document.createElement("span");
  accent.style.color = "var(--color-accent)";
  accent.textContent = "P";
  brandText.appendChild(accent);
  brandText.appendChild(document.createTextNode("A"));
  brand.appendChild(brandText);
  sidebar.appendChild(brand);

  // New conversation button
  const newBtn = document.createElement("button");
  newBtn.type = "button";
  newBtn.className = "btn btn-primary sidebar__new-btn";
  newBtn.textContent = "+ New conversation";
  newBtn.setAttribute("aria-label", "Start new conversation");
  newBtn.addEventListener("click", () => {
    createNewConversation().catch(() => {/* handled in store */});
  });
  sidebar.appendChild(newBtn);

  // Divider
  const divider = document.createElement("hr");
  divider.className = "divider divider--subtle";
  sidebar.appendChild(divider);

  // Conversation list
  const list = document.createElement("nav");
  list.className = "sidebar__list";
  list.setAttribute("aria-label", "Conversation list");
  sidebar.appendChild(list);

  renderList();

  const unsubscribe = subscribeToChat(() => renderList());
  (sidebar as HTMLElement & { __cleanup?: () => void }).__cleanup = unsubscribe;

  return sidebar;
}
