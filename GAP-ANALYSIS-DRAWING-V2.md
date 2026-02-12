# Gap Analysis: Drawing Modality V2

## 1. Requirements Coverage
Based on `TECHSPEC-MODALITY-PLATFORM-V2.md` and inferred Drawing V2 requirements.

### ✅ Covered
*   **Canonical Model:** Fully implemented (`IDiagram` interface with Nodes/Edges).
*   **Bidirectional Sync:**
    *   Agent -> File: Works (JSON updates propagate to UI).
    *   User -> File: Works (UI drawing saves to JSON).
*   **Primitive Support:**
    *   Basic Shapes (Rect, Circle, Cloud, Heart, etc.).
    *   Arrows/Bindings (Fixed crash issue).
    *   Freeform Drawing (`draw` tool).
    *   Text & Notes (`text` vs `richText` issue resolved).
    *   Images.
*   **Validation:** Robust error handling added to prevent crashes on schema mismatches.
*   **Context Contract:** `whiteboard.read` / `whiteboard.update` tools are active.

### ⚠️ Partially Covered
*   **UML Support:**
    *   *Status:* "Generic" support. We can draw boxes and lines that *look* like UML.
    *   *Gap:* No specific semantic shapes for "Class", "Interface", "Actor" (e.g., a Class box with method compartments). Users must manually construct these using primitives.
*   **Validation Contract:**
    *   *Status:* Runtime validation exists (tldraw internal + our try/catch).
    *   *Gap:* No pre-apply validation in the API layer as required by `Section 4.2`. Bad patches are applied to the file, then rejected by the UI.

### ❌ Missing / Not Implemented
*   **Groups:** `groups` array in JSON is always empty. Grouping shapes in UI is not persisted/mapped.
*   **Constraints:** `constraints` array is empty.
*   **Multi-user Cursors:** No implementation for shared presence (though architecture allows it).
*   **Auto-Layout:** No tool/capability for the agent to "clean up" the layout automatically.

## 2. Testing Status
*   **Unit Tests:** 0% (Missing `tldrawMapper.test.ts`).
*   **Integration Tests:** 0% (Manual verification only).
*   **E2E Tests:** 0% (Manual verification only).
*   **Risk:** High regression risk for schema mapping logic.

## 3. Supported Diagram Types
Currently supporting **"Generic Whiteboard"** mode.
*   **Standard Diagrams:** Flowcharts, Block Diagrams, Mind Maps (manual).
*   **UML:** Supported only as visual primitives (boxes + arrows), not as structured semantic models.

## 4. Recommendations
1.  **Prioritize Tests:** Add unit tests for `tldrawMapper` immediately to lock in the schema fixes.
2.  **Implement Groups:** Complete the mapping for `groups` to allow moving complex structures together.
3.  **UML Shapes:** Create specific custom shapes for UML elements if "Semantic UML" is a hard requirement.
