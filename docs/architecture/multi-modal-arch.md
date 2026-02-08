# OpenCode Multimodal Architecture v2.1 — Source of Truth

**Status:** Approved for Implementation
**Philosophy:** Local‑first, Filesystem‑centric, Deterministic, MCP‑standardized
**Primary Goal:** Enable an LLM to operate on multiple modalities (whiteboard, documents, slides, voice) safely, efficiently, and without data corruption.

---

## 1. Core Principles
1.  **LLM as Logic Engine:** The LLM never owns application state. It reads/writes exclusively through MCP Tools.
2.  **Filesystem as Database:** All project state lives in the project directory. It is portable (zip/git friendly).
3.  **Two-Layer Modality:** Every modality has a **Canonical** layer (Semantic Truth) and a **Projection** layer (Visual State).
4.  **Single Writer Principle:** All writes are serialized through the **Artifact Store** (running in the Main Process) to prevent race conditions.
5.  **Pull‑Based Context:** The Agent receives "Lazy" context (summaries/snapshots) and requests deep data only when needed.

---

## 2. High‑Level Architecture

### Components
| Component | Responsibility | Implementation Notes |
| :--- | :--- | :--- |
| **OpenCode Runtime** | The "Main Process". Routes tool calls, holds the In-Memory Write Queue. | Node.js / Python Process |
| **Artifact Store** | The "Spine". Manages atomic writes, versioning, and history. | Class / Module within Runtime |
| **MCP Servers** | The "Arms". Implement specific modality behaviors (Voice, Browser). | Separate Processes (Stdio/SSE) |
| **Client UI** | The "Face". Renders state and captures user input. | React / Web Technologies |
| **Filesystem** | The "Hard Drive". Long‑term storage. | Local Disk |

### Data Flow
1.  **Agent Write:** `Agent` -> `Runtime` -> `MCP Tool` -> `Artifact Store` -> `Filesystem`
2.  **User Write:** `UI` -> `Runtime API` -> `Artifact Store` -> `Filesystem`
3.  **Read:** `UI/Agent` -> `Artifact Store` -> `Filesystem`

---

## 3. Project Directory Layout
*The physical structure of a project on disk.*

```text
MyProject/
├── src/                          # User Code
├── design/
│   ├── whiteboard.graph.mmd      # Canonical: Mermaid Logic
│   ├── whiteboard.excalidraw     # Projection: Excalidraw UI State
│   └── whiteboard.snapshot.png   # View: Auto-generated Image
├── docs/
│   └── deck/
│       ├── deck.meta.json        # Presentation Metadata
│       └── slides/               # Slide Content (Markdown)
├── .opencode/
│   ├── config.json               # Project Settings
│   ├── artifacts/
│   │   ├── history/              # Version Snapshots (Rolling window)
│   │   └── events.ndjson         # Enhanced Event Log
│   └── index/
│       └── summaries.json        # Search Index

```

---

## 4. The Artifact Store (Detailed Specification)

**Crucial Change v2.1:** We replaced file-based locking with an **In-Memory Write Queue** inside the Runtime. This eliminates OS-level locking issues.

### 4.1 Responsibilities

1. **Serialization:** Ensure only one write happens at a time.
2. **Atomicity:** Use the `write_tmp` -> `fsync` -> `rename` pattern.
3. **Debouncing:** Buffer high-frequency UI updates.

### 4.2 The Class Interface (Reference Implementation)

```typescript
class ArtifactStore {
  private writeQueue = new PQueue({ concurrency: 1 }); // Serialize writes

  // Core Write Method
  async write(path: string, content: string, metadata: WriteMetadata) {
    return this.writeQueue.add(async () => {
      // 1. Create Backup (Version History)
      await this.snapshot(path);
      
      // 2. Atomic Write
      const tempPath = `${path}.tmp`;
      await fs.writeFile(tempPath, content);
      await fs.rename(tempPath, path);
      
      // 3. Log Event
      await this.logEvent(path, metadata);
    });
  }

  // Debounced Write (For UI Dragging)
  private debounceTimers = new Map();
  async writeDebounced(path: string, content: string, meta: WriteMetadata) {
    if (this.debounceTimers.has(path)) clearTimeout(this.debounceTimers.get(path));
    
    this.debounceTimers.set(path, setTimeout(() => {
       this.write(path, content, meta);
    }, 500)); // 500ms delay
  }
}

```

### 4.3 Versioning & History

* **Rolling Window:** Keep the last 20 versions in `.opencode/artifacts/history/<filename>/v<timestamp>`.
* **Recovery:** If a write fails, the system can automatically restore the previous version.

---

## 5. Enhanced Event Log (v2.1)

*File:* `.opencode/artifacts/events.ndjson`

**Goal:** Allow "Playback" of a session and debugging of Agent logic.

**Schema:**

```json
{
  "ts": "2023-10-27T10:00:00Z",
  "artifact": "design/whiteboard.graph.mmd",
  "action": "UPDATE",
  "actor": "agent",           // or "user"
  "reason": "User asked to add Auth flow",
  "tool_call_id": "call_123", // Link to LLM trace
  "size_bytes": 405,
  "hash": "sha256-..."
}

```

---

## 6. Universal Modality Contract

Every modality (Whiteboard, Slides, etc.) must implement this interface.

### 6.1 Read Levels (Progressive Disclosure)

1. **Semantic (Low Cost):** Returns the Logic.
* *Example:* Mermaid code, Markdown text.
* *Used by:* Agent (Reasoning).


2. **Summary (Lowest Cost):** Returns a natural language description.
* *Example:* "A diagram with 3 nodes: Client, Server, DB."
* *Used by:* Agent (Context Window).


3. **Snapshot (Fixed Cost):** Returns a visual render.
* *Example:* PNG image, HTML preview.
* *Used by:* Agent (Verification / Vision).



### 6.2 Write Policy (Debouncing)

* **Canonical State (Logic):** Must be written **Immediately** (Sync). Logic is fragile.
* **Projection State (UI):** Can be **Debounced** (Async). Visuals are robust.

---

## 7. Whiteboard Modality: Implementation Detail

### 7.1 The Two-Layer Model

| Layer | File | Owner | Format |
| --- | --- | --- | --- |
| **Canonical** | `whiteboard.graph.mmd` | Agent | Mermaid.js |
| **Projection** | `whiteboard.excalidraw` | User | Excalidraw JSON |

### 7.2 The "Stable ID" Logic (The Bridge)

**Problem:** Mermaid regenerates the graph -> User's layout is lost.
**Solution:** Use `customData.id` in Excalidraw as the Anchor.

**Algorithm:**

1. **Agent Updates Logic:**
* Agent sends: `A[Login] --> B[DB]`.
* **Bridge:** Parses Mermaid.
* **Bridge:** Loads `whiteboard.excalidraw`.
* **Match:** Finds Excalidraw element where `customData.id == "A"`.
* **Preserve:** Keeps `x`, `y`, `width`, `height` from Excalidraw.
* **Create:** If "B" is new, calculate `x,y` using `dagre` (graph layout lib).
* **Write:** Saves new `whiteboard.excalidraw`.


2. **User Updates Layout:**
* User moves "B".
* **Bridge:** Detects change.
* **Write:** Saves `whiteboard.excalidraw` (Debounced).
* **Sync:** (Optional) If User adds a *new* connection, regenerate the Mermaid file.



### 7.3 Tool Definitions (MCP)

**Tool: `update_whiteboard**`

```json
{
  "name": "update_whiteboard",
  "description": "Updates the diagram logic. Input MUST be valid Mermaid.js.",
  "input_schema": {
    "type": "object",
    "properties": {
      "mermaid_code": { "type": "string" },
      "reason": { "type": "string", "description": "Why this change is being made" }
    }
  }
}

```

---

## 8. Multi-Window Coordination (v2.1 Update)

**Pattern:** "Hub & Spoke" with `BroadcastChannel`.

* **Main Window (Hub):** Runs the `OpenCode Runtime` and `Artifact Store`. It is the **only** writer.
* **Pop-out Window (Spoke):** A "dumb" renderer.
* **Communication:**
* *Pop-out -> Hub:* `channel.postMessage({ type: 'REQUEST_WRITE', data: ... })`
* *Hub -> Pop-out:* `channel.postMessage({ type: 'SYNC_STATE', data: ... })`


* **Benefit:** Zero file locking needed. The Hub serializes all requests.

---

## 9. Implementation Roadmap

### Phase 1: The Spine (Runtime & Store)

1. **Scaffold:** Create the `ArtifactStore` class in the main process.
2. **Queue:** Implement `PQueue` for serializing writes.
3. **History:** Implement the `write_tmp` -> `rename` loop and backup logic.
4. **Logging:** Implement `logEvent` writing to `events.ndjson`.

### Phase 2: The Face (Whiteboard Bridge)

1. **Frontend:** Create `<OpenCodeWhiteboard />` React component.
2. **Parsers:** Install `mermaid` and `@excalidraw/excalidraw`.
3. **Sync Logic:** Implement `mergeMermaidToExcalidraw(mermaid, oldJson)` function.
4. **Integration:** Hook up the component to read/write via the `ArtifactStore`.

### Phase 3: The Brain (MCP Tools)

1. **Server:** Create the `whiteboard-mcp` server.
2. **Tools:** Register `update_whiteboard` and `read_whiteboard`.
3. **Agent:** Update System Prompt to include instructions for using Mermaid.

### Phase 4: Reliability & Polish

1. **Debounce:** Add the debounce timer for the User Drag actions.
2. **Pop-out:** Add the `BroadcastChannel` logic for multi-window.
3. **Visuals:** Add `puppeteer` to auto-generate `whiteboard.snapshot.png` on save.
