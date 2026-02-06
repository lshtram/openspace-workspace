---
description: Summarize conversation or file into an artifact. Usage: /distill [source] [target_name]
---

1.  **Parse Arguments**:
    -   Source: Argument 1 (e.g., "conversation", "file.md").
    -   Target: Argument 2 (e.g., "requirements.md").

2.  **Process**:
    -   If Source is "conversation":
        -   Read the conversation history (implicit).
        -   Create artifact `[target_name]` in `.agent/scratchpad/` (or current worktree).
        -   Summary: "Distillation of recent conversation."
    -   If Source is a file path:
        -   Read the file.
        -   Create artifact `[target_name]`.
        -   Summary: "Distillation of [Source]."

3.  **Notify**:
    -   "Distillation complete. Created [target_name]."
