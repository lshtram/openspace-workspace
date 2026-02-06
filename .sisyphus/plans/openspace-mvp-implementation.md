# OpenSpace MVP Implementation

## TL;DR

> **Quick Summary**: Build OpenSpace - a shell-first, multi-modal development environment where voice, whiteboard, presentations, and code editing are equal citizens. Uses OpenCode as backend foundation with custom React web client. Every major subsystem is swappable via stable interfaces.
> 
> **Deliverables**:
> - React web client with 9 core modalities (voice I/O, whiteboard, presentations, agent console, file tree, terminal, editor, diff viewer, session manager)
> - OpenCode integration (backend services: Session, File, PTY, LSP, MCP)
> - Interface-first architecture (IVoiceInput, IVoiceOutput, IWhiteboard, IPresentationRenderer, ITerminal, ICodeEditor, etc.)
> - Progressive enhancement (start simple, upgrade components on demand)
> - Phase 0-3 rollout (foundation → voice → whiteboard+presentations → enhancements)
> 
> **Estimated Effort**: XL (6+ months for complete MVP)
> **Parallel Execution**: YES - 4 phases with parallel work within each
> **Critical Path**: Phase 0 (foundation) → Phase 1 (voice) → Phase 2 (whiteboard+presentations) → Phase 3 (polish)

---

## Context

### Original Request
User wants to build OpenSpace - a development environment that breaks free from "IDE Gravity" by making artifacts (voice, whiteboard, presentations, requirements) PRIMARY and code editing SUBORDINATE.

### Interview Summary
**Key Discussions**:
- **Architecture decision**: Rejected Theia/VS Code fork → Chose Shell-First with OpenCode backend
- **Scope clarifications**: Multiple iterations refined IN/OUT scope (voice I/O, whiteboard dual-mode, presentations IN; security model, collaborative editing OUT)
- **Technology selections**: Progressive enhancement strategy (Web Speech API → optional Kokoro TTS; tldraw recommended for whiteboard; Reveal.js for presentations; xterm.js for terminal)
- **Interface requirements**: CRITICAL - all major subsystems MUST be swappable via stable interfaces
- **File naming fix**: Requirements use semantic names, not numbers
- **Prometheus enhancement**: Separate plan created for expanded planning capabilities

**Research Findings**:
- **OpenCode architecture**: Production-grade backend with 30+ services, plugin system, no web client (perfect for custom client)
- **Technology landscape**: Researched whiteboard libraries (tldraw, Excalidraw, Fabric.js), TTS options (Web Speech API, Kokoro), presentation renderers (Reveal.js, Spectacle), terminal emulators (xterm.js)
- **Swappability pattern**: Adapter pattern with interface-first design ensures libraries can be swapped without rewriting client code

### Metis Review
**Will be conducted before presenting final plan to user.**

---

## Work Objectives

### Core Objective
Build OpenSpace MVP - a shell-first, multi-modal development environment with OpenCode backend and custom React web client, where every major subsystem is swappable via stable interfaces and artifacts (voice, whiteboard, presentations) are equal citizens to code editing.

### Concrete Deliverables
- **Phase 0 (Foundation)**:
  - OpenCode server integration
  - React client boilerplate (Vite + TypeScript + React 18)
  - Core interfaces defined (IVoiceInput, IVoiceOutput, IWhiteboard, etc.)
  - Agent console (replicate OpenCode-web)
  - File tree (unified view via OpenCode File service)
  - Terminal (xterm.js via OpenCode PTY)
  - Monaco Editor (code surface)
  
- **Phase 1 (Voice Modality)**:
  - Voice input (Web Speech API)
  - Voice output (Web Speech API TTS with optional Kokoro extension)
  - Voice-to-requirements workflow
  - Diff viewer (file comparison)
  
- **Phase 2 (Visual Modalities)**:
  - Whiteboard (dual-mode: freehand + structured shapes)
  - Universal annotation mode (activate on whiteboard first)
  - Image import and annotation
  - Presentations (Reveal.js with markdown source)
  
- **Phase 3 (Polish & Persistence)**:
  - Session persistence (auto-save, resume last session)
  - First-time UX (empty canvas + chat + menu)
  - Configuration UI for swapping implementations
  - Performance optimization

### Definition of Done
- [ ] User can speak a requirement → transcript appears → edit/structure as desired
- [ ] User can hear agent responses via TTS (toggle on/off)
- [ ] User can draw freehand OR use structured shapes on whiteboard
- [ ] User can annotate on whiteboard (universal annotation mode)
- [ ] User can generate presentation from markdown
- [ ] User can open terminal and run commands
- [ ] User can edit code in Monaco editor
- [ ] User can view file diffs
- [ ] Session state persists across page refresh
- [ ] User can swap implementations (e.g., Web Speech API → Kokoro TTS) via config

### Must Have
- **Interface-first design**: Every major component behind stable interface (NON-NEGOTIABLE)
- **OpenCode integration**: Use existing backend services (Session, File, PTY, LSP, MCP)
- **Agent console**: Exact replica of OpenCode-web (LLM responses, tool logs, chat, history)
- **Unified file tree**: All artifacts + code in single tree (OS-standard extensions + special .sketch, .whiteboard)
- **Dual-mode whiteboard**: BOTH freehand drawing AND structured shapes
- **Universal annotation**: Same tool works across modalities (start with whiteboard)
- **Progressive enhancement**: Start with simple defaults, upgrade on demand
- **Session persistence**: Auto-save, resume where you left off
- **Zero human verification**: All acceptance criteria agent-executable (Playwright, curl, bash)

### Must NOT Have (Guardrails)
- **NO security model in MVP** - permissions, sandboxing deferred to post-MVP
- **NO collaborative editing** - single-user only for MVP
- **NO extension marketplace UI** - architecture support only (OpenCode plugin system enabled)
- **NO git UI** - use terminal only for git operations
- **NO code generation** - no sketch → component preview in MVP
- **NO enforced workflows** - voice is input modality, user structures output (no automatic LLM formatting)
- **NO vague acceptance criteria** - all tests are executable commands with concrete assertions
- **NO tightly coupled implementations** - every component MUST be swappable

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION FOR AUTOMATED TASKS**
>
> **CRITICAL RULE: MANUAL TEST APPROVAL RESET**
>
> 1. **Explicit Approval**: NO implementation action may be taken without explicit user approval of a plan.
> 2. **Manual Test Revocation**: If any task requires a **manual test**, ALL prior approvals for that task are REVOKED. A new manual test plan must be presented and approved before proceeding.

### Test Decision
- **Infrastructure exists**: NO (building from scratch)
- **Automated tests**: TDD for business logic + Agent-Executed QA for integration
- **Framework**: Vitest (Vite-native testing) + Playwright (E2E)

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| **Frontend/UI** | Playwright | Navigate, interact, assert DOM, screenshot |
| **API/Backend** | Bash (curl) | Send requests, parse responses, assert fields |
| **Terminal/CLI** | interactive_bash (tmux) | Run command, send keystrokes, validate output |
| **File Operations** | Bash | File existence, content validation, OpenCode API calls |

**Each Scenario Format:**
```
Scenario: [Descriptive name]
  Tool: Playwright / Bash / interactive_bash
  Preconditions: [What must be true]
  Steps:
    1. [Exact action with specific selector/command/endpoint]
    2. [Next action with expected intermediate state]
    3. [Assertion with exact expected value]
  Expected Result: [Concrete, observable outcome]
  Failure Indicators: [What would indicate failure]
  Evidence: [Screenshot path / output capture / response body path]
```

**Evidence Requirements:**
- Screenshots: `.sisyphus/evidence/task-{N}-{scenario-slug}.png`
- Terminal output: Captured for CLI verifications
- Response bodies: Saved for API verifications

---

## Execution Strategy

### Phased Rollout

**Phase 0: Foundation (Weeks 1-8)**
- OpenCode integration
- React client scaffold
- Core interface definitions
- Agent console, File tree, Terminal, Monaco Editor

**Phase 1: Voice Modality (Weeks 9-12)**
- Voice input/output
- Diff viewer
- Voice → requirements workflow

**Phase 2: Visual Modalities (Weeks 13-20)**
- Whiteboard (freehand + structured)
- Annotations
- Image import
- Presentations

**Phase 3: Polish & Persistence (Weeks 21-24)**
- Session persistence
- First-time UX
- Configuration UI
- Performance optimization

### Parallel Execution Waves (Per Phase)

**Wave patterns will be defined per-phase to maximize parallelization within each phase.**

---

## TODOs - Phase 0: Foundation

### Phase 0.1: Project Setup & OpenCode Integration

- [ ] 1. Initialize React project with Vite + TypeScript

  **What to do**:
  - Create new Vite project: `npm create vite@latest openspace-client -- --template react-ts`
  - Configure TypeScript strict mode
  - Setup ESLint + Prettier
  - Configure path aliases (@/ for src/, @types/ for types/)
  - Setup Vitest for testing
  - Create directory structure: src/adapters/, src/interfaces/, src/components/, src/services/, src/hooks/, src/types/

  **Must NOT do**:
  - Do NOT install all dependencies at once (install as needed per component)
  - Do NOT skip TypeScript strict mode
  - Do NOT create components yet (structure only)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard project initialization
  - **Skills**: None required
  - **Skills Evaluated but Omitted**: All lack domain overlap

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: None (must complete first)
  - **Blocks**: All Phase 0 tasks
  - **Blocked By**: None

  **References**:
  - **Vite Docs**: Official Vite + React + TypeScript guide
  - **Pattern Reference**: Check OpenSpace drafts for directory structure decisions

  **Acceptance Criteria**:

  ```
  Scenario: Project initializes and builds successfully
    Tool: Bash
    Preconditions: Node.js 18+ installed
    Steps:
      1. cd openspace-client && npm install
      2. Assert: Exit code 0
      3. npm run typecheck
      4. Assert: Exit code 0 (no TypeScript errors)
      5. npm run build
      6. Assert: Exit code 0, dist/ directory created
      7. ls -la dist/ | grep index.html
      8. Assert: index.html exists
    Expected Result: Clean build with no errors
    Evidence: Build output captured

  Scenario: Directory structure matches plan
    Tool: Bash
    Preconditions: Project initialized
    Steps:
      1. find src/ -type d | sort
      2. Assert: Contains src/adapters, src/interfaces, src/components, src/services, src/hooks, src/types
    Expected Result: All required directories exist
    Evidence: Directory listing
  ```

  **Commit**: YES
  - Message: `feat(foundation): initialize OpenSpace React client with Vite + TypeScript`
  - Files: `openspace-client/*`
  - Pre-commit: `npm run typecheck && npm run build`

---

- [ ] 2. Define core interfaces (IVoiceInput, IVoiceOutput, IWhiteboard, etc.)

  **What to do**:
  - Create `src/interfaces/IVoiceInput.ts`:
    ```typescript
    export interface IVoiceInput {
      initialize(config: VoiceInputConfig): Promise<void>;
      startRecording(): Promise<void>;
      stopRecording(): Promise<string>; // Returns transcript
      on(event: 'start' | 'transcript' | 'end' | 'error', callback: Callback): void;
      getCapabilities(): VoiceInputCapability[];
      dispose(): void;
    }
    ```
  - Create `src/interfaces/IVoiceOutput.ts` (speak, pause, resume, stop, events)
  - Create `src/interfaces/IWhiteboard.ts` (addShape, draw, export, import, onAnnotation)
  - Create `src/interfaces/IPresentationRenderer.ts` (loadSlides, play, navigate, export)
  - Create `src/interfaces/ITerminal.ts` (connect, write, onData, resize, dispose)
  - Create `src/interfaces/ICodeEditor.ts` (openFile, edit, save, getLSP, dispose)
  - Create `src/interfaces/IFileTree.ts` (load, navigate, watch, getChildren)
  - Create `src/interfaces/IAgentConsole.ts` (sendMessage, streamResponse, history)
  - Create `src/types/capabilities.ts` (VoiceInputCapability, VoiceOutputCapability, etc.)
  - All interfaces include: initialize, core operations, events, capabilities query, dispose

  **Must NOT do**:
  - Do NOT implement adapters yet (interfaces only)
  - Do NOT skip capability queries (needed for progressive enhancement)
  - Do NOT omit dispose methods (resource cleanup critical)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Interface design requires understanding of each subsystem's requirements
  - **Skills**: None required
  - **Skills Evaluated but Omitted**: All lack domain overlap

  **Parallelization**:
  - **Can Run In Parallel**: YES (after Task 1)
  - **Parallel Group**: Wave 0.1 (with Task 3)
  - **Blocks**: All adapter implementation tasks
  - **Blocked By**: Task 1

  **References**:
  - **Draft**: `.sisyphus/drafts/openspace-requirements-expansion.md` lines 432-527 (interface design requirements and examples)
  - **OpenCode SDK Types**: Check OpenCode TypeScript SDK for File, Session, PTY service types

  **Acceptance Criteria**:

  ```
  Scenario: All core interfaces defined with required methods
    Tool: Bash
    Preconditions: Task 1 completed
    Steps:
      1. ls src/interfaces/ | grep ".ts"
      2. Assert: Contains IVoiceInput.ts, IVoiceOutput.ts, IWhiteboard.ts, IPresentationRenderer.ts, ITerminal.ts, ICodeEditor.ts, IFileTree.ts, IAgentConsole.ts
      3. for file in src/interfaces/*.ts; do grep "initialize" "$file" && grep "dispose" "$file" || exit 1; done
      4. Assert: Exit code 0 (all interfaces have initialize and dispose)
      5. grep "getCapabilities" src/interfaces/IVoiceInput.ts
      6. Assert: Capability query method present
    Expected Result: 8 interfaces with required methods
    Evidence: Interface files exist with initialize, dispose, getCapabilities

  Scenario: TypeScript compilation succeeds
    Tool: Bash
    Preconditions: Interfaces created
    Steps:
      1. npm run typecheck
      2. Assert: Exit code 0 (no TypeScript errors in interfaces)
    Expected Result: Clean compilation
    Evidence: TypeScript check passes
  ```

  **Commit**: YES
  - Message: `feat(interfaces): define core interfaces for all major subsystems`
  - Files: `src/interfaces/*.ts`, `src/types/capabilities.ts`
  - Pre-commit: `npm run typecheck`

---

- [ ] 3. Setup OpenCode server integration

  **What to do**:
  - Install OpenCode SDK: `npm install @opencode/sdk`
  - Create `src/services/OpenCodeClient.ts`:
    - Initialize OpenCode client: `createOpencodeClient({ baseURL: 'http://localhost:3000' })`
    - Expose services: session, file, pty, lsp, mcp
    - Handle connection lifecycle (connect, disconnect, reconnect)
    - Error handling with retries
  - Create `src/services/OpenCodeServer.ts` (for local development):
    - Start OpenCode server: `createOpencodeServer({ port: 3000 })`
    - Auto-start in dev mode
  - Add environment variables: `VITE_OPENCODE_URL` (defaults to localhost:3000)
  - Add connection status indicator to UI (connected/disconnected)

  **Must NOT do**:
  - Do NOT hardcode URLs (use environment variables)
  - Do NOT skip error handling (connection failures are common in development)
  - Do NOT skip reconnection logic (WebSocket drops are normal)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: SDK integration with connection management, error handling, retries
  - **Skills**: None required
  - **Skills Evaluated but Omitted**: All lack domain overlap

  **Parallelization**:
  - **Can Run In Parallel**: YES (after Task 1)
  - **Parallel Group**: Wave 0.1 (with Task 2)
  - **Blocks**: Tasks 4, 5, 6, 7 (agent console, file tree, terminal, editor all depend on OpenCode services)
  - **Blocked By**: Task 1

  **References**:
  - **OpenCode SDK**: Documentation at OpenCode repository (check for createOpencodeClient, createOpencodeServer usage)
  - **Draft**: `.sisyphus/drafts/openspace-requirements-expansion.md` lines 205-252 (OpenCode integration architecture)

  **Acceptance Criteria**:

  ```
  Scenario: OpenCode client connects successfully
    Tool: Bash
    Preconditions: OpenCode server running on localhost:3000
    Steps:
      1. cd openspace-client && npm run dev &
      2. sleep 5
      3. curl http://localhost:5173/
      4. Assert: Exit code 0 (Vite dev server running)
      5. Check browser console logs for "OpenCode connected" (would need Playwright for this)
    Expected Result: Client connects to OpenCode server
    Evidence: Connection established (manual check needed - log to console)

  Scenario: OpenCode services available
    Tool: Bash
    Preconditions: OpenCode client initialized
    Steps:
      1. grep "session\|file\|pty\|lsp\|mcp" src/services/OpenCodeClient.ts
      2. Assert: All 5 services exposed
    Expected Result: All services accessible via client
    Evidence: Code contains service exports
  ```

  **Commit**: YES
  - Message: `feat(opencode): integrate OpenCode SDK with client connection`
  - Files: `src/services/OpenCodeClient.ts`, `src/services/OpenCodeServer.ts`, `.env.example`
  - Pre-commit: `npm run typecheck`

---

### Phase 0.2: Core UI Components

- [ ] 4. Implement Agent Console (replicate OpenCode-web)

  **What to do**:
  - Create `src/adapters/AgentConsoleAdapter.ts` implementing `IAgentConsole`
  - Create `src/components/AgentConsole.tsx`:
    - LLM streaming response display
    - Tool execution logs (collapsible)
    - System messages
    - User chat input
    - Message history (scrollable, virtualized for performance)
    - Multiple session tabs
  - Use OpenCode Session service for backend
  - Markdown rendering for LLM responses
  - Syntax highlighting for code blocks
  - Copy button for code snippets
  - Auto-scroll to bottom on new message

  **Must NOT do**:
  - Do NOT reinvent - replicate OpenCode-web agent console exactly
  - Do NOT skip virtualization for large message lists (performance critical)
  - Do NOT skip syntax highlighting (code blocks are common)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI component with streaming, markdown rendering, interaction
  - **Skills**: `frontend-ui-ux`
    - `frontend-ui-ux`: Component design, real-time updates, responsive layout
  - **Skills Evaluated but Omitted**:
    - `playwright`: Not needed for implementation, only for QA

  **Parallelization**:
  - **Can Run In Parallel**: YES (after Task 3)
  - **Parallel Group**: Wave 0.2 (with Tasks 5, 6, 7)
  - **Blocks**: Phase 1 (voice workflow needs agent console)
  - **Blocked By**: Tasks 1, 2, 3

  **References**:
  - **OpenCode-web**: Check OpenCode repository for agent console implementation (component structure, styling patterns)
  - **OpenCode Session Service**: SDK documentation for sendMessage, streamResponse APIs
  - **Draft**: `.sisyphus/drafts/openspace-requirements-expansion.md` lines 367-369 (agent console requirements)

  **Acceptance Criteria**:

  ```
  Scenario: Agent console displays streaming LLM response
    Tool: Playwright (playwright skill)
    Preconditions: OpenCode server running, app loaded
    Steps:
      1. Navigate to: http://localhost:5173/
      2. Wait for: .agent-console visible (timeout: 5s)
      3. Fill: textarea[data-testid="chat-input"] → "Hello, test message"
      4. Click: button[data-testid="send-message"]
      5. Wait for: .message-bubble[data-role="assistant"] visible (timeout: 10s)
      6. Assert: .message-bubble[data-role="assistant"] text is not empty
      7. Screenshot: .sisyphus/evidence/task-4-agent-console-streaming.png
    Expected Result: LLM response appears in agent console
    Evidence: .sisyphus/evidence/task-4-agent-console-streaming.png

  Scenario: Tool execution logs are collapsible
    Tool: Playwright (playwright skill)
    Preconditions: Message with tool calls exists
    Steps:
      1. Navigate to agent console
      2. Wait for: .tool-log visible
      3. Click: .tool-log .collapse-toggle
      4. Assert: .tool-log .details has class "collapsed"
      5. Click: .tool-log .collapse-toggle
      6. Assert: .tool-log .details does NOT have class "collapsed"
      7. Screenshot: .sisyphus/evidence/task-4-tool-log-toggle.png
    Expected Result: Tool logs collapse and expand
    Evidence: .sisyphus/evidence/task-4-tool-log-toggle.png
  ```

  **Commit**: YES
  - Message: `feat(agent-console): implement LLM streaming console with tool logs`
  - Files: `src/components/AgentConsole.tsx`, `src/adapters/AgentConsoleAdapter.ts`
  - Pre-commit: `npm run typecheck`

---

- [ ] 5. Implement File Tree (unified view)

  **What to do**:
  - Create `src/adapters/FileTreeAdapter.ts` implementing `IFileTree`
  - Create `src/components/FileTree.tsx`:
    - Tree view with folders and files
    - Icons: OS-standard extensions (jpeg, png, md, js, ts) + special (.sketch, .whiteboard)
    - Click to open in appropriate viewer (Monaco for code, whiteboard for .sketch, etc.)
    - Context menu: Rename, Delete, New File, New Folder
    - Drag and drop for move operations
    - Collapsible folders with expand/collapse state
  - Use OpenCode File service for backend operations
  - Watch for file changes (auto-refresh on external changes)

  **Must NOT do**:
  - Do NOT create elaborate custom UI (simple tree like VS Code)
  - Do NOT skip file watching (external changes must reflect)
  - Do NOT hardcode file associations (use config for extensibility)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Tree UI component with interactions
  - **Skills**: `frontend-ui-ux`
    - `frontend-ui-ux`: Tree view, icons, drag-and-drop
  - **Skills Evaluated but Omitted**:
    - `playwright`: Only for QA, not implementation

  **Parallelization**:
  - **Can Run In Parallel**: YES (after Task 3)
  - **Parallel Group**: Wave 0.2 (with Tasks 4, 6, 7)
  - **Blocks**: None (other components can proceed)
  - **Blocked By**: Tasks 1, 2, 3

  **References**:
  - **VS Code File Explorer**: Reference for tree UI patterns
  - **OpenCode File Service**: SDK documentation for file operations
  - **Draft**: `.sisyphus/drafts/openspace-requirements-expansion.md` lines 373-376 (file tree requirements)

  **Acceptance Criteria**:

  ```
  Scenario: File tree displays project files
    Tool: Playwright (playwright skill)
    Preconditions: OpenCode server with sample project open
    Steps:
      1. Navigate to: http://localhost:5173/
      2. Wait for: .file-tree visible (timeout: 5s)
      3. Assert: .file-tree .folder-item length > 0
      4. Assert: .file-tree .file-item length > 0
      5. Screenshot: .sisyphus/evidence/task-5-file-tree.png
    Expected Result: File tree shows folders and files
    Evidence: .sisyphus/evidence/task-5-file-tree.png

  Scenario: Clicking file opens in appropriate viewer
    Tool: Playwright (playwright skill)
    Preconditions: File tree loaded with .ts file
    Steps:
      1. Navigate to file tree
      2. Click: .file-item[data-extension="ts"]:first
      3. Wait for: .monaco-editor visible (timeout: 5s)
      4. Assert: Monaco editor opened with file content
      5. Screenshot: .sisyphus/evidence/task-5-file-open.png
    Expected Result: TypeScript file opens in Monaco editor
    Evidence: .sisyphus/evidence/task-5-file-open.png
  ```

  **Commit**: YES
  - Message: `feat(file-tree): implement unified file tree with OpenCode integration`
  - Files: `src/components/FileTree.tsx`, `src/adapters/FileTreeAdapter.ts`
  - Pre-commit: `npm run typecheck`

---

- [ ] 6. Implement Terminal (xterm.js + OpenCode PTY)

  **What to do**:
  - Install xterm.js: `npm install xterm xterm-addon-fit xterm-addon-webgl`
  - Create `src/adapters/XtermAdapter.ts` implementing `ITerminal`
  - Create `src/components/Terminal.tsx`:
    - Embed xterm.js terminal
    - Connect to OpenCode PTY service via WebSocket
    - Fit addon (auto-resize terminal to container)
    - WebGL addon (rendering performance)
    - Multiple terminal tabs
    - Shell selection (bash, zsh, fish)
  - Handle PTY lifecycle (create, resize, destroy)
  - Proper cleanup on component unmount

  **Must NOT do**:
  - Do NOT skip WebGL addon (performance critical for large output)
  - Do NOT skip fit addon (terminal must resize with window)
  - Do NOT skip PTY cleanup (resource leaks)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: xterm.js + WebSocket integration with PTY lifecycle management
  - **Skills**: None required
  - **Skills Evaluated but Omitted**: All lack domain overlap

  **Parallelization**:
  - **Can Run In Parallel**: YES (after Task 3)
  - **Parallel Group**: Wave 0.2 (with Tasks 4, 5, 7)
  - **Blocks**: None
  - **Blocked By**: Tasks 1, 2, 3

  **References**:
  - **xterm.js Docs**: Official documentation for terminal initialization and addons
  - **OpenCode PTY Service**: SDK documentation for PTY WebSocket protocol
  - **Technology Recommendation**: `.sisyphus/drafts/openspace-requirements-expansion.md` lines 561-570 (xterm.js recommendation)

  **Acceptance Criteria**:

  ```
  Scenario: Terminal connects and executes command
    Tool: interactive_bash (tmux)
    Preconditions: OpenSpace app running with terminal visible
    Steps:
      1. Open app in browser (manual or via Playwright)
      2. Click new terminal tab
      3. Wait for terminal ready
      4. Type: echo "Hello from OpenSpace terminal"
      5. Press Enter
      6. Wait for output: "Hello from OpenSpace terminal"
      7. Assert: Output visible in terminal
    Expected Result: Command executes and output appears
    Evidence: Terminal output captured

  Scenario: Terminal resizes with container
    Tool: Playwright (playwright skill)
    Preconditions: Terminal open
    Steps:
      1. Navigate to app
      2. Wait for: .xterm visible (timeout: 5s)
      3. Get: initial terminal dimensions (.xterm clientWidth, clientHeight)
      4. Resize browser window: setViewportSize({ width: 1920, height: 1080 })
      5. Wait: 1s for resize
      6. Get: new terminal dimensions
      7. Assert: Dimensions changed
    Expected Result: Terminal resizes with window
    Evidence: Dimension changes captured
  ```

  **Commit**: YES
  - Message: `feat(terminal): integrate xterm.js with OpenCode PTY service`
  - Files: `src/components/Terminal.tsx`, `src/adapters/XtermAdapter.ts`
  - Pre-commit: `npm run typecheck`

---

- [ ] 7. Implement Monaco Editor (code surface)

  **What to do**:
  - Install Monaco: `npm install @monaco-editor/react monaco-editor`
  - Create `src/adapters/MonacoAdapter.ts` implementing `ICodeEditor`
  - Create `src/components/CodeEditor.tsx`:
    - Embed Monaco editor
    - Connect to OpenCode LSP service (TypeScript, Python, etc.)
    - File open/save via OpenCode File service
    - Syntax highlighting for common languages
    - IntelliSense (completions, hover, diagnostics)
    - Find/replace
    - Minimap
    - Multiple editor tabs
  - Theme integration (match app theme - light/dark)
  - Proper LSP initialization per language

  **Must NOT do**:
  - Do NOT skip LSP integration (IntelliSense is critical)
  - Do NOT hardcode theme (must match app theme)
  - Do NOT load all language grammars (lazy load per file type)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Monaco + LSP integration with file operations
  - **Skills**: None required
  - **Skills Evaluated but Omitted**: All lack domain overlap

  **Parallelization**:
  - **Can Run In Parallel**: YES (after Task 3)
  - **Parallel Group**: Wave 0.2 (with Tasks 4, 5, 6)
  - **Blocks**: Phase 1 (diff viewer needs editor component)
  - **Blocked By**: Tasks 1, 2, 3

  **References**:
  - **Monaco Docs**: Official @monaco-editor/react documentation
  - **OpenCode LSP Service**: SDK documentation for LSP integration
  - **Draft**: `.sisyphus/drafts/openspace-requirements-expansion.md` lines 409 (editor as subordinate to shell)

  **Acceptance Criteria**:

  ```
  Scenario: Monaco editor opens file with syntax highlighting
    Tool: Playwright (playwright skill)
    Preconditions: File tree with TypeScript file
    Steps:
      1. Navigate to app
      2. Click: .file-item[data-extension="ts"]:first
      3. Wait for: .monaco-editor visible (timeout: 10s)
      4. Assert: .monaco-editor contains .mtk (Monaco syntax token class)
      5. Screenshot: .sisyphus/evidence/task-7-monaco-syntax.png
    Expected Result: File opens with syntax highlighting
    Evidence: .sisyphus/evidence/task-7-monaco-syntax.png

  Scenario: Monaco editor shows IntelliSense completions
    Tool: Playwright (playwright skill)
    Preconditions: TypeScript file open in editor
    Steps:
      1. Navigate to editor with open file
      2. Type: "console."
      3. Wait for: .monaco-editor .suggest-widget visible (timeout: 3s)
      4. Assert: Completion list appears
      5. Assert: Completion list contains "log"
      6. Screenshot: .sisyphus/evidence/task-7-intellisense.png
    Expected Result: IntelliSense shows completions
    Evidence: .sisyphus/evidence/task-7-intellisense.png
  ```

  **Commit**: YES
  - Message: `feat(editor): integrate Monaco editor with OpenCode LSP`
  - Files: `src/components/CodeEditor.tsx`, `src/adapters/MonacoAdapter.ts`
  - Pre-commit: `npm run typecheck`

---

## TODOs - Phase 1: Voice Modality

- [ ] 8. Define IVoiceInput and implement WebSpeechAdapter

  **What to do**:
  - Interface already defined in Task 2
  - Create `src/adapters/WebSpeechInputAdapter.ts` implementing `IVoiceInput`:
    - Use browser Web Speech API (webkitSpeechRecognition or SpeechRecognition)
    - Handle continuous vs single recognition
    - Interim results support
    - Language selection
    - Error handling (no microphone, permission denied, network error)
  - Create factory: `src/factories/VoiceInputFactory.ts` (selects adapter based on config)
  - Add microphone permission request flow
  - Visual feedback for recording state (animated icon)

  **Must NOT do**:
  - Do NOT skip error handling (permission errors are common)
  - Do NOT skip interim results (better UX for real-time feedback)
  - Do NOT hardcode language (make configurable)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Web Speech API integration with permission handling, error cases
  - **Skills**: None required
  - **Skills Evaluated but Omitted**: All lack domain overlap

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1.1 (with Task 9)
  - **Blocks**: Task 10 (voice workflow)
  - **Blocked By**: Tasks 1-7 (Phase 0 complete)

  **References**:
  - **Web Speech API**: MDN documentation for SpeechRecognition
  - **Interface**: `src/interfaces/IVoiceInput.ts` (created in Task 2)
  - **Draft**: `.sisyphus/drafts/openspace-requirements-expansion.md` lines 442 (IVoiceInput in interface table)

  **Acceptance Criteria**:

  ```
  Scenario: Voice input records and returns transcript
    Tool: Playwright (playwright skill)
    Preconditions: App running, microphone permission granted
    Steps:
      1. Navigate to app
      2. Click: button[data-testid="voice-input-start"]
      3. Wait for: .recording-indicator visible (timeout: 2s)
      4. Simulate speech: (Playwright cannot actually trigger speech, so test with mock)
      5. Click: button[data-testid="voice-input-stop"]
      6. Wait for: .transcript-output visible (timeout: 5s)
      7. Assert: .transcript-output text is not empty
      8. Screenshot: .sisyphus/evidence/task-8-voice-input.png
    Expected Result: Recording starts, stops, transcript appears
    Evidence: .sisyphus/evidence/task-8-voice-input.png
    Note: Full speech test requires manual verification due to Playwright limitations

  Scenario: Voice input handles permission denial gracefully
    Tool: Playwright (playwright skill)
    Preconditions: App running, microphone permission NOT granted
    Steps:
      1. Navigate to app
      2. Set microphone permission to "denied" (browser.context().grantPermissions([]))
      3. Click: button[data-testid="voice-input-start"]
      4. Wait for: .error-message visible (timeout: 3s)
      5. Assert: .error-message text contains "microphone permission"
      6. Screenshot: .sisyphus/evidence/task-8-permission-denied.png
    Expected Result: Error message explains permission issue
    Evidence: .sisyphus/evidence/task-8-permission-denied.png
  ```

  **Commit**: YES
  - Message: `feat(voice): implement Web Speech API voice input adapter`
  - Files: `src/adapters/WebSpeechInputAdapter.ts`, `src/factories/VoiceInputFactory.ts`
  - Pre-commit: `npm run typecheck`

---

- [ ] 9. Define IVoiceOutput and implement WebSpeechTTSAdapter + KokoroTTSAdapter stub

  **What to do**:
  - Interface already defined in Task 2
  - Create `src/adapters/WebSpeechTTSAdapter.ts` implementing `IVoiceOutput`:
    - Use browser speechSynthesis API
    - Voice selection (list available voices)
    - Rate, pitch, volume controls
    - Pause, resume, stop
    - Event handling (start, end, error)
  - Create `src/adapters/KokoroTTSAdapter.ts` (stub for now):
    - Implement interface signature
    - Throw "NotInstalledError" with message: "Kokoro TTS not installed. Click here to install."
    - Detection: check if Kokoro package is available
  - Create factory: `src/factories/VoiceOutputFactory.ts` (selects Web Speech by default, Kokoro if installed)
  - Add TTS toggle button (enable/disable voice output globally)

  **Must NOT do**:
  - Do NOT implement full Kokoro integration yet (stub only - actual implementation is Phase 3+)
  - Do NOT auto-enable TTS (user must explicitly enable)
  - Do NOT skip voice selection (different browsers have different voices)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: speechSynthesis API + factory pattern with optional extension
  - **Skills**: None required
  - **Skills Evaluated but Omitted**: All lack domain overlap

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1.1 (with Task 8)
  - **Blocks**: Task 10 (voice workflow)
  - **Blocked By**: Tasks 1-7 (Phase 0 complete)

  **References**:
  - **Web Speech Synthesis**: MDN documentation for speechSynthesis
  - **Interface**: `src/interfaces/IVoiceOutput.ts` (created in Task 2)
  - **Draft**: `.sisyphus/drafts/openspace-requirements-expansion.md` lines 537-558 (TTS progressive enhancement decision)

  **Acceptance Criteria**:

  ```
  Scenario: Voice output speaks text via Web Speech API
    Tool: Playwright (playwright skill)
    Preconditions: App running, TTS enabled
    Steps:
      1. Navigate to app
      2. Click: button[data-testid="enable-tts"]
      3. Fill: textarea[data-testid="test-tts-input"] → "Hello, this is a test"
      4. Click: button[data-testid="speak"]
      5. Wait for: .speaking-indicator visible (timeout: 2s)
      6. Assert: speechSynthesis.speaking === true (via page.evaluate)
      7. Screenshot: .sisyphus/evidence/task-9-tts-speaking.png
    Expected Result: TTS starts speaking
    Evidence: .sisyphus/evidence/task-9-tts-speaking.png
    Note: Actual audio output cannot be verified by Playwright

  Scenario: Kokoro TTS adapter shows install prompt when not available
    Tool: Bash
    Preconditions: Kokoro package NOT installed
    Steps:
      1. grep "throw.*NotInstalledError" src/adapters/KokoroTTSAdapter.ts
      2. Assert: Exit code 0 (stub throws error)
      3. grep "Kokoro TTS not installed" src/adapters/KokoroTTSAdapter.ts
      4. Assert: Error message present
    Expected Result: Kokoro stub handles not-installed case
    Evidence: Code contains error throw
  ```

  **Commit**: YES
  - Message: `feat(voice): implement Web Speech TTS adapter + Kokoro stub`
  - Files: `src/adapters/WebSpeechTTSAdapter.ts`, `src/adapters/KokoroTTSAdapter.ts`, `src/factories/VoiceOutputFactory.ts`
  - Pre-commit: `npm run typecheck`

---

- [ ] 10. Implement Diff Viewer

  **What to do**:
  - Install diff library: `npm install diff react-diff-viewer-continued`
  - Create `src/components/DiffViewer.tsx`:
    - Side-by-side diff view
    - Inline diff view (toggle)
    - Syntax highlighting for both sides
    - Line numbers
    - Collapse unchanged regions
    - Accept left/right (for merge scenarios - future)
  - Integrate with OpenCode File service (load two file versions)
  - Connect to git via terminal (show git diff output)

  **Must NOT do**:
  - Do NOT skip syntax highlighting in diff view
  - Do NOT skip collapse unchanged regions (large diffs are common)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Diff UI component with syntax highlighting
  - **Skills**: `frontend-ui-ux`
    - `frontend-ui-ux`: Diff view layout, toggle controls
  - **Skills Evaluated but Omitted**:
    - `playwright`: Only for QA

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1.2 (with Task 11)
  - **Blocks**: None
  - **Blocked By**: Tasks 1-7 (Phase 0), Task 7 (Monaco needed for syntax highlighting patterns)

  **References**:
  - **react-diff-viewer**: Documentation for diff component
  - **Draft**: `.sisyphus/drafts/openspace-requirements-expansion.md` lines 379-382 (diff viewer requirement)

  **Acceptance Criteria**:

  ```
  Scenario: Diff viewer shows file comparison
    Tool: Playwright (playwright skill)
    Preconditions: Two versions of a file exist
    Steps:
      1. Navigate to app
      2. Click: .file-item[data-filename="test.ts"] right-click
      3. Click: context menu "Compare with..."
      4. Select: previous version from dropdown
      5. Wait for: .diff-viewer visible (timeout: 5s)
      6. Assert: .diff-viewer .diff-line-added length > 0
      7. Assert: .diff-viewer .diff-line-removed length > 0
      8. Screenshot: .sisyphus/evidence/task-10-diff-viewer.png
    Expected Result: Diff shows added/removed lines
    Evidence: .sisyphus/evidence/task-10-diff-viewer.png

  Scenario: Diff viewer toggles between side-by-side and inline
    Tool: Playwright (playwright skill)
    Preconditions: Diff viewer open
    Steps:
      1. Navigate to diff viewer
      2. Click: button[data-testid="toggle-diff-view"]
      3. Assert: .diff-viewer has class "inline-view"
      4. Click: button[data-testid="toggle-diff-view"]
      5. Assert: .diff-viewer has class "split-view"
      6. Screenshot: .sisyphus/evidence/task-10-diff-toggle.png
    Expected Result: View toggles between modes
    Evidence: .sisyphus/evidence/task-10-diff-toggle.png
  ```

  **Commit**: YES
  - Message: `feat(diff): implement side-by-side diff viewer with syntax highlighting`
  - Files: `src/components/DiffViewer.tsx`
  - Pre-commit: `npm run typecheck`

---

- [ ] 11. Implement Voice → Requirements workflow

  **What to do**:
  - Create `src/components/VoiceRequirementsPanel.tsx`:
    - Voice input button (starts recording)
    - Real-time transcript display (interim results)
    - Stop recording button
    - Transcript editing area (user can modify/structure)
    - "Save as Requirement" button → opens requirement template
    - Save to `docs/requirements/` via OpenCode File service
  - No automatic LLM structuring (user has full control)
  - User chooses format (Markdown, YAML, plain text)
  - Integrate with agent console (optional: ask agent to help structure)

  **Must NOT do**:
  - Do NOT enforce any format (user's choice)
  - Do NOT auto-structure with LLM (user controls structure)
  - Do NOT skip editing step (voice is input, user refines output)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Workflow UI connecting voice input → editing → file save
  - **Skills**: `frontend-ui-ux`
    - `frontend-ui-ux`: Workflow panel design, editing UX
  - **Skills Evaluated but Omitted**:
    - `playwright`: Only for QA

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1.2 (with Task 10)
  - **Blocks**: None (Phase 1 complete after this)
  - **Blocked By**: Tasks 8, 9 (voice input/output must exist)

  **References**:
  - **Draft**: `.sisyphus/drafts/openspace-requirements-expansion.md` lines 326-330 (voice → requirements clarification)
  - **Requirement**: REQ-CORE-014 (Voice → Requirements → Presentation flow)

  **Acceptance Criteria**:

  ```
  Scenario: Voice recording produces editable transcript
    Tool: Playwright (playwright skill)
    Preconditions: App running, voice input available
    Steps:
      1. Navigate to app
      2. Click: button[data-testid="voice-requirements-start"]
      3. Wait for: .recording-indicator visible (timeout: 2s)
      4. Mock transcript: (inject via executeScript: simulate recognition result)
      5. Click: button[data-testid="voice-requirements-stop"]
      6. Wait for: textarea[data-testid="transcript-editor"] visible (timeout: 3s)
      7. Assert: textarea contains transcript text
      8. Fill: textarea → "Edited requirement text"
      9. Screenshot: .sisyphus/evidence/task-11-voice-requirements-edit.png
    Expected Result: Transcript appears in editable textarea
    Evidence: .sisyphus/evidence/task-11-voice-requirements-edit.png

  Scenario: Save transcript as requirement file
    Tool: Playwright (playwright skill)
    Preconditions: Transcript edited
    Steps:
      1. Navigate to voice requirements panel with edited transcript
      2. Click: button[data-testid="save-requirement"]
      3. Fill: input[data-testid="filename"] → "REQ-TEST-voice-input"
      4. Click: button[data-testid="confirm-save"]
      5. Wait for: .success-message visible (timeout: 5s)
      6. Navigate to file tree
      7. Assert: .file-item[data-filename="REQ-TEST-voice-input.md"] visible
      8. Screenshot: .sisyphus/evidence/task-11-requirement-saved.png
    Expected Result: Requirement file saved to docs/requirements/
    Evidence: .sisyphus/evidence/task-11-requirement-saved.png
  ```

  **Commit**: YES
  - Message: `feat(voice): implement voice → requirements workflow`
  - Files: `src/components/VoiceRequirementsPanel.tsx`
  - Pre-commit: `npm run typecheck`

---

## TODOs - Phase 2: Visual Modalities

- [ ] 12. Define IWhiteboard interface and implement [SELECTED_LIBRARY]Adapter

  **What to do**:
  - Interface already defined in Task 2
  - Technology selection: [TBD - tldraw, Excalidraw, Fabric.js, or Konva based on research]
  - Create `src/adapters/[SelectedLibrary]WhiteboardAdapter.ts` implementing `IWhiteboard`:
    - Freehand drawing (pen tool)
    - Structured shapes (rectangle, circle, arrow, text)
    - Image import (drag-drop or file picker)
    - Export (PNG, SVG, JSON)
    - Import (load saved whiteboard state)
    - Annotation events (onShapeAdded, onDrawingCompleted)
  - Create `src/components/Whiteboard.tsx`:
    - Embed whiteboard canvas
    - Tool palette (pen, shapes, select, erase)
    - Color picker
    - Stroke width selector
    - Undo/redo
    - Clear canvas
    - Save/load
  - Create factory: `src/factories/WhiteboardFactory.ts`

  **Must NOT do**:
  - Do NOT skip freehand drawing (dual-mode is requirement)
  - Do NOT skip structured shapes (dual-mode is requirement)
  - Do NOT hardcode implementation (use factory pattern)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Canvas integration with tool palette and interactions
  - **Skills**: `frontend-ui-ux`
    - `frontend-ui-ux`: Whiteboard UI, tool palette, drawing interactions
  - **Skills Evaluated but Omitted**:
    - `playwright`: Only for QA

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2.1 (with Task 13)
  - **Blocks**: Task 14 (annotations), Task 15 (image import)
  - **Blocked By**: Tasks 1-11 (Phases 0, 1 complete)

  **References**:
  - **Technology Recommendation**: `.sisyphus/drafts/openspace-requirements-expansion.md` lines 572-593 (whiteboard library comparison)
  - **Interface**: `src/interfaces/IWhiteboard.ts` (created in Task 2)
  - **Requirement**: REQ-CORE-008 (freeform, structured, captured-image sketches)
  - **Draft**: `.sisyphus/drafts/openspace-requirements-expansion.md` lines 309-313 (dual-mode whiteboard)

  **Acceptance Criteria**:

  ```
  Scenario: Freehand drawing works on whiteboard
    Tool: Playwright (playwright skill)
    Preconditions: Whiteboard open
    Steps:
      1. Navigate to app
      2. Click: button[data-testid="open-whiteboard"]
      3. Wait for: .whiteboard-canvas visible (timeout: 5s)
      4. Click: button[data-tool="pen"]
      5. Mouse down at: (100, 100)
      6. Mouse move to: (200, 200)
      7. Mouse up
      8. Assert: Canvas contains drawn path (check canvas data)
      9. Screenshot: .sisyphus/evidence/task-12-freehand-drawing.png
    Expected Result: Freehand line drawn on canvas
    Evidence: .sisyphus/evidence/task-12-freehand-drawing.png

  Scenario: Structured shapes can be added
    Tool: Playwright (playwright skill)
    Preconditions: Whiteboard open
    Steps:
      1. Navigate to whiteboard
      2. Click: button[data-tool="rectangle"]
      3. Mouse down at: (150, 150)
      4. Mouse move to: (250, 250)
      5. Mouse up
      6. Assert: Rectangle shape visible on canvas
      7. Screenshot: .sisyphus/evidence/task-12-rectangle-shape.png
    Expected Result: Rectangle shape added to whiteboard
    Evidence: .sisyphus/evidence/task-12-rectangle-shape.png

  Scenario: Whiteboard state can be saved and loaded
    Tool: Playwright (playwright skill)
    Preconditions: Whiteboard with drawn content
    Steps:
      1. Navigate to whiteboard with shapes
      2. Click: button[data-testid="save-whiteboard"]
      3. Wait for: .success-message visible (timeout: 3s)
      4. Reload page
      5. Click: button[data-testid="open-whiteboard"]
      6. Wait for: .whiteboard-canvas visible
      7. Assert: Previously drawn shapes visible (check canvas data or shape count)
      8. Screenshot: .sisyphus/evidence/task-12-whiteboard-persistence.png
    Expected Result: Whiteboard state restored after reload
    Evidence: .sisyphus/evidence/task-12-whiteboard-persistence.png
  ```

  **Commit**: YES
  - Message: `feat(whiteboard): implement dual-mode whiteboard with [LIBRARY_NAME]`
  - Files: `src/components/Whiteboard.tsx`, `src/adapters/[Library]WhiteboardAdapter.ts`, `src/factories/WhiteboardFactory.ts`
  - Pre-commit: `npm run typecheck`

---

- [ ] 13. Define IPresentationRenderer and implement RevealJSAdapter

  **What to do**:
  - Interface already defined in Task 2
  - Install Reveal.js: `npm install reveal.js`
  - Create `src/adapters/RevealJSAdapter.ts` implementing `IPresentationRenderer`:
    - Load markdown slides
    - Convert markdown to Reveal.js format
    - Slide navigation (next, previous, goto)
    - Play/pause presentation
    - Speaker notes display (optional presenter view)
    - Export to PDF
  - Create `src/components/PresentationViewer.tsx`:
    - Embed Reveal.js presentation
    - Navigation controls
    - Presenter view toggle
    - Edit slides button (opens markdown editor)
  - Create factory: `src/factories/PresentationRendererFactory.ts`

  **Must NOT do**:
  - Do NOT skip markdown → slides conversion (markdown is storage format)
  - Do NOT skip presenter view (useful for presentations)
  - Do NOT hardcode implementation (use factory pattern)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Reveal.js integration with markdown parsing
  - **Skills**: None required
  - **Skills Evaluated but Omitted**: All lack domain overlap

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2.1 (with Task 12)
  - **Blocks**: None
  - **Blocked By**: Tasks 1-11 (Phases 0, 1 complete)

  **References**:
  - **Reveal.js Docs**: Official documentation for initialization and markdown slides
  - **Technology Recommendation**: `.sisyphus/drafts/openspace-requirements-expansion.md` lines 595-605 (Reveal.js recommendation)
  - **Interface**: `src/interfaces/IPresentationRenderer.ts` (created in Task 2)
  - **Requirement**: REQ-CORE-013, REQ-CORE-036, REQ-CORE-039

  **Acceptance Criteria**:

  ```
  Scenario: Presentation loads from markdown file
    Tool: Playwright (playwright skill)
    Preconditions: Markdown presentation file exists (slides.md)
    Steps:
      1. Navigate to app
      2. Click: .file-item[data-filename="slides.md"]
      3. Click: button[data-testid="open-as-presentation"]
      4. Wait for: .reveal visible (timeout: 5s)
      5. Assert: .reveal .slides section length > 0 (slides loaded)
      6. Screenshot: .sisyphus/evidence/task-13-presentation-loaded.png
    Expected Result: Markdown slides rendered as presentation
    Evidence: .sisyphus/evidence/task-13-presentation-loaded.png

  Scenario: Presentation navigation works (next/previous)
    Tool: Playwright (playwright skill)
    Preconditions: Presentation open with multiple slides
    Steps:
      1. Navigate to presentation viewer
      2. Click: button[data-testid="next-slide"]
      3. Wait for: 500ms (slide transition)
      4. Assert: .reveal .slides .present contains slide 2 content
      5. Click: button[data-testid="previous-slide"]
      6. Wait for: 500ms
      7. Assert: .reveal .slides .present contains slide 1 content
      8. Screenshot: .sisyphus/evidence/task-13-presentation-navigation.png
    Expected Result: Slides navigate correctly
    Evidence: .sisyphus/evidence/task-13-presentation-navigation.png
  ```

  **Commit**: YES
  - Message: `feat(presentations): implement Reveal.js presentation renderer`
  - Files: `src/components/PresentationViewer.tsx`, `src/adapters/RevealJSAdapter.ts`, `src/factories/PresentationRendererFactory.ts`
  - Pre-commit: `npm run typecheck`

---

- [ ] 14. Implement Universal Annotation Mode (on whiteboard)

  **What to do**:
  - Create `src/components/AnnotationLayer.tsx`:
    - Overlay layer on top of whiteboard
    - Annotation tools: highlight, strikethrough, arrow, text note, freehand markup
    - Toggle on/off (annotation mode vs drawing mode)
    - Saved separately from whiteboard content (non-destructive)
  - Annotations stored as separate layer in whiteboard file format
  - Export includes both whiteboard content + annotations
  - Can clear annotations without affecting underlying whiteboard

  **Must NOT do**:
  - Do NOT merge annotations with base content (keep layered)
  - Do NOT skip non-destructive editing (annotations are additive)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Overlay layer with annotation tools
  - **Skills**: `frontend-ui-ux`
    - `frontend-ui-ux`: Annotation UI, layer management
  - **Skills Evaluated but Omitted**:
    - `playwright`: Only for QA

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2.2 (with Task 15)
  - **Blocks**: None
  - **Blocked By**: Task 12 (whiteboard must exist)

  **References**:
  - **Draft**: `.sisyphus/drafts/openspace-requirements-expansion.md` lines 315-324 (annotation as universal mode)
  - **Requirement**: REQ-CORE-009 (annotation as distinct modality)

  **Acceptance Criteria**:

  ```
  Scenario: Annotation mode activates on whiteboard
    Tool: Playwright (playwright skill)
    Preconditions: Whiteboard with content
    Steps:
      1. Navigate to whiteboard
      2. Click: button[data-testid="toggle-annotation-mode"]
      3. Assert: .annotation-layer visible
      4. Assert: button[data-testid="toggle-annotation-mode"] has class "active"
      5. Screenshot: .sisyphus/evidence/task-14-annotation-mode.png
    Expected Result: Annotation mode activated
    Evidence: .sisyphus/evidence/task-14-annotation-mode.png

  Scenario: Annotations can be added and cleared independently
    Tool: Playwright (playwright skill)
    Preconditions: Annotation mode active
    Steps:
      1. Navigate to whiteboard in annotation mode
      2. Select: annotation tool "highlight"
      3. Draw highlight over existing shape
      4. Assert: Highlight annotation visible
      5. Click: button[data-testid="clear-annotations"]
      6. Assert: Highlight removed, base whiteboard content unchanged
      7. Screenshot: .sisyphus/evidence/task-14-annotation-cleared.png
    Expected Result: Annotations cleared without affecting base content
    Evidence: .sisyphus/evidence/task-14-annotation-cleared.png
  ```

  **Commit**: YES
  - Message: `feat(annotations): implement universal annotation layer on whiteboard`
  - Files: `src/components/AnnotationLayer.tsx`
  - Pre-commit: `npm run typecheck`

---

- [ ] 15. Implement Image Import and Annotation

  **What to do**:
  - Extend whiteboard to support image import:
    - Drag-and-drop image files onto whiteboard
    - File picker for image selection
    - Paste image from clipboard
    - Supported formats: JPEG, PNG, GIF, SVG
  - Image becomes a whiteboard object (can be moved, resized, rotated)
  - Annotations work on imported images (overlay layer)
  - Export preserves both image + annotations

  **Must NOT do**:
  - Do NOT skip drag-and-drop (common workflow)
  - Do NOT skip paste from clipboard (convenient for screenshots)
  - Do NOT lose annotations when moving images

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Image handling with drag-and-drop, clipboard integration
  - **Skills**: `frontend-ui-ux`
    - `frontend-ui-ux`: Image import UX, drag-and-drop
  - **Skills Evaluated but Omitted**:
    - `playwright`: Only for QA

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2.2 (with Task 14)
  - **Blocks**: None (Phase 2 complete after this)
  - **Blocked By**: Task 12 (whiteboard must exist)

  **References**:
  - **Draft**: `.sisyphus/drafts/openspace-requirements-expansion.md` lines 312 (image import requirement)
  - **Requirement**: REQ-CORE-008 (captured-image sketches)

  **Acceptance Criteria**:

  ```
  Scenario: Image can be drag-and-dropped onto whiteboard
    Tool: Playwright (playwright skill)
    Preconditions: Whiteboard open, image file available
    Steps:
      1. Navigate to whiteboard
      2. Create DataTransfer with image file
      3. Dispatch dragover event on .whiteboard-canvas
      4. Dispatch drop event with image file
      5. Wait for: .image-object visible (timeout: 5s)
      6. Assert: Image visible on whiteboard
      7. Screenshot: .sisyphus/evidence/task-15-image-dropped.png
    Expected Result: Image appears on whiteboard
    Evidence: .sisyphus/evidence/task-15-image-dropped.png

  Scenario: Annotations work on imported images
    Tool: Playwright (playwright skill)
    Preconditions: Image imported on whiteboard, annotation mode active
    Steps:
      1. Navigate to whiteboard with image
      2. Activate annotation mode
      3. Select: annotation tool "arrow"
      4. Draw arrow pointing to part of image
      5. Assert: Arrow annotation visible over image
      6. Screenshot: .sisyphus/evidence/task-15-image-annotation.png
    Expected Result: Annotation overlays image
    Evidence: .sisyphus/evidence/task-15-image-annotation.png
  ```

  **Commit**: YES
  - Message: `feat(whiteboard): add image import with annotation support`
  - Files: `src/components/Whiteboard.tsx` (enhanced)
  - Pre-commit: `npm run typecheck`

---

## TODOs - Phase 3: Polish & Persistence

- [ ] 16. Implement Session Persistence (auto-save, resume)

  **What to do**:
  - Create `src/services/SessionManager.ts`:
    - Auto-save session state every 30 seconds (debounced)
    - Save to browser IndexedDB (or OpenCode Session service)
    - Session state includes:
      - Open files in editor (file paths, cursor positions)
      - Whiteboard state (if whiteboard open)
      - Agent console message history
      - Terminal sessions (restore PTY connections)
      - Last active panel
    - On app load: check for existing session → offer to resume
    - Clear session option (start fresh)
  - Visual indicator: "Session saved" toast notification

  **Must NOT do**:
  - Do NOT save passwords or secrets in session state
  - Do NOT skip debouncing (save on every keystroke is expensive)
  - Do NOT force resume (user choice)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: State management, IndexedDB integration, session lifecycle
  - **Skills**: None required
  - **Skills Evaluated but Omitted**: All lack domain overlap

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3.1 (with Task 17)
  - **Blocks**: None
  - **Blocked By**: Tasks 1-15 (all components must exist to persist their state)

  **References**:
  - **Draft**: `.sisyphus/drafts/openspace-requirements-expansion.md` lines 345-351 (session persistence requirement)
  - **Requirement**: REQ-CORE-043 (session persistence and resume - to be documented)

  **Acceptance Criteria**:

  ```
  Scenario: Session state saves automatically
    Tool: Playwright (playwright skill)
    Preconditions: App running with open file
    Steps:
      1. Navigate to app
      2. Open file in editor
      3. Type: some code changes
      4. Wait: 35s (for auto-save debounce + save)
      5. Assert: .toast-notification text contains "Session saved"
      6. Screenshot: .sisyphus/evidence/task-16-session-saved.png
    Expected Result: Session saved notification appears
    Evidence: .sisyphus/evidence/task-16-session-saved.png

  Scenario: Session resumes on page reload
    Tool: Playwright (playwright skill)
    Preconditions: Session saved with open file
    Steps:
      1. Navigate to app with saved session
      2. Reload page
      3. Wait for: .resume-session-dialog visible (timeout: 3s)
      4. Click: button[data-testid="resume-session"]
      5. Wait for: .monaco-editor visible (timeout: 5s)
      6. Assert: Previously open file restored in editor
      7. Screenshot: .sisyphus/evidence/task-16-session-resumed.png
    Expected Result: Editor opens with previous file
    Evidence: .sisyphus/evidence/task-16-session-resumed.png
  ```

  **Commit**: YES
  - Message: `feat(session): implement auto-save session persistence with resume`
  - Files: `src/services/SessionManager.ts`
  - Pre-commit: `npm run typecheck`

---

- [ ] 17. Implement First-Time UX (empty canvas + chat + menu)

  **What to do**:
  - Create `src/components/WelcomeScreen.tsx`:
    - Detect first-time launch (no previous session)
    - Show:
      - Empty whiteboard canvas (ready to draw)
      - Agent console (chat window visible)
      - Menu bar (File → Open Folder)
    - Subtle onboarding hints (dismissible):
      - "Click here to start drawing"
      - "Type a message to chat with the agent"
      - "Open a folder to browse files"
    - One-time onboarding (never show again after first interaction)

  **Must NOT do**:
  - Do NOT force tutorial (optional dismissible hints only)
  - Do NOT block UI with modal (non-intrusive onboarding)
  - Do NOT show on every launch (first-time only)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Onboarding UX with hints and layout
  - **Skills**: `frontend-ui-ux`
    - `frontend-ui-ux`: Onboarding design, hint placement
  - **Skills Evaluated but Omitted**:
    - `playwright`: Only for QA

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3.1 (with Task 16)
  - **Blocks**: None
  - **Blocked By**: Tasks 1-15 (all components must exist)

  **References**:
  - **Draft**: `.sisyphus/drafts/openspace-requirements-expansion.md` lines 385-390 (first-time UX requirement)

  **Acceptance Criteria**:

  ```
  Scenario: First-time user sees welcome screen
    Tool: Playwright (playwright skill)
    Preconditions: App never launched before (clear browser storage)
    Steps:
      1. Clear IndexedDB and localStorage
      2. Navigate to app
      3. Wait for: .welcome-screen visible (timeout: 3s)
      4. Assert: .whiteboard-canvas visible (empty)
      5. Assert: .agent-console visible
      6. Assert: .onboarding-hint length > 0
      7. Screenshot: .sisyphus/evidence/task-17-first-time-ux.png
    Expected Result: Welcome screen with empty canvas + chat + hints
    Evidence: .sisyphus/evidence/task-17-first-time-ux.png

  Scenario: Onboarding hints can be dismissed
    Tool: Playwright (playwright skill)
    Preconditions: First-time launch
    Steps:
      1. Navigate to welcome screen
      2. Click: .onboarding-hint .dismiss-button
      3. Assert: .onboarding-hint not visible
      4. Reload page
      5. Assert: .onboarding-hint not visible (does not reappear)
      6. Screenshot: .sisyphus/evidence/task-17-hints-dismissed.png
    Expected Result: Hints dismissed permanently
    Evidence: .sisyphus/evidence/task-17-hints-dismissed.png
  ```

  **Commit**: YES
  - Message: `feat(ux): implement first-time welcome screen with onboarding hints`
  - Files: `src/components/WelcomeScreen.tsx`
  - Pre-commit: `npm run typecheck`

---

- [ ] 18. Implement Configuration UI (swap implementations)

  **What to do**:
  - Create `src/components/SettingsPanel.tsx`:
    - Voice Input: Select adapter (Web Speech API | Whisper.js | Deepgram)
    - Voice Output: Select adapter (Web Speech API | Kokoro TTS)
    - Whiteboard: Select adapter ([Default] | Excalidraw | Fabric.js)
    - Presentation: Select adapter (Reveal.js | Spectacle)
    - Terminal: Select adapter (xterm.js)
    - Editor: Select adapter (Monaco)
  - Show "Install" button for unavailable adapters (e.g., Kokoro TTS)
  - Show adapter capabilities (what features are available)
  - Apply changes: reload affected components with new adapter
  - Persist settings to localStorage

  **Must NOT do**:
  - Do NOT allow selection of unavailable adapters without install prompt
  - Do NOT skip capability display (user needs to know what each adapter offers)
  - Do NOT require full app reload (hot-swap adapters where possible)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Settings UI with adapter selection and installation prompts
  - **Skills**: `frontend-ui-ux`
    - `frontend-ui-ux`: Settings panel layout, adapter comparison UI
  - **Skills Evaluated but Omitted**:
    - `playwright`: Only for QA

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3.2 (with Task 19)
  - **Blocks**: None
  - **Blocked By**: Tasks 1-15 (all adapters must exist)

  **References**:
  - **Draft**: `.sisyphus/drafts/openspace-requirements-expansion.md` lines 462-527 (adapter pattern and swappability)

  **Acceptance Criteria**:

  ```
  Scenario: Settings panel shows available adapters
    Tool: Playwright (playwright skill)
    Preconditions: App running
    Steps:
      1. Navigate to app
      2. Click: button[data-testid="open-settings"]
      3. Wait for: .settings-panel visible (timeout: 3s)
      4. Assert: select[data-setting="voice-output"] option length >= 2 (Web Speech + Kokoro)
      5. Assert: select[data-setting="whiteboard"] option length >= 1 (at least default)
      6. Screenshot: .sisyphus/evidence/task-18-settings-panel.png
    Expected Result: Settings panel lists all adapters
    Evidence: .sisyphus/evidence/task-18-settings-panel.png

  Scenario: Adapter can be switched (voice output)
    Tool: Playwright (playwright skill)
    Preconditions: Settings panel open, Kokoro TTS NOT installed
    Steps:
      1. Navigate to settings panel
      2. Select: select[data-setting="voice-output"] → "Kokoro TTS"
      3. Assert: button[data-testid="install-kokoro"] visible
      4. Assert: .adapter-info contains "Install required"
      5. Screenshot: .sisyphus/evidence/task-18-adapter-install-prompt.png
    Expected Result: Install prompt appears for unavailable adapter
    Evidence: .sisyphus/evidence/task-18-adapter-install-prompt.png
  ```

  **Commit**: YES
  - Message: `feat(config): add settings panel for adapter swapping`
  - Files: `src/components/SettingsPanel.tsx`
  - Pre-commit: `npm run typecheck`

---

- [ ] 19. Performance Optimization Pass

  **What to do**:
  - Lazy loading:
    - Code-split major components (Whiteboard, PresentationViewer, CodeEditor)
    - Lazy load language grammars for Monaco
    - Lazy load Reveal.js plugins
  - Virtualization:
    - Agent console message list (react-window or similar)
    - File tree (large directories)
  - Memoization:
    - Expensive computations (diff calculation, syntax highlighting)
    - Component re-renders (React.memo for stable components)
  - Bundle optimization:
    - Tree-shaking for OpenCode SDK (import only used services)
    - Remove unused dependencies
    - Optimize images (compress screenshots)
  - Lighthouse audit: target scores >90 for Performance, Accessibility, Best Practices

  **Must NOT do**:
  - Do NOT skip code-splitting (bundle will be large without it)
  - Do NOT premature optimization (profile first, then optimize hot paths)
  - Do NOT skip Lighthouse audit (objective quality check)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Performance analysis, profiling, optimization across multiple areas
  - **Skills**: None required
  - **Skills Evaluated but Omitted**: All lack domain overlap

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3.2 (with Task 18)
  - **Blocks**: None (Phase 3 complete after this)
  - **Blocked By**: Tasks 1-17 (all components must exist to optimize)

  **References**:
  - **React Docs**: Code-splitting and lazy loading patterns
  - **Vite Docs**: Bundle optimization configuration

  **Acceptance Criteria**:

  ```
  Scenario: Bundle size is under acceptable threshold
    Tool: Bash
    Preconditions: App built for production
    Steps:
      1. npm run build
      2. Assert: Exit code 0
      3. du -sh dist/ | awk '{print $1}'
      4. Assert: Total dist size < 5MB (adjust based on actual requirements)
      5. ls -lh dist/assets/*.js | awk '{if ($5 > "500K") print $9, $5}'
      6. Assert: No individual JS chunks > 500KB (adjust threshold)
    Expected Result: Bundle sizes within acceptable limits
    Evidence: Build output showing chunk sizes

  Scenario: Lighthouse audit scores meet targets
    Tool: Bash
    Preconditions: Production build deployed locally
    Steps:
      1. npm run preview
      2. lighthouse http://localhost:4173 --output json --output-path=./lighthouse-report.json --chrome-flags="--headless"
      3. cat lighthouse-report.json | jq '.categories.performance.score'
      4. Assert: Performance score >= 0.9
      5. cat lighthouse-report.json | jq '.categories.accessibility.score'
      6. Assert: Accessibility score >= 0.9
    Expected Result: Lighthouse scores meet 90+ targets
    Evidence: lighthouse-report.json with scores
  ```

  **Commit**: YES
  - Message: `perf: optimize bundle size and runtime performance`
  - Files: `vite.config.ts`, various component files with React.memo
  - Pre-commit: `npm run build && npm run preview`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(foundation): initialize OpenSpace React client with Vite + TypeScript` | `openspace-client/*` | `npm run build` |
| 2 | `feat(interfaces): define core interfaces for all major subsystems` | `src/interfaces/*.ts` | `npm run typecheck` |
| 3 | `feat(opencode): integrate OpenCode SDK with client connection` | `src/services/OpenCodeClient.ts` | `npm run typecheck` |
| 4 | `feat(agent-console): implement LLM streaming console with tool logs` | `src/components/AgentConsole.tsx` | UI loads |
| 5 | `feat(file-tree): implement unified file tree with OpenCode integration` | `src/components/FileTree.tsx` | File tree displays |
| 6 | `feat(terminal): integrate xterm.js with OpenCode PTY service` | `src/components/Terminal.tsx` | Terminal connects |
| 7 | `feat(editor): integrate Monaco editor with OpenCode LSP` | `src/components/CodeEditor.tsx` | Editor loads file |
| 8 | `feat(voice): implement Web Speech API voice input adapter` | `src/adapters/WebSpeechInputAdapter.ts` | Voice records |
| 9 | `feat(voice): implement Web Speech TTS adapter + Kokoro stub` | `src/adapters/*TTSAdapter.ts` | TTS speaks |
| 10 | `feat(diff): implement side-by-side diff viewer with syntax highlighting` | `src/components/DiffViewer.tsx` | Diff shows changes |
| 11 | `feat(voice): implement voice → requirements workflow` | `src/components/VoiceRequirementsPanel.tsx` | Transcript saves |
| 12 | `feat(whiteboard): implement dual-mode whiteboard with [LIBRARY]` | `src/components/Whiteboard.tsx` | Drawing works |
| 13 | `feat(presentations): implement Reveal.js presentation renderer` | `src/components/PresentationViewer.tsx` | Slides render |
| 14 | `feat(annotations): implement universal annotation layer on whiteboard` | `src/components/AnnotationLayer.tsx` | Annotations overlay |
| 15 | `feat(whiteboard): add image import with annotation support` | Whiteboard enhanced | Images import |
| 16 | `feat(session): implement auto-save session persistence with resume` | `src/services/SessionManager.ts` | Session saves |
| 17 | `feat(ux): implement first-time welcome screen with onboarding hints` | `src/components/WelcomeScreen.tsx` | Welcome shows |
| 18 | `feat(config): add settings panel for adapter swapping` | `src/components/SettingsPanel.tsx` | Settings work |
| 19 | `perf: optimize bundle size and runtime performance` | Multiple files | Lighthouse >90 |

---

## Success Criteria

### Verification Commands
```bash
# Phase 0: Foundation
cd openspace-client && npm run build && npm run typecheck
npm run dev  # App loads with agent console, file tree, terminal, editor

# Phase 1: Voice
# (Playwright tests verify voice input/output, diff viewer, voice workflow)

# Phase 2: Visual
# (Playwright tests verify whiteboard drawing, presentations, annotations, image import)

# Phase 3: Polish
# (Playwright tests verify session persistence, welcome screen, settings panel)
# Lighthouse audit: lighthouse http://localhost:4173 --view
```

### Final Checklist
- [ ] User can speak requirements and save as markdown files
- [ ] User can draw freehand AND use structured shapes on whiteboard
- [ ] User can annotate on whiteboard (universal mode active)
- [ ] User can generate presentations from markdown
- [ ] User can swap voice output (Web Speech API ↔ Kokoro TTS if installed)
- [ ] Session persists across page reload (resume where left off)
- [ ] First-time UX shows empty canvas + chat + menu
- [ ] All interface implementations swappable via settings panel
- [ ] Lighthouse performance score >90
- [ ] Zero acceptance criteria require human verification (all agent-executable)
