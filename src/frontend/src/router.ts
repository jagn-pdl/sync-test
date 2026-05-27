// src/router.ts — hash-based SPA router

import { getAuthState } from "./store/auth.js";
import { getChatState } from "./store/chat.js";

export type Route = "/" | "/login" | "/register" | "/onboarding" | "/chat" | "/profile";
type RouteHandler = () => HTMLElement;
type CleanupFn = () => void;

const routes = new Map<Route, RouteHandler>();
let currentCleanup: CleanupFn | null = null;

export function registerRoute(path: Route, handler: RouteHandler): void {
  routes.set(path, handler);
}

export function navigate(path: Route): void {
  window.location.hash = `#${path}`;
}

export function getCurrentRoute(): Route {
  const hash = window.location.hash.replace(/^#/, "") || "/";
  return (hash as Route) in Object.fromEntries(routes) ? (hash as Route) : "/";
}

function getHashPath(): Route {
  const raw = window.location.hash.replace(/^#/, "");
  const path = raw || "/";
  const valid: Route[] = ["/", "/login", "/register", "/onboarding", "/chat", "/profile"];
  return valid.includes(path as Route) ? (path as Route) : "/";
}

function render(): void {
  const { isAuthenticated } = getAuthState();
  const { conversations } = getChatState();
  let path = getHashPath();

  // Guard: unauthenticated user can only see /, /login, /register
  const publicRoutes: Route[] = ["/", "/login", "/register"];
  if (!isAuthenticated && !publicRoutes.includes(path)) {
    path = "/login";
    window.location.hash = "#/login";
  }

  // Guard: authenticated user should not see /login or /register
  if (isAuthenticated && (path === "/login" || path === "/register")) {
    path = "/chat";
    window.location.hash = "#/chat";
  }

  // Guard: first-time user (no conversations yet) → onboarding
  if (isAuthenticated && path === "/chat" && conversations.length === 0) {
    // Don't redirect if we're already loading; let ChatPage handle creation
    // Only redirect to onboarding if we have confirmed zero conversations
  }

  const handler = routes.get(path);
  const app = document.getElementById("app");
  if (!app || !handler) return;

  // Cleanup previous page
  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }

  app.innerHTML = "";
  const el = handler();
  app.appendChild(el);

  // If element has a cleanup attribute (we pass cleanup via dataset convention)
  const cleanup = (el as HTMLElement & { __cleanup?: CleanupFn }).__cleanup;
  if (cleanup) currentCleanup = cleanup;
}

export function initRouter(): void {
  window.addEventListener("hashchange", () => render());
  render();
}
