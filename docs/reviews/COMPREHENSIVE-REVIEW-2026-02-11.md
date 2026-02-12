---
id: REVIEW-2026-02-11
author: oracle_f3a7
status: FINAL
date: 2026-02-11
task_id: comprehensive-code-review
---

# Comprehensive Review: OpenCode Client, OpenSpace Client & Architecture Evaluation

**Date:** 2026-02-11
**Author:** Oracle (oracle_f3a7)
**Scope:** Full code review + feature parity + architecture critique and alternatives

---

# PART 1: CODE REVIEW — OpenCode Client (SolidJS)

## Summary

The opencode client is a 3-package monorepo: `app` (SolidJS SPA), `ui` (shared components), `desktop` (Tauri v2 shell). It is a technically sophisticated, production-grade AI coding assistant UI.

### Architecture Highlights

| Aspect | Implementation |
|--------|---------------|
| Framework | SolidJS (fine-grained reactivity) |
| State | `createStore` + `persisted()` wrapper (localStorage/IndexedDB) |
| Server Comm | SSE (global.event) with 16ms batched coalescing via `requestAnimationFrame` |
| Terminal | Ghostty WASM (canvas-based) via WebSocket PTY |
| Diff | `@pierre/diffs` in Shadow DOM with 2x web worker Shiki highlighting |
| Markdown | `marked` + `marked-shiki` + `marked-katex` + `morphdom` for incremental DOM patching |
| Theming | OKLCH color space, 9 seed colors → 250+ CSS tokens, 15 bundled themes |
| i18n | 16 languages |
| Desktop | Tauri v2 with deep-link, updater, window-state plugins |

### Provider Tree (20+ levels)

```
MetaProvider → Font → ThemeProvider → LanguageProvider → I18nProvider → DialogProvider →
MarkedProvider → DiffComponentProvider → CodeComponentProvider → ServerProvider →
GlobalSDKProvider → GlobalSyncProvider → Router → SettingsProvider → PermissionProvider →
LayoutProvider → NotificationProvider → ModelsProvider → CommandProvider → HighlightsProvider →
Layout → [per-route: TerminalProvider → FileProvider → PromptProvider → CommentsProvider]
```

### Data Flow Pipeline

```
Server (Go) → SSE stream → GlobalSDK (16ms RAF batch + coalesce) → GlobalSync
(event reduction into per-directory child stores) → Sync (per-session view) → Components
```

### Tool Registry (message-part.tsx)

Extensible dispatcher with dedicated renderers: `read`, `list`, `glob`, `grep`, `webfetch`, `task` (sub-agents), `bash`, `edit` (inline diff), `write`, `apply_patch` (multi-file), `todowrite` (checklist), `question` (wizard).

### LRU Eviction Strategy

| Store | Max | TTL | Purpose |
|-------|-----|-----|---------|
| Directory stores | 30 | 20 min | Project-scoped reactive stores |
| Layout session keys | 50 | — | Scroll/tab state per session |
| Comment sessions | 20 | — | Line comment caches |
| Markdown cache | 200 | — | Rendered HTML fragments |
| File content | Dynamic | — | Loaded file contents |

### Strengths

1. **SSE batching + coalescing is production-grade.** Token-by-token streaming → 16ms RAF batches → dedup within batch. Prevents reactive graph thrash.
2. **LRU eviction is explicit and category-tuned.** Memory doesn't grow unbounded.
3. **Tool registry is extensible.** Adding a tool = implement a component + register by name.
4. **Shadow DOM for diffs** eliminates CSS conflict bugs.
5. **Theme system (OKLCH → 250+ tokens)** is state-of-the-art.
6. **Morphdom for markdown** avoids full re-renders during streaming.

### Concerns

1. **Massive files:** `layout.tsx` (~2000 lines), `session.tsx` (~2000 lines). Too many responsibilities per file.
2. **20+ level provider tree.** Difficult to trace state origin, painful to test in isolation.
3. **ContentEditable prompt input** with layered behaviors (mentions, commands, IME, shell mode) is the highest-risk component.
4. **No visible test infrastructure** for the web client packages.

---

# PART 2: CODE REVIEW — OpenSpace Client (React)

## Summary

Single-package React 18 app (Vite 7 + TailwindCSS 3 + TypeScript strict). Port of the opencode SolidJS client plus a whiteboard modality extension.

### Architecture

| Aspect | Implementation |
|--------|---------------|
| Framework | React 18 + TanStack React Query v5 |
| State | 5 React Contexts + React Query cache + localStorage |
| Server Comm | SSE with 1.5s dedup window + exponential backoff |
| Terminal | xterm.js via WebSocket PTY |
| Diff | None (inline tool call rendering only) |
| Markdown | `react-markdown` + `react-syntax-highlighter` (Prism/oneDark) |
| Theming | CSS custom properties, 3 themes, 3 fonts |
| i18n | 4 languages |
| Whiteboard | Excalidraw + Mermaid bidirectional reconciliation + Hub SSE + BroadcastChannel |

### Provider Tree (6 levels)

```
StrictMode → QueryClientProvider → ServerProvider → CommandPaletteProvider →
DialogProvider → LayoutProvider → App
```

### Strengths

1. **React Query as single source of truth** for server state. No Redux, no duplicated stores.
2. **SSE → cache updates** via `queryClient.setQueriesData` is clean.
3. **Whiteboard modality** (Mermaid ↔ Excalidraw reconciliation + Hub SSE + BroadcastChannel) is genuinely innovative.
4. **Simpler provider tree** (6 levels vs 20+).
5. **Good UX polish:** draft persistence, unseen badges, command palette, configurable shortcuts.
6. **Custom Vite plugin** auto-starts OpenCode server on `npm run dev`.

### Concerns

1. **No diff viewer.** The biggest functional gap.
2. **`console.log` spam** in RichEditor (~15 instances).
3. **Dead code:** FileTabsContext (orphaned), PromptInput.tsx (superseded), SDK v1/v2 duplication.
4. **`any` types** in whiteboard module (~15 instances).
5. **Deprecated `document.execCommand`** in RichEditor.
6. **Module-level mutable state** in terminal hook (fragile under StrictMode).
7. **JSON.stringify comparisons** in at least 3 locations (expensive, GC pressure).
8. **No localStorage migration strategy.** Schema changes = silent failures.

### Overall Score: 7.4/10

---

# PART 3: FEATURE PARITY COMPARISON

## Legend
- ✅ = Implemented
- ⚠️ = Partial implementation
- ❌ = Not implemented
- 🆕 = OpenSpace-only feature (not in opencode)

| # | Category | Feature | opencode (SolidJS) | openspace-client (React) |
|---|----------|---------|-------------------|------------------------|
| | **LAYOUT & NAVIGATION** | | | |
| 1 | Layout | Home / landing page | ✅ (server health, recent projects) | ❌ (goes straight to project) |
| 2 | Layout | Project rail (left icon bar) | ✅ (drag-drop reorder) | ✅ |
| 3 | Layout | Session sidebar (collapsible) | ✅ (with resize drag) | ✅ |
| 4 | Layout | Main chat area | ✅ | ✅ |
| 5 | Layout | Terminal panel (bottom, resizable) | ✅ (Ghostty WASM) | ✅ (xterm.js) |
| 6 | Layout | File tree (right sidebar) | ✅ (with filter, drag-drop) | ✅ (with git status colors) |
| 7 | Layout | Review panel | ✅ (session review with diffs) | ❌ |
| 8 | Layout | Whiteboard panel | ❌ | 🆕 ✅ (Excalidraw split panel) |
| 9 | Layout | Session tabs (drag-drop reorder) | ✅ (with drag-drop via solid-dnd) | ❌ |
| 10 | Layout | Top bar with search | ✅ | ✅ |
| 11 | Layout | Back/forward navigation buttons | ❌ | ✅ |
| | **CHAT / CONVERSATION** | | | |
| 12 | Chat | ContentEditable prompt with @mentions | ✅ (files + agents as pills) | ✅ (files + agents as pills) |
| 13 | Chat | /slash command autocomplete | ✅ (reset, clear, compact) | ✅ (reset, clear, compact, whiteboard) |
| 14 | Chat | ! shell mode | ✅ | ✅ |
| 15 | Chat | Prompt history (up/down arrows) | ✅ | ✅ |
| 16 | Chat | IME composition handling | ✅ | ✅ |
| 17 | Chat | Image attachments | ✅ | ✅ |
| 18 | Chat | PDF attachments | ❌ | 🆕 ✅ |
| 19 | Chat | File attachment with line selection | ✅ | ⚠️ (file only, no line selection) |
| 20 | Chat | Agent mention (@agent) | ✅ | ✅ |
| 21 | Chat | Streaming message display | ✅ (morphdom incremental) | ✅ (ReactMarkdown re-render) |
| 22 | Chat | Markdown rendering (code, math, etc.) | ✅ (marked + shiki + katex) | ✅ (react-markdown + Prism) |
| 23 | Chat | Copy code blocks | ✅ | ✅ |
| 24 | Chat | Retry / cancel actions | ✅ | ✅ (abort via AbortController) |
| 25 | Chat | Duration timer per turn | ✅ | ❌ |
| 26 | Chat | Auto-scroll with scroll spy | ✅ | ✅ |
| 27 | Chat | Scroll-to-bottom FAB | ❌ | ✅ |
| 28 | Chat | Hash-based message focus (#msg-id) | ❌ | ✅ |
| 29 | Chat | Load-more pagination (older messages) | ✅ (chunked, 400/batch) | ✅ |
| 30 | Chat | Draft persistence per session | ❌ (not found) | 🆕 ✅ (localStorage) |
| 31 | Chat | Model variant cycling | ✅ | ❌ |
| | **MESSAGE PARTS / TOOL RENDERING** | | | |
| 32 | Tools | Dedicated per-tool renderers | ✅ (12+ custom renderers) | ✅ (implemented) |
| 33 | Tools | `edit` tool inline diff | ✅ (@pierre/diffs) | ✅ (EditToolRenderer) |
| 34 | Tools | `write` tool inline code view | ✅ (shiki highlighted) | ✅ (WriteToolRenderer) |
| 35 | Tools | `bash` tool output with exit code | ✅ | ✅ (BashToolRenderer) |
| 36 | Tools | `task` sub-agent recursive display | ✅ (recursive parts) | ✅ (TaskToolRenderer) |
| 37 | Tools | `todowrite` checklist render | ✅ | ✅ (TodoWriteToolRenderer) |
| 38 | Tools | `question` wizard render | ✅ | ✅ (QuestionToolRenderer) |
| 39 | Tools | Reasoning parts display | ✅ | ✅ (italic) |
| 40 | Tools | Tool call status indicators | ✅ (thinking/searching/editing) | ✅ (status dots) |
| | **SESSIONS** | | | |
| 41 | Sessions | Create new session | ✅ | ✅ |
| 42 | Sessions | Delete session | ✅ | ✅ |
| 43 | Sessions | Rename session (inline) | ✅ | ✅ |
| 44 | Sessions | Archive / unarchive | ❌ | 🆕 ✅ |
| 45 | Sessions | Unseen message indicators | ✅ | ✅ |
| 46 | Sessions | "Next unseen" button | ❌ | 🆕 ✅ |
| 47 | Sessions | Keyboard navigate sessions (alt+↑/↓) | ✅ | ❌ |
| 48 | Sessions | Session prefetching (adjacent) | ✅ | ✅ |
| 49 | Sessions | Date-grouped session list | ✅ | ✅ |
| | **SETTINGS** | | | |
| 50 | Settings | Color scheme (System/Light/Dark) | ✅ | ✅ |
| 51 | Settings | Theme selection | ✅ (15 themes) | ✅ (3 themes) |
| 52 | Settings | Font selection | ✅ (12 mono fonts) | ✅ (3 fonts) |
| 53 | Settings | Font size adjustment | ✅ (slider) | ❌ |
| 54 | Settings | AutoSave toggle | ✅ | ❌ |
| 55 | Settings | Release notes toggle | ✅ | ❌ |
| 56 | Settings | Sound selection | ❌ | ✅ (None/Chime/Ding) |
| 57 | Settings | Notification preferences | ✅ | ✅ (3 checkboxes) |
| 58 | Settings | Configurable keyboard shortcuts | ✅ (full keybind editor) | ✅ (7 shortcuts with capture UI) |
| 59 | Settings | Auto-approve permissions | ✅ | ❌ |
| 60 | Settings | Provider management | ✅ | ✅ (connect/disconnect) |
| 61 | Settings | Agent configuration | ✅ | ✅ (default agent + list) |
| 62 | Settings | Terminal shell selection | ❌ | ✅ (Default/Bash/Zsh/Fish) |
| 63 | Settings | Language selection | ✅ (16 languages) | ✅ (4 languages) |
| 64 | Settings | Update checking preferences | ✅ | ✅ (2 checkboxes) |
| | **DIFF VIEWER / CODE REVIEW** | | | |
| 65 | Diff | Dedicated diff review panel | ✅ | ❌ |
| 66 | Diff | @pierre/diffs with Shadow DOM | ✅ | ❌ |
| 67 | Diff | Unified / split toggle | ✅ | ❌ |
| 68 | Diff | Line selection with drag | ✅ | ❌ |
| 69 | Diff | Line comments system | ✅ (persistent, per-session) | ❌ |
| 70 | Diff | Shiki highlighting via web workers | ✅ (2 worker pool) | ❌ |
| 71 | Diff | File accordion (per-file expand) | ✅ | ❌ |
| 72 | Diff | Image/audio diff preview | ✅ | ❌ |
| 73 | Diff | Comment focus → scroll to line | ✅ | ❌ |
| | **FILE OPERATIONS** | | | |
| 74 | Files | Recursive file tree | ✅ | ✅ |
| 75 | Files | File filter/search | ✅ (fuzzy) | ✅ |
| 76 | Files | Git status indicators (A/D/M) | ✅ | ✅ |
| 77 | Files | Drag file to prompt | ✅ | ⚠️ (drag support, not to prompt) |
| 78 | Files | Whiteboard file detection | ❌ | 🆕 ✅ (.graph.mmd/.excalidraw) |
| 79 | Files | File watcher integration | ✅ | ❌ |
| | **MODEL SELECTION** | | | |
| 80 | Models | Model selector dropdown | ✅ | ✅ (grouped by provider, searchable) |
| 81 | Models | Recent models list | ✅ | ❌ |
| 82 | Models | Model visibility toggle | ✅ | ❌ |
| 83 | Models | Model variant cycling | ✅ | ❌ |
| | **TOOLS / MCP** | | | |
| 84 | MCP | MCP status display | ✅ (in status popover) | ✅ (tabbed popover) |
| 85 | MCP | MCP toggle switches | ✅ | ✅ |
| 86 | MCP | LSP status display | ✅ | ✅ |
| 87 | MCP | Plugin status display | ✅ | ✅ |
| | **KEYBOARD SHORTCUTS** | | | |
| 88 | Keys | Command palette | ✅ (mod+shift+P, 40+ commands) | ✅ (mod+K, 6 commands) |
| 89 | Keys | Toggle sidebar | ✅ (mod+B) | ✅ (mod+B) |
| 90 | Keys | Toggle terminal | ✅ (mod+J) | ✅ (mod+J) |
| 91 | Keys | Toggle file tree | ✅ (mod+\\) | ✅ (mod+\\) |
| 92 | Keys | New session | ✅ (mod+N) | ✅ (mod+N) |
| 93 | Keys | Open settings | ✅ (mod+,) | ✅ (mod+,) |
| 94 | Keys | Open file | ✅ (mod+O) | ✅ (mod+O) |
| 95 | Keys | Navigate sessions (alt+↑/↓) | ✅ | ❌ |
| 96 | Keys | Theme/language cycling | ✅ | ❌ |
| | **THEMES / APPEARANCE** | | | |
| 97 | Theme | OKLCH color generation | ✅ (9 seeds → 250+ tokens) | ❌ (manual CSS vars) |
| 98 | Theme | Number of themes | 15 | 3 |
| 99 | Theme | Custom shiki "OpenCode" syntax theme | ✅ | ❌ (uses Prism oneDark) |
| | **CONTEXT METER** | | | |
| 100 | Context | Token usage display | ✅ | ✅ (SVG ring) |
| 101 | Context | Cost display | ✅ | ✅ (tooltip) |
| | **NOTIFICATIONS** | | | |
| 102 | Notify | Toast system | ✅ | ✅ (useSyncExternalStore) |
| 103 | Notify | Permission request popups | ✅ | ✅ |
| 104 | Notify | Question prompts from agent | ✅ | ✅ |
| 105 | Notify | Update available alerts | ✅ | ❌ |
| 106 | Notify | Release notes highlights | ✅ | ❌ |
| | **WORKSPACE / PLATFORM** | | | |
| 107 | Workspace | Git worktree management | ✅ (create, rename, reorder, reset, delete, toggle) | ✅ |
| 108 | Platform | Desktop app (Tauri) | ✅ | ❌ |
| 109 | Platform | Deep linking | ✅ | ❌ |
| 110 | Platform | Auto-updater | ✅ | ❌ |
| | **SERVER MANAGEMENT** | | | |
| 111 | Server | Multi-server management | ✅ | ✅ |
| 112 | Server | Server health checks | ✅ (10s interval) | ✅ |
| 113 | Server | Server management dialog | ❌ | 🆕 ✅ (add/edit/delete/set default) |
| | **WHITEBOARD / DRAWING** | | | |
| 114 | Whiteboard | Excalidraw canvas | ❌ | 🆕 ✅ |
| 115 | Whiteboard | Mermaid ↔ Excalidraw reconciliation | ❌ | 🆕 ✅ |
| 116 | Whiteboard | SSE live sync from Hub | ❌ | 🆕 ✅ |
| 117 | Whiteboard | BroadcastChannel multi-window sync | ❌ | 🆕 ✅ |
| 118 | Whiteboard | Send to Agent (mermaid + PNG) | ❌ | 🆕 ✅ |
| 119 | Whiteboard | MCP tools (list/read/update) | ❌ | 🆕 ✅ |
| 120 | Whiteboard | Active context for agent | ❌ | 🆕 ✅ |
| 121 | Whiteboard | Snapshot export (.snapshot.png) | ❌ | 🆕 ✅ |

### Parity Summary

| Metric | Count |
|--------|-------|
| Total features tracked | 121 |
| ✅ in both | ~69 |
| ✅ opencode only | ~23 (mainly diff viewer, themes, desktop) |
| ✅ openspace only (🆕) | ~15 (whiteboard, archive, PDF attach, draft persist, server mgmt) |
| ❌ or ⚠️ openspace gaps | ~22 |

**Biggest gaps in openspace-client:**
1. **No diff viewer at all** (9 features missing)
2. **Fewer themes** (3 vs 15)
3. **No desktop app** (3 features missing)
4. **Fewer command palette commands** (6 vs 40+)

**OpenSpace-only advantages:**
1. **Whiteboard modality** (8 features)
2. **Draft persistence**, **session archive**, **PDF attachments**
3. **Server management UI**

---

# PART 4: ARCHITECTURE EVALUATION & ALTERNATIVES

## 4.1 What the Current Architecture Proposes

The implementation guides describe a **hub-and-spoke multimodal architecture**:

```
                    ┌──────────────────┐
                    │   Runtime Hub    │
                    │  (ArtifactStore) │
                    │  /artifacts API  │
                    │  /events SSE     │
                    │  /context/*      │
                    └──────┬───────────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
     ┌──────▼──────┐ ┌────▼────┐  ┌──────▼──────┐
     │  MCP Server  │ │  MCP    │  │  MCP Server  │
     │ (whiteboard) │ │ (pres.) │  │   (voice)    │
     └──────────────┘ └─────────┘  └──────────────┘
            │              │              │
            └──────────────┼──────────────┘
                           │
                    ┌──────▼──────┐
                    │  Client UI  │
                    │  (React)    │
                    │  Per-modal  │
                    │  Frames     │
                    └─────────────┘
```

### Key Design Decisions

1. **Single Writer Principle** — All writes go through `ArtifactStore` (PQueue concurrency: 1, atomic write via tmp→rename)
2. **Two-Layer Modality** — Canonical (`.graph.mmd`) + Projection (`.excalidraw`)
3. **One MCP server per modality** — separate processes communicating via stdio
4. **Hub server as middleware** — Express on port 3001, separate from OpenCode server
5. **SSE for real-time** — `FILE_CHANGED` events
6. **Active context endpoints** — `POST/GET /context/active-<modality>`
7. **TargetRef for cross-modality navigation** — Universal handoff payload
8. **Domain layer per modality** — `useDrawingDomain`, strategy registries

## 4.2 Honest Critique of Current Architecture

### What's Good

1. **Single Writer is correct.** Eliminates race conditions for concurrent agent + user writes. This is the right call.
2. **Canonical + Projection separation is elegant.** Keeping semantic truth (Mermaid) separate from visual state (Excalidraw) is a clean pattern that enables agent reasoning on semantic data.
3. **MCP for agent integration is standard.** Using the Model Context Protocol gives you compatibility with any MCP-capable LLM runner.
4. **TargetRef as universal navigation is smart.** Having a single contract for "open this thing at this location" prevents N² cross-modality coupling.

### What's Concerning

1. **The Hub server is unnecessary complexity.** You have the OpenCode server already running. Adding a second HTTP server on a different port creates:
   - Two SSE streams to manage
   - Two health checks
   - Two failure modes
   - CORS configuration between them
   - A startup orchestration problem (client needs both servers alive)
   
   The Hub does three things: serve `/artifacts`, emit `/events`, and store `/context`. All of these could be MCP resources/tools on the existing OpenCode server, or a simple plugin within the OpenCode process.

2. **One MCP server per modality is over-engineered at this stage.** Each MCP server is a separate Node.js process with its own stdio connection. For 8 modalities, that's 8 separate processes. The overhead (process management, startup time, memory) is substantial for what are essentially CRUD operations on files. A single MCP server with namespaced tools (`drawing.list`, `drawing.update`, `presentation.list`, `presentation.update`) would be simpler and equally extensible.

3. **The architecture documents describe too much.** 9 implementation guides totaling ~5000+ lines of architecture for features that don't exist yet. This creates:
   - A maintenance burden (guides drift from reality)
   - Analysis paralysis (too many contracts to satisfy before writing code)
   - Premature abstraction (strategy registries, interop adapters for modalities that are months away)
   
   The whiteboard guide alone is 726 lines. Most of it describes a target state that's architecturally similar to what already works — it's essentially a rename from "whiteboard" to "drawing" plus adding TargetRef. That should be a 50-line task document, not a 726-line implementation guide.

4. **The domain layer per modality adds indirection without clear benefit yet.** `useDrawingDomain`, `drawing-sync.ts`, `drawing-context.ts`, `drawing-target-ref.ts`, `parser-registry.ts`, `serializer-registry.ts`, `layout-registry.ts` — this is a lot of files for what is currently: "load a file, show it in Excalidraw, save when it changes." The current `WhiteboardFrame` + `useDebouncedSave` pattern works. Extracting a domain layer is a refactoring step that should happen when a second modality actually needs the abstraction.

5. **The "Event Bus" concept from ARCHITECTURE.md conflicts with the "Hub + MCP" model from multi-modal-arch.md.** The technical architecture describes a pub-sub Event Bus routing `InputEvent`/`OutputEvent`/`ContentEvent`. The implementation guides describe REST + SSE + MCP. These are two different architectures, and neither document acknowledges the other.

6. **Active context endpoints don't scale.** `POST/GET /context/active-drawing`, `POST/GET /context/active-presentation`, `POST/GET /context/active-editor`, etc. — this is N endpoints for N modalities, each with its own in-memory state. A single `POST/GET /context/active` with a `{ modality: string, path: string }` body would be simpler and wouldn't require Hub server changes for each new modality.

## 4.3 Architecture Alternatives

### Architecture A: "Lean Hub" (Minimal Infrastructure, Maximum Simplicity)

**Philosophy:** Do the absolute minimum. No separate hub. No event bus. No domain services. Each modality is a React component that talks to the filesystem via the existing OpenCode server.

```
OpenCode Server (existing)
  ├── REST API (existing)
  ├── SSE stream (existing)
  └── MCP tools (single server, namespaced)
        ├── drawing.list / drawing.read / drawing.update
        ├── presentation.list / presentation.read / presentation.update
        └── ... (all modalities in one MCP server)

React Client
  ├── AgentConsole (chat)
  ├── DrawingPanel (Excalidraw)
  ├── PresentationPanel (Reveal.js)
  ├── EditorPanel (Monaco)
  ├── DiffReviewPanel (@pierre/diffs)
  └── ... each is a self-contained component
```

**How it works:**
- Each modality component reads/writes files via a thin service layer (`fetch('/api/files/...')`)
- Real-time updates come through the existing OpenCode SSE stream (add `file.changed` event type)
- One MCP server process handles all modality tools
- No separate Hub server
- No ArtifactStore class — use OpenCode's existing file write API, add debouncing in the client
- Cross-modality navigation via a simple `useNavigate(targetRef)` hook

**Pros:**
- Stupidly simple. One server process. One SSE stream. One MCP process.
- No startup orchestration.
- No new infrastructure to maintain.
- Components are self-contained and testable in isolation.
- Lowest barrier to adding new modalities.

**Cons:**
- No atomic writes (relies on OS-level file write atomicity).
- No versioning/history for artifacts.
- No centralized write serialization (concurrent writes could conflict).
- Doesn't support multi-window coordination without adding BroadcastChannel per component.

**Best for:** Getting features shipped fast. If you're a small team and you need to get 4+ modalities working in weeks not months.

---

### Architecture B: "Smart Client" (Client-Side Hub, No Server)

**Philosophy:** Move the ArtifactStore and coordination logic into the client. The client is the only writer. No separate Hub server process.

```
React Client (the one and only process besides OpenCode)
  ├── ArtifactService (in-browser write queue, debounce, localStorage cache)
  │   ├── write(path, content) — serialized via async queue
  │   ├── read(path) — cache-first, fallback to server
  │   └── subscribe(path) — SSE-backed file watching
  ├── ModalityManager
  │   ├── registerModality(name, component, tools)
  │   ├── activeContext: Map<string, TargetRef>
  │   └── navigate(targetRef)
  ├── MCP Client (communicates with single MCP server)
  └── Components (each modality)
       ├── DrawingPanel
       ├── PresentationPanel
       └── ...

OpenCode Server (untouched)
  ├── REST API
  ├── SSE stream
  └── File operations

Single MCP Server (separate process)
  └── Namespaced tools for all modalities
```

**How it works:**
- `ArtifactService` runs in the browser. It maintains a write queue (serialize writes), debounce timer, and version cache.
- Writes go through `ArtifactService.write()` → OpenCode server file API → filesystem.
- The `ArtifactService` ensures only one write at a time via a JS async queue (no PQueue needed — just a promise chain).
- SSE from OpenCode server notifies of file changes.
- `ModalityManager` is a lightweight registry: each modality registers on mount, deregisters on unmount. Active context is a simple Map.
- Cross-modality navigation: `navigate(targetRef)` looks up the registered modality and calls its `openAt(targetRef)` method.
- BroadcastChannel for multi-tab (handled once in ArtifactService, not per-modality).

**Pros:**
- No separate Hub server process. Dramatically simpler deployment/startup.
- Write serialization happens in one place (browser).
- Clean modality registry pattern — extensible without infrastructure changes.
- Active context is just a Map, not an HTTP endpoint.
- BroadcastChannel is centralized, not duplicated per modality.

**Cons:**
- Write serialization is per-tab. Two browser tabs could have conflicting writes.
  - Mitigation: BroadcastChannel can implement a "leader election" pattern where only one tab writes.
- No server-side versioning/history.
  - Mitigation: Use git (the project is already a git repo). `git stash` or shadow commits for history.
- Agent MCP writes don't go through the client's queue.
  - Mitigation: Agent writes through MCP → server file API. Client detects via SSE → re-reads. Last-write-wins is acceptable for an MVP.

**Best for:** A balance of simplicity and correctness. Good if you want write safety without operational overhead.

---

### Architecture C: "Spine Lite" (Keep Hub, Simplify Everything Else)

**Philosophy:** Keep the ArtifactStore/Hub concept (it's proven for the whiteboard), but dramatically simplify the modality layer. No strategy registries, no domain services, no TargetRef system until it's needed.

```
Runtime Hub (simplified)
  ├── /files/:path — read/write with write serialization
  ├── /events — SSE for file changes
  └── /context — single endpoint, JSON blob per modality

Single MCP Server
  └── All modality tools, namespaced

React Client
  ├── useArtifact(path) — hook that reads, subscribes to changes, provides write()
  ├── useActiveContext(modality) — hook for reading/writing active context
  ├── Modality components (each self-contained)
  │   ├── DrawingPanel — uses useArtifact("design/*.graph.mmd")
  │   ├── PresentationPanel — uses useArtifact("docs/deck/*.deck.md")
  │   ├── DiffReviewPanel — uses session data (not artifacts)
  │   └── EditorPanel — uses useArtifact("src/*")
  └── Layout shell with panel management
```

**How it works:**
- `useArtifact(path)` is the ONE abstraction. Every modality uses it.
  - Returns `{ data, loading, error, write, subscribe }`
  - Handles debouncing, SSE subscription, and BroadcastChannel internally
  - This replaces: `useDebouncedSave`, `useDrawingDomain`, `drawing-sync.ts`, and all per-modality infrastructure
- `/files/:path` replaces `/artifacts/:path` — simpler naming, same behavior (write queue, atomic writes)
- `/context` is ONE endpoint with body `{ modality: "drawing", data: { path: "design/foo.graph.mmd" } }`
- Reconciliation logic stays per-modality (because it's inherently modality-specific) but lives in a simple `lib/` directory, not a strategy registry
- No TargetRef system. Cross-modality navigation is a simple callback: `onOpenFile(path, line?)`. When we actually have 3+ modalities that need to talk to each other, we formalize it then.

**Pros:**
- Proven write safety (ArtifactStore pattern works today).
- `useArtifact()` is a single, universal abstraction — every modality uses the same hook.
- No premature abstractions (no registries, no domain layers, no TargetRef).
- Adding a new modality = one component + one MCP namespace.
- Hub stays minimal — it's just a file proxy with a write queue.

**Cons:**
- Still requires the Hub server process (operational overhead).
- `useArtifact()` needs to handle many edge cases (binary files, large files, conflict resolution).
- No strategy pattern means each modality's parsing logic is scattered.
  - Counter-argument: parsing logic IS inherently per-modality. A "strategy registry" that dispatches to per-modality parsers is just indirection. A simple import is clearer.

**Best for:** The sweet spot. You get correctness, simplicity, and extensibility without premature abstraction.

---

### Architecture D: "Full Event Bus" (As Described in ARCHITECTURE.md)

**Philosophy:** Build the full Event Bus / Orchestrator architecture described in the technical architecture doc.

```
Runtime Host
  ├── Event Bus (typed async message broker)
  ├── Orchestrator (workflow engine)
  ├── Artifact Store
  └── Plugin Manager (modality lifecycle)

Modality Plugins (each a plugin)
  ├── VoiceInput / VoiceOutput
  ├── TextInput / TextOutput
  ├── DrawingCanvas
  ├── PresentationViewer
  ├── DiffReviewer
  └── ...

MultimodalContent schema
  ├── text blocks
  ├── audio references
  ├── image references
  ├── diagram references
  └── ...
```

**Pros:**
- Most extensible. Adding a modality is adding a plugin.
- Unified data schema enables complex cross-modality workflows.
- Event sourcing enables replay and debugging.
- Closest to the "everything is a modality" vision.

**Cons:**
- **Massive engineering effort.** Building a typed async message broker, workflow engine, and plugin manager is months of work.
- **Over-engineered for current needs.** You have one modality (whiteboard) working and need to add ~4 more. An event bus is appropriate when you have 20+ plugins and complex routing.
- **No existing implementation.** This would be a rewrite from scratch.
- **Performance concerns.** Every user action goes through: Plugin → Event Bus → Orchestrator → Event Bus → Plugin → Store. That's a lot of indirection for "user typed a character."

**Best for:** A product with a large engineering team building a truly extensible platform. Not recommended for the current stage.

---

## 4.4 Recommendation

### Recommended: Architecture C — "Spine Lite"

**Why:**

1. **It preserves what works.** The ArtifactStore + Hub pattern is proven for the whiteboard. The write queue, atomic writes, and SSE change notifications work today. Don't throw that away.

2. **It eliminates what doesn't work.** The per-modality domain layers, strategy registries, and 726-line implementation guides are premature abstraction. `useArtifact(path)` is the right abstraction level.

3. **It's simple enough to hold in your head.** "Every modality reads/writes files through `useArtifact()`. The Hub serializes writes. SSE notifies of changes. One MCP server handles agent tools." That's the entire architecture in 3 sentences.

4. **It scales to 8 modalities without architectural changes.** Adding a presentation modality: create `PresentationPanel.tsx`, use `useArtifact("docs/deck/*.deck.md")`, add `presentation.read/update` to the MCP server. Done.

5. **It defers decisions until you need them.** No TargetRef until two modalities actually need to navigate to each other. No strategy registry until two diagram families share enough code to justify abstraction. No Event Bus until you have 10+ modalities with complex routing.

### Concrete Next Steps

1. **Consolidate the MCP server.** Rename `whiteboard-mcp.ts` to `modality-mcp.ts`. Add namespaced tools.
2. **Build `useArtifact()` hook.** Extract the pattern from `WhiteboardFrame` + `useDebouncedSave` into a reusable hook.
3. **Simplify the Hub.** Merge `/artifacts/:path` and `/context/*` into a cleaner API. One SSE endpoint.
4. **Build the diff viewer FIRST.** This is the biggest feature gap and doesn't require any new infrastructure — it reads session data, not artifacts.
5. **Build editor modality SECOND.** Uses `useArtifact()` for file read/write + Monaco. Validates the hook abstraction.
6. **Delete premature abstractions.** Remove the 9 implementation guides. Replace with a single `docs/architecture/MODALITY-PATTERN.md` (< 200 lines) that describes the pattern: `useArtifact + component + MCP namespace`.

### What to Keep from Current Architecture

- ✅ ArtifactStore (write queue, atomic writes, versioning)
- ✅ Hub SSE for file change notifications
- ✅ MCP for agent tool integration
- ✅ Canonical + Projection two-layer model (for modalities that need it)
- ✅ BroadcastChannel for multi-window sync

### What to Discard

- ❌ Per-modality domain services (useDrawingDomain, drawing-sync.ts, etc.)
- ❌ Strategy registries (parser-registry, serializer-registry, layout-registry)
- ❌ TargetRef system (defer until needed)
- ❌ Per-modality active context endpoints (use one unified endpoint)
- ❌ Event Bus / Orchestrator from ARCHITECTURE.md (over-engineered)
- ❌ 9 separate implementation guides (replace with one pattern doc)

---

# PART 5: PRIORITY ACTIONS

If I were to recommend the top 5 things to do next, in order:

1. **Clean up openspace-client dead code.** Delete PromptInput.tsx, wire or delete FileTabsContext, consolidate SDK v1/v2, remove console.log spam. This is hygiene before building more.

2. **Port the diff viewer from opencode.** This is the single biggest feature gap. Integrate `@pierre/diffs` (or a React equivalent), add the review panel, add line selection + comments. This alone closes 9 feature gaps.

3. **Extract `useArtifact()` hook from WhiteboardFrame.** (DONE) The universal hook pattern is implemented and Whiteboard refactored to use it.

4. **Add dedicated tool renderers.** (DONE) The `edit`, `write`, `bash`, `task`, `todowrite`, and `question` renderers have been ported.

5. **Write the single-page "Modality Pattern" doc.** Replace the 9 implementation guides with one concise document that describes the pattern. Keep the user stories and requirements sections (they're good), archive the rest.

---

*End of review.*

---

## Addendum (2026-02-12): Phase 2A Core UX Delta

This review snapshot is accurate as of 2026-02-11, but parity status changed on 2026-02-12 after Team A merge (`f74d0bc`).

### Newly Closed Parity Gaps

- Feature 79 (Files): **File watcher integration** is now implemented (`file.watcher.updated` handling and file-tree refresh path).
- Feature 25 (Chat): **Duration timer per turn** is now implemented.
- Feature 47 / 95 (Sessions/Keys): **Session navigation via `Alt+ArrowUp/Down`** is now implemented.
- Additional improvement beyond original table: **portable shortcut import/export** in Settings (`openspace-shortcuts.json`).

### Current Interpretation

- The major parity gap in this review remains the same: **diff viewer/review panel stack** is still the biggest missing block.
- The gap counts in Part 3 are now slightly stale and should be read as historical baseline, not current exact totals.
