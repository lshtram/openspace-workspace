# Code Review: OpenSpace Client React Port (Strict)
**Date:** 2026-02-05
**Reviewer:** OpenCode

This review covers the current React port in `openspace-client`. The port is functional and already uses React Query and a clean component split, but there are correctness and lifecycle issues that will create flaky behavior under load or during reconnection scenarios.

## High Impact Issues

1) Missing default model fallback can block sending prompts
- **Where**: `src/hooks/useModels.ts`
- **Problem**: `defaultModelId` can be `undefined` when `defaults[defaultProvider]` is missing even if `models` is non-empty. This leaves `AgentConsole` without a selected model and `sendMessage` will return early.
- **Fix**: After computing defaults, always fall back to `models[0]?.id` when no default is resolved.

2) `useTerminal` leaks window resize listeners
- **Where**: `src/hooks/useTerminal.ts`
- **Problem**: `window.addEventListener("resize", handleResize)` is added inside `connect()` but its cleanup is never used. The returned function is not wired to the effect cleanup. This will leak listeners on remounts and during React StrictMode.
- **Fix**: Register the resize listener in the effect body and remove it in the effect cleanup, or store the cleanup function and call it in the effect cleanup.

## Medium Impact Issues

3) SSE updates can be dropped before initial query resolve
- **Where**: `src/hooks/useSessionEvents.ts`
- **Problem**: `setQueryData` returns `prev` when `prev` is undefined. If SSE events arrive before the first `useMessages` fetch resolves, those events are discarded.
- **Fix**: Initialize cache to `[]` on subscribe or buffer events until initial query completes.

4) File tree loading guard uses stale state
- **Where**: `src/components/FileTree.tsx`
- **Problem**: The `load` callback checks `state.nodes` and `state.loading` from the closure. This can cause duplicate requests when concurrent loads are triggered or state updates batch.
- **Fix**: Store `nodes/loading` in `useRef` or perform the guard inside a functional `setState` update.

5) Model popover never closes on selection
- **Where**: `src/components/ModelSelector.tsx`
- **Problem**: Selecting a model does not close the popover. In the Solid version this was usually handled by a signal. In React you must explicitly manage `open` or call `onOpenChange`.
- **Fix**: Add `open` state to `Popover.Root` and close it on selection.

## Low Impact Issues

6) Attach button ignores disabled state
- **Where**: `src/components/PromptInput.tsx`
- **Problem**: The attach button remains active when `disabled` is true, allowing uploads during pending mutations.
- **Fix**: Add `disabled={disabled}` and visual styles to the attach button.

7) Token and cost math lacks defensive defaults
- **Where**: `src/components/AgentConsole.tsx`
- **Problem**: `item.cost` and `last.tokens.*` are assumed defined. If the backend omits any field, totals become `NaN` and the meter breaks.
- **Fix**: Default missing numeric fields to `0`.

8) `connected` flag in model list is misleading
- **Where**: `src/hooks/useModels.ts`
- **Problem**: The list filters to connected providers and sets `connected: true` for all models. Later checks for `!selectedDefaultModel.connected` are dead code and misleading.
- **Fix**: Either keep all models and set the flag meaningfully, or remove the property and simplify the logic.

## Summary
This port is close to solid, but there are a few correctness and lifecycle problems that will cause hard-to-debug bugs in real usage (default model selection, SSE event loss, terminal resize leak). Address the high-impact items first, then revisit the model selector UX and file tree loading guard.

## Suggested Follow-ups
1) Fix `useModels` default fallback and add a test or quick manual check.
2) Fix `useTerminal` cleanup and validate in StrictMode (mount/unmount twice).
3) Verify SSE streaming by sending a long response and confirming deltas always render.
