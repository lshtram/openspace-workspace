# Draft: OpenSpace Product Definition

## Requirements (confirmed)
- OpenSpace is a multi-modal VibeCoding IDE where the user acts as team lead/PM, not a file-obsessed coder.
- Input and output modalities are decoupled (any input can pair with any output).
- Voice input is already available (Whisper/VoiceInk).
- Voice output (TTS) is essential and must be integrated in MVP.
- Voice output should also cover short agent replies (narrator voice), not just presentations.
- Narrator voice should be brief, friendly, colleague-like summaries (1–3 sentences), pointing users to deeper artifacts (console logs, presentation, files).
- Avoid long TTS lectures by default; detailed content remains in artifacts/presentations unless user opts in.
- Voice output behavior must be fully configurable (on completion only, on errors, on every response, or off). Easy to toggle based on user mood and flow type.
- Provide a global artifact index (project map) that includes everything, beyond file/folder view.
- Provide contextual artifact indexes (view filtered to current flow/context), toggled on demand.
- Contextual indexes examples: requirements view (requirements + traceability), debugging view (feature artifacts + relevant code).
- Artifact navigation should support multi-dimensional classification (type, date, component/feature, flow stage), with table-like sorting and filtering.
- Users should be able to quickly simplify/restore complex views with a button/toggle.
- Default artifact index view should be a VSCode-like file tree (folders/files), with advanced filters available as optional views.
- File tree should include all artifacts (requirements, diagrams, presentations, logs), since artifacts are saved as files.
- Default artifact file organization is a mixed tree; users control their own structure. System may provide a default suggestion via guidelines but does not enforce cataloging.
- Artifact metadata should not be encoded in file names. Use file extensions + optional sidecar metadata (e.g., JSON/INDEX) when needed.
- Interaction guideline: group questions into blocks; avoid one-at-a-time questioning.
- Prefer file-system metadata and/or YAML front matter for artifact metadata when possible.
- If an index/JSON sidecar is used, it must be safe and recoverable (avoid single-point corruption).
- Sketch input should translate to agent understanding first; output modality (preview/presentation/text) is chosen based on context and complexity.
- Voice controls should include quick toggle(s) and keybinds; allow on-demand TTS activation.
- Presentation artifacts should be stored as Markdown whenever possible; avoid persisting HTML output.
- Rendering should be handled by a replaceable presentation component (Reveal.js now, but swappable).
- All major subsystems (voice, sketching, presentation, annotation, indexing) must be modular and replaceable via clean interfaces.
- Default workflow exists but must be fully customizable via AGENTS.md / PROCESS.md / GUIDELINES.md.
- Users must be able to interrupt agent work at any time (voice, ESC, typing, drawing). Agent interruption of users is later phase.
- Primary MVP output view is the agent console (streaming logs), not a terminal.
- Documentation is mostly MD, but non-text truth modalities (audio/image/video) are allowed when translation to text is not possible.
- Whiteboard is a vital modality for input/output, but not the whole IDE shell.
- Avoid UI morphing that reduces user control; prioritize clarity, stability, and discoverability. Nothing hidden.
- Structured dashboard (grid/organized views) and reporting dashboards (Monday/ClickUp style) are important but later.
- Sketching supports UI wireframes, architecture, flowcharts/UML, and freeform. Accepts captured photos of real-world sketches.
- Sketching combines freeform and structured tools (boxes, lines, symbols).
- Annotation is a distinct modality: markup/strike/replace on top of existing artifacts (created by user or agent).
- Annotation-driven change is a must-have capability.
- Presentation output: agent should create slide decks and narration scripts; use TTS to present; user may control slide navigation.
- Spatial orientation of the platform must be designed with future goals/features in mind; phase map should include future capabilities.
- Product roadmap should explicitly map future phases and features (not just MVP).

## Technical Decisions
- Primary MVP output = agent console streaming logs.
- Future hybrid view: evolving diagrams/whiteboard updates while agents work (advanced feature, not MVP).
- No fluid morphing across views; stable framework with clear map and navigation.

## Research Findings
- None yet (pending any external research).

## Open Questions
- MVP flow priority: which 1-2 end-to-end flows are required first if we must sequence?
- Presentation tech: confirm reveal.js vs alternative for slide generation.
- Default output combo for MVP: console only vs console + presentation.
- How to label and navigate artifacts so “nothing is hidden.”
- MVP refinement: minimum features required inside each selected flow.

## Scope Boundaries
- INCLUDE: Multi-modal input/output; voice input; agent console streaming logs; whiteboard modality; sketching (freeform + structured + image input); annotation-driven change; presentation output.
- EXCLUDE (for MVP): agent interrupts user; fluid UI morphing; full structured dashboard; reporting dashboards.
