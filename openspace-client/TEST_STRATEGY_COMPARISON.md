# Test Strategy Comparison: OpenSpace Client vs OpenCode Web Client vs Crush

Date: 2026-02-07

## Scope
- Goal: compare feature coverage quality, not line/file percentages.
- Repos compared:
  - OpenSpace Client: local repo
  - OpenCode Web Client: `anomalyco/opencode` (`dev` branch)
  - Crush: `charmbracelet/crush` (`main` branch)

## MCP/tool status (this run)
- `github` MCP: working (directory listing + full file reads succeeded).
- `gh_grep` MCP: working now (code search/snippets succeeded).
- `github/search_code`: previously rate-limited earlier in session, so this report relies mainly on `get_file_contents` for exact OpenCode e2e cases and on confirmed Crush test inventory + sampled deep test snippets.

## Executive verdict
- OpenSpace is solid on core UX e2e flows (session lifecycle, prompt, status, terminal visibility, files/settings basic flows) and has broad unit coverage for hooks/components.
- OpenCode is broader and deeper at feature-e2e level in these areas:
  - workspace lifecycle (enable/create/rename/reset/delete/reorder)
  - keybinding behavior + persistence + action effects
  - settings behavior breadth (theme/font/language/notifications/release notes/providers/models)
  - prompt slash/mention/context flows
  - status popover tab-level interactions
- Crush is deeper in low-level robustness (config resolution/migrations, shell/background jobs, fs/search primitives, sync data structures, tooling internals).
- Conclusion: OpenSpace is not yet at “at least as good as both” on total feature-depth. It is close on core user flows, behind on advanced settings/workspace/keybind and infra robustness depth.

## OpenCode Web Client: e2e test-by-test inventory

### App/navigation
- `packages/app/e2e/app/home.spec.ts`
  - `home renders and shows core entrypoints`
  - `server picker dialog opens from home`
- `packages/app/e2e/app/navigation.spec.ts`
  - `project route redirects to /session`
- `packages/app/e2e/app/palette.spec.ts`
  - `search palette opens and closes`
- `packages/app/e2e/app/server-default.spec.ts`
  - `can set a default server on web`
- `packages/app/e2e/app/session.spec.ts`
  - `can open an existing session and type into the prompt`
- `packages/app/e2e/app/titlebar-history.spec.ts`
  - `titlebar back/forward navigates between sessions`

### Files
- `packages/app/e2e/files/file-open.spec.ts`
  - `can open a file tab from the search palette`
- `packages/app/e2e/files/file-tree.spec.ts`
  - `file tree can expand folders and open a file` (`test.skip` currently)
- `packages/app/e2e/files/file-viewer.spec.ts`
  - `smoke file viewer renders real file content`

### Models
- `packages/app/e2e/models/model-picker.spec.ts`
  - `smoke model selection updates prompt footer`
- `packages/app/e2e/models/models-visibility.spec.ts`
  - `hiding a model removes it from the model picker`

### Projects/workspaces
- `packages/app/e2e/projects/project-edit.spec.ts`
  - `dialog edit project updates name and startup script`
- `packages/app/e2e/projects/projects-close.spec.ts`
  - `can close a project via hover card close button`
  - `can close a project via project header more options menu`
- `packages/app/e2e/projects/projects-switch.spec.ts`
  - `can switch between projects from sidebar`
- `packages/app/e2e/projects/workspaces.spec.ts`
  - `can enable and disable workspaces from project menu`
  - `can create a workspace`
  - `can rename a workspace`
  - `can reset a workspace`
  - `can delete a workspace`
  - `can reorder workspaces by drag and drop`

### Prompt
- `packages/app/e2e/prompt/context.spec.ts`
  - `context panel can be opened from the prompt`
- `packages/app/e2e/prompt/prompt-mention.spec.ts`
  - `smoke @mention inserts file pill token`
- `packages/app/e2e/prompt/prompt-slash-open.spec.ts`
  - `smoke /open opens file picker dialog`
- `packages/app/e2e/prompt/prompt.spec.ts`
  - `can send a prompt and receive a reply`

### Session
- `packages/app/e2e/session/session.spec.ts`
  - `session can be renamed via header menu`
  - `session can be archived via header menu`
  - `session can be deleted via header menu`
  - `session can be shared and unshared via header button`

### Settings
- `packages/app/e2e/settings/settings.spec.ts`
  - `smoke settings dialog opens, switches tabs, closes`
  - `changing language updates settings labels`
  - `changing color scheme persists in localStorage`
  - `changing theme persists in localStorage`
  - `changing font persists in localStorage and updates CSS variable`
  - `toggling notification agent switch updates localStorage`
  - `toggling notification permissions switch updates localStorage`
  - `toggling notification errors switch updates localStorage`
  - `changing sound agent selection persists in localStorage`
  - `toggling updates startup switch updates localStorage`
  - `toggling release notes switch updates localStorage`
- `packages/app/e2e/settings/settings-keybinds.spec.ts`
  - `changing sidebar toggle keybind works`
  - `resetting all keybinds to defaults works`
  - `clearing a keybind works`
  - `changing settings open keybind works`
  - `changing new session keybind works`
  - `changing file open keybind works`
  - `changing terminal toggle keybind works`
  - `changing command palette keybind works`
- `packages/app/e2e/settings/settings-models.spec.ts`
  - `hiding a model removes it from the model picker`
  - `showing a hidden model restores it to the model picker`
- `packages/app/e2e/settings/settings-providers.spec.ts`
  - `custom provider form can be filled and validates input`
  - `custom provider form shows validation errors`
  - `custom provider form can add and remove models`
  - `custom provider form can add and remove headers`

### Sidebar/status/terminal/other
- `packages/app/e2e/sidebar/sidebar.spec.ts`
  - `sidebar can be collapsed and expanded`
- `packages/app/e2e/sidebar/sidebar-session-links.spec.ts`
  - `sidebar session links navigate to the selected session`
- `packages/app/e2e/status/status-popover.spec.ts`
  - `status popover opens and shows tabs`
  - `status popover servers tab shows current server`
  - `status popover can switch to mcp tab`
  - `status popover can switch to lsp tab`
  - `status popover can switch to plugins tab`
  - `status popover closes on escape`
  - `status popover closes when clicking outside`
- `packages/app/e2e/terminal/terminal.spec.ts`
  - `terminal panel can be toggled`
- `packages/app/e2e/terminal/terminal-init.spec.ts`
  - `smoke terminal mounts and can create a second tab`
- `packages/app/e2e/thinking-level.spec.ts`
  - `smoke model variant cycle updates label`

## OpenSpace Client: test-by-test coverage (feature mapped)

### E2E coverage
- `e2e/app.spec.ts`
  - `app loads and shows project rail`
  - `can create new session`
- `e2e/session-management.spec.ts`
  - `can rename a session`
  - `can archive and unarchive a session`
  - `can delete a session`
- `e2e/session-behavior.spec.ts`
  - `session actions menu on dot and rename`
  - `archive toggle and delete active session`
  - `unseen dot updates for background session`
  - `multiple sessions can be pending independently`
  - `timeline shows load earlier and resume scroll controls`
- `e2e/prompt.spec.ts`
  - `can send a prompt and receive a reply`
- `e2e/abort-generation.spec.ts`
  - `can abort generation with stop button`
- `e2e/providers.spec.ts`
  - `can open model picker`
- `e2e/files.spec.ts`
  - `file tree can load and show files`
- `e2e/settings.spec.ts`
  - `can open settings dialog`
  - `can switch settings tabs`
  - `can close settings dialog`
- `e2e/status.spec.ts`
  - `status popover opens and shows connection info`
  - `can view MCP status`
- `e2e/terminal.spec.ts`
  - `terminal is visible when expanded`

### Unit/integration coverage highlights
- `src/App.test.tsx`: app-shell composition, connection gating, project selection/addition, layout toggles, session wiring.
- `src/services/OpenCodeClient.test.ts`: singleton behavior, status transitions, HTTP/auth/timeout handling, accessor availability.
- `src/hooks/useSessionEvents.test.tsx`: event stream update/remove semantics, retry/backoff, abort lifecycle.
- `src/hooks/useModels.test.tsx`: model flattening/filtering/defaulting/sorting/provider-connectivity semantics.
- `src/hooks/useMcp.test.tsx`: MCP status fetch, connect/disconnect mutation behavior, cache update semantics.
- `src/components/StatusPopover.test.tsx`: servers/MCP/LSP/plugins tabs and empty states.
- `src/components/PromptInput.test.tsx`: submit semantics, attachments, disabled/pending states.
- `src/components/MessageList.test.tsx`: rich part rendering (markdown/code/tool/reasoning/file), pending timing, hash-focus/resume behavior.
- `src/components/FileTree.test.tsx`: lazy expansion, styling/status, drag handling, loading behavior.
- `src/utils/storage.test.ts`: persistence safety for projects/paths/session seen/server list.

## Crush: confirmed strategy coverage (feature mapped)

### Confirmed test file inventory (broad)
- Agent/tooling:
  - `internal/agent/agent_test.go`
  - `internal/agent/common_test.go`
  - `internal/agent/tools/grep_test.go`
  - `internal/agent/tools/job_test.go`
  - `internal/agent/tools/multiedit_test.go`
- App/cmd/projects:
  - `internal/app/app_test.go`
  - `internal/app/provider_test.go`
  - `internal/cmd/dirs_test.go`
  - `internal/cmd/projects_test.go`
  - `internal/projects/projects_test.go`
- Config:
  - `internal/config/attribution_migration_test.go`
  - `internal/config/catwalk_test.go`
  - `internal/config/hyper_test.go`
  - `internal/config/load_test.go`
  - `internal/config/lsp_defaults_test.go`
  - `internal/config/provider_empty_test.go`
  - `internal/config/provider_test.go`
  - `internal/config/recent_models_test.go`
  - `internal/config/resolve_test.go`
- Concurrency/sync primitives:
  - `internal/csync/maps_test.go`
  - `internal/csync/slices_test.go`
  - `internal/csync/value_test.go`
  - `internal/csync/versionedmap_test.go`
- Filesystem/search:
  - `internal/fsext/fileutil_test.go`
  - `internal/fsext/ignore_test.go`
  - `internal/fsext/lookup_test.go`
  - `internal/fsext/ls_test.go`
  - `internal/fsext/paste_test.go`
- Shell/LSP/log/env/skills/ui/update:
  - `internal/shell/background_test.go`
  - `internal/shell/command_block_test.go`
  - `internal/shell/comparison_test.go`
  - `internal/shell/shell_test.go`
  - `internal/lsp/client_test.go`
  - `internal/log/http_test.go`
  - `internal/env/env_test.go`
  - `internal/skills/skills_test.go`
  - `internal/ui/diffview/diffview_test.go`
  - `internal/ui/diffview/udiff_test.go`
  - `internal/ui/diffview/util_test.go`
  - `internal/update/update_test.go`

### Sample concrete Crush test cases (from code snippets)
- `internal/csync/maps_test.go`
  - `TestNewMap`
  - `TestNewMapFrom`
- `internal/csync/value_test.go`
  - `TestValue_GetSet`
  - `TestValue_ZeroValue`
  - `TestValue_Struct`
- `internal/config/load_test.go`
  - `TestMain`
  - `TestConfig_LoadFromBytes`
- `internal/config/catwalk_test.go`
  - `TestCatwalkSync_Init`
  - `TestCatwalkSync_GetPanicIfNotInit`
- `internal/config/hyper_test.go`
  - `TestHyperSync_Init`
  - `TestHyperSync_GetPanicIfNotInit`
- `internal/config/provider_test.go`
  - `TestProviders_Integration_AutoUpdateDisabled`
  - `TestProviders_Integration_WithMockClients`
- `internal/agent/tools/job_test.go`
  - `TestBackgroundShell_Integration`
  - `TestBackgroundShell_Kill`
- `internal/shell/background_test.go`
  - `TestBackgroundShellManager_Start`
  - `TestBackgroundShellManager_Get`

## Feature-parity judgement (OpenSpace vs peers)

### At parity / near parity
- Core session lifecycle UX: create/rename/archive/delete, active-session behavior.
- Prompt send + generation lifecycle (including stop/abort).
- Basic provider/model picker behavior.
- Status/MCP/LSP surface visibility.
- File tree basic interaction and rendering.

### Behind OpenCode
- Workspace lifecycle (enable/create/rename/reset/delete/reorder).
- Keybind behavior coverage (end-to-end action effect + persistence).
- Settings breadth (theme/font/language/notification/release notes/providers/models deep variants).
- Prompt advanced UX (`@mention`, `/open`, context panel).
- Status popover interaction depth (all tab switching and close conditions).
- Terminal lifecycle depth (multi-tab init/interaction, action shortcuts).

### Behind Crush
- Deep non-UI robustness suites for:
  - config loading/merging/migrations/provider resolution,
  - shell background process lifecycle,
  - filesystem/search edge behavior,
  - concurrency/sync data structures,
  - low-level tool internals.

## Concrete target to be “at least as good”
- Add OpenCode-level e2e feature depth in OpenSpace for:
  - advanced prompt interactions,
  - workspace/project management,
  - settings/keybind persistence + behavior semantics,
  - status/terminal interaction depth.
- Add Crush-style robustness suites in OpenSpace for:
  - config resolution/validation,
  - fs/search edge cases,
  - shell/job lifecycle,
  - state-sync/reducer ordering + reconciliation.

## Notes
- This report is feature-driven by explicit test cases and file-level evidence.
- OpenCode e2e list above is based on direct file reads from `github` MCP.
- Crush list is complete at file-inventory level; concrete function list is representative and can be expanded to exhaustive `func Test...` enumeration in a follow-up pass.
