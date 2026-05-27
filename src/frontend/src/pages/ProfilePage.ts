// src/pages/ProfilePage.ts

import { getProfile, triggerCompaction } from "../api/profile.js";
import { updateTraits } from "../api/auth.js";
import { Header } from "../components/layout/Header.js";
import { formatTraitValue } from "../utils/format.js";
import type { ProfileResponse } from "../api/profile.js";

const EDITABLE_TRAITS = ["age", "height_cm", "weight_kg", "lifestyle"] as const;
type EditableTrait = (typeof EDITABLE_TRAITS)[number];

export function ProfilePage(): HTMLElement {
  const shell = document.createElement("div");
  shell.style.cssText = "min-height: 100vh; display: flex; flex-direction: column;";

  const headerEl = Header();
  shell.appendChild(headerEl);

  const container = document.createElement("div");
  container.className = "page-container animate-fade-in";
  container.style.cssText = "max-width: var(--content-width); margin: 0 auto; padding: var(--space-8) var(--space-4);";
  shell.appendChild(container);

  // Loading state
  const loadingEl = document.createElement("p");
  loadingEl.className = "loading-dots";
  loadingEl.setAttribute("aria-label", "Loading profile");
  container.appendChild(loadingEl);

  // Error state
  const errorEl = document.createElement("p");
  errorEl.className = "error-message";
  errorEl.setAttribute("role", "alert");
  errorEl.style.display = "none";
  container.appendChild(errorEl);

  // Content (hidden until loaded)
  const content = document.createElement("div");
  content.style.display = "none";
  container.appendChild(content);

  let currentProfile: ProfileResponse | null = null;

  function renderProfile(profile: ProfileResponse): void {
    currentProfile = profile;
    content.innerHTML = "";

    // Heading
    const heading = document.createElement("h1");
    heading.style.cssText = "font-size: var(--text-3xl); margin-bottom: var(--space-6);";
    heading.textContent = "Your Profile.";
    content.appendChild(heading);

    // Conversation count
    const countEl = document.createElement("p");
    countEl.style.cssText = "font-family: var(--font-mono); font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-6);";
    countEl.textContent = `${profile.conversation_count} conversation${profile.conversation_count !== 1 ? "s" : ""} to date.`;
    content.appendChild(countEl);

    // Compacted summary card
    if (profile.compacted_summary) {
      const summaryCard = document.createElement("div");
      summaryCard.className = "card";
      summaryCard.style.cssText = "margin-bottom: var(--space-6); padding: var(--space-5);";

      const summaryTitle = document.createElement("h2");
      summaryTitle.style.cssText = "font-size: var(--text-sm); font-family: var(--font-mono); color: var(--color-text-secondary); margin-bottom: var(--space-3);";
      summaryTitle.textContent = "What I know about you";
      summaryCard.appendChild(summaryTitle);

      const summaryText = document.createElement("p");
      summaryText.style.cssText = "font-size: var(--text-base); line-height: 1.7; color: var(--color-text-primary);";
      summaryText.textContent = profile.compacted_summary;
      summaryCard.appendChild(summaryText);

      content.appendChild(summaryCard);
    }

    // Traits display + edit
    const traitsCard = document.createElement("div");
    traitsCard.className = "card";
    traitsCard.style.cssText = "margin-bottom: var(--space-6); padding: var(--space-5);";

    const traitsTitle = document.createElement("h2");
    traitsTitle.style.cssText = "font-size: var(--text-base); font-family: var(--font-mono); margin-bottom: var(--space-4);";
    traitsTitle.textContent = "Known traits";
    traitsCard.appendChild(traitsTitle);

    const dl = document.createElement("dl");
    dl.style.cssText = "display: grid; grid-template-columns: 1fr 2fr; gap: var(--space-2) var(--space-4);";

    const traits = profile.traits;

    EDITABLE_TRAITS.forEach((key) => {
      const dt = document.createElement("dt");
      dt.style.cssText = "font-family: var(--font-mono); font-size: var(--text-sm); color: var(--color-text-secondary); padding: var(--space-1) 0;";
      dt.textContent = key.replace("_", " ");

      const dd = document.createElement("dd");
      dd.style.cssText = "display: flex; align-items: center; gap: var(--space-2);";

      const inputEl = document.createElement("input");
      inputEl.type = key === "age" || key === "height_cm" || key === "weight_kg" ? "number" : "text";
      inputEl.className = "input";
      inputEl.style.cssText = "width: 100%; font-size: var(--text-sm); padding: var(--space-1) var(--space-2);";
      inputEl.value = String(traits[key] ?? "");
      inputEl.placeholder = "—";
      inputEl.setAttribute("aria-label", `Edit ${key.replace("_", " ")}`);

      dd.appendChild(inputEl);
      dl.appendChild(dt);
      dl.appendChild(dd);
    });

    traitsCard.appendChild(dl);

    // Save traits button
    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "btn btn-primary";
    saveBtn.style.cssText = "margin-top: var(--space-4);";
    saveBtn.textContent = "Save traits";
    saveBtn.setAttribute("aria-label", "Save trait changes");

    const saveMsg = document.createElement("span");
    saveMsg.style.cssText = "font-family: var(--font-mono); font-size: var(--text-sm); color: var(--color-text-secondary); margin-left: var(--space-3);";
    saveMsg.textContent = "";

    saveBtn.addEventListener("click", () => {
      const inputs = dl.querySelectorAll<HTMLInputElement>("input");
      const updated: Record<string, unknown> = {};
      EDITABLE_TRAITS.forEach((key, i) => {
        const raw = inputs[i]?.value.trim();
        if (!raw) {
          updated[key] = null;
        } else if (key === "age" || key === "height_cm" || key === "weight_kg") {
          updated[key] = Number(raw);
        } else {
          updated[key] = raw;
        }
      });

      saveBtn.disabled = true;
      saveBtn.textContent = "Saving…";
      saveMsg.textContent = "";

      updateTraits(updated)
        .then(() => {
          saveMsg.textContent = "Saved.";
          saveBtn.disabled = false;
          saveBtn.textContent = "Save traits";
        })
        .catch((err: unknown) => {
          saveMsg.textContent = err instanceof Error ? err.message : "Save failed.";
          saveBtn.disabled = false;
          saveBtn.textContent = "Save traits";
        });
    });

    const saveBtnRow = document.createElement("div");
    saveBtnRow.style.cssText = "display: flex; align-items: center;";
    saveBtnRow.appendChild(saveBtn);
    saveBtnRow.appendChild(saveMsg);
    traitsCard.appendChild(saveBtnRow);

    content.appendChild(traitsCard);

    // Refresh summary button
    const refreshBtn = document.createElement("button");
    refreshBtn.type = "button";
    refreshBtn.className = "btn btn-secondary";
    refreshBtn.textContent = "Refresh summary";
    refreshBtn.setAttribute("aria-label", "Trigger profile compaction and refresh summary");

    refreshBtn.addEventListener("click", () => {
      refreshBtn.disabled = true;
      refreshBtn.textContent = "Refreshing…";
      triggerCompaction()
        .then((updated) => {
          renderProfile(updated);
        })
        .catch((err: unknown) => {
          errorEl.textContent = err instanceof Error ? err.message : "Refresh failed.";
          errorEl.style.display = "block";
          refreshBtn.disabled = false;
          refreshBtn.textContent = "Refresh summary";
        });
    });

    content.appendChild(refreshBtn);
  }

  // Load profile on mount
  getProfile()
    .then((profile) => {
      loadingEl.style.display = "none";
      content.style.display = "block";
      renderProfile(profile);
    })
    .catch((err: unknown) => {
      loadingEl.style.display = "none";
      errorEl.textContent = err instanceof Error ? err.message : "Failed to load profile.";
      errorEl.style.display = "block";
    });

  const cleanups = [
    () => { (headerEl as HTMLElement & { __cleanup?: () => void }).__cleanup?.(); },
  ];
  (shell as HTMLElement & { __cleanup?: () => void }).__cleanup = () => {
    cleanups.forEach((fn) => fn());
  };

  return shell;
}
