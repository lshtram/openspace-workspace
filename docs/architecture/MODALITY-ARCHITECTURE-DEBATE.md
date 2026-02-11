---
id: ARCH-MODALITY-DEBATE
author: oracle_a1b2
status: DRAFT
date: 2026-02-11
task_id: modality-architecture
---

# Modality Architecture Debate

## Purpose

This document presents the architecture options for implementing 6 additional modalities in openspace-client:

1. **Diff Review** — Interactive code review with comments
2. **Editor** — Full-featured code editor (Monaco)
3. **Presentation** — Slide deck viewer/editor
4. **Voice** — Audio recording/transcription
5. **Comments** — Persistent inline annotations
6. **Browser Preview** — Live web app preview with inspection

**Scope of debate:**
- Hub server architecture (keep, simplify, or eliminate?)
- MCP server organization (one vs many)
- Client-side abstraction (`useArtifact` hook vs per-modality services)
- Cross-modality navigation (TargetRef system vs simple callbacks)
- Active context protocol (how does agent know what's open?)

---

## Current State: What We Have

### Whiteboard Modality (Working)

**Architecture:**
```
Runtime Hub (Express on :3001)
  ├── ArtifactStore (write queue, atomic writes)
  ├── GET/POST /artifacts/:path
  ├── SSE /events (FILE_CHANGED)
  └── GET/POST /context/active-whiteboard

Whiteboard MCP Server (stdio)
  ├── whiteboard.list()
  ├── whiteboard.read(name)
  └── whiteboard.update(name, mermaid)

React Client
  └── WhiteboardFrame.tsx
      ├── useDebouncedSave() — writes to Hub
      ├── SSE subscription — listens for changes
      ├── BroadcastChannel — multi-tab sync
      └── Excalidraw ↔ Mermaid reconciliation
```

**What works:**
- ✅ Write safety (atomic writes, no race conditions)
- ✅ Real-time sync (SSE + BroadcastChannel)
- ✅ Agent integration (MCP tools work)
- ✅ Multi-tab coordination

**What's awkward:**
- ⚠️ Separate Hub server process (startup orchestration)
- ⚠️ Per-modality MCP server (would need 6 more processes)
- ⚠️ Per-modality context endpoints (`/context/active-whiteboard`, `/context/active-editor`, etc.)
- ⚠️ Manual debouncing in each component (`useDebouncedSave`)
- ⚠️ SSE subscription boilerplate in each component

---

## Architecture Options

### Option A: "Status Quo+" (Keep Current, Scale Linearly)

**Description:** Add 6 more modalities using the exact same pattern as whiteboard.

**Architecture:**
```
Runtime Hub (:3001)
  ├── /artifacts/:path
  ├── /events (SSE)
  ├── /context/active-whiteboard
  ├── /context/active-editor
  ├── /context/active-presentation
  ├── /context/active-voice
  ├── /context/active-comments
  └── /context/active-browser

7 MCP Servers (7 processes)
  ├── whiteboard-mcp (stdio)
  ├── editor-mcp (stdio)
  ├── presentation-mcp (stdio)
  ├── voice-mcp (stdio)
  ├── comments-mcp (stdio)
  ├── diff-mcp (stdio)
  └── browser-mcp (stdio)

React Client
  ├── WhiteboardFrame + useDebouncedSave
  ├── EditorPanel + useDebouncedSave
  ├── PresentationPanel + useDebouncedSave
  ├── VoicePanel + useDebouncedSave
  ├── CommentsPanel + useDebouncedSave
  ├── DiffReviewPanel + useDebouncedSave
  └── BrowserPreviewPanel + useDebouncedSave
```

**Pros:**
- ✅ Zero refactoring of whiteboard (it keeps working)
- ✅ Clear pattern (copy-paste whiteboard, change names)
- ✅ Process isolation (one MCP crash doesn't kill others)

**Cons:**
- ❌ 7 separate Node.js processes (memory overhead, startup time)
- ❌ 7 context endpoints (N+1 problem for each new modality)
- ❌ Boilerplate duplication (`useDebouncedSave`, SSE subscription in 7 places)
- ❌ Hub server adds operational complexity (two servers, two health checks, two SSE streams)
- ❌ Adding 8th modality = add 8th MCP server + 8th context endpoint + 8th component with same boilerplate

**Verdict:** ⚠️ **Works but doesn't scale.** After 3-4 modalities, the duplication becomes painful.

---

### Option B: "Spine Lite" (Simplified Hub + Universal Hook)

**Description:** Keep the Hub for write safety, but simplify everything else:
- One MCP server with namespaced tools
- One context endpoint with modality parameter
- One `useArtifact()` hook used by all modalities

**Architecture:**
```
Runtime Hub (:3001) — Simplified
  ├── /files/:path (rename from /artifacts, clearer)
  ├── /events (SSE - one stream for all modalities)
  └── /context (one endpoint: POST { modality, data })

Single MCP Server (one process)
  └── Namespaced tools:
      ├── whiteboard.list/read/update
      ├── editor.read/write/navigate
      ├── presentation.list/read/update/navigate
      ├── voice.record/transcribe
      ├── comment.list/add/resolve
      ├── diff.read/comment/approve
      └── browser.navigate/snapshot/inspect

React Client
  ├── useArtifact(path) — universal hook
  │   ├── read() — fetch from Hub
  │   ├── write() — debounced write to Hub
  │   ├── subscribe() — SSE + BroadcastChannel
  │   └── activeContext — track active file per modality
  └── Modality Panels (all use useArtifact)
      ├── WhiteboardFrame
      ├── EditorPanel
      ├── PresentationPanel
      ├── VoicePanel
      ├── CommentsPanel
      ├── DiffReviewPanel
      └── BrowserPreviewPanel
```

**Pros:**
- ✅ One hook to learn (`useArtifact`)
- ✅ One MCP process (simpler deployment)
- ✅ One context endpoint (scales to N modalities)
- ✅ Keeps write safety (Hub still serializes writes)
- ✅ Adding 8th modality = new component + 3 MCP tools (no infrastructure changes)

**Cons:**
- ⚠️ Still requires Hub server (separate process)
- ⚠️ All MCP tools in one process (one crash kills all agent tools)
- ⚠️ `useArtifact()` needs to handle many edge cases (binary files, large files, conflicts)

**Verdict:** ⭐ **Best balance of simplicity and correctness.** Recommended by the review.

---

### Option C: "No Hub" (Client-Only Architecture)

**Description:** Eliminate the Hub server entirely. All coordination happens in the React client.

**Architecture:**
```
OpenCode Server (:3000) — Existing
  ├── /api/files/:path (read/write)
  ├── /events (SSE for file changes)
  └── [No Hub server needed]

Single MCP Server (one process)
  └── Talks directly to OpenCode server /api/files

React Client
  ├── ArtifactService (in-browser write queue)
  │   ├── write(path, content) — debounced, serialized
  │   ├── read(path) — cache-first, fallback to server
  │   └── subscribe(path) — SSE from OpenCode server
  └── Modality Panels
      └── All use ArtifactService
```

**Pros:**
- ✅ **One server process** (just OpenCode server)
- ✅ Simplest deployment (no Hub to manage)
- ✅ No startup orchestration
- ✅ All coordination logic in one place (client)

**Cons:**
- ❌ No server-side write serialization (race conditions possible)
  - Agent writes via MCP → OpenCode → filesystem
  - User writes via client → OpenCode → filesystem
  - Last-write-wins if simultaneous
- ❌ Multi-tab conflicts (need leader election pattern)
- ❌ No server-side versioning/history

**Mitigations:**
- Use BroadcastChannel leader election (only one tab writes)
- Use optimistic locking (ETags, compare-and-swap)
- Accept last-write-wins for MVP

**Verdict:** ⚠️ **Simpler but riskier.** Good for MVP, but write conflicts are possible.

---

### Option D: "OpenCode Plugin" (Hub Inside OpenCode Server)

**Description:** Move the Hub logic into the OpenCode server as a plugin/module. No separate process.

**Architecture:**
```
OpenCode Server (:3000) — Extended
  ├── /api/files/:path (existing)
  ├── /api/artifacts/:path (new - with write queue)
  ├── /events (SSE - existing + artifact events)
  └── ArtifactStore plugin (write queue, atomic writes)

Single MCP Server (one process)
  └── Talks to OpenCode /api/artifacts

React Client
  ├── useArtifact(path)
  └── Modality Panels
```

**Pros:**
- ✅ **One server process** (just OpenCode)
- ✅ Write safety (server-side queue)
- ✅ No separate Hub to manage
- ✅ All APIs on one port (no CORS issues)

**Cons:**
- ⚠️ Requires modifying OpenCode server (Go code)
- ⚠️ Couples modality logic to OpenCode (harder to swap out)
- ⚠️ Go expertise required

**Verdict:** ⭐⭐ **Best long-term solution IF you control the OpenCode server.** If you're just a client consuming OpenCode, this isn't feasible.

---

## Key Decision Points

### Decision 1: Hub Server — Keep, Simplify, or Eliminate?

| Option | Hub Server | Pros | Cons |
|---|---|---|---|
| **A: Status Quo+** | Keep as-is | Proven, no refactor | 7 processes, N context endpoints |
| **B: Spine Lite** | Keep, simplify | Write safety, one MCP | Still separate process |
| **C: No Hub** | Eliminate | Simplest deployment | Race conditions possible |
| **D: OpenCode Plugin** | Move into OpenCode | One process, write safety | Requires Go changes |

**My Recommendation:** 
- **If you control OpenCode server:** Option D (OpenCode Plugin)
- **If you don't:** Option B (Spine Lite)

**Avoid:** Option A (doesn't scale), Option C (too risky for collaborative editing)

---

### Decision 2: MCP Server Organization — One vs Many?

| Approach | Process Count | Pros | Cons |
|---|---|---|---|
| **One MCP per modality** (Status Quo) | 7 processes | Process isolation | Memory overhead, startup time |
| **One MCP for all** (Spine Lite) | 1 process | Simpler deployment | One crash kills all |

**My Recommendation:** One MCP with namespaced tools.

**Rationale:**
- MCP tools are CRUD operations (low crash risk)
- Memory savings: 7 Node processes = ~350MB, 1 process = ~50MB
- Startup time: 7 × 200ms = 1.4s, 1 × 200ms = 200ms
- If reliability becomes an issue, split later (easy refactor)

---

### Decision 3: Client Abstraction — `useArtifact` vs Per-Modality Services?

| Approach | Code Duplication | Flexibility | Complexity |
|---|---|---|---|
| **Per-modality** (WhiteboardFrame pattern) | High | High | Low per-component |
| **Universal hook** (`useArtifact`) | Low | Medium | Medium (hook handles edge cases) |

**My Recommendation:** Universal `useArtifact()` hook.

**API Design:**
```typescript
function useArtifact(path: string, options?: ArtifactOptions) {
  return {
    data: T | null
    loading: boolean
    error: Error | null
    write: (data: T) => Promise<void>  // Debounced, queued
    refresh: () => Promise<void>
    subscribe: (callback: (data: T) => void) => () => void
  }
}

// Usage:
function EditorPanel({ filePath }: { filePath: string }) {
  const { data, loading, write } = useArtifact(filePath, {
    debounce: 1000,
    format: 'text'
  })
  
  // ... Monaco editor
  // onChange → write(newContent)
}
```

**Rationale:**
- All modalities need read/write/subscribe
- Debouncing logic is identical
- SSE subscription is identical
- BroadcastChannel coordination is identical
- Testing is easier (one hook, many consumers)

---

### Decision 4: Cross-Modality Navigation — TargetRef vs Simple Callbacks?

**Context:** Some modalities need to open others. Examples:
- Diff Review → "Open in Editor" button → Editor panel opens file at line
- Comments → Click comment → Editor scrolls to line
- Browser → "View Source" → Editor opens HTML file

**Option A: TargetRef System** (from implementation guides)
```typescript
interface TargetRef {
  modality: string
  path: string
  metadata?: {
    line?: number
    column?: number
    slideIndex?: number
    commentId?: string
  }
}

function navigate(ref: TargetRef) {
  // Lookup modality registry
  // Call modality's openAt() method
}
```

**Option B: Simple Callbacks** (no system)
```typescript
// Just use React state + callbacks
function DiffReviewPanel() {
  const { openFile } = useLayout()
  
  return (
    <button onClick={() => openFile('src/foo.ts', 42)}>
      Open in Editor
    </button>
  )
}
```

**My Recommendation:** Start with Option B (simple callbacks), formalize later.

**Rationale:**
- Only 2-3 modalities need cross-navigation initially
- Premature abstraction adds complexity without proven benefit
- When you have 5+ modalities with complex handoffs, refactor to TargetRef
- TargetRef is a 2-day refactor when needed

---

### Decision 5: Active Context — Per-Modality Endpoints vs Unified?

**Context:** Agent needs to know what's open (e.g., "update the active whiteboard").

**Option A: Per-Modality Endpoints** (Status Quo)
```
POST /context/active-whiteboard { path: "design/foo.graph.mmd" }
GET  /context/active-whiteboard → { path: "design/foo.graph.mmd" }

POST /context/active-editor { path: "src/foo.ts", line: 42 }
GET  /context/active-editor → { path: "src/foo.ts", line: 42 }

... 7 endpoints total
```

**Option B: Unified Endpoint**
```
POST /context { modality: "whiteboard", path: "design/foo.graph.mmd" }
GET  /context/whiteboard → { path: "design/foo.graph.mmd" }

POST /context { modality: "editor", path: "src/foo.ts", line: 42 }
GET  /context/editor → { path: "src/foo.ts", line: 42 }

... one endpoint for all modalities
```

**My Recommendation:** Option B (unified).

**Rationale:**
- Scales to N modalities without code changes
- Simpler API surface
- Agent MCP tools can be generic: `set_active_context(modality, data)`

---

## Recommended Architecture: "Spine Lite with Unified Context"

**Summary:** Option B (Spine Lite) + unified context + one MCP server + `useArtifact()` hook.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     OpenCode Server (:3000)                  │
│                         [Untouched]                          │
│  ├─ /api/sessions, /api/messages, /api/providers, etc.      │
│  └─ /events (SSE - session/message events)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ (HTTP + SSE)
                              │
┌─────────────────────────────▼─────────────────────────────────┐
│                      Runtime Hub (:3001)                       │
│                      [Simplified]                              │
│  ├─ ArtifactStore (write queue, atomic writes)                │
│  ├─ GET/POST /files/:path (read/write with serialization)     │
│  ├─ SSE /events (FILE_CHANGED events for all modalities)      │
│  └─ GET/POST /context (unified: { modality, data })           │
└─────────────────────────────▲──────────────────────────────────┘
                              │
                              │ (HTTP)
                              │
┌─────────────────────────────┴─────────────────────────────────┐
│                   Modality MCP Server (stdio)                  │
│                      [Single Process]                          │
│  └─ Namespaced Tools:                                          │
│      ├─ whiteboard.list/read/update                            │
│      ├─ editor.read/write/navigate                             │
│      ├─ presentation.list/read/update/navigate                 │
│      ├─ voice.record/transcribe                                │
│      ├─ comment.list/add/resolve                               │
│      ├─ diff.read/comment/approve                              │
│      └─ browser.navigate/snapshot/inspect                      │
└────────────────────────────────────────────────────────────────┘
                              │
                              │ (Agent uses MCP)
                              │
┌─────────────────────────────▼─────────────────────────────────┐
│                    React Client (Browser)                      │
│  ├─ useArtifact(path) — Universal Hook                         │
│  │   ├─ read() → Hub /files/:path                              │
│  │   ├─ write() → Hub /files/:path (debounced)                 │
│  │   ├─ subscribe() → Hub SSE /events                          │
│  │   └─ BroadcastChannel (multi-tab sync)                      │
│  │                                                              │
│  ├─ Modality Panels (all use useArtifact)                      │
│  │   ├─ WhiteboardFrame (design/*.graph.mmd)                   │
│  │   ├─ EditorPanel (src/*)                                    │
│  │   ├─ PresentationPanel (docs/*.deck.md)                     │
│  │   ├─ VoicePanel (audio/*.m4a + transcripts)                 │
│  │   ├─ CommentsPanel (overlays on editor/diff)                │
│  │   ├─ DiffReviewPanel (session diffs)                        │
│  │   └─ BrowserPreviewPanel (iframe + inspection)              │
│  │                                                              │
│  └─ Layout Shell                                               │
│      ├─ Panel management (which modality visible)              │
│      ├─ Active context tracking (POST /context on focus)       │
│      └─ Cross-modality navigation (callbacks)                  │
└────────────────────────────────────────────────────────────────┘
```

### Core Contracts

#### 1. `useArtifact()` Hook API
```typescript
interface ArtifactOptions {
  debounce?: number        // Write debounce ms (default 1000)
  format?: 'text' | 'json' | 'binary'
  validate?: (data: any) => boolean
  transform?: {
    serialize?: (data: any) => string
    deserialize?: (raw: string) => any
  }
}

function useArtifact<T = string>(
  path: string,
  options?: ArtifactOptions
): {
  data: T | null
  loading: boolean
  error: Error | null
  write: (data: T) => Promise<void>
  refresh: () => Promise<void>
  subscribe: (callback: (data: T) => void) => () => void
  version: number  // Increments on each change (optimistic locking)
}
```

#### 2. Hub API
```typescript
// Read
GET /files/:path
Response: { content: string, version: number, metadata: {...} }

// Write (debounced, queued)
POST /files/:path
Body: { content: string, version?: number }
Response: { version: number }

// Events
SSE /events
Event: { type: 'FILE_CHANGED', path: string, version: number }

// Active Context (unified)
POST /context
Body: { modality: string, data: any }

GET /context/:modality
Response: { data: any }
```

#### 3. MCP Tools (Namespaced)
```typescript
// Whiteboard
whiteboard.list() → string[]
whiteboard.read(name: string) → { mermaid: string, png?: string }
whiteboard.update(name: string, mermaid: string) → void

// Editor
editor.read(path: string) → string
editor.write(path: string, content: string) → void
editor.navigate(path: string, line?: number, column?: number) → void

// Presentation
presentation.list() → string[]
presentation.read(path: string) → { markdown: string, slideIndex: number }
presentation.update(path: string, markdown: string) → void
presentation.navigate(path: string, slideIndex: number) → void

// Voice
voice.record(duration?: number) → { audioPath: string }
voice.transcribe(audioPath: string) → { transcript: string }

// Comment
comment.list(filePath: string) → Comment[]
comment.add(filePath: string, line: number, text: string) → Comment
comment.resolve(commentId: string) → void

// Diff
diff.read(sessionId: string) → FileDiff[]
diff.comment(sessionId: string, fileId: string, line: number, text: string) → Comment
diff.approve(sessionId: string, fileId: string) → void

// Browser
browser.navigate(url: string) → void
browser.snapshot() → { png: string, html: string }
browser.inspect(selector: string) → Element
```

#### 4. Modality Component Pattern
```typescript
// Every modality follows this pattern
function ModalityPanel({ initialPath }: { initialPath: string }) {
  // 1. Use the universal hook
  const { data, loading, write } = useArtifact(initialPath, {
    debounce: 1000,
    format: 'text'
  })
  
  // 2. Set active context on mount
  const { setActiveContext } = useActiveContext()
  useEffect(() => {
    setActiveContext('modality-name', { path: initialPath })
    return () => setActiveContext('modality-name', null)
  }, [initialPath])
  
  // 3. Render modality-specific UI
  return <div>...</div>
}
```

---

## Open Questions for Debate

### Question 1: Hub Server — Keep or Eliminate?

**Options:**
- **A:** Keep Hub as separate process (Status Quo)
- **B:** Move Hub logic into OpenCode server as plugin (requires Go changes)
- **C:** Eliminate Hub, accept client-side write coordination (riskier)

**What do you think?** Do you control the OpenCode server? Are you okay with a separate Hub process?

---

### Question 2: Write Conflicts — How Important?

**Scenario:** Agent and user edit the same file simultaneously.

**Options:**
- **Strict:** Server-side queue (only Hub Option A/B can guarantee this)
- **Optimistic:** Last-write-wins, rely on git for recovery (Option C)
- **Hybrid:** Client-side queue + optimistic locking (ETags)

**What do you think?** How often will agent and user edit the same file at the same time?

---

### Question 3: Cross-Modality Navigation — Now or Later?

**Options:**
- **Now:** Build TargetRef system upfront (2 days, used by 2-3 modalities initially)
- **Later:** Use simple callbacks, refactor when we have 5+ modalities (save 2 days now, pay 2 days later)

**What do you think?** Do you have clear cross-modality workflows in mind?

---

### Question 4: MCP Server Reliability — One Process OK?

**Concern:** If one MCP tool crashes (e.g., voice transcription OOM), all MCP tools die.

**Options:**
- **One process:** Simpler, accept risk (can restart quickly)
- **Per-modality processes:** More reliable, more complex

**What do you think?** How critical is MCP uptime?

---

### Question 5: Whiteboard Refactor — Now or Later?

**Context:** Whiteboard currently uses `useDebouncedSave` directly. To adopt `useArtifact()`, we'd refactor it.

**Options:**
- **Now:** Refactor whiteboard to use `useArtifact()`, validate the hook works (1 day)
- **Later:** Leave whiteboard as-is, build new modalities with `useArtifact()` (faster short-term)

**What do you think?** Should whiteboard be the reference implementation?

---

## Recommendation Summary

**My position:**
1. **Hub:** Keep as separate process (Option B: Spine Lite) unless you can modify OpenCode server
2. **Write conflicts:** Accept optimistic approach for MVP, add stricter queue if issues arise
3. **Cross-modality navigation:** Simple callbacks now, TargetRef when we have 5+ modalities
4. **MCP reliability:** One process is fine, split if reliability becomes an issue
5. **Whiteboard refactor:** Do it now (1 day) — validates `useArtifact()` before building 5 more modalities

**Total infrastructure work before building modalities:** ~1 week
- Build `useArtifact()` hook (2 days)
- Simplify Hub API (/artifacts → /files, unified /context) (1 day)
- Consolidate MCP server (whiteboard-mcp → modality-mcp with namespaces) (1 day)
- Refactor whiteboard to use `useArtifact()` (1 day)
- Write pattern documentation (1 day)

**Then:** Building each modality is ~3-5 days (no infrastructure changes needed).

---

## Your Turn: What's Your Position?

Please respond with:
1. **Hub decision:** Keep, modify OpenCode, or eliminate?
2. **Write conflict tolerance:** Strict queue or optimistic?
3. **Cross-modality nav:** Build TargetRef now or later?
4. **MCP reliability:** One process OK or split now?
5. **Whiteboard refactor:** Do it now or leave as-is?
6. **Any other concerns or questions?**

Once we align on architecture, I'll create the implementation roadmap (Part C).
