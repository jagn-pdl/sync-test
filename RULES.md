# RULES.md — PersonalAssistant

## drive_write
Before writing any file: check if it exists — overwrite it, never create alongside (prevents filename(1) duplicates).
Write each file immediately after producing it. Print: ✅ Drive: written [path]
If the Drive write fails, print the full file contents in chat:
  ⚠️ DRIVE WRITE FAILED — [path]
  Upload this file manually to: Claude/PersonalAssistant/[path]
  ─────────────────────────────
  [full file contents]
  ─────────────────────────────
Continue to the next file regardless. Never stop because of a Drive write failure.

## already_run_guard
At startup: check if this session's HANDOFF exists in Drive and ends with HANDOFF STATUS: COMPLETE.
If yes, print and wait:
  ⚠️ SESSION ALREADY COMPLETE.
    i)  Redo — overwrite everything
    ii) Resume — fill gaps only
    iii) Cancel

## resume (when "resume" received or option ii chosen)
1. Pull PLAN.md + this session's assigned files from Drive.
2. Cross-reference "files_to_produce" against what exists in Drive.
3. Print:
   ✅ Complete: [list]
   ✂️  Partial (will redo): [list]
   ❌ Missing (will generate): [list]
4. Produce only partial + missing. Overwrite to Drive immediately.
5. Produce HANDOFF, write to Drive.

## quality_standards (every session producing code)
- No placeholder, commented-out, or TODO code.
- No `any` types. All error states handled explicitly.
- Every data-fetching component has loading, error, and empty states.
- Use design system tokens — no hardcoded colors, fonts, or magic spacing numbers.
- All interactive elements have hover and focus states.
- Responsive: mobile, tablet, desktop.
- No console.log left in produced code.

## layer_boundary
All data crossing DB→API→UI: cast ORM types (Decimal, Date, raw relations) to plain types before UI use.

## shared_types
Parallel sessions never locally declare a type already in PLAN.md shared_contracts — import it.

## pre_integration_audit (every STITCH)
Before fixing any file, verify every assigned file exists in Drive.
If claimed complete by prior HANDOFF but absent:
  Print: 🚫 ABSENT IN DRIVE: [path] — generating now
  Generate from PLAN.md contracts.

## infrastructure_check (final STITCH only)
Verify in src/: dependency manifests (requirements.txt, package.json), .env.example, framework configs, DEPLOY.md.
Any missing → generate from PLAN.md. Missing deliverable, not a new feature.

## handoff_format
Write to Claude/PersonalAssistant/handoffs/[HANDOFF_X].md

# HANDOFF_X — PersonalAssistant — Session X
plan_version: [e.g. 1.0]
files_produced: | file | drive_path | status | notes |
deps_added: [exact versions, or: none]
deviations: [what changed and why, or: none]
interfaces_exposed: [exact signatures]
watch_out_for: [edge cases]

HANDOFF STATUS: COMPLETE
