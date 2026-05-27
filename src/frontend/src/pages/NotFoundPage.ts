// src/pages/NotFoundPage.ts

export function NotFoundPage(): HTMLElement {
  const page = document.createElement("div");
  page.style.cssText = [
    "min-height: 100vh",
    "display: flex",
    "flex-direction: column",
    "align-items: center",
    "justify-content: center",
    "gap: var(--space-4)",
    "padding: var(--space-8)",
    "text-align: center",
  ].join("; ");

  const code = document.createElement("p");
  code.style.cssText = "font-family: var(--font-mono); font-size: var(--text-sm); color: var(--color-text-muted);";
  code.textContent = "404";
  page.appendChild(code);

  const heading = document.createElement("h1");
  heading.style.cssText = "font-size: var(--text-2xl);";
  heading.textContent = "Page not found.";
  page.appendChild(heading);

  const link = document.createElement("a");
  link.href = "#/chat";
  link.className = "btn btn-ghost";
  link.textContent = "← Back to your space";
  link.setAttribute("aria-label", "Go back to chat");
  page.appendChild(link);

  return page;
}
