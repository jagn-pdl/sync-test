// src/components/layout/Header.ts

import { getAuthState, subscribeToAuth } from "../../store/auth.js";
import { navigate } from "../../router.js";

export function Header(): HTMLElement {
  const header = document.createElement("header");
  header.className = "header";

  function render(): void {
    header.innerHTML = "";

    const brand = document.createElement("div");
    brand.className = "header__brand";

    const brandLink = document.createElement("a");
    brandLink.href = "#/";
    brandLink.setAttribute("aria-label", "PersonalAssistant home");

    const brandText = document.createElement("span");
    brandText.className = "header__brand-text";

    const accent = document.createElement("span");
    accent.style.color = "var(--color-accent)";
    accent.textContent = "P";
    brandText.appendChild(accent);

    const rest = document.createTextNode("ersonalAssistant");
    brandText.appendChild(rest);
    brandLink.appendChild(brandText);
    brand.appendChild(brandLink);
    header.appendChild(brand);

    const { isAuthenticated, user } = getAuthState();
    if (isAuthenticated && user) {
      const nav = document.createElement("nav");
      nav.className = "header__nav";
      nav.setAttribute("aria-label", "User navigation");

      const avatarBtn = document.createElement("button");
      avatarBtn.className = "avatar avatar--sm";
      avatarBtn.setAttribute("aria-label", "Go to profile");
      avatarBtn.setAttribute("type", "button");

      const initials = user.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();
      avatarBtn.textContent = initials;

      avatarBtn.addEventListener("click", () => navigate("/profile"));
      nav.appendChild(avatarBtn);
      header.appendChild(nav);
    }
  }

  render();
  const unsubscribe = subscribeToAuth(() => render());

  // Attach cleanup
  (header as HTMLElement & { __cleanup?: () => void }).__cleanup = unsubscribe;

  return header;
}
