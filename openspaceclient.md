# OpenSpace Client Requirements and Test Parity

## Purpose
Track requirements and test coverage for the OpenSpace web client, aligned to the OpenCode web client tests and the OpenSpace port plan.

## Sources of Truth
- Port plan: `/Users/Shared/dev/openspace/openspace-client-port-plan.md`
- Feature parity: `/Users/Shared/dev/openspace/opencode-openspace-feature-parity_v2.md`
- OpenCode web app tests: `/Users/Shared/dev/opencode/packages/app`

## Requirements by Phase (Summary)

### Phase 0: Baseline Stability
- SSE session stream reconnects automatically.
- API errors surface in UI logs/toasts without breaking session state.
- Stream backoff is implemented and aborts do not show false error toasts.

### Phase 1: Sessions Core Parity
- Session rename, archive, delete with immediate UI updates.
- Session prefetch for adjacent sessions.
- Message history paging for large sessions.
- Unseen session navigation and tracking.

### Phase 2: Message Timeline UX
- Load earlier/backfill on demand.
- Auto-scroll with resume button.
- Scroll spy active message.
- Hash-based message focus.
- Gesture boundary handling.

### Phase 3: Prompt Input Parity
- Contenteditable prompt, @mentions, slash commands.
- Prompt history (normal + shell), shell mode.
- Draft persistence, attachment paste/drag/drop.
- Context items list, auto-accept permissions, stop generation.

### Phase 4: File Tree + Tabs
- Changes/all toggle, open file tabs, tooltips + diff badges.
- Drag file to context.

### Phase 5: Terminal Parity
- Multi-terminal tabs, drag-reorder, create/close.
- Buffer serialization and workspace scope.

## OpenSpace Automated Tests (Current)

### Unit/Integration (Vitest)
- App + layout: `src/App.test.tsx`
- Contexts: `src/context/DialogContext.test.tsx`, `src/context/ServerContext.test.tsx`
- Hooks: `src/hooks/useSessionEvents.test.tsx`, `src/hooks/useModels.test.tsx`, `src/hooks/useMcp.test.tsx`, `src/hooks/useSimpleHooks.test.tsx`, `src/hooks/useAdditionalHooks.test.tsx`
- Services: `src/services/OpenCodeClient.test.ts`
- Components: `src/components/*` (AgentConsole, PromptInput, MessageList, selectors, sidebars, status, etc.)
- Utilities: `src/utils/storage.test.ts`, `src/lib/utils.test.ts`

### E2E (Playwright)
- `e2e/app.spec.ts` (app load, create session)
- `e2e/session-management.spec.ts` (rename/archive/delete)
- `e2e/prompt.spec.ts` (prompt + reply)
- `e2e/abort-generation.spec.ts`
- `e2e/providers.spec.ts` (model picker)
- `e2e/files.spec.ts` (file tree)
- `e2e/settings.spec.ts` (settings dialog + tabs)
- `e2e/status.spec.ts` (status + MCP)
- `e2e/terminal.spec.ts`

## OpenCode Web Test Inventory

### E2E Suites in `/Users/Shared/dev/opencode/packages/app/e2e`
- App: `app/home.spec.ts`, `app/session.spec.ts`, `app/navigation.spec.ts`, `app/titlebar-history.spec.ts`, `app/server-default.spec.ts`, `app/palette.spec.ts`
- Sidebar: `sidebar/sidebar.spec.ts`, `sidebar/sidebar-session-links.spec.ts`
- Projects: `projects/projects-switch.spec.ts`, `projects/project-edit.spec.ts`, `projects/workspaces.spec.ts`, `projects/projects-close.spec.ts`
- Prompt: `prompt/prompt.spec.ts`, `prompt/prompt-mention.spec.ts`, `prompt/prompt-slash-open.spec.ts`, `prompt/context.spec.ts`
- Files: `files/file-tree.spec.ts`, `files/file-open.spec.ts`, `files/file-viewer.spec.ts`
- Models: `models/model-picker.spec.ts`, `models/models-visibility.spec.ts`
- Settings: `settings/settings.spec.ts`, `settings/settings-keybinds.spec.ts`, `settings/settings-models.spec.ts`, `settings/settings-providers.spec.ts`
- Terminal: `terminal/terminal.spec.ts`, `terminal/terminal-init.spec.ts`
- Status: `status/status-popover.spec.ts`
- Session: `session/session.spec.ts`
- Misc: `thinking-level.spec.ts`

### Unit/Integration Suites in `/Users/Shared/dev/opencode/packages/app/src`
- Context: `context/terminal.test.ts`, `context/comments.test.ts`, `context/command.test.ts`, `context/layout.test.ts`, `context/layout-scroll.test.ts`, `context/notification.test.ts`, `context/sync-optimistic.test.ts`, `context/global-sync*.test.ts`, `context/file/*`
- Components: `components/file-tree.test.ts`, `components/prompt-input/*`, `components/titlebar-history.test.ts`, `components/session/session-context-metrics.test.ts`
- Pages/Layout: `pages/layout/*`
- Pages/Session: `pages/session/*`
- Utils: `utils/runtime-adapters.test.ts`, `utils/server-health.test.ts`, `utils/worktree.test.ts`, `utils/scoped-cache.test.ts`
- Addons: `addons/serialize.test.ts`
- i18n: `i18n/parity.test.ts`

## Parity Status (OpenCode Web Tests vs OpenSpace)

### E2E Parity
- App home/navigation/titlebar/history/palette: Not implemented in OpenSpace UI yet.
- Sidebar/session links: Partial. OpenSpace has sidebar + unseen navigation, but no link preview tests.
- Projects/workspaces: Partial. OpenSpace has project rail, but no multi-workspace tests.
- Prompt: Partial. OpenSpace covers basic prompt send + abort, but not mentions, slash open, or context insertion.
- Files: Partial. OpenSpace tests file tree only; file open/viewer not covered.
- Models: Partial. OpenSpace tests model picker open, not model visibility rules.
- Settings: Partial. OpenSpace tests dialog + tabs, not keybinds/models/providers specifics.
- Terminal: Partial. OpenSpace tests visibility only, not init or multi-terminal behaviors.
- Status: Covered at a basic level.
- Session: Partial. OpenSpace tests rename/archive/delete, but no session timeline behaviors.
- Thinking level: Not implemented in OpenSpace.

### Unit/Integration Parity
- Global sync, command/keybind, file watchers, session helpers, scroll-spy, message-gesture, file tab scrolling, prompt editor DOM/history: Not present in OpenSpace test suite.
- Runtime adapters/server health utilities: Not present in OpenSpace test suite.
- OpenSpace does have tests for OpenCode client wiring, session events, and core UI components.

## Test Improvements (Recommended)

### Phase 0
- Add explicit tests for SSE reconnect/backoff and abort handling (no false error toasts).
- Add tests for OpenCode API error surfaces at UI boundary.

### Phase 1
- Add optimistic update tests for rename/archive/delete, including rollback.
- Add tests for deleting active session and selecting next/clearing.
- Add tests for unseen tracking updates while active session is open.
- Add tests for message history paging behavior.

### Phase 2+
- Add tests for scroll-spy, hash focus, message timeline behavior.
- Add tests for prompt mentions, slash commands, context items, draft persistence.
- Add tests for file tabs and open file viewer.
- Add tests for multi-terminal tab behavior and serialization.

## Manual Test Checklist (High Signal)
- SSE reconnect: restart backend during active session and confirm UI recovers.
- Abort toast: abort/close session while SSE active; no false interruption toast.
- Rename, archive/unarchive, delete (active + inactive sessions).
- Unseen navigation: new messages update unseen count; active session stays seen.
- Pagination: load earlier messages; UI remains responsive.
- Prompt flow: send prompt, stop generation, send attachments.
- Status dialog: connection + MCP tab data.

## E2E Runtime Notes
- E2E requires an OpenCode backend available at `http://127.0.0.1:3000`.
- Start server example:
  - `OPENCODE_TEST_HOME=/tmp/opencode XDG_DATA_HOME=/tmp/opencode/data XDG_CACHE_HOME=/tmp/opencode/cache XDG_CONFIG_HOME=/tmp/opencode/config XDG_STATE_HOME=/tmp/opencode/state bun run dev -- serve --port 3000`
- OpenSpace E2E uses a dedicated workspace inside the repo to avoid touching the main OpenSpace project:
  - `/Users/Shared/dev/openspace/openspace-client/e2e/workspace`
  - Override via `OPENCODE_E2E_DIR`.
- OpenSpace E2E starts the UI dev server via Playwright config in `/Users/Shared/dev/openspace/openspace-client/e2e/playwright.config.ts`.
