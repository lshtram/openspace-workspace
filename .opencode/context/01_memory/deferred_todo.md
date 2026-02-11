---
id: DEFERRED-WHITEBOARD-TODO
author: oracle_9d3a
status: FINAL
date: 2026-02-11
task_id: deferred-whiteboard
---

# Deferred Whiteboard Modality Tasks

This file tracks complex, non-critical, or "luxury" tasks for the Whiteboard ↔ Mermaid polymorphic bridge. 
**Note:** This file is for reference only and should NOT be loaded into active context unless specifically requested.

## 1. Multi-Diagram Feature Completion

### 1.1. Class Diagrams (⏸ DEFERRED)
*   **Status**: Logical infrastructure (Parser/Serializer/Layout) is 100% complete. Visual rendering is unstable.
*   **Tasks**:
    *   [ ] **Composite Component Stability**: Fix the issue where grouped class boxes (Container + 2 Separators + 3 Text areas) lose alignment or visibility after manual user resizing.
    *   [ ] **Section Header Labels**: Add "Attributes" and "Methods" labels to the segments (optional but improves clarity).
    *   [ ] **Member Modifiers**: Add visual hints for `static` (underlined) and `abstract` (italicized) members.

### 1.2. State Diagrams (🏗 FOUNDATION IN PLACE)
*   **Tasks**:
    *   [ ] **Specialized Shapes**: Implement rendering for `[*] ` as a filled circle (Start/End) and `choice` states as diamonds.
    *   [ ] **Composite Transitions**: Handle transitions that have multiple points to avoid overlapping state labels.

### 1.3. ER Diagrams (🏗 FOUNDATION IN PLACE)
*   **Tasks**:
    *   [ ] **Crow's Foot Arrows**: Implement specific Excalidraw arrow types for ER relationships (e.g., `||--o{` , `}|--||`).
    *   [ ] **Entity Sizing**: Reuse Class Diagram "Split-Box" logic but optimized for Entity/Attribute only.

### 1.4. C4 Models (🏗 FALLBACK IN PLACE)
*   **Tasks**:
    *   [ ] **C4 Specific Parser**: Handle specialized Mermaid-C4 syntax like `System_Boundary`, `Container`, and `Person`.
    *   [ ] **Themed Boxes**: Implement specific colors and rounded corners for C4 elements (People = blue, Systems = gray).

### 1.5. Gantt & Mindmaps (🏗 STUBS IN PLACE)
*   **Tasks**:
    *   [ ] **Gantt Layout**: Implement a horizontal timeline layout strategy.
    *   [ ] **Mindmap Layout**: Implement a radial/tree layout strategy (expanding from center).

---

## 2. Infrastructure & Reliability

### 2.3. Whiteboard Runtime Regressions (NEW - 2026-02-11)
*   **Tasks**:
    *   [x] **Post-SSE Draw Regression**: Fixed in `WhiteboardFrame` by suppressing synthetic `onChange` after agent-driven scene apply.
    *   [x] **PNG Persistence Gap**: Fixed in Send-to-Agent flow by persisting PNG via Hub file API under `design/*.png` before agent prompt.
*   **Closure Evidence**:
    *   Targeted tests pass in `WhiteboardFrame.test.tsx`.
    *   Independent validation pass recorded by Janitor.

### 2.1. Vision-First Type Deduction (🏗 PROTOCOL DEFINED)
*   **Tasks**:
    *   [ ] **Vision Bridge**: Create a utility that automatically takes a canvas screenshot and sends it to the agent with the prompt: "Identify the diagram type and logical topology."
    *   [ ] **Confidence Thresholding**: If vision is unsure, prompt the user to select the type manually.

### 2.2. The "Luxury" Test Suite
*   **Tasks**:
    *   [ ] **Round-trip Stress Test**: A script that generates 10 complex diagrams of each type, renders them, parses them back, and verifies Mermaid equality.
    *   [ ] **Style Preservation Audit**: Verify that manual user styling (e.g., changing a box to "Red" and "Dashed") survives 5 consecutive logical updates by the agent.

---

## 3. Collaboration & Conflict Management (⏸ DEFERRED - P2)

### 3.1. Yjs Real-Time Collaboration (Only if multi-user needed)

**Current:** BroadcastChannel for multi-tab sync (same user)
**Future:** Yjs CRDT for multi-user real-time collaboration

**Tasks:**
*   [ ] **WebSocket Provider**: Set up Yjs WebSocket sync server
*   [ ] **CRDT Integration**: Map diagram.json operations to Yjs shared types
*   [ ] **Awareness Channel**: Show presence indicators for multiple users
*   [ ] **Conflict Resolution**: Handle concurrent edits from multiple users

**Trigger:** Multiple users need to edit same diagram simultaneously

**Estimate:** 2-3 weeks implementation + 1 week testing

---

## 4. Write Conflict Management (⏸ DEFERRED - P2)

**Current:** Optimistic last-write-wins (agent and user edits)
**Future Options:**
1. **Optimistic Locking:** ETags with version checks
2. **Conflict Detection:** Warn user if agent modified file they're editing
3. **Merge Strategy:** Operation-level merge (scene graph makes this easier than DSL merge)

**Tasks:**
*   [ ] **Version Tracking**: Add version number to diagram.json
*   [ ] **ETag Implementation**: Hub returns version, client sends version on write
*   [ ] **Conflict UI**: Show user when agent edit conflicts with their work
*   [ ] **Merge Preview**: Let user choose which edits to keep

**Trigger:** User reports data loss from concurrent agent/user edits

**Estimate:** 1 week for optimistic locking, 2 weeks for merge UI

---

## 5. Completed Architecture (For Reference)
*   ✅ **Polymorphic Foundation**: `LayoutStrategy` and `Parser/Serializer` dispatchers are fully implemented.
*   ✅ **Sequence Diagrams**: Full support for participants, lifelines, and horizontal message proximity.
*   ✅ **Zero-Conf MCP**: MCP tools now automatically identify the "Active Whiteboard" without user input.
*   ✅ **UI Type-Awareness**: The React UI correctly detects and persists the `diagramType`.
