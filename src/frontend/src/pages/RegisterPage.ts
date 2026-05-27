// src/pages/RegisterPage.ts

import { registerUser, getAuthState, subscribeToAuth } from "../store/auth.js";
import { navigate } from "../router.js";

export function RegisterPage(): HTMLElement {
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
  title.textContent = "Begin.";
  card.appendChild(title);

  // Name field
  const nameGroup = document.createElement("div");
  nameGroup.className = "form-group";
  const nameLabel = document.createElement("label");
  nameLabel.className = "form-label";
  nameLabel.htmlFor = "reg-name";
  nameLabel.textContent = "Name";
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.id = "reg-name";
  nameInput.className = "input";
  nameInput.autocomplete = "name";
  nameInput.required = true;
  nameInput.setAttribute("aria-required", "true");
  nameGroup.appendChild(nameLabel);
  nameGroup.appendChild(nameInput);
  card.appendChild(nameGroup);

  // Email field
  const emailGroup = document.createElement("div");
  emailGroup.className = "form-group";
  const emailLabel = document.createElement("label");
  emailLabel.className = "form-label";
  emailLabel.htmlFor = "reg-email";
  emailLabel.textContent = "Email";
  const emailInput = document.createElement("input");
  emailInput.type = "email";
  emailInput.id = "reg-email";
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
  passLabel.htmlFor = "reg-password";
  passLabel.textContent = "Password";
  const passInput = document.createElement("input");
  passInput.type = "password";
  passInput.id = "reg-password";
  passInput.className = "input";
  passInput.autocomplete = "new-password";
  passInput.required = true;
  passInput.setAttribute("aria-required", "true");
  passGroup.appendChild(passLabel);
  passGroup.appendChild(passInput);
  card.appendChild(passGroup);

  // Submit button
  const submitBtn = document.createElement("button");
  submitBtn.type = "button";
  submitBtn.className = "btn btn-primary auth-form__submit";
  submitBtn.textContent = "Create account";
  card.appendChild(submitBtn);

  // Error display
  const errorEl = document.createElement("p");
  errorEl.className = "form-error error-message";
  errorEl.setAttribute("role", "alert");
  errorEl.setAttribute("aria-live", "polite");
  errorEl.style.display = "none";
  card.appendChild(errorEl);

  // Login link
  const linkEl = document.createElement("p");
  linkEl.className = "auth-form__link";
  const link = document.createElement("a");
  link.href = "#/login";
  link.textContent = "Already have an account? Sign in.";
  linkEl.appendChild(link);
  card.appendChild(linkEl);

  async function handleSubmit(): Promise<void> {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passInput.value;
    if (!name || !email || !password) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Creating account…";
    errorEl.style.display = "none";

    await registerUser(name, email, password);

    const { isAuthenticated, error } = getAuthState();
    if (isAuthenticated) {
      navigate("/onboarding");
    } else {
      errorEl.textContent = error ?? "Registration failed.";
      errorEl.style.display = "block";
      submitBtn.disabled = false;
      submitBtn.textContent = "Create account";
    }
  }

  submitBtn.addEventListener("click", () => { handleSubmit().catch(() => undefined); });
  [nameInput, emailInput, passInput].forEach((el) => {
    el.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") { handleSubmit().catch(() => undefined); }
    });
  });

  const unsubscribe = subscribeToAuth(() => {
    const { isAuthenticated } = getAuthState();
    if (isAuthenticated) navigate("/onboarding");
  });
  (page as HTMLElement & { __cleanup?: () => void }).__cleanup = unsubscribe;

  page.appendChild(card);
  return page;
}
