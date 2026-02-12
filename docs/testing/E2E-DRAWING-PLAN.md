# E2E Test Plan: Drawing V2 Modality

## Overview
This plan outlines the E2E testing strategy for the Drawing V2 modality (tldraw-based). The goal is to ensure core functionality, persistence, and live-sync capabilities are working as expected and to prevent regressions in existing features.

## Test Environment
- **Framework:** Playwright
- **Location:** `openspace-client/e2e/drawing.spec.ts`
- **Configuration:** `openspace-client/e2e/playwright.config.ts`
- **Data:** Uses `.diagram.json` files as the canonical format.

## Test Scenarios

### 1. Initial Loading (Hydration)
- **ID:** DRAW-001
- **Goal:** Verify that existing diagram files are correctly rendered.
- **Steps:**
    1. Seed a project with a pre-defined `test.diagram.json`.
    2. Navigate to the drawing modality for that file.
    3. Verify that the tldraw canvas contains the expected number of shapes.
    4. Verify specific attributes (e.g., a node with text "Hello World").

### 2. User Edit Persistence (Auto-save)
- **ID:** DRAW-002
- **Goal:** Verify that UI changes are persisted to the filesystem.
- **Steps:**
    1. Open a blank or existing diagram.
    2. Use Playwright to simulate drawing a shape (e.g., a rectangle or note).
    3. Wait for the debounced auto-save (via `useArtifact`).
    4. Read the file from the filesystem (via SDK or direct FS check in test).
    5. Verify the new shape exists in the JSON data.

### 3. Live Sync (Agent-to-UI)
- **ID:** DRAW-003
- **Goal:** Verify that external changes are reflected in the UI via SSE.
- **Steps:**
    1. Open a diagram in the browser.
    2. Programmatically modify the `.diagram.json` file (simulating an agent patch).
    3. Verify that the tldraw canvas updates the shape (e.g., position change) without a reload.

### 4. Binding & Edge Stability
- **ID:** DRAW-004
- **Goal:** Ensure arrows and bindings remain stable during movements.
- **Steps:**
    1. Load a diagram with two nodes and a connecting arrow.
    2. Move one node via the UI.
    3. Verify the arrow remains attached.
    4. Verify the `bindings` and `edges` (if applicable in mapper) are correctly updated in the persisted file.

### 5. Regression: Component Coexistence
- **ID:** DRAW-005
- **Goal:** Ensure drawing modality doesn't break other UI parts.
- **Steps:**
    1. Open drawing modality.
    2. Toggle the File Tree and select a different file.
    3. Execute a command in the Terminal.
    4. Verify both File Tree and Terminal respond correctly.
    5. Return to drawing and verify it is still responsive.

## Implementation Details
- **Mocking:** Avoid mocking the Hub/API. Use the real backend as per NSO standards.
- **Selectors:** Use `data-testid` where possible, or tldraw-specific class names.
- **Persistence:** Use the `seedProject` fixture to set up test files.

## Traceability
| Requirement ID | Test Scenario ID | Status |
|----------------|------------------|--------|
| REQ-DRAW-001   | DRAW-001         | Pending|
| REQ-DRAW-002   | DRAW-002         | Pending|
| REQ-DRAW-003   | DRAW-003         | Pending|
| REQ-DRAW-004   | DRAW-004         | Pending|
| REQ-REGR-001   | DRAW-005         | Pending|
