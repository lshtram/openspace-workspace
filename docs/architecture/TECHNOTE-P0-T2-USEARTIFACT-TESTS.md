---
id: TECHNOTE-P0-T2-USEARTIFACT-TESTS
author: builder_9f3a
status: DRAFT
date: 2026-02-11
task_id: drawing-modality-v2-phase0-task2
---

# Tech Note: useArtifact Test Coverage

## Summary
Adds unit tests for `useArtifact()` and supporting test utilities to validate load, save, sync, and error behavior prior to the whiteboard refactor.

## Test Files
- `openspace-client/src/hooks/useArtifact.test.tsx`
- `openspace-client/src/test/utils/useArtifactTestUtils.ts`

## Coverage Map
- Load success + 404 handling
- Debounced auto-save + serialized payload
- SSE update handling + `onRemoteChange` callback
- BroadcastChannel sync + `onRemoteChange` callback
- Parse errors fall back to raw content
- Serialize errors invoke `onSaveError`
- `isEqual` loop prevention for redundant saves

## Test Utilities
The utilities provide in-memory mocks for `EventSource` and `BroadcastChannel` and include defensive assertions to fail fast when the test environment is misconfigured.

## Notes
- Tests stub `fetch` directly (Hub URL stays on `/artifacts`).
- SSE and BroadcastChannel are mocked to avoid network dependencies.
