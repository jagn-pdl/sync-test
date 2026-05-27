# STITCH_A — PersonalAssistant — Integration Pass

identity:
  role: Wire all layers together. Audit quality. Fix violations. Generate missing infra files. Zero new features.
  drive_folder: Claude/PersonalAssistant/
  reads: RULES.md, PLAN.md, all HANDOFFs (B through G)

## startup
1. Print:
   ════════════════════════════════════════
   ⚠️ IF THIS SESSION IS CUT OFF:
   New chat → connect Google Drive → paste:
   "Resume STITCH_A for Claude/PersonalAssistant/ — check Drive for completed files and continue."
   ════════════════════════════════════════
2. Read RULES.md from Drive.
3. Run already_run_guard (RULES.md).
4. Read PLAN.md and all handoffs from Drive.
5. Run pre_integration_audit (RULES.md): verify every file claimed in every HANDOFF exists in Drive. For any absent file: print 🚫 ABSENT IN DRIVE: [path] — generating now. Generate from PLAN.md contracts.

## integration_checklist

### Layer wiring — verify each:
- [ ] main.py includes all routers: auth, profile (Session E), chat + conversations (Session F). Check prefix and tags.
- [ ] app.core.deps.get_current_user imported and used in all protected routes (auth, chat, conversations, profile).
- [ ] compact_profile in compaction.py receives ollama_client correctly — check Session F passes `ollama_client` singleton.
- [ ] BackgroundTasks in chat router correctly creates a new AsyncSession (not reuse request session which closes).
- [ ] ChromaDB PersistentClient path reads from settings.CHROMA_PERSIST_DIR — not hardcoded.
- [ ] Alembic migration 0001 creates all three tables with correct FK constraints.
- [ ] Frontend api/client.ts /api prefix matches nginx proxy strip rule.
- [ ] CSS import order in main.ts: tokens → reset → typography → layout → components → animations → chat → widgets → forms.
- [ ] Widget submission flow: WidgetRenderer onSubmit → chatStore.sendMessage(text, widgetResponse) → ChatRequest.widget_response → backend stores as user message → response has no widget if answer received.
- [ ] Onboarding: first-login guard in router checks conversation count OR a flag in authStore.
- [ ] docker-compose: backend depends_on ollama with condition: service_healthy.
- [ ] .env.example has all vars consumed by Settings class.

### Fix protocol
For each integration gap:
1. State: "INTEGRATION FIX: [what] in [file]"
2. Output the complete fixed file.
3. Overwrite to Drive.

## quality_audit (RULES.md quality_standards)
For every file from every session, check:
- [ ] No placeholder / TODO / commented-out code
- [ ] No `any` types (TypeScript)
- [ ] Loading, error, empty states on all data-fetching components
- [ ] Design system tokens only — no hardcoded colors/fonts/spacing
- [ ] All interactive elements: hover + focus states
- [ ] No console.log in production code
- [ ] All error states handled explicitly (Python: no bare except; TS: typed catch)

Flag each violation as:
`⚠️ QUALITY: [file] — [issue] — fixing`
Then output the fixed file.

## visual_consistency_pass
- Verify all UI pages use only CSS classes defined in Session B's design system.
- Verify Cormorant Garamond used for user messages / headings, DM Mono for assistant messages / labels.
- Verify amber accent (#c97d2e) only appears via var(--color-accent) — never hardcoded.
- Verify all animations use var(--transition-base) or var(--transition-slow) — no hardcoded ms.

## infrastructure_check (RULES.md)
Verify these exist in Drive:
- [ ] src/backend/requirements.txt ✓ (Session C)
- [ ] src/frontend/package.json ✓ (Session C)
- [ ] src/frontend/vite.config.ts ✓ (Session C)
- [ ] docker-compose.yml ✓ (Session C)
- [ ] .env.example ✓ (Session C)
- [ ] DEPLOY.md ✓ (Session C)
- [ ] src/backend/alembic.ini ✓ (Session C)
- [ ] src/backend/seed.py ✓ (Session D)

Any missing: generate from PLAN.md. Print: 🚫 ABSENT — generating.

## final_tasks
1. Generate README.md:
   - Project overview (2 paragraphs)
   - Architecture diagram (ASCII)
   - Quick start (5 steps: clone → .env → docker compose up → open browser → register)
   - Session order reference
   - How memory compaction works (1 paragraph)
   - Tech stack table

2. Generate final DEPLOY.md (overwrite Session C version with any corrections discovered during stitch).

3. Dead code sweep:
   - Any imported symbol not used → remove import
   - Any defined function not called → remove if not part of a public interface
   - Any CSS class defined but never referenced in TS → note in handoff (do not remove CSS — may be used dynamically)

4. Naming consistency audit:
   - Python: snake_case for functions/vars, PascalCase for classes
   - TypeScript: camelCase for functions/vars, PascalCase for interfaces/classes
   - File names: kebab-case for CSS, camelCase for TS components

## assigned_files
All files from Sessions B, C, D, E, F, G — read-modify only.
New files generated here: README.md, DEPLOY.md (final overwrite).

## do_not_do
- Add new features
- Change domain models
- Add new API routes
- Change the visual design direction

## stitch_handoff
Write to Claude/PersonalAssistant/handoffs/STITCH_HANDOFF_A.md

# STITCH_HANDOFF_A — PersonalAssistant — Pass A
plan_version: 1.0
files_fixed: | file | changes |
files_generated: | file | reason |
quality_violations_fixed: | file | issue | fix |
layer_violations_fixed: | file | issue | fix |
out_of_scope: | file | issue | recommendation |
remaining: none — proceed to SCRIPT

HANDOFF STATUS: COMPLETE

---
▶ WHAT NEXT
════════════════════════════════════════
New chat → connect Google Drive → paste:
"Read SESSION_SCRIPT.md from Claude/PersonalAssistant/ in Google Drive and begin."
════════════════════════════════════════
