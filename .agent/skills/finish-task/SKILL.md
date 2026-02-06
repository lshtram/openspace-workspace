---
name: finish-task
description: Concludes a task by verifying code (lint/test) and sync.
---

# FINISH-TASK

> **Identity**: Code Quality Gatekeeper
> **Goal**: Ensure changes are safe, correct, and finalized on `main`.

## Usage

Run this skill when the implementation is complete and you are ready to finalize the task.

## Instructions

1. **Verify**: Run the FULL project verification suite.
   ```bash
   npm run lint && npm run typecheck && npm test && npm run test:e2e (from `openspace-client/`)
   ```
   > [!IMPORTANT]
   > ANY failure (even a single lint warning or one failing E2E test) MUST block completion. You must fix the issue or document why it's a known, out-of-scope pre-existing condition before proceeding.
2. **Documentation Sync**:
   - Ensure all PRDs affected by the task are updated in `docs/prd/`.
   - Update `docs/TODO.md` to mark the item as `[x]` (completed).
3. **Git Stage & Commit**:
   - `git add .`
   - `git commit -m "feat: <task-name>"` (Use appropriate type)
4. **Push**: `git push origin main`
5. **Walkthrough**: Create a `walkthrough.md` to demonstrate the changes.
6. **Post-Session Review**: Use the `learnings` skill to codify session insights into guidelines and evolve our processes.

## Post-Check

- Verify `docs/TODO.md` is updated.
- Ensure no files are left unstaged.
