// src/main.ts — entry point

// CSS imports — order matters: tokens must be first
import "./styles/tokens.css";
import "./styles/reset.css";
import "./styles/typography.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/animations.css";
import "./styles/chat.css";
import "./styles/widgets.css";
import "./styles/forms.css";

import { initAuth, subscribeToAuth } from "./store/auth.js";
import { registerRoute, initRouter, navigate } from "./router.js";
import { LandingPage } from "./pages/LandingPage.js";
import { LoginPage } from "./pages/LoginPage.js";
import { RegisterPage } from "./pages/RegisterPage.js";
import { OnboardingPage } from "./pages/OnboardingPage.js";
import { ChatPage } from "./pages/ChatPage.js";
import { ProfilePage } from "./pages/ProfilePage.js";
import { NotFoundPage } from "./pages/NotFoundPage.js";

async function boot(): Promise<void> {
  // Register all routes
  registerRoute("/", LandingPage);
  registerRoute("/login", LoginPage);
  registerRoute("/register", RegisterPage);
  registerRoute("/onboarding", OnboardingPage);
  registerRoute("/chat", ChatPage);
  registerRoute("/profile", ProfilePage);

  // Initialise auth (loads tokens from storage, calls /users/me)
  await initAuth();

  // Re-render header/navigation when auth state changes
  subscribeToAuth(() => {
    // Re-trigger the router so guards re-evaluate
    const hash = window.location.hash;
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    if (!window.location.hash) window.location.hash = hash;
  });

  // Start the router
  initRouter();
}

boot().catch((err) => {
  console.error("Boot failed:", err);
  const app = document.getElementById("app");
  if (app) {
    app.textContent = "Failed to load application. Please refresh.";
  }
});
