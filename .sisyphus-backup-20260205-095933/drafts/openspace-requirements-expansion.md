# Draft: OpenSpace Requirements Expansion

## User Decisions Captured

### Architecture Approach
**Decision**: Shell-First with OpenCode Foundation
- Use OpenCode server/backend (REST + WebSocket + SSE)
- Build new React web client for multi-modal experience
- OpenCode SDK provides 30+ services (sessions, files, terminal, LSP, MCP, etc.)
- Keep all OpenCode capabilities, extend with custom UI modalities

### Navigation
**Decision**: Unified Tree (File-Centric)
- Single file tree shows all content (.md, .js, .sketch files, etc.)
- Artifacts are files in the filesystem (no separate artifact graph UI)
- Leverage OpenCode's existing File service
- Familiar developer experience

### Requirements Scope
**Decision**: Expand Requirements
- Add security model (REQ-SEC-001 to REQ-SEC-004)
- Add deployment matrix (REQ-DEPLOY-001 to REQ-DEPLOY-003)
- Add QA strategy (REQ-QA-001 to REQ-QA-003)
- Add architecture interfaces (REQ-ARCH-001 to REQ-ARCH-003)

### Timeline
**Decision**: No Hard Deadline
- Focus on doing it right, not fast
- Willing to invest in proper architecture

---

## Requirements Identified from Critique

### Security Requirements (CRITICAL - From Critique Lines 151-184)

**REQ-SEC-001: Agent Permission Model**
- Category: Security
- Priority: High
- Source: Response to Critique (lines 170-173)
- Description: Agents must declare and request explicit permissions for filesystem, execution, and network access
- Acceptance Criteria:
  - Agent can declare permissions in manifest (read/write/exec/network)
  - User must explicitly grant permissions (no implicit grants)
  - Workspace sandboxing enforced at runtime
  - Permission violations logged and blocked

**REQ-SEC-002: Extension Trust Model**
- Category: Security
- Priority: High
- Source: Response to Critique (lines 174)
- Description: Curated extension registry prevents arbitrary extension installations
- Acceptance Criteria:
  - Custom extension registry (no direct OpenVSX/marketplace access)
  - 20-40 "certified" extensions in v1
  - Extension hashing and verification
  - Approval workflow for new extensions

**REQ-SEC-003: Workspace Sandboxing**
- Category: Security
- Priority: High
- Source: Response to Critique (lines 169, 171)
- Description: Terminal and agent file access must be limited to workspace boundaries
- Acceptance Criteria:
  - Local vs remote workspace distinction
  - Terminal cannot read files outside workspace root
  - Agent file access limited by granted permissions
  - Network access requires explicit permission

**REQ-SEC-004: Supply Chain Controls**
- Category: Security
- Priority: Medium
- Source: Response to Critique (lines 174)
- Description: Extension supply chain must be auditable and controlled
- Acceptance Criteria:
  - Custom VSX_REGISTRY_URL support (if using Theia components)
  - Version pinning for all dependencies
  - Audit trail for extension installations
  - Checksum verification for downloaded extensions

---

### Deployment Requirements (CRITICAL - From Critique Lines 16-40)

**REQ-DEPLOY-001: Web vs Desktop Capability Matrix**
- Category: Deployment
- Priority: High
- Source: Response to Critique (lines 27-35)
- Description: Explicit documentation of what capabilities are available in web-only vs desktop deployments
- Acceptance Criteria:
  - Web-only mode supports: Voice→Requirements→Presentation, Sketching, Agent outputs
  - Web-only mode does NOT support: Local filesystem, Terminal, Backend-dependent extensions
  - Desktop mode supports: Everything from web-only + filesystem + terminal + extensions
  - Capability matrix documented in README and in-app

**REQ-DEPLOY-002: Web-Only Artifact Mode**
- Category: Deployment
- Priority: High
- Source: Response to Critique (lines 33-34)
- Description: Web deployment must be fully functional for artifact-driven workflows without backend
- Acceptance Criteria:
  - Voice input works (Web Speech API or Whisper.js)
  - Presentations render (Reveal.js)
  - Whiteboard/sketching functional (HTML5 Canvas)
  - Requirements editing works (Markdown editor)
  - Agent console displays outputs
  - No server required for static content browsing

**REQ-DEPLOY-003: Desktop Full-Featured Mode**
- Category: Deployment
- Priority: High
- Source: Response to Critique (lines 328-332)
- Description: Desktop deployment provides all capabilities including local filesystem and terminal
- Acceptance Criteria:
  - OpenCode server runs locally
  - Local filesystem access via OpenCode File service
  - Terminal integration via PTY WebSocket
  - Extension support via OpenCode plugin system
  - Better performance for large whiteboards/canvases

---

### Quality Assurance Requirements (From Prometheus Constraints)

**REQ-QA-001: Zero Human Intervention Verification**
- Category: Quality Assurance
- Priority: High
- Source: Prometheus work plan guidelines
- Description: All workflows must be verifiable without any human action
- Acceptance Criteria:
  - Playwright for UI verification (opens browser, interacts, asserts, screenshots)
  - curl/httpie for API verification (sends requests, parses responses)
  - interactive_bash for CLI/TUI verification (runs commands, validates output)
  - Every task has concrete QA scenarios with exact selectors/data/assertions

**REQ-QA-002: Agent-Executed QA Scenarios**
- Category: Quality Assurance
- Priority: High
- Source: Prometheus work plan guidelines
- Description: Each deliverable includes detailed agent-executable verification scenarios
- Acceptance Criteria:
  - Exact selectors (`.login-button`, not "the button")
  - Concrete test data (`"test@example.com"`, not placeholders)
  - Expected results (observable outcomes, not vague "verify it works")
  - Evidence paths (screenshots: `.sisyphus/evidence/*.png`, logs, responses)
  - Both happy-path AND negative/error scenarios

**REQ-QA-003: Evidence Capture**
- Category: Quality Assurance
- Priority: Medium
- Source: Prometheus work plan guidelines
- Description: All verifications must produce evidence artifacts
- Acceptance Criteria:
  - Screenshots saved to `.sisyphus/evidence/` for UI verifications
  - Terminal output captured for CLI/TUI verifications
  - Response bodies saved for API verifications
  - Evidence files named: `task-{N}-{scenario-slug}.{ext}`

---

### Architecture Requirements (From REQ-CORE-037/038 Expansion)

**REQ-ARCH-001: Interface Contracts for Replaceability**
- Category: Architecture
- Priority: High
- Source: REQ-CORE-037, REQ-CORE-038 expansion
- Description: Define stable interfaces for all replaceable subsystems
- Acceptance Criteria:
  - `IVoiceInput`: startRecording(), stopRecording(), onTranscript()
  - `IVoiceOutput`: speak(text), pause(), resume(), stop()
  - `IWhiteboard`: addShape(), export(), import(), onAnnotation()
  - `IPresentationRenderer`: loadSlides(markdown), play(), navigate()
  - `ICodeSurface`: openFile(), edit(), save(), getLSP()
  - `IArtifactStore`: create(), read(), update(), delete(), query()

**REQ-ARCH-002: OpenCode SDK Integration**
- Category: Architecture
- Priority: High
- Source: Shell-First with OpenCode Foundation decision
- Description: New React client must integrate with OpenCode SDK for backend operations
- Acceptance Criteria:
  - OpenCode server running (`createOpencodeServer()`)
  - Client initialized (`createOpencodeClient()`)
  - File operations via `File` service
  - Terminal via PTY WebSocket
  - Sessions via `Session` service
  - Plugins registered for custom modalities

**REQ-ARCH-003: Plugin System for Modalities**
- Category: Architecture
- Priority: High
- Source: OpenCode plugin system capabilities
- Description: Each modality (voice, whiteboard, presentation) implemented as OpenCode plugin
- Acceptance Criteria:
  - Voice plugin with `tool.execute` hooks
  - Whiteboard plugin with custom rendering
  - Presentation plugin with SSE event subscriptions
  - Agent console plugin with `chat.message` hooks
  - All plugins follow OpenCode plugin API

---

## OpenCode Foundation Insights

### Server Capabilities (Existing in OpenCode)
✅ **Already Have**:
- REST API (30+ service classes)
- WebSocket for terminal (PTY sessions)
- SSE for event streaming
- Session management (agent orchestration)
- File operations (file tree, read/write, git)
- LSP integration
- MCP integration (Model Context Protocol)
- Terminal/shell capabilities
- Plugin system (30+ hooks)
- Authentication/OAuth flows

### What OpenSpace Adds
🆕 **New Components**:
- React web client (OpenCode has no built-in web UI)
- Monaco Editor integration
- Voice input/output (Web Speech API, Whisper.js, TTS)
- Whiteboard canvas (Fabric.js, Konva.js)
- Presentation renderer (Reveal.js)
- Requirements editor (Markdown-focused)
- Agent console UI (streaming logs)

### Integration Architecture
```
┌─────────────────────────────────────────────┐
│         OpenSpace Web Client (React)        │
│  ┌──────────────────────────────────────┐   │
│  │  Voice I/O  │  Whiteboard  │ Editor  │   │
│  ├──────────────────────────────────────┤   │
│  │  Presentations │ Agent Console       │   │
│  ├──────────────────────────────────────┤   │
│  │  File Tree (OpenCode File service)   │   │
│  └──────────────────────────────────────┘   │
│             ↕ OpenCode SDK                  │
│     (REST + WebSocket + SSE)                │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│      OpenCode Server (Existing Backend)     │
│  ┌──────────────────────────────────────┐   │
│  │  Session │ File │ PTY │ LSP │ MCP    │   │
│  ├──────────────────────────────────────┤   │
│  │  Auth │ Config │ Tools │ Events      │   │
│  ├──────────────────────────────────────┤   │
│  │  Plugin System (30+ hooks)           │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## User Feedback (Critical Revisions)

### Scope Corrections
**IN (Confirmed)**:
- Voice input/output
- Whiteboard canvas
- Agent console
- File tree
- Terminal
- Editor
- **Annotations** (activate on whiteboard first)
- **Extension marketplace** (important, not just "out")
- **Version control integration** (important, not just "out")

**OUT (Removed from MVP)**:
- ❌ Security model (not needed for MVP)
- ❌ TTS (text-to-speech output)
- ❌ Presentations (Reveal.js removed)
- ❌ Code generation (sketch → component preview removed)
- ❌ Collaborative editing (whiteboard or editor)
- ❌ Drawing tools on whiteboard (basic whiteboard only)

**REVISED Workflows**:
- Voice → Requirements → ~~Presentation~~ (stops at requirements documentation)
- ~~Sketch → Component Preview~~ (removed)

### Technology Selection Process
**User Request**: Add exploration step before selecting each technology
- Don't assume Fabric.js is best for whiteboard
- Don't assume Reveal.js (now removed anyway)
- Don't assume xterm.js without comparing alternatives
- **Process**: For each technology decision, add "Explore alternatives and select best" task

### Navigation / Landing Page
**User Question**: "Landing page is artifact dashboard and not file tree - this is not yet so clear to me. Let's explore."
- **Action**: Needs further exploration with user
- **Options to explore**:
  1. Dashboard with recent artifacts (cards/tiles)
  2. File tree as landing (traditional IDE)
  3. Activity feed (recent sessions, voice input history)
  4. Blank canvas with "Start new..." prompts
- **Defer decision** until exploration complete

### Voice Input Technology
**User Feedback**: "We need something better than Web Speech API, but fine starting simple and improving"
- **MVP**: Start with Web Speech API
- **Post-MVP**: Evaluate Whisper.js, Deepgram, AssemblyAI, others
- **Add task**: Research voice input alternatives

## User Answers (FINAL Clarified Scope)

### Whiteboard & Diagramming
✅ **BOTH structured AND freehand**:
- Structured: Drag-drop shapes (like Excalidraw/tldraw)
- Freehand: Manual drawing with pen/touch
- Image import: Drop external images OR open from filesystem, then annotate
- **Requirement**: Add to REQ-CORE as new requirement for dual-mode diagramming

### Annotations (Universal but phased)
✅ **Annotation is a MODE OF WORK** (not tool-specific):
- Same annotation tool/package works across modalities
- MVP: Annotations on whiteboard/diagrams (most straightforward)
- Phase 2: Annotations on image files
- Phase 3: Annotations on presentations
- Phase 4+: Annotations on editor (most complex, defer)

**Key insight**: Drawing input/output modality naturally includes annotation

### Voice → Requirements Flow
**User clarification**: "Voice is just replacing text"
- Voice input → transcript → user edits/structures as they wish
- NO enforced format (Markdown, YAML, etc.) - user's choice
- NO automatic LLM structuring (user has full control)
- Same freedom as current IDEs (OpenCode-web)

**Implication**: Voice is an INPUT modality, not a workflow orchestrator

### Presentation Output Modality
✅ **INCLUDED IN MVP** (User corrected: "when did I say NO presentation?")
- Presentation generation IS in scope
- Important and quite early for MVP
- Phase 2 deliverable

### Voice Output (TTS)
✅ **INCLUDED - Phase 1**
- User wants voice OUT modality
- Add to Phase 1 alongside voice input

### Session Persistence / Resume
✅ **Resume = ALL of the above**:
- Show last agent console messages
- Re-open last files in editor
- Restore whiteboard state
- Session state **automatically saved**

**Implication**: Need robust session persistence layer

### Extension Architecture
✅ **Architecture support, but minimal work**:
- Enable extension system (OpenCode already has plugin system)
- Don't build marketplace UI
- Don't build custom extensions (beyond core modalities)
- Just ensure architecture is extension-friendly

### Agent Console
✅ **Reproduce OpenCode-web exactly**:
- LLM responses
- Tool execution logs
- System messages
- Multiple sessions
- History
- User interaction (chat)
- NO need to invent anything new

### File Tree Artifacts
✅ **Simple icons like typical file explorer**:
- Standard icons for artifacts (folder, file, sketch, etc.)
- Use OS-recognized extensions as primary (`.jpeg`, `.png`, `.md`)
- Special extensions where needed (`.sketch`, `.whiteboard`)
- No elaborate custom UI

### Diff Feature (OVERLOOKED!)
✅ **ADD TO PLAN**: Diff viewer
- Phase 0+ (after basic setup)
- File comparison view
- Git diff integration via OpenCode

### First-Time User Experience
✅ **Empty canvas + Chat + Menu**:
- Sketch canvas (empty whiteboard)
- Chat window (agent console)
- Menu access (File → Open Folder)
- NOT "resume last session" on very first launch

### Version Control
✅ **Terminal Only** (no special git UI)

### Extension Marketplace
✅ **Post-MVP** (not in scope)

---

## Revised Scope Summary

### IN (MVP Deliverables)
1. ✅ Voice input (start with Web Speech API, plan for upgrade)
2. ✅ Whiteboard canvas (freehand + diagramming + image annotation)
3. ✅ Annotations (on whiteboard sketches)
4. ✅ Agent console (streaming, resume last session)
5. ✅ File tree (unified, all artifacts + code)
6. ✅ Terminal (xterm.js integration, PTY via OpenCode)
7. ✅ Monaco Editor (code surface, subordinate to shell)
8. ✅ Session persistence (resume where you left off)
9. ✅ OpenCode plugins (custom modalities)
10. ✅ Requirements documentation (voice → requirements workflow)

### OUT (NOT in MVP)
1. ❌ TTS (text-to-speech output)
2. ❌ Presentations (Reveal.js, slide generation)
3. ❌ Code generation (sketch → component preview)
4. ❌ Collaborative editing (whiteboard or editor)
5. ❌ Extension marketplace UI
6. ❌ Git UI (status badges, commit dialog)
7. ❌ Security model (permissions, sandboxing)

### Post-MVP (Important but deferred)
- Extension marketplace
- Collaborative whiteboarding
- Better voice input (Whisper.js, Deepgram, etc.)
- TTS for agent responses
- Git UI integration
- Security/permission model

---

## Architecture Principles (CRITICAL)

**UNIVERSAL REQUIREMENT: Component Swappability**

Every major subsystem MUST be implemented behind stable interfaces. This is NON-NEGOTIABLE.

### Required Interfaces

| Interface | Purpose | Implementations |
|-----------|---------|-----------------|
| `IVoiceInput` | Speech-to-text | WebSpeechRecognition (MVP), WhisperJS (future), Deepgram (future) |
| `IVoiceOutput` | Text-to-speech | WebSpeechTTS (MVP), KokoroTTS (optional extension) |
| `IWhiteboard` | Drawing canvas | [TBD based on research] - Fabric.js, Konva, tldraw, or Excalidraw |
| `IAnnotation` | Universal annotation layer | [TBD] - Must work across modalities (whiteboard, images, presentations) |
| `IPresentationRenderer` | Slide display | RevealJS (default), Spectacle (alternative) |
| `ITerminal` | Terminal emulator | xterm.js (likely default) |
| `ICodeEditor` | Code surface | Monaco Editor (default, from VS Code) |
| `IFileTree` | File navigation | Custom (using OpenCode File service) |
| `IAgentConsole` | LLM interaction | OpenCode-web agent console (replicate exactly) |

### Interface Design Requirements

Each interface MUST include:
1. **Initialization**: `initialize(config): Promise<void>`
2. **Core operations**: Domain-specific methods (e.g., `speak(text)`, `addShape(shape)`)
3. **Event handling**: `on(event, callback)` for state changes
4. **Cleanup**: `dispose(): void` for teardown
5. **Capability queries**: `getCapabilities(): Capability[]` (what features are available)
6. **Error handling**: Standard error types, no silent failures

### Adapter Pattern (MANDATORY)

```typescript
// Interface definition (stable contract)
interface IVoiceOutput {
  initialize(config: VoiceConfig): Promise<void>;
  speak(text: string): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
  on(event: 'start' | 'end' | 'error', callback: Callback): void;
  getCapabilities(): VoiceCapability[];
  dispose(): void;
}

// Adapter implementations (swappable)
class WebSpeechTTSAdapter implements IVoiceOutput { /* ... */ }
class KokoroTTSAdapter implements IVoiceOutput { /* ... */ }

// Client code (implementation-agnostic)
const voiceOutput: IVoiceOutput = config.useKokoro 
  ? new KokoroTTSAdapter()
  : new WebSpeechTTSAdapter();
```

### Why This Matters

**Without interfaces** (tightly coupled):
- Swapping libraries requires rewriting call sites throughout the codebase
- Testing requires real implementations (slow, brittle)
- Future upgrades blocked by technical debt

**With interfaces** (loosely coupled):
- Swap implementations with config change
- Mock interfaces for fast testing
- Add new implementations without touching client code

**User benefit**:
- Start with simple defaults (Web Speech API, Reveal.js)
- Upgrade components individually (add Kokoro TTS, swap to Spectacle)
- Experiment with alternatives (try tldraw vs Excalidraw) without rewrite

### Implementation Plan Requirement

Every TODO in the implementation plan that introduces a major component MUST:
1. Define the interface FIRST (as a separate sub-task)
2. Implement the adapter (wrapping chosen library)
3. Write interface tests (pass with any compliant implementation)
4. Document swappability in acceptance criteria

**Example TODO structure:**
```
- [ ] X. Implement Voice Output

  Sub-tasks:
  1. Define IVoiceOutput interface (speak, pause, resume, stop, events)
  2. Implement WebSpeechTTSAdapter (default, browser native)
  3. Create VoiceOutputFactory (selects adapter based on config)
  4. Write interface compliance tests (mock implementations)
  
  Acceptance Criteria:
  - IVoiceOutput interface defined with all required methods
  - WebSpeechTTSAdapter implements IVoiceOutput
  - Can swap implementation via config: { voiceOutput: 'web-speech' | 'kokoro' }
  - Tests pass with both MockVoiceOutput and WebSpeechTTSAdapter
```

---

## Technology Decisions

**User Request**: Add exploration step before selecting tech

### Decisions Made

#### Voice Output (TTS) - DECIDED
**Decision**: Progressive enhancement approach
- **MVP (Phase 1)**: Web Speech API (browser native)
  - Zero dependencies, instant setup
  - Cross-platform, works everywhere
  - Quality varies by browser/OS
- **Optional Enhancement**: Kokoro TTS (on-demand extension)
  - High-quality neural voices
  - Installed only when user requests it
  - Large package (~several hundred MB)
  - User opts in: "Install Kokoro for better voice quality"

**Architecture implication**: TTS must be abstracted behind `IVoiceOutput` interface
- Default implementation: WebSpeechTTS
- Enhanced implementation: KokoroTTS (loaded dynamically if available)
- User can switch in settings

**Rationale**:
- Don't force large download on all users
- Instant functionality with browser TTS
- Power users get high-quality option
- Follows progressive enhancement principle

### Recommendations (Based on Industry Standards)

#### Terminal Emulator - RECOMMEND xterm.js
**Recommendation**: xterm.js (industry standard)
- Used by VS Code, Eclipse Theia, GitHub Codespaces
- Excellent WebSocket/PTY integration
- WebGL renderer for performance
- Rich addon ecosystem (fit, webgl, search, unicode11)
- React wrapper: `xterm-for-react`
- Bundle: ~200KB gzipped

**Architecture implication**: `ITerminal` interface with XtermAdapter

#### Whiteboard Canvas - RECOMMEND tldraw
**Recommendation**: tldraw (React-first, production-ready)
- **Supports BOTH freehand AND structured shapes** ✅
- React-native (not canvas wrapper)
- Excellent touch/pen support
- Built-in collaboration infrastructure (can disable for MVP)
- Image import supported
- Extensible shape system for annotations
- Bundle: ~500KB gzipped
- Used in production by Vercel, Linear

**Alternative**: Excalidraw
- Hand-drawn aesthetic
- Also supports both freehand + shapes
- Lighter weight (~300KB)
- Less extensible

**Architecture implication**: `IWhiteboard` interface with TldrawAdapter (default) or ExcalidrawAdapter

#### Presentation Renderer - RECOMMEND Reveal.js
**Recommendation**: Reveal.js (industry standard)
- Most mature presentation framework
- Markdown → slides support ✅
- Speaker notes, presenter view
- PDF export
- Extensive plugin ecosystem
- React wrapper: `reveal.js-react`
- Bundle: ~150KB gzipped

**Architecture implication**: `IPresentationRenderer` interface with RevealJSAdapter

### Decisions Remaining

1. **Diagramming**: Native canvas vs specialized library (mermaid, react-flow) - Defer to Phase 3+
2. **Voice input upgrade path**: Whisper.js vs Deepgram vs AssemblyAI - Post-MVP evaluation

---

## Requirements Summary

### Existing REQ-CORE
- REQ-CORE-001 through REQ-CORE-039 ✅ (39 requirements)

### New Requirements (Expansion)
- REQ-SEC-001 through REQ-SEC-004 (4 security requirements)
- REQ-DEPLOY-001 through REQ-DEPLOY-003 (3 deployment requirements)
- REQ-QA-001 through REQ-QA-003 (3 QA requirements)
- REQ-ARCH-001 through REQ-ARCH-003 (3 architecture requirements)

**Total**: 52 requirements

---

## Process Improvements Identified

### 1. File Naming Convention Fix
**Problem**: `docs/requirements/DOCUMENTATION_PROCESS.md` line 36 specifies:
```
- **Requirements**: `REQ-[PREFIX]-001-through-NNN.md`
```

This creates numbered filenames (e.g., `REQ-CORE-001-through-039.md`) that require renaming when requirements are added.

**Solution**: Update naming convention to semantic names:
```
- **Requirements**: `REQ-[PREFIX]-[SEMANTIC-NAME].md`
  Examples: 
  - REQ-CORE-modalities.md
  - REQ-DEPLOY-platform-matrix.md
  - REQ-ARCH-interfaces.md
```

**File to Update**: `docs/requirements/DOCUMENTATION_PROCESS.md` line 36

---

### 2. Prometheus Capability Enhancement

**Current Constraint**: Prometheus can only write to `.sisyphus/*.md` (enforced by `prometheus-md-only` hook)

**Problem**: Requirements and guidelines are planning artifacts, but Prometheus cannot write them directly. This creates unnecessary handoff overhead:
- Prometheus drafts requirements → Sisyphus must copy to `docs/requirements/` → Extra step

**Proposed Solution**: **Surgical Permission Expansion**

Allow Prometheus to write to:
- ✅ `.sisyphus/plans/*.md` (current)
- ✅ `.sisyphus/drafts/*.md` (current)
- ✅ `docs/requirements/**/*.md` (NEW - requirements are planning artifacts)
- ✅ `.agent/**/*.md` (NEW - guidelines/processes are meta-planning)
- ✅ `docs/**/*.md` (NEW - documentation files)
- ❌ Source code, configs, non-markdown files (still forbidden)

**Rationale**:
1. Requirements ARE planning deliverables (logical fit for planner role)
2. Guidelines/directives ARE meta-planning documents
3. Reduces handoff friction (Prometheus authors docs directly)
4. Maintains safety (no code/config access)
5. Clear audit trail (Prometheus-authored docs vs Sisyphus-authored code)

**Implementation Required**:
1. Update `.opencode/hooks/prometheus-md-only/main.ts` to allow expanded paths
2. Update Prometheus system prompt to clarify documentation authoring capability
3. Test: Prometheus should be able to create/edit files in allowed paths

---

## Next Phase

Now that requirements are expanded and OpenCode foundation is understood, ready to:
1. Design detailed architecture (component diagram, data flow)
2. Create implementation plan (phased approach)
3. Define interface contracts for replaceable components
4. Plan OpenCode plugin development strategy
