# REQ-WHITEBOARD: Whiteboard Modality Implementation

## Status: APPROVED
**Mandatory Guideline:** 
ALL MODALITY COMPONENTS MUST BE DECOUPLED, MODULAR, AND DESIGNED TO SURVIVE MAJOR CLIENT-SIDE REFACTORS. MODALITIES ARE PLUGGABLE EXTENSIONS TO THE MULTIMODAL SPINE.

## 1. Vision & Intent
The goal is to transform OpenSpace into a comprehensive multimodal environment. The **Whiteboard Modality** is the first implementation, serving as the blueprint for future modalities (Code Annotations, Presentations, Voice, etc.). 

The system relies on a "Strong Spine" (Artifact Store + Write Queue) that manages serialized, atomic writes to the filesystem, ensuring data integrity across multiple actors (User and AI).

## 2. User Stories

### US.1: User-Initiated Creation
As a user, I want to generate a new whiteboard artifact by choosing the whiteboard modality from a creation menu, so that I can start a fresh visual thinking session.

### US.2: Opening Existing Artifacts
As a user, I want to open an existing whiteboard artifact (`.graph.mmd` or `.excalidraw`) from the file tree, which should trigger the whiteboard modality frame to display the correct state.

### US.3: Agent-Initiated Interaction
As a user, I want the Agent to be able to suggest or initiate a whiteboard session. The Agent will request approval to create or update an artifact, and once approved, it will write to the whiteboard logic.

### US.4: Collaborative Interaction
As a user, I want a shared frame where both I and the Agent can communicate visually. I can adjust layouts, and the Agent can update logic (Mermaid), with both changes reflecting in the shared state.

## 3. High-Level Functional Requirements

### 3.1 The Spine (Core Infrastructure)
* **REQ-CORE-01: Universal Artifact Store:** Implement a central module to manage file lifecycle for **ANY** multimodal artifact (whiteboards, documents, slides, voice recordings, etc.). It must be modality-agnostic.
* **REQ-CORE-02: In-Memory Write Queue:** Serialize all write operations to the filesystem to prevent race conditions across all artifact types.
* **REQ-CORE-03: Multi-Actor Support:** Handle writes from both the Client UI (User) and the MCP Server (Agent) via a central "Gatekeeper".
* **REQ-CORE-04: Debouncing:** Support "Debounced Writes" for Projection/UI updates (e.g., 500ms delay for node dragging) while keeping Canonical/Logic updates immediate.
* **REQ-CORE-05: Safety Net:** Implement a "Rolling History" (last 20 versions) for artifacts to enable corruption recovery in `.opencode/artifacts/history/`.
* **REQ-CORE-06: Auditing:** Append all write events to `.opencode/artifacts/events.ndjson` including timestamp, actor, and tool_call_id.

### 3.2 The Whiteboard Modality
* **REQ-WB-01: Modality Frame:** A dedicated UI container in `openspace-client` that renders the whiteboard. It should be implemented as a pluggable component that can be displayed in a sidebar or a main panel.
* **REQ-WB-02: Two-Layer Sync:** 
    * **Canonical Layer:** Mermaid.js logic (editable by Agent).
    * **Projection Layer:** Excalidraw UI state (editable by User).
* **REQ-WB-03: Layout Bridge:** Maintain position/layout state (using Stable IDs) even when the Agent updates the underlying logic.
* **REQ-WB-04: Client-Side Snapshotting:** The Client UI is responsible for generating the `.png` snapshot. Since the DOM exists in the Client, it must export the canvas to a Blob and send it to the Artifact Store during debounced saves. Rationale: Avoids spinning up a heavy Puppeteer instance on the backend.
* **REQ-WB-05: File Tree Integration:** Clicking a `.graph.mmd` or `.excalidraw` file in the file tree must open the Modality Frame and load the artifact.
* **REQ-WB-06: Command Initiation:** Users can create a new whiteboard via a slash command (e.g., `/whiteboard [name]`) in the prompt input.

### 3.4 Interaction Loop (User-Agent Handoff)
* **REQ-INT-01: User-to-Agent Handoff:** When a user finishes drawing, they can trigger the Agent's reasoning by clicking a "Send to Agent" button or via a specific text prompt. This translates the visual state to Mermaid and sends it to the Agent context.
* **REQ-INT-02: Agent-to-User Feedback:** The Agent updates the whiteboard via the MCP server. The Client must detect this change (via SSE or polling) and update the UI immediately using the Reconciliation Logic.
* **REQ-INT-03: Modular Frame:** The whiteboard frame must be a self-contained component that communicates with the rest of the client only via standardized events/props to maintain decoupling.

### 3.3 Communication (MCP)
* **REQ-COM-01: Whiteboard MCP Server:** A standalone MCP server that allows the Agent to:
    * `read_whiteboard`: Get the current semantic or visual state.
    * `update_whiteboard`: Propose changes to the Mermaid logic.
* **REQ-COM-02: Permission Flow:** Ensure the Agent cannot write to the filesystem without user approval.

## 4. Constraints & Principles
* **Filesystem-Centric:** All state must reside in the project directory (e.g., `design/whiteboard.excalidraw`).
* **Modularity:** The Whiteboard component must be decoupled from the core chat/terminal logic.
* **Stable IDs:** Use `customData.id` in Excalidraw to anchor Mermaid nodes.

## 5. Success Metrics
* A user can open a `.graph.mmd` file and see a rendered Excalidraw diagram.
* An Agent can successfully update a node name in the Mermaid code, and the Excalidraw UI reflects the change while preserving the user's manual positioning.
