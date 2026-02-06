---
description: How to create high-quality code walkthroughs
---

# Creating Code Walkthroughs

When creating a walkthrough artifact to explain code logic or implementation details to the user, follow these standards:

1.  **Structure**: Break the walkthrough down into logical sections corresponding to the user's requirements or the execution flow.
2.  **Code Evidence (CRITICAL)**:
    *   For every key logic point, you **MUST** quote the specific code block responsible for it.
    *   You **MUST** provide a clickable file link to the code using the format: `[filename:L10-20](file:///absolute/path/to/file#L10-20)`.
    *   Do not just describe what the code does; show the code that does it.
3.  **Context**: Explain *why* the code works this way and how it maps to the high-level design.
4.  **Verification**: Explicitly state if the logic has been verified (e.g., via "Implements" checklist).
