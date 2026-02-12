# REQ-DRAWING-FIX: Structured Drawing Modality Patches

## 1. Objective
Enable structured, incremental updates to drawing artifacts (canonical `.diagram.json` files) via the Hub and Model Context Protocol (MCP). This allows agents to modify diagrams precisely (e.g., "add a node") rather than replacing the entire file content.

## 2. Context & Problem Statement
The current implementation of the drawing modality relies on a full-file replacement (`replace_content`) operation in the Hub's `PatchEngine`. While this works for the Client (which has the full state), it is inefficient and error-prone for AI agents using the MCP tools. The MCP tools for drawing are currently stubs and do not perform any structured validation or transformation.

## 3. Requirements

### 3.1. Hub Structured Patch Support
- **Engine Extension**: `PatchEngine.ts` must be extended to support an array of `IOperation` (as defined in `IDrawing.ts`) for files with the `.diagram.json` extension.
- **Reduction Logic**: Implement a reducer-style function that takes the current `IDiagram` state and an `IOperation` and returns the updated `IDiagram` state.
- **Operation Coverage**:
    - `addNode`: Add a new node to the `nodes` array.
    - `updateNode`: Apply a partial update to an existing node by ID.
    - `removeNode`: Remove a node and any connected edges.
    - `addEdge`: Add a new edge to the `edges` array.
    - `updateEdge`: Apply a partial update to an existing edge by ID.
    - `removeEdge`: Remove an edge by ID.
    - `updateNodeLabel`: Shortcut for updating a node's label.
    - `updateNodeLayout`: Shortcut for updating a node's layout (x, y, w, h).
- **Validation**:
    - Ensure IDs are unique when adding.
    - Ensure referenced nodes exist when adding/updating edges.
    - Gracefully handle (or error on) missing IDs during updates/removals.

### 3.2. MCP Tool Implementation
- **`drawing.inspect_scene`**: 
    - Should return a structured view of the active drawing.
    - Optional: Filter or summarize the output if the diagram is very large.
- **`drawing.propose_patch`**:
    - Validate that the input `patch` conforms to the `IOperation[]` structure.
    - Store the patch with a unique ID for later application.
- **`drawing.apply_patch`**:
    - Bridge to the Hub's patch endpoint using the structured `ops` format.
    - Handle 409 Conflict errors by reporting the current version back to the agent.

### 3.3. Integration & Tracking
- **Schema Alignment**: Ensure `runtime-hub` and `openspace-client` use the exact same `IDrawing.ts` interface.
- **Persistence**: Ensure that the Hub correctly serializes the updated `IDiagram` back to the file system after applying patches.

## 4. Success Criteria
- An agent can call `drawing.propose_patch` with an `addNode` operation.
- Calling `drawing.apply_patch` results in the node appearing in the `.diagram.json` file.
- The OpenSpace Client correctly reflects the new node in the Tldraw whiteboard UI via the existing `useArtifact` sync mechanism.
- Attempting to update a non-existent node returns a clear validation error from the Hub.

## 5. Non-Functional Requirements
- **Performance**: Patch application should be fast (< 100ms) for diagrams with up to 1000 nodes.
- **Robustness**: The Hub must not crash on malformed patches; it must return a `ValidationErrorEnvelope`.
