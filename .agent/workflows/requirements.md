---
description: Initialize or update the PRD. Usage: /requirements
---

1.  **Context Check**:
    -   Ensure we are in an active task (Standard or Light).
    -   Read `.agent/scratchpad/CURRENT_TASK`.

2.  **Initialize PRD**:
    -   // turbo
    -   Check if `PRD_current.md` exists in the local `.agent/scratchpad/` (or worktree equivalent).
    -   If NO:
        -   Read `.agent/templates/PRD.md`.
        -   Create `PRD_current.md` using the template.
        -   Pre-fill "Context" with the User's initial request if listed in `task.md`.

3.  **Prompt User**:
    -   "PRD initialized. Please review `PRD_current.md` and provide specific requirements."
