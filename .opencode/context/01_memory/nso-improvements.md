---
id: NSO-IMPROVEMENTS-CANONICAL
author: oracle_9d3a
status: APPLIED
date: 2026-02-12
task_id: nso-improvement-standardization
---

# NSO Improvements Canonical Backlog

## Policy
- Canonical location for all NSO improvement suggestions: `.opencode/context/01_memory/nso-improvements.md`.
- Task-local and session-local documents may propose items, but must cross-link here.

## Applied Entries (2026-02-12 NSO Overhaul)

The following entries were applied as part of the comprehensive NSO overhaul based on the Superpowers analysis. See `docs/plans/NSO-improvement-plan-12-Feb.md` for full details.

### NSO-2026-02-11-001
- proposal: Add explicit role ownership and mandatory gates for requirements, architecture, code, tests, workflow-step enforcement.
- status: **APPLIED** (2026-02-12)
- applied_ref: `instructions.md` Role Ownership Matrix, all workflow docs updated with gates

### NSO-2026-02-11-002
- proposal: Add Session Closing Protocol for significant work sessions.
- status: **APPLIED** (2026-02-12)
- applied_ref: `instructions.md` Session Closing Protocol section

### NSO-2026-02-11-003
- proposal: Add Librarian documentation hygiene audit cadence and checklist.
- status: **APPLIED** (2026-02-12)
- applied_ref: `prompts/Librarian.md` documentation hygiene checklist

### NSO-2026-02-11-004
- proposal: Add handoff quality gates template checklist.
- status: **APPLIED** (2026-02-12)
- applied_ref: All workflow docs now have formal contracts + gates

### NSO-2026-02-11-005
- proposal: Standardize retry interval floors across polling/retry services.
- status: **APPLIED** (2026-02-12)
- applied_ref: `instructions.md` MIN_INTERVAL=1000ms universal standard

### NSO-2026-02-11-006
- proposal: Extend gate checks to verify minimum TTL/interval safety in tests.
- status: **APPLIED** (2026-02-12)
- applied_ref: `prompts/Janitor.md` harness checks

### NSO-2026-02-11-007
- proposal: Enforce explicit fetch observability logs (start/success/failure plus timestamp).
- status: **APPLIED** (2026-02-12)
- applied_ref: `instructions.md` observability requirement with code example

### NSO-2026-02-12-008
- proposal: Create dedicated TDD enforcement document.
- status: **APPLIED** (2026-02-12)
- applied_ref: `skills/tdd/SKILL.md` (~300 lines)

### NSO-2026-02-12-009
- proposal: Create systematic debugging process document.
- status: **APPLIED** (2026-02-12)
- applied_ref: `skills/systematic-debugging/SKILL.md` (~300 lines)

### NSO-2026-02-12-010
- proposal: Add Verification Gate Function.
- status: **APPLIED** (2026-02-12)
- applied_ref: `skills/verification-gate/SKILL.md` (~250 lines)

### NSO-2026-02-12-011
- proposal: Split Phase 4 validation into two stages.
- status: **APPLIED** (2026-02-12)
- applied_ref: Janitor Stage A (spec) + Stage B (harness) + CodeReviewer as Phase 4B

### NSO-2026-02-12-012
- proposal: Adopt rationalization prevention meta-pattern.
- status: **APPLIED** (2026-02-12)
- applied_ref: All new skills and prompts include rationalization tables + red flags

### NSO-2026-02-12-013
- proposal: Add brainstorming interaction design to Discovery phase.
- status: **APPLIED** (2026-02-12)
- applied_ref: `prompts/Analyst.md` one-question-at-a-time protocol, YAGNI check

### NSO-2026-02-12-014
- proposal: Enhance GIT WORKTREE PROTOCOL with safety verification.
- status: **APPLIED** (2026-02-12)
- applied_ref: `prompts/Oracle.md` Phase 0 safety checks, `instructions.md` worktree protocol

### NSO-2026-02-12-015
- proposal: Add anti-performative agreement to all agent prompts.
- status: **APPLIED** (2026-02-12)
- applied_ref: `instructions.md` forbidden language table, `prompts/CodeReviewer.md` anti-performative agreement

### NSO-2026-02-12-016
- proposal: Add question protocol for Builder.
- status: **APPLIED** (2026-02-12)
- applied_ref: `prompts/Builder.md` QUESTION GATE
