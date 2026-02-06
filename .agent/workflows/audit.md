---
description: Run verification suite. Usage: /audit [docs]
---

1.  **Parse Arguments**:
    -   Check for "docs" argument.

2.  **Execute Command**:
    -   // turbo
    -   If "docs":
        -   Execute: `./agent audit --docs`
    -   Else:
        -   Execute: `./agent audit`

3.  **Report**:
    -   If success: "System verified. 🟢"
    -   If failure: "Issues detected. See output above."
