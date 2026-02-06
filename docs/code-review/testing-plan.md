# Testing Plan for OpenSpace Client Port

**Objective:** Validate that the React port (`openspace-client`) achieves functional parity with the original SolidJS implementation (`opencode-web`) for the in-scope features: **Chat Interface**, **Input**, **Status/Connection**, and **Providers/Auth**.

**Methodology:**
We will mirror the existing Playwright E2E test suite from `opencode/packages/app/e2e/`. This approach ensures we are testing against the exact same behavior expectations as the original app. Since unit test coverage is low in the original codebase, E2E parity is the primary success metric.

**Tools:** Playwright (already installed in `opencode` workspace, we will configure it for `openspace-client`).

---

## 1. Test Environment Setup

We need to configure Playwright for `openspace-client` similar to `opencode`.

**Steps:**
1.  Initialize Playwright in `openspace-client` (or reuse workspace config if possible, but separate config is safer for porting).
2.  Port the `fixtures.ts`, `actions.ts`, `selectors.ts`, and `utils.ts` helpers from `opencode/packages/app/e2e/` to `openspace-client/e2e/`.
    *   *Note:* Selectors might need adjustment if class names or data attributes differ in the React port (we should aim to keep `data-*` attributes consistent).

## 2. Test Scenarios (In-Scope)

The following tests will be prioritized. I have selected specific test files from the original suite that map to our current feature set.

### A. Chat & Input (`e2e/prompt/prompt.spec.ts`)
*Focus: Core interaction loop.*

*   **TC-01: Send Prompt & Receive Reply**
    *   *Action:* User types message, presses Enter.
    *   *Expectation:* URL updates with session ID. Agent reply appears. Reply content matches expectations (echo token).
    *   *Source:* `prompt.spec.ts` ("can send a prompt and receive a reply")

### B. Session Management (`e2e/session/session.spec.ts`)
*Focus: Lifecycle of a chat session.*

*   **TC-02: Rename Session**
    *   *Action:* Open session menu -> Rename -> Input new title.
    *   *Expectation:* Header title updates.
    *   *Source:* `session.spec.ts` ("session can be renamed via header menu")
*   **TC-03: Delete Session**
    *   *Action:* Open session menu -> Delete -> Confirm.
    *   *Expectation:* Redirected to home/new session. Session removed from sidebar.
    *   *Source:* `session.spec.ts` ("session can be deleted via header menu")

### C. Status & Connection (`e2e/status/status-popover.spec.ts`)
*Focus: Server health and capability monitoring.*

*   **TC-04: Status Popover Tabs**
    *   *Action:* Click status indicator.
    *   *Expectation:* Popover opens. Tabs for "Servers", "MCP", "LSP", "Plugins" are visible.
    *   *Source:* `status-popover.spec.ts` ("status popover opens and shows tabs")
*   **TC-05: Server Status**
    *   *Action:* Open "Servers" tab.
    *   *Expectation:* Current server is listed and selected.
    *   *Source:* `status-popover.spec.ts` ("status popover servers tab shows current server")

### D. Model Selection (`e2e/models/model-picker.spec.ts`)
*Focus: Switching AI models.*

*   **TC-06: Change Model**
    *   *Action:* Open model selector -> Pick new model.
    *   *Expectation:* Prompt input footer updates to show new model name.
    *   *Source:* `model-picker.spec.ts` ("smoke model selection updates prompt footer")

## 3. Excluded Scenarios (For Now)
*   **File Tree & Operations:** `e2e/files/*` (Tree View, File View, Diffs are out of scope for this phase).
*   **Terminal:** `e2e/terminal/*` (Terminal is implemented but we are focusing on Chat/Status first).
*   **Settings:** `e2e/settings/*` (Unless critical for connection).

## 4. Implementation Plan

1.  **Scaffold E2E Folder:** Create `openspace-client/e2e/` structure.
2.  **Port Helpers:** Copy and adapt `fixtures.ts`, `actions.ts`, etc.
3.  **Port Test Files:** Copy the selected spec files above.
4.  **Run & Debug:** Run tests against the `openspace-client` dev server.
    *   *Expect Failures:* Initial runs will fail because features like "Status Popover" and "Session Menu" are not implemented yet. This confirms our "gap analysis" is correct.

This plan gives us a clear "Definition of Done" for the features: **When the ported E2E tests pass, the React port matches the original.**
