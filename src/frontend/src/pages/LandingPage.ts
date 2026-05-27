// src/pages/LandingPage.ts

export function LandingPage(): HTMLElement {
  const page = document.createElement("div");
  page.className = "landing-page";
  page.style.cssText = [
    "min-height: 100vh",
    "display: flex",
    "flex-direction: column",
    "align-items: center",
    "justify-content: center",
    "padding: var(--space-8)",
    "text-align: center",
    "gap: var(--space-6)",
  ].join("; ");

  const heading = document.createElement("h1");
  heading.className = "animate-fade-in";
  heading.style.cssText = "font-size: var(--text-4xl); max-width: 560px;";
  heading.textContent = "Think clearly. Decide freely.";
  page.appendChild(heading);

  const subtitle = document.createElement("p");
  subtitle.className = "animate-fade-in";
  subtitle.style.cssText = [
    "font-family: var(--font-mono)",
    "font-size: var(--text-sm)",
    "color: var(--color-text-secondary)",
    "max-width: 400px",
    "animation-delay: 100ms",
  ].join("; ");
  subtitle.textContent =
    "A private Socratic guide for life's difficult decisions.";
  page.appendChild(subtitle);

  const btnRow = document.createElement("div");
  btnRow.className = "animate-fade-in";
  btnRow.style.cssText = [
    "display: flex",
    "gap: var(--space-4)",
    "flex-wrap: wrap",
    "justify-content: center",
    "animation-delay: 200ms",
  ].join("; ");

  const beginBtn = document.createElement("a");
  beginBtn.href = "#/register";
  beginBtn.className = "btn btn-primary";
  beginBtn.textContent = "Begin";
  btnRow.appendChild(beginBtn);

  const signInBtn = document.createElement("a");
  signInBtn.href = "#/login";
  signInBtn.className = "btn btn-secondary";
  signInBtn.textContent = "Sign in";
  btnRow.appendChild(signInBtn);

  page.appendChild(btnRow);

  return page;
}
