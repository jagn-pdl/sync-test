// src/pages/LoginPage.ts

import { loginUser, getAuthState, subscribeToAuth } from "../store/auth.js";
import { navigate } from "../router.js";

export function LoginPage(): HTMLElement {
  const page = document.createElement("div");
  page.style.cssText = [
    "min-height: 100vh",
    "display: flex",
    "align-items: center",
    "justify-content: center",
    "padding: var(--space-8)",
  ].join("; ");

  const card = document.createElement("div");
  card.className = "auth-form animate-fade-in";

  const title = document.createElement("h1");
  title.className = "auth-form__title";
  title.textContent = "Welcome back.";
  card.appendChild(title);

  // Email field
  const emailGroup = document.createElement("div");
  emailGroup.className = "form-group";
  const emailLabel = document.createElement("label");
  emailLabel.className = "form-label";
  emailLabel.htmlFor = "login-email";
  emailLabel.textContent = "Email";
  const emailInput = document.createElement("input");
  emailInput.type = "email";
  emailInput.id = "login-email";
  emailInput.className = "input";
  emailInput.autocomplete = "email";
  emailInput.required = true;
  emailInput.setAttribute("aria-required", "true");
  emailGroup.appendChild(emailLabel);
  emailGroup.appendChild(emailInput);
  card.appendChild(emailGroup);

  // Password field
  const passGroup = document.createElement("div");
  passGroup.className = "form-group";
  const passLabel = document.createElement("label");
  passLabel.className = "form-label";
  passLabel.htmlFor = "login-password";
  passLabel.textContent = "Password";
  const passInput = document.createElement("input");
  passInput.type = "password";
  passInput.id = "login-password";
  passInput.className = "input";
  passInput.autocomplete = "current-password";
  passInput.required = true;
  passInput.setAttribute("aria-required", "true");
  passGroup.appendChild(passLabel);
  passGroup.appendChild(passInput);
  card.appendChild(passGroup);

  // Submit button
  const submitBtn = document.createElement("button");
  submitBtn.type = "button";
  submitBtn.className = "btn btn-primary auth-form__submit";
  submitBtn.textContent = "Sign in";
  card.appendChild(submitBtn);

  // Error display
  const errorEl = document.createElement("p");
  errorEl.className = "form-error error-message";
  errorEl.setAttribute("role", "alert");
  errorEl.setAttribute("aria-live", "polite");
  errorEl.style.display = "none";
  card.appendChild(errorEl);

  // Register link
  const divider = document.createElement("p");
  divider.className = "auth-form__link";
  const link = document.createElement("a");
  link.href = "#/register";
  link.textContent = "New here? Begin your journey.";
  divider.appendChild(link);
  card.appendChild(divider);

  async function handleSubmit(): Promise<void> {
    const email = emailInput.value.trim();
    const password = passInput.value;
    if (!email || !password) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Signing in…";
    errorEl.style.display = "none";

    await loginUser(email, password);

    const { isAuthenticated, error } = getAuthState();
    if (isAuthenticated) {
      navigate("/chat");
    } else {
      errorEl.textContent = error ?? "Login failed.";
      errorEl.style.display = "block";
      submitBtn.disabled = false;
      submitBtn.textContent = "Sign in";
    }
  }

  submitBtn.addEventListener("click", () => { handleSubmit().catch(() => undefined); });
  [emailInput, passInput].forEach((el) => {
    el.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") { handleSubmit().catch(() => undefined); }
    });
  });

  const unsubscribe = subscribeToAuth(() => {
    const { isAuthenticated } = getAuthState();
    if (isAuthenticated) navigate("/chat");
  });
  (page as HTMLElement & { __cleanup?: () => void }).__cleanup = unsubscribe;

  page.appendChild(card);
  return page;
}
