# Whiteboard Modality: Demo & Usage Guide

This guide walks you through the end-to-end usage of the new Whiteboard Modality, from spinning up the system to Agent collaboration.

## 1. Starting the System

To use the full multimodal stack, you need to run three components:
1.  **Runtime Hub (The Spine):** Manages file I/O and artifact history.
2.  **OpenSpace Client (The Face):** The React UI.
3.  **Whiteboard MCP (The Brain):** Connects the Agent to the system.

### Step-by-Step Launch
1.  **Start Runtime Hub + MCP:**
    Open a terminal and run:
    ```bash
    cd runtime-hub
    npm run start:hub       # Starts Hub API on port 3001
    npm run start:whiteboard # Starts MCP Server (via stdio)
    ```

2.  **Start Client UI:**
    Open a second terminal and run:
    ```bash
    cd openspace-client
    npm run dev
    ```
    Access the UI at `http://localhost:5173`.

---

## 2. User Stories (How to Test)

### Scenario A: Creating a Whiteboard
1.  **Slash Command:** In the chat input, type `/whiteboard SystemArchitecture`.
2.  **Result:** A new tab/panel opens with an empty Excalidraw canvas.
3.  **File Tree:** Check the sidebar. You should see `design/SystemArchitecture.excalidraw` and `design/SystemArchitecture.graph.mmd`.

### Scenario B: Drawing & Saving
1.  **Draw:** Drag a "Rectangle" from the toolbar and label it "Client".
2.  **Debounce:** Wait 500ms.
3.  **Verify:** Check your filesystem. `design/SystemArchitecture.excalidraw` should be updated. A `design/SystemArchitecture.snapshot.png` should also appear.

### Scenario C: Agent Collaboration (The "Magic" Part)
1.  **User Handoff:** Click the **"Send to Agent"** button in the whiteboard toolbar.
2.  **Prompt:** The chat input fills with: "I've updated the whiteboard: [Mermaid Code] [Snapshot]".
3.  **Instruction:** Add to the message: "Please add a 'Server' node connected to 'Client'".
4.  **Agent Action:** The Agent (using `update_whiteboard` tool) will modify the `.graph.mmd` file.
5.  **Reconciliation:** Watch the whiteboard. A new "Server" node should appear automatically, connected to your "Client" node. Your "Client" node should stay exactly where you put it (Stable ID).

### Scenario D: Multi-Window Sync
1.  **Duplicate:** Open `http://localhost:5173` in a second browser window.
2.  **Navigate:** Open the same whiteboard in both windows.
3.  **Draw:** Draw a circle in Window A.
4.  **Sync:** Verify it appears instantly in Window B (via BroadcastChannel).

---

## 3. Troubleshooting

*   **"ArtifactStore Write Failed"**: Ensure `npm run start:hub` is running on port 3001.
*   **"Invalid Syntax"**: If the Agent generates bad Mermaid, the UI will show a toast notification. Check the browser console for details.
*   **Mermaid not rendering**: Ensure you are using valid flowchart syntax (e.g., `graph TD`).
