# Recommended Tests (opencode-web)

This document summarizes the existing tests worth keeping and the most important tests to add.

## Existing Tests Worth Keeping

- Home: renders core entrypoints and opens server picker dialog.
- Navigation: project route redirects to `/session` and prompt is visible.
- Command palette: opens and closes.
- Default server: set default server via status popover and persists to localStorage.
- Session open: open an existing session and type in prompt.
- Titlebar history: Back/Forward navigates between sessions.
- File open (palette): open a file tab from palette and render file content.
- Prompt send: send a prompt and receive a reply (SDK polling + UI confirm).
- Prompt @mention: inserts file pill token.
- Prompt /open: opens file picker dialog.
- Context panel: opens from prompt after seeded context.
- Settings general: dialog opens, tab switches, closes.
- Settings appearance: language, color scheme, theme, font persistence.
- Settings notifications/sounds/updates/release notes: toggle and persist.
- Settings keybinds: change, reset, clear, and verify behavior for keybinds.
- Model picker: selecting model updates prompt footer.
- Model visibility: hide/show models and reflect in picker.
- Providers: custom provider form validation, add/remove models and headers.
- Status popover: opens, tabs switch, closes by escape and click-outside.
- Sidebar: collapse/expand and session link navigation.
- Terminal: panel toggles; terminal initializes and can create a second tab.
- Session actions: rename, archive, delete; share/unshare when enabled.
- Projects: edit project name/startup script; switch; close via hover/menu.
- Workspaces: enable/disable, create, rename, reset, delete, reorder by drag.
- (Skipped today) File tree: expand folders and open a file.
- (Skipped today) Terminal serialization: ANSI/color preservation, round-trip, alt buffer.

## Tests That Should Be Added

- Error/empty states: server unreachable, API 4xx/5xx, LLM timeouts, retry UI.
- Accessibility: focus trapping in dialogs, ARIA roles/labels, keyboard-only flows.
- Responsive layouts: mobile/tablet breakpoints, sidebar/terminal behavior on small screens.
- Prompt edge cases: multiline input, history, slash commands beyond /open and /model.
- File viewer edge cases: large files, binary/invalid encoding, file not found.
- Terminal behavior: copy/paste, resize, scrollback, long-running output handling.
- Settings persistence: reload/tab sync and startup defaults.
- Provider workflows: save/remove custom providers, auth failures, default model selection.
- Session list: search/filter/pagination (if supported), share link open/preview.
- Workspaces: open existing workspace, conflict handling, failed reset/delete UI.
