# Platform Architecture Decision

Version: 0.1 (Draft)
Date: 2026-02-04
Status: Decision Pending

## Decision Framing
OpenSpace is a multi-modal IDE where input/output modalities are decoupled and major subsystems are replaceable. The platform foundation should maximize flexibility for multi-modal UI, reduce long-term maintenance risk, and accelerate MVP delivery. This decision is higher impact than tool choices (voice, presentation, sketching) because those components are plug-and-play.

## Option A: Web-first (Electron wrapper)
Build a web application as the primary platform, then package it with Electron for desktop distribution.

Pros:
- UI freedom for multi-modal layouts, whiteboard, and rich visualization.
- Faster MVP iteration with standard web tooling.
- Clear separation of core logic and renderer adapters.
- Easier to support alternative shells (PWA, native wrapper) later.

Cons:
- Must build or re-implement IDE affordances (file tree, editor panes, etc.).
- Fewer built-in editor features compared to VS Code.

## Option B: VS Code fork
Fork VS Code OSS and adapt it into a multi-modal environment.

Pros:
- Mature editor experience out of the box.
- Extension ecosystem and existing IDE conventions.
- File tree, search, and editor infrastructure already present.

Cons:
- VS Code is editor-centric; multi-modal UI is not a first-class pattern.
- Higher maintenance burden to keep up with upstream changes.
- Harder to deviate from VS Code navigation and mental model.
- Multi-modal canvas and custom artifact views may fight core layout assumptions.

## Comparative Matrix

| Criteria | Web-first (Electron) | VS Code fork |
| --- | --- | --- |
| Multi-modal UI flexibility | High | Medium/Low |
| Time to MVP | Faster | Slower |
| Long-term maintenance | Lower | Higher (upstream merge burden) |
| Editor capabilities day 1 | Medium | High |
| Replaceable components | Cleaner | Harder (tight coupling) |
| Platform portability | High | Medium |
| Fit to OpenSpace vision | Strong | Mixed (editor-first bias) |

## Recommendation
Choose Web-first (Electron wrapper) as the initial foundation.

Rationale:
- The OpenSpace vision prioritizes multi-modal interaction and artifact-driven workflows over traditional editing efficiency.
- Web-first allows a clean architecture with replaceable subsystems and a UI designed around modalities, not files.
- Faster MVP delivery with less risk of fighting VS Code core assumptions.

## Risks and Mitigations
- Risk: Rebuilding standard IDE affordances (search, editor panes) slows MVP.
  - Mitigation: Implement a minimal file tree and editor view first; add advanced features later.

- Risk: Performance issues with complex canvases and rich layouts.
  - Mitigation: Keep MVP scope tight; optimize after proving core flows.

- Risk: Losing extension ecosystem benefits.
  - Mitigation: Treat extensibility as a future phase; build a minimal plugin interface for OpenSpace modalities.

## Future Flexibility (Replaceable Components)
Regardless of platform, OpenSpace keeps subsystems modular and swappable:
- Voice input/output engines can change without altering workflows.
- Presentation renderer can be replaced while keeping Markdown artifacts.
- Sketching engine can be swapped behind a stable adapter.

This design keeps tool choices plug-and-play even after the platform foundation is set.
