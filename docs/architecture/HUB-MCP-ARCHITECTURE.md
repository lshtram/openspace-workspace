---
id: HUB-MCP-ARCHITECTURE
author: oracle_e7f2
status: CANONICAL
date: 2026-02-16
purpose: Canonical technical reference for Hub/MCP architecture (implementation guide)
---

# Hub/MCP Multi-Modal Architecture

> **Document Type:** Technical Reference (Canonical)  
> **Audience:** Developers implementing or extending OpenSpace's multi-modal capabilities  
> **Purpose:** Explain how the Runtime Hub + MCP server architecture enables multi-modal AI interactions  
> **Related Documents:**
> - [Architecture Review](../ARCHITECTURE_REVIEW_OPENSPACE.md) - Point-in-time comprehensive review (2026-02-15)
> - [Modality Platform V2 Spec](./TECHSPEC-MODALITY-PLATFORM-V2.md) - Contracts and execution order
> - [Modality Platform V2 Requirements](../requirements/REQ-MODALITY-PLATFORM-V2.md) - User stories and backlog

---

## Table of Contents

1. [Overview](#1-overview)
2. [System Topology](#2-system-topology)
3. [The Runtime Hub](#3-the-runtime-hub)
4. [The MCP Server](#4-the-mcp-server)
5. [Multi-Modal Capabilities](#5-multi-modal-capabilities)
6. [Agent → Client Command Pipeline](#6-agent--client-command-pipeline)
7. [Artifact Management](#7-artifact-management)
8. [Event Streams](#8-event-streams)
9. [Comparison with OpenCode](#9-comparison-with-opencode)
10. [Security Model](#10-security-model)

---

## 1. Overview

OpenSpace extends the opencode AI coding agent server with **multi-modal capabilities** — whiteboards, diagrams, presentations, and voice interaction. This is accomplished through a **companion Runtime Hub server** that handles everything the opencode server doesn't need to know about.

### Key Design Principles

1. **Non-invasive:** Extends opencode without modifying the upstream server
2. **Modality-agnostic:** Hub provides a platform; modalities are pluggable
3. **AI-controllable:** Agent can manipulate UI via MCP (Model Context Protocol) tools
4. **Multi-client:** SSE events synchronize state across browser tabs

### Architecture Pattern

```
┌─────────────────────────────────────────────────────────┐
│                    Why Two Servers?                      │
├─────────────────────────────────────────────────────────┤
│ opencode server (Go):                                    │
│   - Session management                                   │
│   - Message history                                      │
│   - Model/agent selection                                │
│   - Streaming completions                                │
│                                                          │
│ Runtime Hub (Node.js):                                   │
│   - Artifact storage (whiteboards, presentations)        │
│   - Voice orchestration (Whisper/TTS pipeline)           │
│   - MCP tool server (agent ↔ UI control)                │
│   - SSE events (file changes, commands)                  │
└─────────────────────────────────────────────────────────┘
```

**Why not merge into opencode?**
- opencode is a general-purpose AI server (language-agnostic)
- Multi-modal features are OpenSpace-specific (React, tldraw, Reveal.js)
- Separation allows upstream opencode updates without conflicts

---

## 2. System Topology

### 2.1 Three-Server Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User's Browser                          │
│                  (OpenSpace React Client - Port 5173)           │
│                                                                 │
│  ┌────────────────┐  ┌──────────────┐  ┌────────────────┐     │
│  │ 9 Context      │  │ TanStack     │  │ Binary Tree    │     │
│  │ Providers      │  │ React Query  │  │ Pane System    │     │
│  └────────┬───────┘  └──────┬───────┘  └───────┬────────┘     │
│           │                 │                   │              │
│  ┌────────┴─────────────────┴───────────────────┘              │
│  │        useArtifact() + useSessionEvents()                   │
│  └────────┬──────────────────┬──────────────────┘              │
│           │ HTTP/SSE         │ HTTP/SSE                        │
└───────────┼──────────────────┼─────────────────────────────────┘
            │                  │
       ┌────▼────┐        ┌────▼─────────────────┐
       │opencode │        │   Runtime Hub        │
       │ server  │        │  (Express 5, Node)   │
       │ :3000   │        │  :3001               │
       │         │        │                      │
       │Sessions │◄───┐   │ ArtifactStore        │
       │Messages │    │   │ PatchEngine          │
       │Models   │    │   │ VoiceOrchestrator    │
       │Config   │    │   │ SSE EventEmitter     │
       │Agents   │    │   └──────────────────────┘
       └─────────┘    │           ▲
                      │           │ stdio
                      │   ┌───────▼──────────────┐
                      │   │  MCP Server          │
                      │   │  (modality-mcp.ts)   │
                      │   │                      │
                      │   │ 21 Tools:            │
                      └───┤   whiteboard.*       │
                          │   drawing.*          │
                          │   presentation.*     │
                          │   pane.*             │
                          │   editor.*           │
                          └──────────────────────┘
```

### 2.2 Communication Flows

| Flow | Protocol | Purpose |
|------|----------|---------|
| **Client ↔ opencode** | HTTP + SSE | Session management, streaming messages |
| **Client ↔ Hub** | HTTP + SSE | Artifact CRUD, file changes, pane commands |
| **Agent → MCP Server** | stdio (JSON-RPC) | Tool calls (whiteboard.create, pane.open, etc.) |
| **MCP Server → Hub** | HTTP | Tool execution (POST /whiteboards, POST /commands) |
| **Hub → Client** | SSE | Broadcast events (FILE_CHANGED, PANE_COMMAND) |

---

## 3. The Runtime Hub

**Location:** `runtime-hub/src/hub-server.ts` (1034 lines)

The Hub is an **Express 5 server** running on port 3001 (configurable). It provides:

### 3.1 HTTP Endpoints

#### Artifact Management
```typescript
// File CRUD (enforces design/ prefix for safety)
GET  /files/:path              // Read file content
POST /files/:path              // Create/update file
DEL  /files/:path              // Delete file

// Whiteboard endpoints
GET  /whiteboards              // List all whiteboards
GET  /whiteboards/:name        // Get whiteboard data
POST /whiteboards/:name        // Create/update whiteboard
DEL  /whiteboards/:name        // Delete whiteboard

// Presentation endpoints
GET  /presentations            // List all presentations
GET  /presentations/:name      // Get presentation content
POST /presentations/:name      // Create/update presentation
DEL  /presentations/:name      // Delete presentation

// Drawing endpoints
GET  /drawing/scene            // Get drawing scene data
POST /drawing/scene            // Update drawing scene
```

#### Active Context (What the user is viewing)
```typescript
GET  /context/active           // Get current focus
POST /context/active           // Set current focus

// Example response:
{
  "modality": "editor",
  "data": {
    "path": "src/main.ts",
    "location": { "startLine": 42 }
  }
}
```

#### Agent → Client Command Channel
```typescript
POST /commands                 // Agent sends UI command
GET  /panes/state              // MCP reads current pane layout
POST /panes/state              // Client reports pane state

// Example command:
{
  "type": "PANE_OPEN",
  "payload": {
    "content": { "type": "editor", "filePath": "README.md" },
    "targetPaneId": "pane-1"
  }
}
```

#### Event Stream
```typescript
GET  /events                   // SSE stream for real-time updates

// Event types:
// - FILE_CHANGED: File modified externally
// - PANE_COMMAND: Agent wants to control UI
// - CONTEXT_UPDATED: Active context changed
```

### 3.2 Core Services

#### ArtifactStore (`services/ArtifactStore.ts`)

**Responsibilities:**
- Atomic writes (tmp → fsync → rename)
- Rolling backups (20 versions)
- Audit logging (NDJSON format)
- File watcher (chokidar) for external changes

**Key Methods:**
```typescript
class ArtifactStore {
  async read(path: string): Promise<string>
  async write(path: string, content: string): Promise<void>
  async delete(path: string): Promise<void>
  async list(directory: string): Promise<string[]>
  async backup(path: string): Promise<void>
}
```

**Why Atomic Writes?**
```typescript
// Prevents data corruption on crashes
async write(path: string, content: string): Promise<void> {
  const tmpPath = path + '.tmp'
  await fs.writeFile(tmpPath, content)
  await fs.fsync(tmpPath)           // Force to disk
  await fs.rename(tmpPath, path)    // Atomic operation
}
```

#### PatchEngine (`services/PatchEngine.ts`)

**Responsibilities:**
- Versioned patching with optimistic concurrency control
- Operation-based mutations (add/update/remove nodes/edges/slides)

**Key Concepts:**
```typescript
interface PatchRequest {
  baseVersion: number           // Version request is based on
  operations: IOperation[]      // Sequence of operations
}

interface PatchResult {
  success: boolean
  newVersion: number
  conflicts?: Conflict[]        // If baseVersion mismatch
}
```

**Operations:**
```typescript
type IOperation =
  | { type: 'addNode', node: INode }
  | { type: 'updateNode', id: string, updates: Partial<INode> }
  | { type: 'removeNode', id: string }
  | { type: 'addEdge', edge: IEdge }
  | { type: 'updateEdge', id: string, updates: Partial<IEdge> }
  | { type: 'removeEdge', id: string }
  | { type: 'addSlide', slide: ISlide }
  | { type: 'updateSlide', index: number, updates: Partial<ISlide> }
  | { type: 'removeSlide', index: number }
  | { type: 'reorderSlides', fromIndex: number, toIndex: number }
```

#### VoiceOrchestrator (`services/voice-orchestrator.ts`)

**Responsibilities:**
- 3-FSM voice pipeline (SessionFSM, AudioFSM, NarrationFSM)
- Whisper integration (speech-to-text)
- TTS integration (text-to-speech)
- Active context narration

**States:**
```
idle → listening → processing → speaking → idle
       ↑                                    ↓
       └────────────────────────────────────┘
```

### 3.3 Security Model

**Default Binding:** `127.0.0.1` (localhost only)

**Configuration:**
```bash
# Priority: CLI > env > default
runtime-hub --bind 127.0.0.1                     # CLI flag
HUB_BIND_ADDRESS=192.168.1.10 npm run hub        # Environment variable
npm run hub                                      # Default: 127.0.0.1
```

**Path Traversal Protection:**
```typescript
// All artifact paths are validated against design/ directory
const designDir = path.resolve(process.cwd(), 'design')
if (!resolvedPath.startsWith(designDir)) {
  return res.status(403).json({ error: 'Path must be within design/' })
}
```

**Security Warnings:**
```typescript
// Logs 7-line warning when binding to 0.0.0.0
validateBindAddress('0.0.0.0')
// ⚠️  WARNING: Hub is binding to 0.0.0.0 (all network interfaces)
// ⚠️  This exposes the Hub to your local network.
// ⚠️  Anyone on your network can:
// ⚠️    - Read/write files under design/
// ⚠️    - Send commands to your browser
// ⚠️    - Monitor your activity via SSE stream
// ⚠️  For remote access, use SSH tunnel or VPN instead.
```

---

## 4. The MCP Server

**Location:** `runtime-hub/src/mcp/modality-mcp.ts` (1011 lines)

The MCP server is a **Model Context Protocol** server that exposes 21 tools for AI agents to control the UI.

### 4.1 MCP Integration

**Configuration:** `opencode.json` at project root
```json
{
  "mcp": {
    "servers": {
      "openspace-modality": {
        "command": "npx",
        "args": ["tsx", "runtime-hub/src/mcp/modality-mcp.ts"],
        "env": {
          "MODALITY_HUB_URL": "http://localhost:3001"
        }
      }
    }
  }
}
```

**Startup:** opencode server spawns MCP server as child process via stdio

**Protocol:** JSON-RPC over stdio
```
Agent → opencode → MCP Server → Hub → Client
         (stdio)    (HTTP)      (SSE)
```

### 4.2 Tool Categories

#### Whiteboard Tools (4)
```typescript
whiteboard.create(name: string, diagram: IDiagram)
  // Creates new whiteboard file at design/whiteboards/{name}.diagram.json

whiteboard.read(name: string): IDiagram
  // Reads whiteboard data

whiteboard.patch(name: string, baseVersion: number, operations: IOperation[])
  // Applies versioned operations to whiteboard

whiteboard.close(name: string)
  // Closes whiteboard pane in client
```

#### Drawing Tools (4)
```typescript
drawing.create(name: string, diagram: IDiagram)
drawing.read(name: string): IDiagram
drawing.patch(name: string, baseVersion: number, operations: IOperation[])
drawing.close(name: string)
```

#### Presentation Tools (5)
```typescript
presentation.create(name: string, content: string)
  // Creates Markdown-based presentation

presentation.read(name: string): string
  // Reads presentation Markdown

presentation.update(name: string, content: string)
  // Updates presentation content

presentation.open(name: string, paneId?: string)
  // Opens presentation in client pane

presentation.navigate(name: string, slideIndex: number)
  // Navigates to specific slide
```

#### Pane Control Tools (4)
```typescript
pane.open(content: ContentSpec, targetPaneId?: string, newPane?: boolean, splitDirection?: 'horizontal' | 'vertical')
  // Opens content in specified pane or creates new split

pane.close(paneId: string, tabId: string)
  // Closes specific tab

pane.list(): PaneLayout
  // Returns current pane tree structure

pane.focus(paneId: string, tabId?: string)
  // Focuses pane/tab
```

#### Editor Tools (3)
```typescript
editor.open(filePath: string, paneId?: string, line?: number, endLine?: number)
  // Opens file in editor pane

editor.read_file(filePath: string): string
  // Reads file content (equivalent to GET /files/:path)

editor.close(paneId: string, filePath: string)
  // Closes editor tab
```

### 4.3 Tool Execution Flow

**Example: Agent creates a whiteboard**

```
1. Agent LLM decides to create a diagram
   → calls whiteboard.create("architecture", { nodes: [...], edges: [...] })

2. opencode server forwards to MCP server (stdio)
   → JSON-RPC: { "method": "tools/call", "params": { "name": "whiteboard.create", ... } }

3. MCP server validates args (Zod schema)
   → Validates: name is string, diagram matches IDiagram schema

4. MCP server calls Hub (HTTP)
   → POST http://localhost:3001/whiteboards/architecture
   → Body: { nodes: [...], edges: [...] }

5. Hub ArtifactStore writes file atomically
   → Writes: design/whiteboards/architecture.diagram.json

6. Hub file watcher detects change
   → Emits SSE event: { type: 'FILE_CHANGED', path: 'design/whiteboards/...' }

7. Client receives SSE event
   → useArtifact hook updates React state
   → TldrawWhiteboard re-renders with new data

8. MCP server returns success to agent
   → Agent receives: { "success": true, "path": "design/whiteboards/architecture.diagram.json" }
```

---

## 5. Multi-Modal Capabilities

### 5.1 Whiteboard Modality

**Technology:** tldraw (React canvas library)

**File Format:** IDiagram (JSON, `*.diagram.json`)
```json
{
  "schemaVersion": "1.0",
  "diagramType": "generic",
  "nodes": [
    {
      "id": "node-1",
      "type": "rectangle",
      "label": "User",
      "position": { "x": 100, "y": 100 },
      "size": { "width": 120, "height": 60 },
      "style": { "fill": "#ffffff", "stroke": "#000000" }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "type": "arrow",
      "source": { "nodeId": "node-1", "anchor": "right" },
      "target": { "nodeId": "node-2", "anchor": "left" }
    }
  ]
}
```

**Bidirectional Mapping:** `tldrawMapper.ts` (489 lines)
- **IDiagram → TLShape[]:** `diagramToTldrawShapes(diagram)`
- **TLShape[] → IDiagram:** `tldrawShapesToDiagram(shapes, bindings)`

**Supported Shapes:**
- Rectangle, Circle, Diamond, Hexagon (basic shapes)
- Arrow with smart bindings (connects to shapes)
- Text, Sticky Notes
- Groups

**Component:** `TldrawWhiteboard.tsx` (376 lines)
- Uses `useArtifact` for live sync
- Auto-saves on change (debounced 1000ms)
- Remote updates via SSE (deferred change mechanism prevents data loss)

### 5.2 Presentation Modality

**Technology:** Reveal.js (HTML5 presentation framework)

**File Format:** Markdown with YAML frontmatter (`*.presentation.md`)
```markdown
---
title: My Presentation
theme: black
---

## Slide 1

Content here

---

## Slide 2

More content
```

**Component:** `PresentationFrame.tsx` (174 lines)
- Renders Markdown as Reveal.js slides
- Supports presenter notes, fragments, vertical slides
- Navigation controls (prev/next, jump to slide)

**Agent Control:**
```typescript
// Agent can create, update, and navigate presentations
presentation.create("demo", "---\ntitle: Demo\n---\n\n## Hello")
presentation.open("demo", "pane-1")
presentation.navigate("demo", 2)  // Jump to slide 2
```

### 5.3 Drawing Modality

**Technology:** Same as Whiteboard (tldraw), but separate file namespace

**File Format:** `*.drawing.json` (IDiagram)

**Difference from Whiteboard:**
- Whiteboard: Free-form design, multiple diagrams per workspace
- Drawing: Single canonical diagram per file, versioned with baseVersion

### 5.4 Editor Modality

**Technology:** Monaco Editor (VSCode editor)

**File Format:** Plain text (any extension)

**Component:** `EditorContent.tsx`
- Syntax highlighting via Shiki
- Line highlighting support
- Read-only by default (editing TBD)

**Agent Control:**
```typescript
editor.open("src/main.ts", "pane-1", 42)  // Open file at line 42
```

### 5.5 Voice Modality

**Technology:** Whisper (STT) + OpenAI TTS

**States:** idle → listening → processing → speaking → idle

**Agent Integration:**
- Narrates active context (what you're viewing)
- Voice commands trigger agent tools
- TTS reads agent responses

---

## 6. Agent → Client Command Pipeline

**Problem:** How does the agent control the UI (open files, create panes, navigate)?

**Solution:** Agent sends commands to Hub → Hub broadcasts via SSE → Client dispatches to PaneContext

### 6.1 Command Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│ Agent LLM (Claude, GPT-4, etc.)                              │
└──────────────────────┬───────────────────────────────────────┘
                       │ "Open README in right pane"
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ MCP Tool: pane.open(content, targetPaneId, newPane, split)  │
└──────────────────────┬───────────────────────────────────────┘
                       │ Validated args
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ POST /commands                                               │
│ Body: { type: "PANE_OPEN", payload: { ... } }              │
└──────────────────────┬───────────────────────────────────────┘
                       │ Hub validates type & payload
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ Hub generates commandId, broadcasts SSE event                │
│ Event: { type: "PANE_COMMAND", commandId: "...", payload }  │
└──────────────────────┬───────────────────────────────────────┘
                       │ All connected clients receive
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ Client: useAgentCommands hook                                │
│ useEffect(() => {                                            │
│   eventSource.on('PANE_COMMAND', handleCommand)             │
│ }, [])                                                       │
└──────────────────────┬───────────────────────────────────────┘
                       │ Dispatch to PaneContext
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ PaneContext.dispatch({ type: 'ADD_TAB', ... })              │
└──────────────────────┬───────────────────────────────────────┘
                       │ Pure function update
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ UI updates: New tab opens in specified pane                 │
└──────────────────────┬───────────────────────────────────────┘
                       │ Layout change
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ usePaneStateReporter: POST /panes/state (debounced 500ms)  │
│ Body: { tree: PaneNode, activePaneId: "..." }              │
└──────────────────────┬───────────────────────────────────────┘
                       │ Hub stores pane state
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ Agent calls pane.list() → sees updated layout               │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 Command Types

```typescript
type PaneCommand =
  | { type: 'PANE_OPEN', payload: { content: ContentSpec, targetPaneId?, newPane?, splitDirection? } }
  | { type: 'PANE_CLOSE', payload: { paneId: string, tabId: string } }
  | { type: 'PANE_FOCUS', payload: { paneId: string, tabId?: string } }
  | { type: 'EDITOR_OPEN', payload: { filePath: string, paneId?, line?, endLine? } }
  | { type: 'PRESENTATION_NAVIGATE', payload: { name: string, slideIndex: number } }
```

### 6.3 Client Handlers

**useAgentCommands Hook:**
```typescript
export function useAgentCommands() {
  const { dispatch } = usePaneContext();
  
  useEffect(() => {
    const eventSource = new EventSource('/events');
    
    eventSource.addEventListener('PANE_COMMAND', (event) => {
      const { type, payload } = JSON.parse(event.data);
      
      switch (type) {
        case 'PANE_OPEN':
          dispatch({
            type: 'ADD_TAB',
            paneId: payload.targetPaneId,
            tab: createTabFromContent(payload.content),
            splitDirection: payload.splitDirection,
          });
          break;
        
        case 'PANE_CLOSE':
          dispatch({
            type: 'REMOVE_TAB',
            paneId: payload.paneId,
            tabId: payload.tabId,
          });
          break;
        
        // ... other handlers
      }
    });
    
    return () => eventSource.close();
  }, [dispatch]);
}
```

**usePaneStateReporter Hook:**
```typescript
export function usePaneStateReporter() {
  const { tree, activePaneId } = usePaneContext();
  
  // Debounce: Only send layout updates every 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      fetch('/panes/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tree, activePaneId }),
      });
    }, 500);
    
    return () => clearTimeout(timer);
  }, [tree, activePaneId]);
}
```

---

## 7. Artifact Management

### 7.1 useArtifact Hook

**The Universal Pattern:** Every modality (whiteboard, drawing, presentation, editor) uses `useArtifact` for live sync.

**Location:** `openspace-client/src/hooks/useArtifact.ts` (548 lines)

**Architecture:**
1. **Initial Load:** HTTP GET from Hub
2. **Live Sync:** SSE subscription for `FILE_CHANGED` events (filtered by path)
3. **Multi-Window:** BroadcastChannel for same-origin tab synchronization
4. **Auto-Save:** Debounced HTTP PUT to Hub (configurable, default 1000ms)
5. **Remote Change Callback:** `onRemoteChange` for modality-specific handling

**API:**
```typescript
function useArtifact<T>(
  filePath: string,
  options: {
    parse: (content: string) => T
    serialize: (data: T) => string
    debounceMs?: number
    onRemoteChange?: (data: T) => void
  }
): {
  data: T | null
  setData: (updater: T | ((prev: T | null) => T | null)) => void
  loading: boolean
  error: string | null
  connected: boolean
}
```

**Example Usage:**
```typescript
// TldrawWhiteboard.tsx
const { data, setData, loading, error, connected } = useArtifact<IDiagram>(
  'design/whiteboards/architecture.diagram.json',
  {
    parse: (content) => JSON.parse(content),
    serialize: (data) => JSON.stringify(data, null, 2),
    debounceMs: 1000,
    onRemoteChange: (newData) => {
      // Update tldraw editor with new shapes
      const { shapes, bindings } = diagramToTldrawShapes(newData);
      editor.run(() => {
        editor.createShapes(shapes);
        editor.createBindings(bindings);
      });
    },
  }
);

// User drags a shape
const handleChange = (editor: Editor) => {
  const shapes = editor.getCurrentPageShapes();
  const bindings = editor.store.query.records('binding').get();
  const diagram = tldrawShapesToDiagram(shapes, bindings);
  
  setData(diagram);  // Triggers debounced save to Hub
};
```

### 7.2 Event-Driven Sync

**Scenario: Multi-tab editing**

```
Tab 1: User drags shape in whiteboard
  ↓
Tab 1: setData(updatedDiagram)
  ↓
Tab 1: useArtifact debounce timer (1000ms)
  ↓
Tab 1: PUT /whiteboards/architecture
  ↓
Hub: ArtifactStore.write() (atomic)
  ↓
Hub: File watcher detects change
  ↓
Hub: SSE broadcast { type: 'FILE_CHANGED', path: 'design/whiteboards/architecture.diagram.json' }
  ↓
Tab 2: useArtifact receives SSE event
  ↓
Tab 2: GET /whiteboards/architecture (fetch latest)
  ↓
Tab 2: onRemoteChange(newDiagram) called
  ↓
Tab 2: TldrawWhiteboard updates editor
  ↓
Tab 2: User sees shape appear (real-time sync)
```

### 7.3 Conflict Resolution

**Problem:** Two users edit same diagram simultaneously

**Current Strategy:** Last write wins (optimistic concurrency)
- useArtifact debounce (1000ms) reduces conflict window
- Remote changes trigger `onRemoteChange` callback
- Local changes during remote update are deferred (B1 fix)

**Future:** CRDT or Operational Transformation for true concurrent editing

---

## 8. Event Streams

### 8.1 SSE Architecture

**Server:** Express EventEmitter + SSE middleware

```typescript
// hub-server.ts
import EventEmitter from 'events';

const eventBus = new EventEmitter();

// SSE endpoint
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const handler = (event: HubEvent) => {
    res.write(`event: ${event.type}\n`);
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };
  
  eventBus.on('event', handler);
  
  req.on('close', () => {
    eventBus.off('event', handler);
  });
});

// Emit events
eventBus.emit('event', {
  type: 'FILE_CHANGED',
  path: 'design/whiteboards/architecture.diagram.json',
  timestamp: Date.now(),
});
```

**Client:** EventSource + custom hooks

```typescript
// Client: useSessionEvents.ts
export function useSessionEvents() {
  useEffect(() => {
    const eventSource = new EventSource('http://localhost:3001/events');
    
    eventSource.addEventListener('FILE_CHANGED', (event) => {
      const { path } = JSON.parse(event.data);
      // Re-fetch file if useArtifact is watching this path
    });
    
    eventSource.addEventListener('PANE_COMMAND', (event) => {
      const { type, payload } = JSON.parse(event.data);
      // Dispatch to PaneContext
    });
    
    return () => eventSource.close();
  }, []);
}
```

### 8.2 Event Types

| Event | Source | Purpose |
|-------|--------|---------|
| `FILE_CHANGED` | Hub file watcher | Artifact modified externally |
| `PANE_COMMAND` | Agent MCP tool | UI control (open/close/focus) |
| `CONTEXT_UPDATED` | Client or Agent | Active context changed |
| `SESSION_CREATED` | opencode server | New session started |
| `MESSAGE_RECEIVED` | opencode server | Agent message arrived |

---

## 9. Comparison with OpenCode

### 9.1 What OpenSpace Adds

| Feature | OpenCode (SolidJS) | OpenSpace (React + Hub) |
|---------|--------------------|-----------------------|
| **Chat Interface** | ✅ SolidJS components | ✅ React components |
| **File Tabs** | ✅ Fixed panel layout | ✅ Binary tree pane system |
| **Whiteboards** | ❌ No | ✅ tldraw + IDiagram |
| **Diagrams** | ❌ No | ✅ 5 diagram types (UML, sequence, etc.) |
| **Presentations** | ❌ No | ✅ Reveal.js Markdown slides |
| **Voice** | ❌ No | ✅ Whisper STT + OpenAI TTS |
| **Agent UI Control** | ❌ No | ✅ MCP tools (pane.open, etc.) |
| **Multi-Modal Sync** | ❌ No | ✅ SSE + BroadcastChannel |

### 9.2 Architectural Differences

**OpenCode (SolidJS):**
```
Browser ←→ opencode server (:3000)
            - Session management
            - Message streaming
            - File serving
```

**OpenSpace (React + Hub):**
```
Browser ←→ opencode server (:3000)  [Session, Messages]
        ←→ Runtime Hub (:3001)       [Artifacts, Voice, MCP, SSE]
                ↕
           MCP Server (stdio)         [Agent → UI control]
```

### 9.3 Why Not Use opencode's SolidJS Client?

**OpenSpace's Multi-Modal Vision:**
- OpenCode is a **chat + file editor** (TUI-first)
- OpenSpace is a **spatial IDE** with whiteboards, diagrams, presentations
- SolidJS client is designed for the TUI use case (terminal-first)
- React ecosystem has better libraries for canvas (tldraw), presentations (Reveal.js), etc.

**Trade-offs:**
- **OpenSpace Pro:** Richer modalities, agent-controllable UI, spatial workspace
- **OpenSpace Con:** Two servers, more complexity, React re-render overhead
- **OpenCode Pro:** Simpler architecture, single server, SolidJS fine-grained reactivity
- **OpenCode Con:** Limited to chat + file tabs, no multi-modal capabilities

---

## 10. Security Model

### 10.1 Threat Model

**Assumptions:**
- Hub runs on **localhost** (trusted environment)
- Client runs in **user's browser** (same machine)
- No authentication required for local development

**Risks if exposed to network:**
- Arbitrary file read/write under `design/`
- UI command injection (agent can open panes)
- SSE event stream monitoring (privacy leak)

### 10.2 Mitigations

#### 1. Bind to Localhost by Default
```typescript
// hub-server.ts
const bindAddress = parseBindAddress();  // Default: 127.0.0.1
app.listen(3001, bindAddress);
```

#### 2. Path Traversal Protection
```typescript
// All paths validated against design/ directory
const resolvedPath = path.resolve(designDir, relativePath);
if (!resolvedPath.startsWith(designDir)) {
  return res.status(403).json({ error: 'Path must be within design/' });
}
```

#### 3. Security Warnings
```typescript
// Warns user when binding to 0.0.0.0
if (bindAddress === '0.0.0.0') {
  console.warn('⚠️  WARNING: Hub is binding to 0.0.0.0 (all network interfaces)');
  console.warn('⚠️  This exposes the Hub to your local network.');
  // ... 7 lines of warnings
}
```

#### 4. No Secrets in Artifacts
- Artifacts are stored in `design/` (version-controlled)
- Never store API keys, passwords, credentials
- Use `.env` files outside `design/` for secrets

### 10.3 Remote Access (If Needed)

**Do NOT expose Hub directly to internet.**

**Safe Methods:**
1. **SSH Tunnel:**
   ```bash
   # On remote machine
   ssh -L 3001:localhost:3001 user@remote-host
   ```

2. **VPN:** Access via secure VPN connection

3. **Reverse Proxy with Auth:**
   ```nginx
   # nginx with basic auth
   location /hub/ {
     proxy_pass http://127.0.0.1:3001/;
     auth_basic "Restricted";
     auth_basic_user_file /etc/nginx/.htpasswd;
   }
   ```

---

## Summary

The Hub/MCP architecture enables OpenSpace's multi-modal capabilities through:

1. **Separation of Concerns:** opencode handles sessions, Hub handles modalities
2. **Agent Control:** MCP tools let AI manipulate UI (pane.open, whiteboard.create)
3. **Real-Time Sync:** SSE events propagate changes across tabs and modalities
4. **Universal Pattern:** useArtifact hook provides consistent artifact management
5. **Security:** Localhost-only by default, path traversal protection, clear warnings

**Key Innovation:** The Hub acts as a **multi-modal platform** that extends opencode without requiring upstream changes. This architectural pattern could be adopted by other AI coding clients that want to go beyond chat + file editing.

---

## References

- **Architecture Review:** `docs/ARCHITECTURE_REVIEW_OPENSPACE.md`
- **Modality Platform V2:** `docs/architecture/TECHSPEC-MODALITY-PLATFORM-V2.md`
- **Hub Server:** `runtime-hub/src/hub-server.ts`
- **MCP Server:** `runtime-hub/src/mcp/modality-mcp.ts`
- **useArtifact Hook:** `openspace-client/src/hooks/useArtifact.ts`
- **TldrawWhiteboard:** `openspace-client/src/components/whiteboard/TldrawWhiteboard.tsx`
