# OpenSpace: Key Conversations & Decisions

**Purpose**: This document captures critical conversations and decisions from planning sessions that must be remembered across sessions. These are the "golden rules" that inform all future work.

**Last Updated**: 2025-02-05  
**Source Sessions**: Session 002 (OpenSpace MVP Planning)

---

## Architecture & Philosophy

### 1. Shell-First Architecture (NON-NEGOTIABLE)

**Decision**: OpenSpace is a SHELL-FIRST development environment, not an IDE.

**Key Conversation**:
> "Voice, whiteboard, and presentations are PRIMARY. Code editing is SUBORDINATE."

**What This Means**:
- Artifacts (voice recordings, whiteboard drawings, presentations) are **first-class citizens**
- Code editing (Monaco) is **one modality among many**, not the center
- The shell (terminal/REPL) is the primary interaction surface
- We're NOT building "VS Code with voice" - we're building a new paradigm

**Why This Matters**:
- Prevents "IDE gravity" - the tendency to become just another code editor
- Keeps focus on multi-modal interaction (voice, drawing, presenting)
- Ensures artifacts don't become second-class "attachments" to code

**Architecture Implications**:
- File tree shows ALL artifacts (`.voice`, `.whiteboard`, `.slides`) alongside code
- Agent console is NOT a sidebar - it's a primary surface
- Whiteboard is NOT an annotation layer - it's a full modality
- Voice is NOT dictation - it's a primary input method

**Rejected Alternatives**:
- ❌ Theia/VS Code fork - Too much IDE DNA, would fight shell-first vision
- ❌ Editor-centric with voice plugin - Reinforces wrong hierarchy
- ❌ Separate apps for each modality - Breaks unified experience

---

### 2. Swappability is Non-Negotiable

**Decision**: Every major subsystem MUST be behind stable interfaces with adapter pattern.

**Key Conversation**:
> "Users should be able to swap TTS engines, whiteboard libraries, presentation renderers via config - WITHOUT touching code."

**What This Means**:
- `IVoiceInput`, `IVoiceOutput`, `IWhiteboard`, `IPresentationRenderer`, `ITerminal`, `ICodeEditor` interfaces
- Adapter pattern for ALL implementations (WebSpeechTTSAdapter, KokoroTTSAdapter, etc.)
- Config-driven selection: `{ voiceOutput: 'web-speech' | 'kokoro' }`
- Progressive enhancement: Start simple (Web Speech API), upgrade on demand (Kokoro TTS)

**Why This Matters**:
- Users can experiment with different implementations without rewrite
- We can add new implementations without breaking existing code
- Testing becomes easier (mock interfaces, not real libraries)
- Future-proof: technologies change, interfaces stay stable

**Architecture Pattern**:
```typescript
// Interface (stable contract)
interface IVoiceOutput {
  initialize(config: VoiceConfig): Promise<void>;
  speak(text: string): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
  on(event: 'start' | 'end' | 'error', callback: Callback): void;
}

// Adapters (swappable implementations)
class WebSpeechTTSAdapter implements IVoiceOutput { /* ... */ }
class KokoroTTSAdapter implements IVoiceOutput { /* ... */ }

// Client code (implementation-agnostic)
const voiceOutput: IVoiceOutput = config.useKokoro 
  ? new KokoroTTSAdapter()
  : new WebSpeechTTSAdapter();
```

**Implementation Requirement**:
- EVERY task that introduces a major component MUST:
  1. Define interface FIRST (separate sub-task)
  2. Implement adapter (wrap chosen library)
  3. Write interface compliance tests
  4. Document swappability in acceptance criteria

**Examples**:
- Voice Output: Web Speech API (default) → Kokoro TTS (optional upgrade)
- Whiteboard: tldraw (recommended) → Excalidraw (alternative)
- Presentations: Reveal.js (default) → Spectacle (alternative)
- Terminal: xterm.js (industry standard, unlikely to change)

---

## Core Feature Decisions

### 3. Voice is Input Modality, NOT Enforced Workflow

**Decision**: Voice is a way to INPUT information. Users control OUTPUT structure.

**Key Conversation**:
> "User dictates thoughts. Tool captures. User structures output afterward. NO enforced formats."

**What This Means**:
- Voice input captures raw transcription + audio file
- User DECIDES what to do with it:
  - Convert to requirements document?
  - Add to whiteboard as annotations?
  - Keep as voice memo?
  - Transcribe to markdown?
- NO automatic "voice → requirements" pipeline
- NO enforced structure during capture

**Why This Matters**:
- Respects user agency (they control workflow, not the tool)
- Avoids premature structure (forces format before ideas are clear)
- Enables flexible use cases (brainstorming, documentation, meeting notes)

**Anti-Pattern to AVOID**:
- ❌ "Speak requirements and they auto-generate" - Too rigid
- ❌ "Voice activates specific modes" - Over-constrains input
- ❌ "Voice must follow template" - Kills spontaneity

**Correct Implementation**:
- ✅ Voice input saves: `.voice` file (audio) + `.transcript.md` (text)
- ✅ User can: View, edit transcript, convert to other formats (later)
- ✅ Agent can: Process transcript when user requests (not automatically)

---

### 4. Whiteboard: Dual-Mode is MANDATORY

**Decision**: Whiteboard MUST support BOTH freehand drawing AND structured shapes. Not one or the other.

**Key Conversation**:
> "Users need freehand for brainstorming AND structured shapes for diagrams. Dual-mode, not either/or."

**What This Means**:
- Freehand drawing: Pen tool, eraser, natural sketching
- Structured shapes: Rectangles, circles, arrows, connectors
- Unified canvas: Both modes work on same surface
- No mode switching required (toolbar with both tools available)

**Why This Matters**:
- Freehand only: Can't create clean diagrams (frustrating for architecture)
- Structured only: Kills creativity, feels rigid
- Dual-mode: Best of both worlds (sketch ideas, formalize later)

**Technology Selection**:
- **Recommended**: tldraw (React-first, supports both modes, extensible)
- **Alternative**: Excalidraw (freehand focus, structured shapes via plugin)
- **NOT**: Fabric.js alone (low-level, no built-in shapes), Miro/Figma (proprietary APIs)

**Implementation Requirement**:
- Task 13 (Implement Whiteboard) MUST verify both modes work
- Acceptance criteria MUST test: freehand stroke + structured rectangle on same canvas

---

### 5. Annotations are Universal Mode (Cross-Modality Vision)

**Decision**: Annotation tool works across ALL modalities, not just whiteboard.

**Key Conversation**:
> "Annotations START on whiteboard for MVP. But they're designed to work on images, PDFs, presentations - eventually everything."

**What This Means**:
- MVP: Annotations work on whiteboard canvas
- Architecture: Designed for multi-surface support (images, slides, code)
- UI: Annotation mode is global (activate anywhere, annotate anything)
- Future: Annotate presentation slides, code diffs, terminal output

**Why This Matters**:
- Avoids silo'd annotation systems per modality
- Unified UX (same tools work everywhere)
- Enables powerful workflows (annotate slide → discuss in whiteboard → code implementation)

**Architecture Implication**:
- `IAnnotation` interface (separate from `IWhiteboard`)
- Annotation layer can overlay any surface (whiteboard, image, presentation)
- Annotations stored as separate `.annotations` files (linked to target surface)

**MVP Scope**:
- ✅ Annotation tools: Pen, highlighter, shapes, text
- ✅ Works on: Whiteboard canvas
- ❌ Deferred: Code annotations, PDF annotations, presentation annotations (post-MVP)

---

### 6. Session Persistence is Comprehensive

**Decision**: "Resume last session" means resume EVERYTHING, not just files.

**Key Conversation**:
> "User closes OpenSpace. Reopens. EVERYTHING is exactly as they left it: files, whiteboard, console, terminal state."

**What This Means**:
- Auto-save: Continuous background save (every 30s or on change)
- Resume scope:
  - ✅ Open files + scroll position + cursor location
  - ✅ Whiteboard drawings + zoom level + pan position
  - ✅ Agent console history + active chat
  - ✅ Terminal sessions + working directory + scroll position
  - ✅ Layout state (pane sizes, tab order)
- NO "Save Project" button - it's automatic

**Why This Matters**:
- Eliminates friction of session setup/teardown
- Protects against data loss (no "did I save?" anxiety)
- Enables context switching (close mid-work, resume seamlessly)

**Architecture Implication**:
- `ISessionPersistence` service saves/restores ALL modality states
- Each modality implements `getState()` and `restoreState()`
- Session file: `.openspace/session.json` (tracks all open artifacts + positions)

**MVP Implementation**:
- Task 17 (Session Persistence) must test: Save → Close → Reopen → Verify ALL states restored

---

### 7. First-Time UX is Minimal (Explicitly NOT a Dashboard)

**Decision**: Empty canvas + chat + menu. NO dashboard, NO wizard, NO templates.

**Key Conversation**:
> "User opens OpenSpace for first time. Sees: empty canvas, chat interface, menu bar. That's it. No dashboard."

**What This Means**:
- Empty state shows: Blank space (for whiteboard/terminal/editor), agent chat, top menu
- NO template gallery, NO project wizard, NO "getting started" dashboard
- User decides what to open first (file, terminal, whiteboard, voice)
- Menu provides discovery (File → New Whiteboard, Terminal → New Session, etc.)

**Why This Matters**:
- Respects user autonomy (they choose workflow, not guided)
- Avoids prescriptive onboarding (no "right way" to use OpenSpace)
- Minimalist aesthetic (clean slate, not overwhelming)

**Anti-Pattern to AVOID**:
- ❌ "Welcome screen with templates" - Feels like MS Office
- ❌ "Tutorial wizard" - Treats user like child
- ❌ "Sample project" - Clutter they must delete

**Correct Implementation**:
- ✅ Empty state message: "Open a file, start a terminal, create a whiteboard" (subtle hint)
- ✅ Menu bar with clear options: File, Terminal, Whiteboard, Presentation, View, Help
- ✅ Agent chat is ALWAYS visible (primary way to interact)

---

## Scope & Boundaries

### 8. Security is Deferred (Don't Let Perfect Be Enemy of Good)

**Decision**: Security model is OUT OF SCOPE for MVP. Explicitly deferred to post-MVP.

**Key Conversation**:
> "Security (permissions, sandboxing, multi-user auth) is important. But NOT for MVP. Ship first, secure later."

**What This Means**:
- MVP runs on localhost, single-user
- NO user authentication, NO permissions system, NO sandboxing
- Trust model: User = developer (they control environment)
- Post-MVP: Add security when multi-user or cloud deployment needed

**Why This Decision Was Made**:
- MVP goal: Validate UX paradigm (shell-first, multi-modal)
- Security is orthogonal to core value prop
- Over-engineering security too early = delays learning
- Can retrofit security after UX is proven

**Scope Implications**:
- ✅ MVP: Local development environment (developer's machine)
- ❌ MVP: Cloud hosting, team collaboration, permission controls
- ❌ MVP: Code execution sandboxing, resource limits

**Post-MVP Path**:
- Phase 2: Add authentication (OAuth, JWT)
- Phase 3: Add permissions (file access controls, agent capabilities)
- Phase 4: Add sandboxing (isolate code execution, resource limits)

---

### 9. Git UI is Deferred (Use Terminal)

**Decision**: NO Git UI in MVP. Users use terminal for git operations.

**Key Conversation**:
> "Git is complex. Building a UI is a whole project. For MVP, terminal is enough."

**What This Means**:
- MVP: No visual git diff, no commit UI, no branch switcher
- Users run: `git status`, `git add`, `git commit`, `git push` in terminal
- Diff viewer (Task 12) is for general file comparison, not git-specific

**Why This Decision Was Made**:
- Git UI is feature-complete project (VS Code took years)
- Terminal is familiar to target users (developers)
- Avoids scope creep (MVP already large)

**Scope Implications**:
- ✅ MVP: Terminal integration (xterm.js) supports git commands
- ✅ MVP: Diff viewer (compare any two files/versions)
- ❌ MVP: Visual git graph, inline git blame, git UI widgets

**Post-MVP Path**:
- Phase 2: Git integration (show branch in status bar)
- Phase 3: Visual git diff (inline diff viewer)
- Phase 4: Full git UI (graph, blame, merge conflict resolution)

---

## Technology Decisions

### 10. OpenCode Backend (Foundation)

**Decision**: Use OpenCode server as backend (Session, File, PTY, LSP, MCP services).

**Key Conversation**:
> "OpenCode already has 30+ services. Don't reinvent. Build custom React client on top of existing backend."

**What This Means**:
- Backend: OpenCode server (existing, mature, stable)
- Frontend: Custom React web client (new, built for shell-first UX)
- Communication: WebSocket + JSON-RPC (OpenCode SDK)
- Services used:
  - Session: Workspace management, artifact storage
  - File: File operations, watchers, search
  - PTY: Terminal emulation (xterm.js frontend)
  - LSP: Language server protocol (Monaco integration)
  - MCP: Model Context Protocol (agent communication)

**Why This Matters**:
- Avoids 6+ months of backend development
- Leverages battle-tested infrastructure
- Focuses effort on UX innovation (where value is)

**Architecture Implication**:
- Task 2 (Setup OpenCode Server) is prerequisite for all other tasks
- Task 4 (Build OpenCode SDK Layer) wraps WebSocket communication

---

### 11. Technology Selections (Recommendations)

**Decision**: Use proven, React-first libraries with strong ecosystems.

**Technology Matrix**:

| Component | Selected | Rationale | Alternative Considered |
|-----------|----------|-----------|------------------------|
| **Terminal** | xterm.js | Industry standard (VS Code, Codespaces), WebGL renderer, rich addons | None (de facto choice) |
| **Whiteboard** | tldraw | React-first, dual-mode (freehand + shapes), extensible, production-ready | Excalidraw (freehand focus), Fabric.js (low-level) |
| **Presentations** | Reveal.js | Industry standard, markdown → slides, speaker notes, PDF export, rich plugins | Spectacle (React-first but less mature) |
| **Voice Output** | Web Speech API (MVP) + Kokoro TTS (optional) | Progressive enhancement: instant browser TTS, optional high-quality download | Azure Cognitive Services (requires cloud), Amazon Polly (paid) |
| **Voice Input** | Web Speech API (MVP) + Whisper.js (optional) | Same progressive enhancement strategy | Deepgram (paid API), AssemblyAI (paid) |
| **Code Editor** | Monaco Editor | Industry standard (VS Code), LSP support, rich language support | CodeMirror (less polished), Ace Editor (older) |

**Key Conversation on Whiteboard**:
> "tldraw vs Excalidraw? tldraw has BOTH freehand AND structured shapes out of box. Excalidraw is freehand-first, shapes are secondary. For dual-mode requirement, tldraw wins."

**Key Conversation on Voice**:
> "Start with Web Speech API (zero dependencies, works in browser). Offer Kokoro TTS as optional download for higher quality. Progressive enhancement, not forced choice."

**Progressive Enhancement Pattern**:
1. **MVP**: Web Speech API (browser native, instant, good enough)
2. **Opt-in Upgrade**: Kokoro TTS (download model, high quality, local processing)
3. **Future**: Cloud TTS (Azure, Polly) for multi-language, enterprise features

---

## Testing & Quality

### 12. Agent-Executable QA (Zero Human Verification)

**Decision**: ALL acceptance criteria MUST be verifiable by agent tools (Playwright, bash, curl). ZERO human action.

**Key Conversation**:
> "No 'user manually tests' in acceptance criteria. EVERY verification is automated. Agent runs Playwright, checks DOM, takes screenshot."

**What This Means**:
- Forbidden phrases in acceptance criteria:
  - ❌ "User manually tests..."
  - ❌ "User visually confirms..."
  - ❌ "User interacts with..."
  - ❌ "Ask user to verify..."
- Required format:
  - ✅ "Playwright navigates to /login → Fills form → Clicks submit → Asserts redirect to /dashboard"
  - ✅ "bash: curl -X POST /api/users → Assert status 201 → Assert response.id is UUID"
  - ✅ "tmux: Run ./cli --config test.yaml → Send 'q' → Assert exit code 0"

**Why This Matters**:
- Executing agent (Sisyphus) has NO human to verify
- Manual verification = blocked task = stalled project
- Automated verification = continuous progress

**Quality Standards**:
- Scenarios must include:
  - Specific selectors (`.login-button`, not "the login button")
  - Concrete test data (`"test@example.com"`, not `[email]`)
  - Exact assertions (`text contains "Welcome"`, not "verify it works")
  - Evidence paths (`.sisyphus/evidence/task-1-login.png`)

**Verification Tools by Deliverable Type**:

| Deliverable Type | Tool | Example |
|------------------|------|---------|
| Frontend/UI | Playwright | Navigate, click, fill, assert DOM, screenshot |
| API/Backend | curl (Bash) | POST request, assert status, assert response fields |
| CLI/TUI | interactive_bash (tmux) | Run command, send keystrokes, validate output |
| Library/Module | Bash (REPL) | Import, call function, compare output |
| Config/Infra | Bash (shell) | Apply config, run state checks, validate |

---

### 13. Test Strategy Decision (Per-Project)

**Decision**: Test strategy (TDD, tests-after, none) is per-project decision, asked explicitly during planning.

**Key Conversation**:
> "If test infrastructure exists, ask user: TDD, tests-after, or none? If infrastructure doesn't exist, ask if they want to set it up."

**Decision Flow**:

```
Does test infrastructure exist?
├─ YES → Ask: "TDD (RED-GREEN-REFACTOR) or tests-after?"
│   ├─ TDD → Structure tasks as RED-GREEN-REFACTOR cycles
│   │   Example: Write test (FAIL) → Implement (PASS) → Refactor (PASS)
│   └─ Tests-after → Add test tasks after implementation tasks
│       Example: Implement feature → Add tests for feature
└─ NO → Ask: "Want to set up testing? (bun test, vitest, jest, pytest, etc.)"
    ├─ YES → Add Task 0: Setup test infrastructure
    │   Then proceed with chosen test strategy
    └─ NO → No unit/integration tests
        BUT: Agent-Executed QA Scenarios are STILL MANDATORY
```

**CRITICAL**: Agent-Executed QA Scenarios are ALWAYS required, regardless of test choice.
- QA Scenarios = End-to-end verification (Playwright, curl, tmux)
- Unit tests = Optional (developer preference)

**Why This Matters**:
- Respects developer workflow preferences
- Some projects use TDD religiously, others don't
- Some codebases have zero test infrastructure (legacy, prototypes)
- QA scenarios ensure deliverables work, even without unit tests

---

## Process & Workflow

### 14. Requirements File Naming Convention

**Decision**: Use semantic names (`REQ-CORE-modalities.md`), not numbered ranges (`REQ-CORE-001-through-039.md`).

**Key Conversation**:
> "Numbered ranges require file rename every time you add a requirement. Semantic names are stable."

**What This Means**:
- ✅ `REQ-CORE-modalities-and-features.md` (describes content)
- ✅ `REQ-VOICE-input-output.md` (clear subject matter)
- ❌ `REQ-CORE-001-through-039.md` (maintenance burden)

**Why This Matters**:
- Adding REQ-CORE-040 only requires editing file, not renaming it
- Version control doesn't show spurious file renames
- Filenames communicate content, not arbitrary count

**Migration**:
- Task: Rename existing files to semantic names
- Mark old convention as "deprecated" in docs (don't erase history)
- Update examples throughout documentation

---

### 15. Plan Execution with /start-work

**Decision**: Plans are executed by Sisyphus agent via `/start-work` command, not by Prometheus.

**Key Conversation**:
> "Prometheus is PLANNER. Sisyphus is EXECUTOR. After plan is complete, user runs `/start-work` to begin execution."

**What This Means**:
- Prometheus: Consultation, research, plan generation (markdown files ONLY)
- Sisyphus: Code writing, file editing, command execution (does the work)
- Handoff: User runs `/start-work` after plan is approved
- Boulder system: Tracks progress, enables resumption across sessions

**Why This Matters**:
- Clear separation of concerns (planning vs. execution)
- Prometheus focuses on understanding requirements (not rushing to code)
- Sisyphus focuses on precise implementation (not ad-hoc problem solving)

**Workflow**:
1. User describes goal to Prometheus
2. Prometheus interviews, researches (explore, librarian agents)
3. Prometheus generates plan → `.sisyphus/plans/{name}.md`
4. User reviews plan
5. User runs `/start-work` → Sisyphus begins execution
6. Sisyphus works through tasks, updating progress
7. If interrupted, next session continues automatically (boulder system)

---

## Anti-Patterns (What NOT to Do)

### 16. AI Slop Patterns to AVOID

**Decision**: Explicitly guard against common AI code generation mistakes.

**Identified Anti-Patterns**:

| Pattern | Example | Prevention |
|---------|---------|------------|
| **Scope Inflation** | "Also added tests for adjacent modules" | Guardrail: "Only test [TARGET], nothing beyond" |
| **Premature Abstraction** | "Extracted to utility" | Question: "Do you want abstraction, or inline?" |
| **Over-Validation** | "15 error checks for 3 inputs" | Question: "Error handling: minimal or comprehensive?" |
| **Documentation Bloat** | "Added JSDoc everywhere" | Question: "Documentation: none, minimal, or full?" |
| **Assumed Requirements** | "Added user preferences" | Guardrail: "NO features beyond explicit requirements" |

**Key Conversation**:
> "LLMs tend to over-engineer. Explicit guardrails prevent scope creep. Every task needs 'Must NOT do' section."

**Implementation in Plans**:
- Every task includes "Must NOT do" section
- Guardrails derived from Metis review (pre-generation gap analysis)
- Agent consults guardrails before adding ANY feature

---

## Future Vision (Post-MVP)

### 17. Multi-Modal Future (Where We're Heading)

**Vision**: OpenSpace becomes unified workspace where ALL modalities interact seamlessly.

**Post-MVP Roadmap**:

**Phase 2 (Enhanced Modalities)**:
- Voice: Whisper.js integration (better transcription)
- Whiteboard: Multi-canvas support (infinite boards)
- Presentations: Live editing during presentation mode
- Annotations: Extend to images, PDFs, code

**Phase 3 (Collaboration)**:
- Multi-user sessions (real-time collaboration)
- Permissions system (workspace, file, artifact access)
- Presence indicators (see who's viewing what)
- Shared voice channels (discussion threads)

**Phase 4 (AI Integration)**:
- Voice → requirements (optional AI pipeline)
- Sketch → component (drawing to code generation)
- Presentation → documentation (auto-generate docs from slides)
- Whiteboard → architecture (diagram to code scaffolding)

**Phase 5 (Platform Expansion)**:
- Desktop apps (Electron, Tauri)
- Mobile apps (view-only, annotations)
- Cloud sync (cross-device sessions)
- API/SDK (embed OpenSpace in other tools)

**Key Conversation**:
> "We're starting with MVP to validate the paradigm. But the vision is: your entire development workflow happens in OpenSpace - not just coding."

---

## Critical Success Factors

### 18. What Must Go Right

**For MVP to Succeed**:

1. **Shell-first paradigm validated**
   - Users actually prefer artifacts-first workflow
   - Voice/whiteboard feel as natural as code editing
   - Terminal remains central, not peripheral

2. **Swappability proves valuable**
   - Users experiment with different implementations
   - Upgrades (Web Speech → Kokoro) feel seamless
   - No one feels "locked in" to technology choices

3. **Multi-modal integration feels unified**
   - Switching between whiteboard/voice/code is fluid
   - Artifacts reference each other naturally
   - No jarring context switches

4. **Performance is acceptable**
   - Whiteboard drawing feels responsive
   - Voice input has low latency
   - Terminal doesn't lag
   - Large sessions resume quickly

5. **Agent-executable QA works**
   - Sisyphus can verify deliverables without human help
   - Playwright scenarios cover real user workflows
   - Evidence (screenshots, outputs) proves functionality

**Failure Modes to Watch**:
- ❌ Users treat OpenSpace as "VS Code with voice plugin" (IDE gravity)
- ❌ Swappability unused (users stick with defaults, never swap)
- ❌ Modalities feel siloed (no integration, just separate tools)
- ❌ Performance issues make experience frustrating
- ❌ QA scenarios too brittle (break on minor UI changes)

---

## How to Use This Document

**When Starting New Work**:
1. Read relevant sections (architecture, scope, technology)
2. Verify new work aligns with decisions here
3. If conflict arises, revisit conversation (source session links)

**When Making New Decisions**:
1. Check if similar decision already made
2. If changing existing decision, document WHY (rationale)
3. Update this document with new conversation

**When Onboarding**:
1. Read entire document (goldmine of context)
2. Understand WHY decisions were made (not just WHAT)
3. Ask questions if unclear (better than wrong assumptions)

**When In Doubt**:
1. Check this document first
2. If not covered, ask user (don't assume)
3. Document the answer here (for next time)

---

## Document Maintenance

**Who Updates This**:
- Prometheus: After every major planning session
- Sisyphus: If implementation reveals decision ambiguity
- User: Can request updates/corrections anytime

**Update Triggers**:
- New architectural decision made
- Technology selection changed
- Scope boundary clarified
- Anti-pattern identified
- Vision/roadmap updated

**Version History**:
- 2025-02-05: Initial version (Session 002 - OpenSpace MVP Planning)
- Future updates will be logged here

---

**This document is living memory. Treat it as source of truth for project direction.**
