# TODO

## P0 (Critical: Robustness and Correctness)

- [x] [Robustness] Terminal lifecycle hardening: guarantee PTY cleanup for unmount, tab close, navigation, server switch, and websocket failure; prevent zombie `/bin/zsh -l` processes.
- [x] [Robustness] Terminal recovery and ownership: reconcile/clean stale PTYs on startup and ensure only live UI terminals own active PTYs.
- [x] [Robustness] Event-stream safety: harden session SSE handling for reconnect storms, duplicate events, and out-of-order updates across long-running sessions.
- [x] [Robustness] Mutation idempotency and retries: make workspace/project/session destructive operations safe under retries/timeouts (no double-delete/reset side effects).
- [x] [Robustness] State consistency across caches: enforce correct TanStack Query invalidation and key scoping when server URL or project directory changes.
- [x] [Robustness] Local-storage migration/versioning: add explicit schema version + migrations for settings/projects/workspaces to avoid silent corruption across releases.
- [x] [Robustness] Failure-path tests: expand unit/integration tests for terminal cleanup, stream reconnection, and multi-step mutation rollback behavior.
- [Parity] Model visibility enforcement: implement full enable/disable model controls and guarantee disabled models are hidden everywhere (picker + prompt flow).
- [Parity] Providers custom config parity: support custom provider form behaviors (validation, add/remove headers, add/remove models) with persistence and tests.

## P1 (Important: Feature Parity and Deep Coverage)

- [Parity] Projects parity: add project edit (name + startup script) and project close actions from card and header menus.
- [Parity] Session parity: add share/unshare flow.
- [Parity] Navigation parity: add titlebar/session history back-forward behavior.
- [Parity] Prompt parity: add `/open` flow that opens file picker and inserts selection into prompt context.
- [Parity] Terminal parity: support multi-tab terminal initialization and actions (create/switch/close tabs) with E2E coverage.
- [Parity] Model controls parity: add model variant/thinking-level cycle behavior.
- [Parity] Sidebar parity: verify session-link navigation and collapse/expand behavior against OpenCode.
- [Parity] File-flow parity: add open-from-palette and file-viewer smoke scenarios.
- [Robustness] Config and resolution suites: deeper tests for config resolution/validation and migration behavior.
- [Robustness] Shell/job lifecycle suites: add tests around background shell/job start-stop-retry-cleanup semantics.
- [Robustness] State/reducer reconciliation suites: extend ordering/conflict tests for session/message/workspace state updates under concurrent events.

## P2 (Lower Priority: UX and Nice-to-Have UI Parity)

- [UI] Settings layout polish: ensure no clipping, full-height panes, and balanced vertical spacing in all tabs.
- [UI] Left settings menu fit: ensure full-height usage and clean containment in dialog frame.
- [UI] Providers UX: connected-first ordering, optional popularity ordering, and provider search box.
- [UI] Providers panel sizing: expand list region to better use available vertical space.
- [UI] Agents settings parity pass: expose missing options from OpenCode Desktop if any.
- [UI] Shortcuts UX: add shortcut search/filter field.
- [UI] Shortcuts breadth parity: expand keybind catalog (model/agent/terminal/general/session) including unassigned actions.
- [UI] General settings parity pass: verify all notification/sound/update toggles are present and visible.
- [UI] Visual polish: revisit default color/theme/font and improve light-mode contrast.
