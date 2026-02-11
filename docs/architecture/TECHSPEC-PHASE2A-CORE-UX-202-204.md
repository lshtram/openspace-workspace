---
id: TECHSPEC-PHASE2A-CORE-UX-202-204
author: oracle_c3e9
status: DRAFT
date: 2026-02-11
task_id: phase2a-core-ux-202-204
---

# Tech Spec: Phase 2A Core UX Parity (202, 203, 204)

## Summary
Implement the remaining Phase 2A parity features in strict order:
1. File watcher integration (`id: 202`)
2. Session navigation shortcuts (`id: 203`)
3. Duration timer per turn (`id: 204`)

The implementation preserves existing OpenSpace UX patterns while adding configurable shortcuts and portable shortcut import/export.

## Goals
- Deliver functional parity for features 202, 203, and 204.
- Keep diffs focused and compatible with current React Query + Context architecture.
- Enforce NSO requirements for interface-first design, defensive assertions, and observability for external I/O.

## Non-Goals
- Large architecture rewrites (no full event bus redesign).
- Settings/theme/i18n expansions outside shortcut portability requirements.
- Any backend protocol changes unless required for typing compatibility.

## Interfaces (Define Before Implementations)

### 1) Global Event Contracts
```ts
export const MIN_INTERVAL_MS = 1000
export const WATCHER_COALESCE_WINDOW_MS = 1000

export interface FileWatcherUpdatedEnvelope {
  type: "file.watcher.updated"
  properties?: {
    path?: string
    directory?: string
    event?: string
  }
}

export interface FileWatcherRefreshEventDetail {
  directory: string
  path?: string
  event?: string
  timestamp: number
}

export interface FileWatcherRefreshSignal {
  key: string
  detail: FileWatcherRefreshEventDetail
}
```

### 2) Session Navigation Contracts
```ts
export interface SessionNavigationInput {
  sessions: Array<{ id: string }>
  currentSessionId?: string
  direction: "previous" | "next"
}

export interface SessionNavigationResult {
  nextSessionId?: string
}
```

### 3) Shortcut Portability Contracts
```ts
export const SHORTCUTS_FILE_SCHEMA_VERSION = 1

export interface ShortcutsFile {
  version: number
  shortcuts: Partial<ShortcutMap>
}

export interface ParseShortcutsFileResult {
  ok: boolean
  shortcuts?: ShortcutMap
  error?: string
}
```

### 4) Duration Formatting Contract
```ts
export interface DurationFormatInput {
  startMs: number
  endMs: number
}

export type DurationLabel = "< 1s" | `${number}s` | `${number}m ${number}s`
```

## Design

### Feature 202: File Watcher Integration

#### Current Baseline
- `useSessionEvents` already consumes global SSE events and filters by directory.
- `FileTree` currently manages directory nodes in component state, loaded lazily.

#### Proposed Approach
1. Extend `useSessionEvents` to recognize `file.watcher.updated` envelopes.
2. On matching active directory:
   - emit a browser custom event (`openspace:file-watcher-updated`) with typed detail,
   - invalidate file status query (`file-status` key) for that directory,
   - keep event handling no-op for unrelated directories.
3. In `FileTree`, subscribe to `openspace:file-watcher-updated` and trigger controlled tree refresh:
   - clear loaded cache refs,
   - reload root and currently expanded nodes,
   - preserve expanded set and avoid scroll jumps.
4. Add observability logs with timestamps around refresh I/O paths (`load` and watcher-triggered refresh start/success/failure).
5. Coalesce bursts with deterministic key policy:
   - key: `${directory}:${path ?? "*"}:${event ?? "updated"}`
   - refresh at most once per `WATCHER_COALESCE_WINDOW_MS`
   - preserve most recent detail payload per key within the window.

#### Loop Safety
- Any retry/poll additions use shared `MIN_INTERVAL_MS` and apply to both success and failure states.
- Existing fixed intervals touched by this scope should be normalized to use the constant where modified.
- Loop inventory for this task:
  - SSE reconnect backoff path in `useSessionEvents` (if touched)
  - any watcher-driven deferred refresh timers introduced in `FileTree`
  - any import/export retry flow (if introduced; default is no retry)

### Feature 203: Session Navigation Shortcuts (Configurable)

#### Current Baseline
- `App.tsx` centralizes keyboard shortcut handling via `matchesShortcut`.
- Shortcut settings already persist in local storage via `utils/shortcuts.ts`.

#### Proposed Approach
1. Add two actions to `ShortcutAction` and `DEFAULT_SHORTCUTS`:
   - `sessionPrevious` -> `Alt+ArrowUp`
   - `sessionNext` -> `Alt+ArrowDown`
2. Add non-UI pure helper (`getAdjacentSessionId`) to compute wrap-around previous/next.
3. In `App.tsx` keydown handler:
   - evaluate new shortcuts only after editable-target guard,
   - compute target session and call existing `setActiveSession`.
4. Do not expand command palette scope in this task (remain out of scope).

#### Portable Keyboard Config
1. Add export/import utilities in `utils/shortcuts.ts`:
   - `serializeShortcutsFile(shortcuts)`
   - `parseShortcutsFile(jsonText)` with schema/version checks.
2. Add Settings > Shortcuts actions:
   - Export JSON file (`openspace-shortcuts.json`)
   - Import JSON file and merge with defaults.
3. On import failure, surface clear message and leave current shortcuts unchanged.

### Feature 204: Duration Timer per Turn

#### Current Baseline
- `MessageList` already tracks pending elapsed seconds (`startTime`, `elapsed`).
- Completed turns display timestamp only.

#### Proposed Approach
1. Add pure utility function for duration formatting (`formatTurnDuration`).
2. Compute per-turn completed duration from turn boundaries:
   - start: first message in turn (`user` if present, otherwise first assistant),
   - end: latest assistant message in turn.
   - if timestamps are missing/invalid, omit duration label instead of returning misleading `0s`.
3. Render completed duration beside existing assistant timestamp in turn footer.
4. Retain existing pending live timer, but normalize label format through same utility.

## Defensive Programming
- New public helpers assert required inputs (`sessions` array, positive timestamps, parseable JSON).
- Invalid inputs return safe fallbacks without mutating current UI state.

### Assertion Matrix
- `getAdjacentSessionId(input)`: assert `input.sessions` is array, direction is `previous|next`; fallback `undefined`.
- `formatTurnDuration(input)`: assert finite non-negative timestamps and `endMs >= startMs`; fallback `undefined`.
- `parseShortcutsFile(jsonText)`: assert non-empty string, parseable JSON object, supported schema version; fallback `{ ok: false, error }`.
- watcher event handler: assert envelope shape and directory match before side effects.

## Observability Plan
For each external I/O operation below, emit start/success/failure logs with timestamps.

### Observability Matrix
- `watcher.refresh.load` (file tree list reload)
  - start: directory/path/timestamp
  - success: directory/path/nodeCount/timestamp
  - failure: directory/path/error/timestamp
- `watcher.refresh.status` (file status query refresh/invalidate)
  - start: directory/timestamp
  - success: directory/timestamp
  - failure: directory/error/timestamp
- `shortcuts.export.file` (JSON file generation + browser download trigger)
  - start: fileName/timestamp
  - success: fileName/shortcutCount/timestamp
  - failure: fileName/error/timestamp
- `shortcuts.import.file` (file read)
  - start: fileName/timestamp
  - success: fileName/byteLength/timestamp
  - failure: fileName/error/timestamp
- `shortcuts.import.parse` (schema validation/merge)
  - start: version?/timestamp
  - success: version/shortcutCount/timestamp
  - failure: reason/timestamp

## Files Expected to Change
- `openspace-client/src/hooks/useSessionEvents.ts`
- `openspace-client/src/components/FileTree.tsx`
- `openspace-client/src/hooks/useFileStatus.ts` (if interval constants are touched)
- `openspace-client/src/utils/shortcuts.ts`
- `openspace-client/src/utils/shortcuts.test.ts`
- `openspace-client/src/components/SettingsDialog.tsx`
- `openspace-client/src/App.tsx`
- `openspace-client/src/components/MessageList.tsx`
- `openspace-client/src/components/sidebar/SessionSidebar.test.tsx` and/or `App` keyboard tests

## Test Plan

### Unit
- `useSessionEvents.test.tsx`: handle `file.watcher.updated`, directory scoping, dedupe behavior.
- `shortcuts.test.ts`: new shortcut actions, import/export schema validation, merge behavior.
- `shortcuts.test.ts`: export->import roundtrip into fresh settings state.
- duration formatter tests for `< 1s`, `Xs`, `Xm Ys`.
- session navigation helper tests for wrap-around and empty/one-item edge cases.
- session navigation tests for editable-target guard and extra-modifier no-trigger behavior.
- duration tests for historical reload consistency and streaming-update stability.

### Integration/UI
- App keyboard test: configured session nav shortcuts select previous/next and wrap.
- File tree integration test: synthetic watcher event triggers refresh path.
- Message list render test: completed turn footer includes formatted duration.

### Validation Commands
- `npm run check` (in `openspace-client`)
- targeted tests for modified modules (`vitest`)

## Risks and Mitigations
- **Risk:** duplicate event streams causing extra refreshes.
  - **Mitigation:** keep watcher handling in existing stream path and apply directory filtering + dedupe.
- **Risk:** file tree refresh jitter during large watcher bursts.
  - **Mitigation:** coalesce refresh triggers and preserve expanded state.
- **Risk:** shortcut import corrupts mappings.
  - **Mitigation:** strict schema validation and non-destructive merge with defaults.

## Traceability
- FR-202 -> watcher event handling + file tree refresh tests.
- FR-203 -> keyboard navigation helper + App shortcut tests + editable-target guard regression.
- FR-203A -> shortcut file import/export tests + Settings integration + fresh-state roundtrip.
- FR-204 -> turn duration formatter + MessageList rendering tests + pending/historical stability checks.

## Closure and Consolidation
- After implementation/validation, merge accepted outcomes into canonical docs:
  - `docs/plans/FEATURE-PARITY-PLAN.md`
  - `.opencode/context/01_memory/progress.md`
  - any relevant verification/index docs touched during validation.
- Mark this task-specific tech spec as archived/superseded when consolidation is complete.
