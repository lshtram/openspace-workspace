---
id: REQ-P0-T2-WHITEBOARD-USEARTIFACT
author: oracle_2b11
status: APPROVED
date: 2026-02-11
task_id: drawing-modality-v2-phase0-task2
---

# Requirements: Phase 0 Task 2 - Whiteboard useArtifact Refactor

## Objective
Refactor the whiteboard modality to use the universal `useArtifact()` hook with zero regressions, while establishing unit-test coverage for the hook prior to refactor work.

## In Scope
- Add unit tests for `useArtifact()` before refactoring the whiteboard.
- Refactor `openspace-client/src/components/whiteboard/WhiteboardFrame.tsx` to use `useArtifact()` for:
  - `.excalidraw` layout data
  - `.graph.mmd` Mermaid logic
- Remove `openspace-client/src/components/whiteboard/useDebouncedSave.ts` after refactor stabilizes.
- Preserve existing endpoint usage (`/artifacts`) for Task 2.
- Maintain existing UI behavior and error handling (error UI + retry).
- Add fresh documentation for the refactor and new/updated files (non-UI).

## Out of Scope
- Hub API `/files` endpoint (Task 3).
- MCP consolidation (Task 4).
- New UI features or layout changes.

## Functional Requirements
1. Whiteboard loads existing `.excalidraw` and `.graph.mmd` data via `useArtifact()`.
2. Auto-save triggers after debounce (1s default) for both artifacts.
3. Multi-window sync via BroadcastChannel works (manual two-tab test).
4. SSE updates from MCP (`whiteboard.update`) trigger reconciliation and UI update.
5. "Send to Agent" flow remains intact (mermaid + PNG snapshot).
6. Diagram type persists across reloads.
7. Error UI shows retry action on load failures.

## Non-Functional Requirements
1. Zero regressions against current whiteboard feature set.
2. Unit tests for `useArtifact()` are in place before refactor changes.
3. Observability: any new external I/O added in this task must include start/success/failure logs with timestamps.
4. Minimal diff where possible, but prioritize correctness over preserving old code.

## Verification
- Unit tests: `npm run test:run` in `openspace-client`.
- Manual tests:
  - Multi-window sync (two tabs).
  - SSE update via MCP (`whiteboard.update`).
  - Error UI (missing `.graph.mmd`).
  - Send-to-Agent workflow.
- Performance spot-check via Chrome DevTools (load + save timings).

## Acceptance Criteria
- All functional requirements pass.
- Unit tests for `useArtifact()` pass and cover load, save debounce, 404 handling, SSE update, BroadcastChannel sync, and loop prevention.
- Whiteboard behavior matches current functionality with no UI regressions.
