# SESSION_B — PersonalAssistant — Design System

identity:
  role: Produce the complete CSS design system. Zero application logic. Zero Python. Zero HTML pages.
  drive_folder: Claude/PersonalAssistant/
  reads: RULES.md, PLAN.md

## startup
1. Print:
   ════════════════════════════════════════
   ⚠️ IF THIS SESSION IS CUT OFF:
   New chat → connect Google Drive → paste:
   "Resume SESSION_B for Claude/PersonalAssistant/ — check Drive for completed files and continue."
   ════════════════════════════════════════
2. Read RULES.md from Drive.
3. Run already_run_guard (RULES.md).
4. Read PLAN.md — absorb visual_brief, font choices, color palette, shared_contracts.

## context
App: PersonalAssistant — a Socratic life-guidance chat app.
Aesthetic: Refined editorial / luxury journal. Serious, calm, trustworthy.
- Background: #0d0f12 near-black with subtle warm noise texture
- Text: warm cream #f0ead6 — never pure white
- Accent: burnished amber #c97d2e — CTAs, focus rings, active states
- Display font: Cormorant Garamond (serif — user messages, headings)
- Mono font: DM Mono (monospace — assistant messages, labels, metadata)
- Motion: slow, deliberate — 300–500ms easing, no bounce
- Max content width: 680px, single-column centered
- Border radius: 12px cards, 8px inputs, 4px buttons
- Chat bubbles: user right-aligned cream, assistant left-aligned slightly lighter dark card

## files_to_produce
| file | drive_path |
|---|---|
| tokens.css | Claude/PersonalAssistant/src/frontend/src/styles/tokens.css |
| reset.css | Claude/PersonalAssistant/src/frontend/src/styles/reset.css |
| typography.css | Claude/PersonalAssistant/src/frontend/src/styles/typography.css |
| components.css | Claude/PersonalAssistant/src/frontend/src/styles/components.css |
| animations.css | Claude/PersonalAssistant/src/frontend/src/styles/animations.css |
| chat.css | Claude/PersonalAssistant/src/frontend/src/styles/chat.css |
| widgets.css | Claude/PersonalAssistant/src/frontend/src/styles/widgets.css |
| forms.css | Claude/PersonalAssistant/src/frontend/src/styles/forms.css |
| layout.css | Claude/PersonalAssistant/src/frontend/src/styles/layout.css |

## instructions

### tokens.css
Define ALL CSS custom properties. Every subsequent file uses only these tokens — no hardcoded values anywhere.
Must include:
- Color scale: --color-bg, --color-bg-elevated, --color-bg-card, --color-bg-input
- --color-text-primary, --color-text-secondary, --color-text-muted, --color-text-inverse
- --color-accent, --color-accent-hover, --color-accent-muted
- --color-border, --color-border-focus, --color-error, --color-success
- --color-user-bubble-bg, --color-user-bubble-text
- --color-assistant-bubble-bg, --color-assistant-bubble-text
- Typography: --font-display, --font-mono, --font-body
- Font sizes: --text-xs through --text-4xl (rem scale)
- Font weights: --weight-normal, --weight-medium, --weight-semibold, --weight-bold
- Spacing scale: --space-1 through --space-16 (0.25rem steps)
- --radius-sm, --radius-md, --radius-lg, --radius-xl, --radius-full
- --shadow-sm, --shadow-md, --shadow-lg
- --transition-fast (150ms), --transition-base (300ms), --transition-slow (500ms)
- --ease-out, --ease-in-out
- --content-width: 680px
- --sidebar-width: 260px
- Noise texture: define as --noise-opacity: 0.035

### reset.css
Modern CSS reset. Box-sizing border-box. Remove default margins. Smooth scrolling. Font smoothing.
Include :focus-visible outline using --color-border-focus. No outline on mouse click.

### typography.css
Import Cormorant Garamond (weights 400, 500, 600) and DM Mono (weights 400, 500) from Google Fonts.
Define h1–h4, p, small, code, label using only token variables.
h1: Cormorant Garamond, 2.5rem, weight 600, letter-spacing -0.02em.
Body text: DM Mono 0.875rem — the app is data/chat-oriented, mono feels precise.
User chat messages: Cormorant Garamond (handwritten feel, personal).
Assistant messages: DM Mono (precise, professional).

### components.css
Produce complete styles for:
- .btn, .btn-primary, .btn-secondary, .btn-ghost, .btn-sm — all with hover, focus, active, disabled states
- .card (--color-bg-card, --shadow-md, --radius-lg)
- .badge, .badge-accent
- .avatar (circular, initials fallback)
- .divider (horizontal rule, amber tint)
- .loading-dots (three animated dots)
- .error-message (--color-error, icon space)
- .empty-state (centered, muted)

### animations.css
Define all @keyframes used across the app:
- @keyframes fadeIn (opacity 0→1)
- @keyframes slideUp (translateY 16px→0 + opacity)
- @keyframes slideInRight (translateX 20px→0 + opacity) — user bubble entrance
- @keyframes slideInLeft (translateX -20px→0 + opacity) — assistant bubble entrance
- @keyframes widgetReveal (slideUp variant, slower 500ms)
- @keyframes pulse (subtle scale 1→1.03→1 for loading)
- @keyframes typingDot (opacity bounce for typing indicator)
- .animate-fade-in, .animate-slide-up, .animate-widget utility classes

### chat.css
Complete chat interface styles:
- .chat-container (full-height flex column)
- .chat-messages (scrollable, padding, flex column gap)
- .chat-bubble-wrapper (flex, user vs assistant alignment)
- .chat-bubble (max-width 80%, padding, radius, font selection by role)
- .chat-bubble--user (right-aligned, cream bg, dark text)
- .chat-bubble--assistant (left-aligned, elevated dark bg, cream text, DM Mono)
- .chat-bubble__timestamp (muted, tiny, DM Mono)
- .chat-input-bar (fixed/sticky bottom, blur backdrop, border-top)
- .chat-input (textarea, auto-resize feel, dark bg, cream text)
- .chat-send-btn (amber accent, icon-only on mobile)
- .typing-indicator (three dots animation)

### widgets.css
Generative UI widget styles — all widgets slide in from below:
- .widget-container (card style, amber left-border accent, margin, animation)
- .widget-label (DM Mono, small caps feel, muted color)
- .widget-description (smaller, secondary color)
- .widget-submit-btn (full-width, btn-primary variant)
- Slider: .widget-slider (custom range input — amber thumb, track styling)
- Radio: .widget-radio-group, .widget-radio-option (custom radio with amber dot)
- Checkbox: .widget-checkbox-group, .widget-checkbox-item (custom checkbox amber check)
- Scale: .widget-scale (numbered buttons row, amber on selected)
- Multi-select: .widget-multi-select (pill-style toggleable chips)
- Date picker: .widget-date-input (styled date input, consistent with form tokens)
- Confirm: .widget-confirm (two-button yes/no layout)
- All interactive elements: hover state, focus ring using --color-border-focus

### forms.css
- .form-group (label + input + error stacked)
- .form-label (DM Mono, small, secondary color)
- .input, .textarea, .select (dark bg, cream text, amber focus border, smooth transition)
- .input--error (--color-error border)
- .form-error (error text, small, --color-error)
- .form-hint (helper text, muted)
- .auth-form (centered card form — login/register)
- .auth-form__title (Cormorant Garamond display)
- .auth-form__subtitle (muted)

### layout.css
- .app-shell (full-height grid: sidebar + main)
- .sidebar (fixed left, --sidebar-width, dark bg-elevated, border-right)
- .sidebar__logo (app name, Cormorant Garamond, amber accent letter)
- .sidebar__nav (conversation list, scroll)
- .sidebar__nav-item (hover, active states)
- .main-content (flex column, fills remaining width)
- .page-container (max-width --content-width, centered, padding)
- .onboarding-container (centered, max 480px, card style)
- .header (top bar with user avatar + profile link)
- Responsive: sidebar collapses to icon-only at <768px, hidden at <480px
- Noise texture overlay: ::before on body using SVG data URI for subtle grain

## quality_check before handoff
- Zero hardcoded hex colors — all var(--color-*)
- Zero hardcoded pixel values outside token definitions
- Every interactive element has :hover, :focus-visible, :active, :disabled
- All animations use tokens for duration/easing
- Mobile responsive verified in all files

## do_not_build
- Any Python files
- Any TypeScript files
- Any HTML files beyond what is explicitly listed
- Any backend routes or logic

## handoff
Write to Claude/PersonalAssistant/handoffs/HANDOFF_B.md

# HANDOFF_B — PersonalAssistant — Session B
plan_version: 1.0
files_produced: | file | drive_path | status | notes |
deps_added: Google Fonts (CDN — no install)
deviations: [what changed and why, or: none]
interfaces_exposed:
  - All CSS custom properties defined in tokens.css
  - All class names defined across style files (consumed by Session G)
watch_out_for:
  - Session G must import styles in order: tokens → reset → typography → layout → components → animations → chat → widgets → forms
  - Custom range input styling requires -webkit- prefixes for cross-browser slider thumb

HANDOFF STATUS: COMPLETE

---
▶ WHAT NEXT
════════════════════════════════════════
New chat → connect Google Drive → paste:
"Read SESSION_C.md from Claude/PersonalAssistant/ in Google Drive and begin."
════════════════════════════════════════
