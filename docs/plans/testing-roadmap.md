# OpenSpace Client: Test Strategy & Roadmap

## Executive Summary
After the completion of the baseline testing phase, the OpenSpace client has reached **63.95% line coverage** with a stable suite of **231 unit/integration tests**. While the core UI and state logic are well-covered, several high-complexity areas remain at 0% coverage, and the application lacks End-to-End (E2E) validation.

The next phases will transition from **"Testing Components"** to **"Testing Workflows,"** ensuring that the integration between the frontend, the backend server, and the AI agents is seamless.

---

## Phase 3: Unit & Integration Hardening (Target: 75%+)
The goal of this phase is to eliminate the remaining coverage gaps in complex logic modules.

### 1. Terminal & Shell Integration (`0% Coverage`)
*   **Challenge**: `xterm.js` requires a real DOM and layout measurements.
*   **Strategy**: 
    *   **Headless Terminal Testing**: Use `xterm-addon-serialize` to verify the buffer state without rendering.
    *   **Hook Logic**: Test `useTerminal.ts` by mocking the WebSocket implementation to ensure commands sent from the UI reach the "socket" and incoming data updates the state.

### 2. Streaming & Event Logic (`42% Coverage`)
*   **Recommendation**: Expand `useSessionEvents.test.tsx` to include:
    *   **Text Deltas**: Simulate chunks of text arriving (streaming) to verify the UI appends correctly.
    *   **Tool State Transitions**: Verify the transition from `pending` -> `running` -> `completed` for tool parts.
    *   **Error Boundaries**: Intentionally send malformed SSE events to ensure client resilience.

### 3. Provider Configuration (`0% Coverage`)
*   **Recommendation**: Create tests for `DialogConnectProvider.tsx`.
    *   Test form validation for different API key formats.
    *   Verify "Connecting" states are shown correctly while waiting for backend validation.

---

## Phase 4: E2E Testing Foundations (Playwright)
E2E testing is critical for OpenSpace because features like the FileTree and Terminal rely on the actual filesystem and backend process.

### Priority 1: The "First Run" Experience
*   **Test Case**: New User Project Setup.
*   **Steps**: Open app -> Click "Add Project" -> Select directory -> Verify files appear in the sidebar.
*   **Validation**: Check that `localStorage` is updated and the "Workspace" header shows the correct folder name.

### Priority 2: AI Agent Interaction Loop
*   **Test Case**: Successful Chat & Tool Call.
*   **Steps**: Select model -> Type "list files" -> Observe "Thinking" state -> Verify "bash: ls" tool call appears -> Verify text output.
*   **Validation**: Tests the full circuit: **React -> SSE -> Backend -> LLM -> Backend -> SSE -> React.**

### Priority 3: Session Persistence
*   **Test Case**: Session Switching.
*   **Steps**: Create Session A -> Type message -> Create Session B -> Switch back to A.
*   **Validation**: Ensure the message history for Session A is correctly re-hydrated.

---

## Phase 5: Advanced E2E & Reliability
### 1. Terminal Realism
*   **Scenario**: Run a long-running command (e.g., `npm install`) and verify progress updates in the real terminal window.

### 2. Network Resilience (Heartbeat)
*   **Scenario**: Disconnect the backend server while the app is open.
*   **Validation**: Verify `StatusPopover` turns red (Offline) and a reconnection guard appears.

### 3. Visual Regression Testing
*   **Recommendation**: Use Playwright's `screenshot` comparison to ensure complex UI elements (StepsFlow, code blocks) maintain layout integrity.

---

## Summary of Recommendations

| Category | Action Item | Impact |
| :--- | :--- | :--- |
| **Unit** | Mock WebSocket for `useTerminal` | Covers 0% shell logic |
| **Unit** | State-machine tests for `useSessionEvents` | Ensures stable AI streaming |
| **E2E** | Automate "Add Project" flow | Validates core app utility |
| **E2E** | Mock LLM responses in E2E | Allows cost-effective workflow testing |
| **Tooling** | Integrate `check` into Git Hooks | Prevents regression before commits |
