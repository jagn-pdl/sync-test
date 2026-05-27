# QUICK_START — PersonalAssistant

## How this works
Each session prints a ▶ WHAT NEXT line when done. Copy-paste it into a new chat to start the next session.
Session A is done — your first ▶ WHAT NEXT is printed at the bottom of this document.

## If a session is cut off
Each session prints a rescue line at the very start. Copy it into a new chat — it resumes from the gap, nothing is redone.

## When complete
Download Claude/PersonalAssistant/src/ → copy .env.example to .env → fill JWT_SECRET_KEY → run bash run.sh.

## Session order
```
A (planning, done) → B (design system) → C (infra+config)
→ D (auth+DB) → E (vector+memory) ∥ F (backend API)
→ G (frontend) → STITCH_A (integration) → SCRIPT (run scripts)
```
Note: E and F can run in parallel (separate chats) after D is complete.

## All rescue lines (use if a session dies before printing its own)
| session | rescue line |
|---|---|
| SESSION_B | "Resume SESSION_B for Claude/PersonalAssistant/ — check Drive for completed files and continue." |
| SESSION_C | "Resume SESSION_C for Claude/PersonalAssistant/ — check Drive for completed files and continue." |
| SESSION_D | "Resume SESSION_D for Claude/PersonalAssistant/ — check Drive for completed files and continue." |
| SESSION_E | "Resume SESSION_E for Claude/PersonalAssistant/ — check Drive for completed files and continue." |
| SESSION_F | "Resume SESSION_F for Claude/PersonalAssistant/ — check Drive for completed files and continue." |
| SESSION_G | "Resume SESSION_G for Claude/PersonalAssistant/ — check Drive for completed files and continue." |
| STITCH_A | "Resume STITCH_A for Claude/PersonalAssistant/ — check Drive for completed files and continue." |
| SESSION_SCRIPT | "Resume SESSION_SCRIPT for Claude/PersonalAssistant/ — check Drive for completed files and continue." |
| SESSION_FIX | "Fix errors for Claude/PersonalAssistant/ — [paste full error/stack trace here]" |

---

▶ WHAT NEXT — Start here after Session A
════════════════════════════════════════
New chat → connect Google Drive → paste:
"Read SESSION_B.md from Claude/PersonalAssistant/ in Google Drive and begin."
════════════════════════════════════════
