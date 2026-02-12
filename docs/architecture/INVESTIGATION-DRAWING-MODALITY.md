# Investigation Report: Drawing Modality Implementation

**Date:** 2026-02-12
**Agent:** analyst_2f12
**Status:** COMPLETE

## 1. Executive Summary
The drawing modality implementation successfully maps between a canonical `IDiagram` model and the `tldraw` library in the frontend. However, the Hub-side patch application logic is limited to full-file replacements, and the MCP tools for drawings are currently non-functional stubs. This report details the gaps and proposes a path to enabling structured, incremental updates.

## 2. Findings

### 2.1. Hub Patching Mechanism (`PatchEngine.ts`)
- **Current Limitation**: The `PatchEngine` only accepts `replace_content` operations. It lacks the logic to parse, modify, and re-serialize structured JSON data.
- **Contract Mismatch**: `IDrawing.ts` defines an `IOperation` discriminated union, but these operations are not handled by the Hub.
- **Recommendation**: Implement a `DiagramReducer` class in the Hub that can apply `IOperation` patches to an `IDiagram` object.

### 2.2. MCP Tool Implementation (`modality-mcp.ts`)
- **Stub State**: `drawing.inspect_scene`, `drawing.propose_patch`, and `drawing.apply_patch` are stubs that do not perform validation or effectively communicate with the Hub for structured updates.
- **Workflow Gap**: There is no validation layer in the MCP server to ensure agents are proposing valid `IOperation` objects.
- **Recommendation**: Implement tool handlers that use the `IDrawing.ts` interfaces for validation and update `apply_patch` to use the Hub's new structured patching capability.

### 2.3. Git Tracking & Environment
- **Tracking Status**: `runtime-hub/src/interfaces/IDrawing.ts` and its client-side counterpart are both correctly tracked by Git.
- **Duplication**: The interface is currently duplicated across `runtime-hub` and `openspace-client`. 
- **Recommendation**: While duplication works for now, consider moving shared interfaces to a common package if more modalities are added.

### 2.4. Client-Side Consistency
- **Sync Mechanism**: The client uses `useArtifact` to sync the entire `IDiagram` state. This is robust but will receive full-file updates even when the Hub applies small patches.
- **Tldraw Integration**: `TldrawWhiteboard.tsx` correctly handles remote updates by diffing and updating shapes/bindings. No major changes are required on the client side to support Hub-side patches.

## 3. Proposed Implementation Path

### Phase 1: Hub Logic (Builder)
1. Import `IDrawing.ts` into `PatchEngine.ts`.
2. Implement `applyDiagramPatch(diagram: IDiagram, ops: IOperation[]): IDiagram`.
3. Update `PatchEngine.apply()` to detect `.diagram.json` files and use the new logic.

### Phase 2: MCP Bridge (Builder)
1. Update `modality-mcp.ts` to include `IDrawing.ts` types.
2. Implement validation in `drawing.propose_patch`.
3. Ensure `drawing.apply_patch` correctly forwards the `ops` array to the Hub.

### Phase 3: Verification (Janitor)
1. Create a test script that uses the MCP tools to add a node to a blank diagram.
2. Verify that the `.diagram.json` file is updated correctly.
3. Verify that the OpenSpace Client renders the new node.

## 4. References
- `docs/requirements/REQ-DRAWING-FIX.md`
- `runtime-hub/src/interfaces/IDrawing.ts`
- `runtime-hub/src/services/PatchEngine.ts`
