# INVENTORY A: opencode-client (SolidJS — the Original)

> **Purpose**: Exhaustive feature inventory of the opencode SolidJS client.
> This is the reference implementation. Every feature listed here is a candidate for parity analysis against the openspace port.

---

## 1. Layout & Navigation

- Home page with server health status display, recent projects list, and "Open" button to select a project
- Main layout composed of: sidebar (left) + message area (center) + file tree (right) + terminal (bottom) + project rail (top)
- Sidebar with session list, workspace management, and project navigation
- Drag-and-drop project reorder in the sidebar
- Resizable terminal panel docked to bottom of main area
- File tree panel on the right side of the layout
- Project rail at the top with settings access
- Review panel overlay for diff viewing (split/unified)
- Collapsible sidebar (Mod+B toggle)
- Collapsible terminal (Mod+J toggle)
- Collapsible file tree (Mod+\ toggle)

## 2. Chat / Prompt Input

- ContentEditable prompt editor (not a plain textarea)
- @file mentions rendered as inline pills in the prompt
- @agent mentions rendered as inline pills in the prompt
- /slash command autocomplete: `/reset`, `/clear`, `/compact`
- `!` shell mode prefix for running shell commands directly
- Image attachments with preview in the prompt area
- Prompt history navigation with Up/Down arrow keys
- IME composition handling (CJK input support)
- Multi-line input support
- Context items displayed inline in prompt area

## 3. Message Display & Streaming

- Streaming message display with real-time token rendering
- Markdown rendering via `marked` library
- Syntax highlighting via `shiki` (web worker-based)
- LaTeX/math rendering via `katex`
- Copy-to-clipboard button on every code block
- Tool call results displayed with per-tool registered renderers:
  - `read` — file content display
  - `list` — directory listing
  - `glob` — file pattern match results
  - `grep` — content search results
  - `webfetch` — fetched web content
  - `task` — sub-agent task display
  - `bash` — terminal output
  - `edit` — inline diff viewer (before/after)
  - `write` — inline code display (new file content)
  - `apply_patch` — multi-file patch display
  - `todowrite` — interactive checklist
  - `question` — question wizard / interactive prompt
- Reasoning/thinking parts displayed (collapsible)
- Retry button on failed messages
- Cancel button on in-progress messages
- Duration timer displayed per assistant turn
- Auto-scroll during streaming with scroll spy (pauses on manual scroll-up)
- Turn-based message grouping (user turn → assistant turn)

## 4. Sessions

- Create new session (Mod+N)
- List all sessions in sidebar
- Switch between sessions (Alt+Up / Alt+Down)
- Prefetch adjacent sessions for instant switching
- Session tabs with drag-and-drop reorder
- Tab handoff (transfer session context between tabs/windows)
- Session history in sidebar

## 5. Settings

- **General tab**: autoSave toggle, releaseNotes toggle
- **Updates section**: update check, update available notification
- **Appearance tab**: fontSize slider, font family dropdown with 12 monospace font options
- **Keybinds tab**: configurable keyboard shortcut bindings
- **Permissions tab**: autoApprove toggle for tool calls
- **Notifications tab**: notification preferences
- **Sounds tab**: sound effect preferences
- **Models tab**: model configuration
- **Providers tab**: provider/API key management
- **MCP tab**: MCP server configuration
- **Agents tab**: agent configuration
- **Commands tab**: command configuration

## 6. Diff Viewer / Code Review

- Full diff viewer powered by `@pierre/diffs` library
- Shadow DOM isolation for diff rendering
- Split view mode (side-by-side)
- Unified view mode (inline)
- Toggle between split and unified views
- Line selection with click-and-drag range highlighting
- Line comments system (add comments on specific diff lines)
- File accordion (expand/collapse individual files in multi-file diffs)
- Image file diff support
- Audio file diff support
- Syntax highlighting via shiki (web worker offloaded)
- Review panel as a dedicated overlay/modality

## 7. File Operations & File Tree

- File tree with hierarchical expand/collapse
- Filter/search within file tree
- Drag-and-drop files from tree into prompt (creates @file mention)
- Modification markers on files: A (added), D (deleted), M (modified)
- Tooltip on hover showing full file path
- File search functionality (find files by name)
- File tree toggle (Mod+\)

## 8. Model Selection

- Model selector dropdown/popover
- Recent models list for quick access
- Visibility toggle (show/hide specific models)
- Variant cycling (rotate through model variants)

## 9. Tools & MCP

- Tool registry with 12+ built-in tools: read, list, glob, grep, webfetch, task, bash, edit, write, apply_patch, todowrite, question
- Each tool has a dedicated renderer component for displaying results
- MCP server status displayed in StatusPopover
- MCP toggle switches for enabling/disabling individual MCP servers
- Tool call status indicators (pending, running, completed, failed)

## 10. Keyboard Shortcuts & Commands

- 40+ registered commands
- Command palette (Mod+Shift+P)
- Key shortcuts include:
  - Mod+P — command palette (alternate binding)
  - Mod+Shift+P — command palette
  - Mod+B — toggle sidebar
  - Mod+J — toggle terminal
  - Mod+\ — toggle file tree
  - Alt+Up / Alt+Down — navigate sessions
  - Mod+N — new session
  - Mod+, — open settings
- Commands for: sidebar control, project management, session management, workspace management, theme cycling, language cycling
- Configurable keybindings via settings

## 11. Context & Attachments

- File attachments with line range selection (attach specific lines of a file)
- @agent mentions to invoke specific agents
- Image attachments with preview thumbnails
- Context items displayed in prompt area before sending
- Drag-and-drop files from file tree into prompt

## 12. Themes & Appearance

- 15 bundled themes: oc-1, aura, ayu, carbonfox, catppuccin, dracula, gruvbox, monokai, nightowl, nord, onedarkpro, shadesofpurple, solarized, tokyonight, vesper
- Color scheme modes: System, Light, Dark
- OKLCH color system with 9 seed colors generating 250+ CSS tokens
- Font size slider (adjustable)
- 12 monospace font family options
- Theme cycling command

## 13. Auth & Providers

- Provider management in settings panel
- API key entry per provider
- Multiple provider support
- Provider health status display

## 14. Notifications & Toasts

- Toast notification system for errors, info, success
- Permission request popups (tool approval prompts)
- Question popups (interactive prompts from the `question` tool)
- Update available alerts
- Auto-dismiss behavior

## 15. Copy & Share

- Copy-to-clipboard on all code blocks in messages
- Copy code from diff viewer
- No share/export feature observed

## 16. Command Palette

- Full command palette (Mod+Shift+P)
- 40+ registered commands searchable by name
- Commands span: sidebar, project, session, workspace, theme, language, navigation
- Fuzzy search/filter on command names

## 17. Status & Health

- Server health indicator (checks every 10 seconds)
- LSP status display
- MCP status display with per-server toggle switches
- Plugin status display
- Connection status indicator
- StatusPopover consolidating all status information

## 18. Error Handling

- Toast notifications for all error types
- Server health checks on 10-second interval
- Automatic reconnection logic
- Error states in tool call renderers

## 19. Platform & Additional Features

- **Terminal**: ghostty-web WASM terminal emulator, WebSocket PTY backend, serialize addon for session persistence across reloads
- **Desktop**: Tauri v2 wrapper with:
  - Deep-link protocol handling
  - Native dialog integration
  - Shell command execution
  - Auto-updater
  - Window state persistence (size, position)
- **Internationalization**: 16 languages supported (full i18n)
- **Release Notes**: Changelog/highlights system for new versions
- **Workspace Management** (git worktrees):
  - Create new worktree
  - Rename worktree
  - Reorder worktrees (drag-and-drop)
  - Reset worktree
  - Delete worktree
  - Toggle worktree active/inactive
- **Performance**: Shiki syntax highlighting offloaded to web workers
- **Persistence**: Terminal state serialized for session continuity
