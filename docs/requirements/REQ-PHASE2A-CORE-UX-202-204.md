---
id: REQ-PHASE2A-CORE-UX-202-204
author: oracle_c3e9
status: DRAFT
date: 2026-02-11
task_id: phase2a-core-ux-202-204
---

# Requirements: Phase 2A Core UX Parity (202, 203, 204)

## Objective
Deliver the remaining Phase 2A feature parity items for the OpenSpace React client in the required order: file watcher integration, session navigation shortcuts, and duration timer per turn.

## In Scope
1. Feature 202: File Watcher Integration.
2. Feature 203: Session Navigation Shortcuts (`Alt+ArrowUp`, `Alt+ArrowDown`).
3. Feature 204: Duration Timer per Turn.
4. Unit/integration test updates for each feature.
5. Shortcut configurability via Settings and portable keyboard config file import/export.
6. Post-completion consolidation of these requirements into canonical parity docs/memory (no long-lived orphan requirement doc).

## Out of Scope
- Theme, font, language, and command palette expansion tasks.
- New modality work and whiteboard backlog items.
- Backend protocol changes outside existing event contracts.

## Functional Requirements

### FR-202 File Watcher Integration
1. The client must react to server-side file watcher events and refresh file tree state without manual page refresh.
2. The file watcher update path must invalidate or refresh the relevant file data for the currently active directory only.
3. Event handling must not interfere with existing message/session SSE event handling.
4. Any new polling/retry added for watcher resilience must enforce a shared `MIN_INTERVAL` in both success and failure paths.

### FR-203 Session Navigation Shortcuts
1. `Alt+ArrowUp` selects the previous session in the visible ordered session list.
2. `Alt+ArrowDown` selects the next session in the visible ordered session list.
3. Navigation wraps at list boundaries.
4. These actions must be configurable shortcut bindings (not hardcoded-only).
5. Default bindings are `Alt+ArrowUp` and `Alt+ArrowDown`, but users can rebind in Settings.
6. Shortcuts must not trigger when focus is in editable inputs or content-editable regions.
7. Behavior must preserve existing global shortcuts and command palette interactions.

### FR-203A Portable Keyboard Configuration
1. The app must support exporting keyboard shortcut mappings to a portable JSON file (default file name: `openspace-shortcuts.json`).
2. The app must support importing that JSON file to restore/apply shortcut mappings on another installation.
3. Import must validate schema/version and reject invalid files with clear user feedback.
4. Import behavior must be deterministic: merge with defaults for missing keys and preserve required action coverage.
5. Export/import must be reachable from Settings > Shortcuts and require no manual localStorage editing.

### FR-204 Duration Timer per Turn
1. Each completed assistant turn must display elapsed duration derived from turn start and completion timestamps.
2. In-progress turn must display a live "thinking" duration.
3. Duration format must be human-readable:
   - `< 1s` for sub-second,
   - `Xs` for seconds,
   - `Xm Ys` for minute-plus durations.
4. Timer rendering must remain stable across streaming updates and historical message reloads.

## Non-Functional Requirements
1. Interface-first: introduce/update TypeScript interfaces before implementation use.
2. Defensive programming: public entry points for new hooks/helpers must begin with assertions/guards.
3. Observability: external I/O paths must log start/success/failure with timestamps.
4. Minimal diff, maintain current visual language and interaction patterns.

## Verification Matrix
- FR-202:
  - `useSessionEvents` (or equivalent event layer) tests covering file watcher event handling and directory scoping.
  - UI validation: file tree refreshes after synthetic watcher event.
- FR-203:
  - App-level keyboard tests for `Alt+ArrowUp` and `Alt+ArrowDown` including wrap behavior.
  - Regression tests for editable target guard.
- FR-203A:
  - Settings tests for shortcut export payload/schema and import validation.
  - End-to-end or integration test confirming exported JSON can be imported in a fresh settings state.
- FR-204:
  - Message/turn rendering tests for duration formatting and pending/completed states.
  - Regression tests for existing pending indicator behavior.

## Documentation Consolidation Requirement
1. This task-scoped REQ document is temporary orchestration material.
2. On closure, accepted requirements and verification outcomes must be merged into canonical locations:
   - `docs/plans/FEATURE-PARITY-PLAN.md` (feature status and acceptance)
   - `.opencode/context/01_memory/progress.md` (task state)
   - relevant long-lived requirements index or verification docs if needed
3. The task must not end with fragmented "random" standalone requirements that are disconnected from maintained docs.

## Acceptance Criteria
1. Features 202, 203, and 204 are implemented and merged in order.
2. Updated tests pass for affected modules.
3. `npm run check` passes in `openspace-client`.
4. No regressions in existing SSE message streaming and session selection UX.
