# SESSION_G — PersonalAssistant — Frontend

identity:
  role: Produce all TypeScript frontend files — pages, components, API clients, router, state stores. No Python. No CSS (designed in Session B).
  drive_folder: Claude/PersonalAssistant/
  reads: RULES.md, PLAN.md, HANDOFF_B, HANDOFF_F

## startup
1. Print:
   ════════════════════════════════════════
   ⚠️ IF THIS SESSION IS CUT OFF:
   New chat → connect Google Drive → paste:
   "Resume SESSION_G for Claude/PersonalAssistant/ — check Drive for completed files and continue."
   ════════════════════════════════════════
2. Read RULES.md from Drive.
3. Run already_run_guard (RULES.md).
4. Read PLAN.md, HANDOFF_B, HANDOFF_F from Drive.

## context
- Vanilla TypeScript, Vite 5. No framework (React, Vue, etc.).
- Custom SPA router (hash-based: #/login, #/chat, etc.).
- CSS classes come entirely from Session B's design system — use them exactly as defined.
- State: module-level stores (auth.ts, chat.ts) — plain TypeScript objects, not signals/observables.
- API calls go to /api/* (proxied by nginx to backend:8000).
- Fonts: Cormorant Garamond (display) + DM Mono (mono/body) — already imported by typography.css.
- All shared TypeScript types from PLAN.md shared_contracts live in types/index.ts.
- Each "component" is a function returning HTMLElement. Pages are functions that mount into #app.
- Router is a simple popstate/hashchange listener.

## aesthetic direction (from PLAN.md visual_brief)
- Near-black bg, warm cream text, amber accent
- Single column, max 680px, centered
- Chat: user bubbles right (Cormorant Garamond), assistant left (DM Mono)
- Widgets slide up from below (CSS animation defined in Session B)
- Slow, deliberate motion — no bounce

## files_to_produce
| file | drive_path |
|---|---|
| src/types/index.ts | Claude/PersonalAssistant/src/frontend/src/types/index.ts |
| src/utils/format.ts | Claude/PersonalAssistant/src/frontend/src/utils/format.ts |
| src/utils/storage.ts | Claude/PersonalAssistant/src/frontend/src/utils/storage.ts |
| src/api/client.ts | Claude/PersonalAssistant/src/frontend/src/api/client.ts |
| src/api/auth.ts | Claude/PersonalAssistant/src/frontend/src/api/auth.ts |
| src/api/chat.ts | Claude/PersonalAssistant/src/frontend/src/api/chat.ts |
| src/api/profile.ts | Claude/PersonalAssistant/src/frontend/src/api/profile.ts |
| src/store/auth.ts | Claude/PersonalAssistant/src/frontend/src/store/auth.ts |
| src/store/chat.ts | Claude/PersonalAssistant/src/frontend/src/store/chat.ts |
| src/router.ts | Claude/PersonalAssistant/src/frontend/src/router.ts |
| src/main.ts | Claude/PersonalAssistant/src/frontend/src/main.ts |
| src/components/layout/Header.ts | Claude/PersonalAssistant/src/frontend/src/components/layout/Header.ts |
| src/components/layout/Sidebar.ts | Claude/PersonalAssistant/src/frontend/src/components/layout/Sidebar.ts |
| src/components/chat/ChatBubble.ts | Claude/PersonalAssistant/src/frontend/src/components/chat/ChatBubble.ts |
| src/components/chat/ChatInput.ts | Claude/PersonalAssistant/src/frontend/src/components/chat/ChatInput.ts |
| src/components/chat/TypingIndicator.ts | Claude/PersonalAssistant/src/frontend/src/components/chat/TypingIndicator.ts |
| src/components/widgets/WidgetRenderer.ts | Claude/PersonalAssistant/src/frontend/src/components/widgets/WidgetRenderer.ts |
| src/components/widgets/SliderWidget.ts | Claude/PersonalAssistant/src/frontend/src/components/widgets/SliderWidget.ts |
| src/components/widgets/RadioWidget.ts | Claude/PersonalAssistant/src/frontend/src/components/widgets/RadioWidget.ts |
| src/components/widgets/CheckboxWidget.ts | Claude/PersonalAssistant/src/frontend/src/components/widgets/CheckboxWidget.ts |
| src/components/widgets/ScaleWidget.ts | Claude/PersonalAssistant/src/frontend/src/components/widgets/ScaleWidget.ts |
| src/components/widgets/TextInputWidget.ts | Claude/PersonalAssistant/src/frontend/src/components/widgets/TextInputWidget.ts |
| src/components/widgets/DatePickerWidget.ts | Claude/PersonalAssistant/src/frontend/src/components/widgets/DatePickerWidget.ts |
| src/components/widgets/MultiSelectWidget.ts | Claude/PersonalAssistant/src/frontend/src/components/widgets/MultiSelectWidget.ts |
| src/components/widgets/ConfirmWidget.ts | Claude/PersonalAssistant/src/frontend/src/components/widgets/ConfirmWidget.ts |
| src/pages/LandingPage.ts | Claude/PersonalAssistant/src/frontend/src/pages/LandingPage.ts |
| src/pages/LoginPage.ts | Claude/PersonalAssistant/src/frontend/src/pages/LoginPage.ts |
| src/pages/RegisterPage.ts | Claude/PersonalAssistant/src/frontend/src/pages/RegisterPage.ts |
| src/pages/OnboardingPage.ts | Claude/PersonalAssistant/src/frontend/src/pages/OnboardingPage.ts |
| src/pages/ChatPage.ts | Claude/PersonalAssistant/src/frontend/src/pages/ChatPage.ts |
| src/pages/ProfilePage.ts | Claude/PersonalAssistant/src/frontend/src/pages/ProfilePage.ts |
| src/pages/NotFoundPage.ts | Claude/PersonalAssistant/src/frontend/src/pages/NotFoundPage.ts |

## instructions

### src/types/index.ts
Copy EXACTLY the TypeScript interfaces from PLAN.md shared_contracts:
User, UserProfile, Message, UIWidget, UIWidgetType, ChatRequest, ChatResponse, AuthTokens, ConversationSchema.
Add: `interface ApiError { detail: string; }` and `type LoadingState = "idle" | "loading" | "success" | "error"`.

### src/utils/format.ts
- `formatTimestamp(iso: string): string` — "2:34 PM" or "Mon 2:34 PM" if not today
- `truncate(str: string, max: number): string`
- `formatTraitValue(key: string, value: unknown): string` — e.g. weight_kg → "72 kg"

### src/utils/storage.ts
localStorage wrapper:
- `getAccessToken(): string | null`
- `setAccessToken(token: string): void`
- `getRefreshToken(): string | null`
- `setRefreshToken(token: string): void`
- `clearTokens(): void`
- `getUserId(): string | null`
- `setUserId(id: string): void`

### src/api/client.ts
Base fetch wrapper:
```typescript
async function apiFetch<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<T>
```
- Prepends /api to path.
- Injects Authorization: Bearer {token} unless skipAuth.
- On 401: attempt token refresh once, retry. If refresh fails: clear tokens, redirect to #/login.
- On non-ok response: throw ApiError with response JSON detail.
- Returns parsed JSON as T.

### src/api/auth.ts
- `register(name, email, password): Promise<AuthTokens>`
- `login(email, password): Promise<AuthTokens>`
- `refresh(refreshToken): Promise<AuthTokens>`
- `getMe(): Promise<User>`
- `updateTraits(traits: Record<string, unknown>): Promise<User>`

### src/api/chat.ts
- `sendMessage(req: ChatRequest): Promise<ChatResponse>`
- `getHistory(conversationId: string): Promise<Message[]>`
- `getConversations(): Promise<ConversationSchema[]>`
- `createConversation(): Promise<ConversationSchema>`

### src/api/profile.ts
- `getProfile(): Promise<ProfileResponse>` (define ProfileResponse type inline: { user_id, compacted_summary, traits, conversation_count })
- `triggerCompaction(): Promise<ProfileResponse>`

### src/store/auth.ts
Module-level state object (not exported directly — use functions):
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loadingState: LoadingState;
  error: string | null;
}
```
Exported functions:
- `getAuthState(): AuthState`
- `async initAuth(): Promise<void>` — load tokens from storage, call getMe(), populate state
- `async loginUser(email, password): Promise<void>`
- `async registerUser(name, email, password): Promise<void>`
- `logoutUser(): void` — clear tokens, reset state
- `subscribeToAuth(cb: (state: AuthState) => void): () => void` — simple listener pattern (array of callbacks, returns unsubscribe fn)

### src/store/chat.ts
```typescript
interface ChatState {
  conversations: ConversationSchema[];
  activeConversationId: string | null;
  messages: Message[];
  pendingWidget: UIWidget | null;
  isTyping: boolean;
  loadingState: LoadingState;
  error: string | null;
}
```
Exported functions:
- `getChatState(): ChatState`
- `async loadConversations(): Promise<void>`
- `async selectConversation(id: string): Promise<void>` — load history, set active
- `async createNewConversation(): Promise<void>`
- `async sendMessage(text: string, widgetResponse?: { field_key: string; value: unknown }): Promise<void>`
  Sets isTyping=true → calls API → appends messages → sets pendingWidget → sets isTyping=false.
- `clearPendingWidget(): void`
- `subscribeToChat(cb: (state: ChatState) => void): () => void`

### src/router.ts
Hash-based router:
```typescript
type Route = "/" | "/login" | "/register" | "/onboarding" | "/chat" | "/profile";
type RouteHandler = () => HTMLElement;

function registerRoute(path: Route, handler: RouteHandler): void
function navigate(path: Route): void
function getCurrentRoute(): Route
function initRouter(): void  // listens to hashchange, renders into #app
```
Guard logic: if not authenticated and route is not "/" | "/login" | "/register" → redirect to /login.
If authenticated and route is "/login" | "/register" → redirect to /chat.
If authenticated and no conversations yet (first login after register) → redirect to /onboarding.

### src/main.ts
Entry point:
1. Import all CSS files in order: tokens → reset → typography → layout → components → animations → chat → widgets → forms.
2. Call initAuth().
3. Register all routes.
4. Call initRouter().
5. Subscribe to auth state changes to re-render header/sidebar when auth changes.

### src/components/layout/Header.ts
Returns header element with:
- App name "PersonalAssistant" (Cormorant Garamond, amber "P" accent).
- Right side: if authenticated, user avatar (initials), link to #/profile. If not, nothing.
- Uses .header class from layout.css.

### src/components/layout/Sidebar.ts
Returns sidebar element:
- Logo / app name at top.
- "New Conversation" button.
- Scrollable conversation list (from chatStore.conversations).
- Each item: conversation title (truncated), click → selectConversation.
- Active item highlighted.
- Subscribes to chat store, re-renders list on change.

### src/components/chat/ChatBubble.ts
```typescript
function ChatBubble(message: Message): HTMLElement
```
Returns .chat-bubble-wrapper with correct role class.
User bubble: Cormorant Garamond via CSS class (.chat-bubble--user).
Assistant bubble: DM Mono via CSS class (.chat-bubble--assistant).
Include timestamp below bubble. Animate in using .animate-slide-in-left or right.

### src/components/chat/ChatInput.ts
```typescript
function ChatInput(onSend: (text: string) => void): HTMLElement
```
Returns .chat-input-bar with textarea + send button.
Textarea: auto-growing (adjust height on input event), max 5 rows.
Send on Enter (not Shift+Enter). Disable while isTyping.
Clear on send.

### src/components/chat/TypingIndicator.ts
Returns .typing-indicator with three animated dots. Used while isTyping=true.

### src/components/widgets/WidgetRenderer.ts
```typescript
function WidgetRenderer(
  widget: UIWidget,
  onSubmit: (value: { field_key: string; value: unknown }) => void
): HTMLElement
```
Switch on widget.type → render the correct sub-widget component.
Wraps in .widget-container with .animate-widget class.
Submit button calls onSubmit then hides the widget.

### Individual widget components
Each: `function XWidget(widget: UIWidget, onSubmit: SubmitFn): HTMLElement`

- **SliderWidget**: `<input type="range">` with live value display. Shows unit if set. Min/max/step from widget.
- **RadioWidget**: list of radio inputs from widget.options. Custom styled via .widget-radio-option.
- **CheckboxWidget**: list of checkboxes. onSubmit value = string[] of selected.
- **ScaleWidget**: row of numbered buttons (min to max). Amber highlight on selected. Default: 1–10 if no min/max.
- **TextInputWidget**: single `<input type="text">` or `<textarea>` if no options.
- **DatePickerWidget**: `<input type="date">` styled consistently.
- **MultiSelectWidget**: pill-style toggleable chips from widget.options. onSubmit value = string[].
- **ConfirmWidget**: two buttons (Yes / No). onSubmit value = boolean.

### src/pages/LandingPage.ts
Full-screen landing:
- Centered vertically and horizontally.
- Large Cormorant Garamond heading: "Think clearly. Decide freely."
- Subtitle in DM Mono: "A private Socratic guide for life's difficult decisions."
- Two buttons: "Begin" (→ #/register) and "Sign in" (→ #/login).
- Subtle noise texture background (from CSS body ::before).
- No sidebar, no header on this page.

### src/pages/LoginPage.ts
.auth-form centered card:
- Title: "Welcome back."
- Email + password inputs.
- "Sign in" button (amber, full-width).
- Error display below button.
- Link to #/register: "New here? Begin your journey."
- On success: navigate to #/chat.

### src/pages/RegisterPage.ts
.auth-form centered card:
- Title: "Begin."
- Name, email, password inputs.
- "Create account" button.
- Error display.
- Link to #/login.
- On success: store tokens, navigate to #/onboarding.

### src/pages/OnboardingPage.ts
Onboarding is the FIRST conversation — it IS the chat interface, but narrower and without sidebar.
- Creates a new conversation on mount (POST /conversations).
- Renders same ChatBubble + ChatInput + WidgetRenderer as ChatPage.
- After 3 exchanges (turn_count >= 3 on the conversation), show a "Continue to your space →" button that navigates to #/chat.
- No sidebar. Simple centered layout. Onboarding framing copy at top: "Let's get to know you." in Cormorant Garamond.

### src/pages/ChatPage.ts
Main app shell:
- .app-shell (sidebar + main-content).
- Sidebar: conversation list + new conversation button.
- Main: header + .chat-container + .chat-messages + active widgets + .chat-input-bar.
- On mount: loadConversations(). If no conversations, create one.
- Subscribe to chatStore: re-render messages on change, show TypingIndicator when isTyping.
- When pendingWidget is set: render WidgetRenderer above ChatInput. onSubmit → sendMessage with widgetResponse, clearPendingWidget.
- Auto-scroll messages to bottom on new message.
- Show empty state if no messages: "Ask anything. This is your space."

### src/pages/ProfilePage.ts
.page-container centered:
- Heading: "Your Profile."
- Display compacted_summary (if set) in a card: "What I know about you" — quoted-journal aesthetic.
- List known traits (age, height, weight, lifestyle, goals) as a definition list.
- "Refresh summary" button → triggerCompaction() → update display.
- conversation_count shown: "X conversations to date."
- Edit traits: inline fields for age, height_cm, weight_kg, lifestyle — save with PATCH /users/me/traits.

### src/pages/NotFoundPage.ts
Centered: "404 — Page not found." Back to #/chat link.

## quality_requirements
- Every page/component: loading state, error state, empty state.
- No innerHTML with unsanitized user content — use textContent or createElement.
- All event listeners cleaned up on page unmount (router calls cleanup functions if returned).
- TypeScript strict mode — no `any`, no non-null assertions without guard.
- Accessible: all inputs have labels, buttons have aria-labels where icon-only.

## do_not_build
- Any Python files
- Any CSS files (Session B owns all CSS)
- Any backend routes

## handoff
Write to Claude/PersonalAssistant/handoffs/HANDOFF_G.md

# HANDOFF_G — PersonalAssistant — Session G
plan_version: 1.0
files_produced: | file | drive_path | status | notes |
deps_added: none (pure vanilla TS)
deviations: [or none]
interfaces_exposed:
  - router: navigate(path), initRouter()
  - authStore: initAuth(), loginUser(), registerUser(), logoutUser(), subscribeToAuth()
  - chatStore: loadConversations(), sendMessage(), subscribeToChat()
  - WidgetRenderer: WidgetRenderer(widget, onSubmit) → HTMLElement
watch_out_for:
  - CSS import order in main.ts matters — tokens must be first
  - WidgetRenderer hides itself after submit — ChatPage should also clearPendingWidget() in store
  - OnboardingPage creates a conversation on mount — guard against double-creation on re-render
  - Auto-scroll: use scrollTop = scrollHeight after DOM update (after requestAnimationFrame)

HANDOFF STATUS: COMPLETE

---
▶ WHAT NEXT
════════════════════════════════════════
New chat → connect Google Drive → paste:
"Read STITCH_A.md from Claude/PersonalAssistant/ in Google Drive and begin."
════════════════════════════════════════
