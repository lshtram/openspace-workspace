---
description: Create a new Architectural Decision Record. Usage: /adr "Title"
---

1.  **Parse Arguments**:
    -   Capture "Title" from arguments.

2.  **Execute Command**:
    -   // turbo
    -   Execute: `./agent adr "<Title>"`

3.  **Review**:
    -   Notify user: "ADR created. Please review the new file in `.agent/adrs/`."
