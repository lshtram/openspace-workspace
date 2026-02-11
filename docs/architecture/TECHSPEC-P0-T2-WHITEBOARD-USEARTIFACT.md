---
id: TECHSPEC-P0-T2-WHITEBOARD-USEARTIFACT
author: oracle_2b11
status: APPROVED
date: 2026-02-11
task_id: drawing-modality-v2-phase0-task2
---

# Tech Spec: Phase 0 Task 2 - Whiteboard useArtifact Refactor

## Summary
Refactor the whiteboard modality to use the universal `useArtifact()` hook for `.excalidraw` layout data and `.graph.mmd` Mermaid logic. Add unit tests for `useArtifact()` first (TDD). Maintain `/artifacts` endpoints for Task 2. Preserve all existing behavior and error UI.

## Goals
- Implement unit tests for `useArtifact()` before refactor changes.
- Replace custom SSE/BroadcastChannel/debounce logic in `WhiteboardFrame.tsx` with two `useArtifact()` calls.
- Preserve reconciliation, diagram type detection, and Send-to-Agent flow.
- Remove `useDebouncedSave.ts` after refactor stabilizes.

## Non-Goals
- Hub `/files` endpoint (Task 3).
- MCP consolidation (Task 4).
- UI redesign.

## Interfaces (Define Before Implementations)

### Types
```typescript
interface ExcalidrawData {
  elements: readonly any[];
}

interface UseArtifactOptions<T> {
  parse?: (content: string) => T;
  serialize?: (data: T) => string;
  debounceMs?: number;
  enableSync?: boolean;
  enableSSE?: boolean;
  isEqual?: (a: T, b: T) => boolean;
  onRemoteChange?: (data: T, actor: 'user' | 'agent') => void;
  onSaved?: () => void;
  onSaveError?: (error: Error) => void;
}
```

### Whiteboard hook usage (target)
```typescript
const excalidrawArtifact = useArtifact<ExcalidrawData>(excalidrawPath, {
  parse: (content) => {
    try {
      const json = JSON.parse(content);
      return { elements: json.elements || [] };
    } catch {
      return { elements: [] };
    }
  },
  serialize: (data) => JSON.stringify(data, null, 2),
  debounceMs: 1000,
  onRemoteChange: (data, actor) => {
    if (actor === 'agent' && excalidrawAPI) {
      excalidrawAPI.updateScene({ elements: data.elements });
    }
  }
});

const mermaidArtifact = useArtifact<string>(mmdPath, {
  parse: (content) => content,
  serialize: (content) => content,
  debounceMs: 1000,
  onRemoteChange: (mmd, actor) => {
    if (actor === 'agent') {
      // reconcile + toast
    }
  }
});
```

## Design

### 1. `useArtifact` Unit Tests (TDD first)
- Add unit tests in `openspace-client/src/hooks/__tests__/useArtifact.test.tsx` (or existing test location).
- Use `msw` to mock Hub endpoints and SSE where possible.
- Use `BroadcastChannel` polyfill or stub for multi-window tests.
- Cover:
  - initial load success
  - 404 handling
  - debounce save
  - SSE remote update
  - BroadcastChannel sync
  - onRemoteChange callback
  - parse/serialize errors
  - save loop prevention via `isEqual`

### 2. WhiteboardFrame refactor
- Replace custom SSE, BroadcastChannel, debounce, and save logic.
- Keep reconciliation logic intact.
- Keep diagram type detection (sequence/class/state/er/gantt/mindmap/C4).
- Maintain existing error UI and Retry button.
- Keep status indicator based on `connected` state from both artifacts.

### 3. Removal of useDebouncedSave
- After refactor passes manual tests, delete `openspace-client/src/components/whiteboard/useDebouncedSave.ts`.

## Observability
- No new external I/O beyond what `useArtifact()` already performs.
- If new I/O is introduced in tests or helpers, add explicit start/success/failure logs with timestamps.

## Defensive Programming
- Public functions in new test utilities or helpers must begin with assertions.

## Implementation Steps
1. Add `useArtifact()` tests (red → green).
2. Refactor `WhiteboardFrame.tsx` to use the two artifacts.
3. Remove `useDebouncedSave.ts` after refactor verification.
4. Update docs to describe new pattern and files.

## Test Plan
- Unit: `npm run test:run` in `openspace-client`.
- Manual:
  - Multi-window sync (two tabs).
  - SSE update via MCP (`whiteboard.update`).
  - Error UI on missing `.graph.mmd`.
  - Send-to-Agent flow.
- Performance: Chrome DevTools spot-check load/save timing.

## Risks
- BroadcastChannel unsupported in some browsers (accepted for now).
- SSE reconnect edge cases (handled inside `useArtifact()`).
- Reconciliation inconsistencies for agent updates (existing logic retained).
