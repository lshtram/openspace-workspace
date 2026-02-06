---
description: Merge, audit, and cleanup. Usage: /finish-task
---

1.  **Verify**:
    - // turbo
    - Execute: `npm test && npm run lint && npm run typecheck` from `openspace-client/`
    - If fails -> STOP. Fix errors first.

2.  **Doc Sync Check**:
    - **Action**: Use `doc-maintainer` skill to ensure docs match code.
    - **Constraint**: Has `docs/TODO.md` been updated?
    - If no -> STOP. Update docs first.

3.  **Commit Logic**:
    - Execute: `git add .`
    - Execute: `git commit -m "feat: <CURRENT_TASK>"`
    - Notify user: "Task committed to main."

4.  **Cleanup**:
    - Provide a summary of the work done (Walkthrough).
