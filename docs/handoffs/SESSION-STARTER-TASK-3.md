# Session Starter: Phase 0 Task 3 (Hub API Simplification)

Copy/paste into the next agent session:

```text
I need to start Phase 0, Task 3 for Drawing Modality V2 in /Users/Shared/dev/openspace.

Read first:
1) /Users/Shared/dev/openspace/docs/handoffs/SESSION-CLOSURE-TASK-2-2026-02-11.md
2) /Users/Shared/dev/openspace/docs/plans/PHASE-0-IMPLEMENTATION-PLAN.md
3) /Users/Shared/dev/openspace/runtime-hub/src/hub-server.ts
4) /Users/Shared/dev/openspace/runtime-hub/src/services/ArtifactStore.ts

Task 3 scope:
- Add `/files/:path` as alias to existing `/artifacts/:path`
- Add unified context endpoints:
  - POST `/context/active`
  - GET `/context/active`
- Keep backward compatibility:
  - `/artifacts/*` must continue to work
  - `/context/active-whiteboard` must continue to work (deprecate but keep)
- Update runtime-hub docs for new endpoints and deprecations

Constraints:
- Keep all file operations constrained to `<project-root>/design`
- Keep path traversal protections intact
- Do not start Task 4 (MCP consolidation)
- Do not fix deferred Whiteboard UI regressions in this task

Validation required:
- runtime-hub tests (or targeted API verification if tests unavailable)
- manual curl checks for all old/new endpoints
- report exact compatibility behavior

Deliverable:
- concise change report + endpoint matrix (old/new + status)
```
