---
id: ACTIVE-FEATURE-WHITEBOARD-PLAN
author: oracle_9d3a
status: FINAL
date: 2026-02-11
task_id: whiteboard-active-feature
---

# Implementation Plan: Whiteboard Modality & Multimodal Spine

## Overview
This plan breaks down the implementation into five distinct phases, following the **v2.1 Architecture**. Each phase is designed to be testable in isolation before moving to the next.

---

## Phase 1: The Spine (Runtime Hub Infrastructure)
**Goal:** Build the foundational `ArtifactStore` to manage serialized, atomic file operations.

### Steps:
1.  **Scaffold `ArtifactStore.ts`:**
    *   Implement `PQueue` serialization (Concurrency: 1).
    *   Implement `write` (Atomic) and `writeDebounced` methods.
2.  **History Engine:**
    *   Implement the rolling backup logic (last 20 versions) in `.opencode/artifacts/history/`.
3.  **Audit Logger:**
    *   Implement the NDJSON event appender for `events.ndjson`.
4.  **Internal API:**
    *   Expose an internal HTTP or IPC endpoint for the Hub to receive write requests from the Client and MCP Server.

### Validation (Definition of Done):
*   **Unit Test:** Multiple concurrent calls to `write()` must result in sequential file updates without corruption.
*   **Verify History:** Deleting a file or corrupting it should be recoverable from the `history/` directory.
*   **Verify Log:** `events.ndjson` must correctly show the `actor` (User/Agent) for every write.

---

## Phase 2: The Bridge (Client Reconciliation Logic)
**Goal:** Implement the logic that merges Agent logic (Mermaid) with User layout (Excalidraw).

### Steps:
1.  **Dependency Setup:** Install `mermaid`, `dagre`, and `@excalidraw/excalidraw` in `openspace-client`.
2.  **Mermaid Parser:** Implement `parseMermaidToAST` to extract IDs and labels.
3.  **Reconciliation Logic (`reconcileGraph`):**
    *   Implement the Stable ID mapping.
    *   Integrate `dagre` for auto-layout of new nodes.
4.  **Bridge Hook (`useMermaidBridge`):** Create the React hook that manages the sync lifecycle.

### Validation (Definition of Done):
*   **Unit Test:** Pass a Mermaid string and an existing Excalidraw JSON to `reconcileGraph`. Verify that existing nodes keep their `x, y` while new nodes are positioned via `dagre`.
*   **Consistency Test:** Verify that `customData.id` is correctly preserved across updates.

---

## Phase 3: The Face (Whiteboard UI Component)
**Goal:** Build the isolated Whiteboard UI and integrate it into the OpenSpace Client.

### Steps:
1.  **`WhiteboardFrame.tsx`:**
    *   Embed Excalidraw component.
    *   Add "Send to Agent" button.
2.  **Integration:**
    *   Update `FileTree.tsx` to open the whiteboard frame on file click.
    *   Update `PromptInput.tsx` to support the `/whiteboard` slash command.
3.  **Snapshotting:**
    *   Implement the canvas-to-PNG export logic in the client.

### Validation (Definition of Done):
*   **Manual Test:** Clicking a `.graph.mmd` file in the sidebar opens the whiteboard.
*   **Snapshot Test:** Saving a whiteboard generates a valid `.png` in the `design/` folder.
*   **UI Test:** Dragging a node in the UI triggers a debounced write to the `.excalidraw` file.

---

## Phase 4: The Brain (MCP Server & Agent Interaction)
**Goal:** Connect the Agent to the whiteboard via the MCP protocol.

### Steps:
1.  **MCP Server Scaffold:** Build the standalone `whiteboard-mcp` process.
2.  **Tool Implementation:**
    *   `read_whiteboard`: Returns semantic Mermaid or summary.
    *   `update_whiteboard`: Validates Mermaid and calls Runtime Hub API.
3.  **Agent System Prompt:** Update the Agent's instructions to use the new tools.

### Validation (Definition of Done):
*   **MCP Test:** Run `whiteboard-mcp` and call `update_whiteboard` via a test client. Verify the file is updated on disk.
*   **Agent Test:** Ask the Agent: "Update the whiteboard to add a 'Cache' node connected to 'Database'". Verify the Agent calls the tool and the UI reflects the change.

---

## Phase 5: Reliability & Polish
**Goal:** Harden the system and ensure cross-window synchronization.

### Steps:
1.  **Multi-Window Sync:** Implement `BroadcastChannel` to sync state across pop-out windows.
2.  **Error Boundaries:** Add robust error handling for Mermaid syntax errors in the UI.
3.  **Performance Tuning:** Optimize the `dagre` layout for large graphs.

### Validation (Definition of Done):
*   **E2E Test:** Open two windows with the same whiteboard. Update one and verify the other reflects the change immediately.
*   **Stress Test:** Rapidly drag nodes while the Agent is simultaneously updating the logic. Verify no state is lost.
