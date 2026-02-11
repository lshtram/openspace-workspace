# Code Review: OpenSpace Client Port (Strict)
**Date:** 2026-02-05  
**Reviewer:** Antigravity

The port to `openspace-client` has successfully established the basic UI structure and React component hierarchy, but it fails to utilize modern React patterns and the installed dependencies effectively, resulting in fragile and difficult-to-maintain state management logic.

### 1. Critical: Misuse of Dependencies & State Management
You have `@tanstack/react-query` installed in `package.json`, but you are not using it. Instead, you are relying on "old-school" manual data fetching using `useEffect` and `useState`.
-   **Problem**: In `AgentConsole.tsx`, you have 11 separate `useState` hooks and multiple `useEffect` chains to manage data loading (`loadProviders`, `loadAgents`). This introduces race conditions (no cancellation logic), requires manual loading states (`sending`, `checking`), and makes the component unnecessarily complex.
-   **Problem**: In `App.tsx`, you implemented a manual polling mechanism using `setTimeout` for connection checking.
-   **Fix**: Replace manual fetching with `useQuery` hooks. This handles caching, loading states, and polling (refetchInterval) automatically.
    -   *Example*: `const { data: agents } = useQuery({ queryKey: ['agents'], queryFn: () => openCodeService.client.app.agents(...) })`

### 2. Architecture: "God Component" Pattern
`AgentConsole.tsx` (316 lines) violates the Single Responsibility Principle. It currently handles:
1.  API Interaction (fetching agents, models, sessions)
2.  WebSocket/SSE Event Handling (merging message deltas)
3.  Local State Management (attachments, prompts)
4.  UI Rendering
-   **Fix**: Extract logic into custom hooks. The `src/hooks` directory is currently empty.
    -   `useChatSession(sessionId)`: Handles message list and SSE subscriptions.
    -   `useAgentList()`: Handles fetching agents.
    -   `useModelSelector()`: Handles model listing and selection logic.

### 3. Logic: Fragile Event Handling
The `handleEvent` function in `AgentConsole.tsx` manually splices arrays to update message parts (`message.part.updated`).
-   **Problem**: This mutable-style logic inside a `setState` callback is error-prone and hard to test.
-   **Fix**: Move this reducer-like logic into a proper `useReducer` or a strongly typed store. The complex logic of merging deltas should be isolated from the React view layer.

### 4. Component: Terminal & Lifecycle
`Terminal.tsx` mixes WebSocket connection logic with UI rendering.
-   **Problem**: The `useEffect` block is too large (80+ lines). If the component re-renders or strict mode runs, the socket connection/disconnection logic might be flaky.
-   **Fix**: Create a `useTerminalSocket(ptyId)` hook that returns the socket status and `term` instance.

### 5. Styling: Hardcoded Values
-   **Problem**: `Terminal.tsx` contains hardcoded colors (`#151312`, `#f6f3ef`).
-   **Fix**: Move these to your Tailwind configuration or CSS variables (`var(--color-bg-terminal)`) to maintain consistency with the rest of the app (`panel-surface`, `panel-muted`).

### 6. Types
-   **Problem**: Types like `ModelOption` and `EventEnvelope` are defined inside `AgentConsole.tsx`.
-   **Fix**: Move these to `src/types/` or `src/interfaces/` to be shared across components and hooks.

### Summary
The port works "on paper" but ignores the ecosystem tools you have available. **Refactoring to use React Query is mandatory** before this code is considered production-ready. It will reduce your code size by ~30% and eliminate potential race conditions.
