# INVENTORY B: openspace-client (React — the Port)

> **Purpose**: Exhaustive feature inventory of the openspace React client as it exists today.
> This is the port. Every feature listed here should be compared against Inventory A for gap analysis.

---

## 1. Layout & Navigation

- No home page — application opens directly to project view
- Main layout composed of: ProjectRail (left, 68px icon bar) → SessionSidebar (260px, collapsible) → Main area (AgentConsole + optional WhiteboardFrame split) → Optional FileTree (right, 280px) → Terminal (bottom, resizable)
- ProjectRail: fixed left icon bar for project-level navigation
- SessionSidebar: session list with create/delete/rename/archive actions
- TopBar with: sidebar toggle, back/forward navigation buttons, search trigger (Cmd+P), StatusPopover, share button, terminal toggle, file tree toggle
- Resizable terminal panel docked to bottom
- File tree panel on the right (280px, collapsible)
- WhiteboardFrame as optional split pane alongside AgentConsole (openspace-specific, no opencode equivalent)
- Collapsible sidebar (Mod+B toggle)
- Collapsible terminal (Mod+J toggle)
- Collapsible file tree (Mod+\ toggle)
- No drag-and-drop project reorder
- No review panel / diff modality overlay

## 2. Chat / Prompt Input

- RichEditor with contentEditable (not a plain textarea)
- @file mentions rendered as inline pills
- @agent mentions rendered as inline pills
- /slash command autocomplete: `/reset`, `/clear`, `/compact`, `/whiteboard`
- `!` shell mode prefix for running shell commands
- Prompt history navigation with Up/Down arrow keys
- IME composition handling (CJK input support)
- Multi-line input support
- Image attachments via file input
- PDF attachments via file input
- Attachment thumbnails with remove button
- ContextPanel for workspace file insertion

## 3. Message Display & Streaming

- Streaming message display with real-time token rendering
- Markdown rendering via `ReactMarkdown`
- Syntax highlighting via `Prism` with `oneDark` theme
- No LaTeX/math rendering (no katex equivalent)
- Copy-to-clipboard button on code blocks
- Tool call results displayed as generic expandable sections with status dots (green/yellow/red)
- No per-tool custom renderers — all tool results use the same generic expandable display
- Reasoning/thinking parts displayed (italic styling)
- Scroll-to-bottom FAB (floating action button)
- Hash-based message focus (URL fragment linking to specific messages)
- Load-more pagination for long message histories
- Turn-based message grouping (user turn → assistant turn)
- No retry button on failed messages
- No cancel button on in-progress messages
- No duration timer per turn
- No auto-scroll with scroll spy behavior

## 4. Sessions

- Create new session (Mod+N)
- Delete session
- Rename session (inline edit in sidebar)
- Archive/unarchive sessions
- Unseen message indicators on session tabs
- "Next unseen" button to jump to next session with new messages
- Load more sessions (pagination in sidebar)
- Prefetching adjacent sessions
- No drag-and-drop session tab reorder
- No session switching via Alt+Up/Alt+Down
- No tab handoff between windows

## 5. Settings (6 tabs)

- **General tab**:
  - Color scheme selector: System / Light / Dark
  - Theme selector: OpenSpace / Graphite / Paper
  - Font family: Space Grotesk / Inter / IBM Plex Sans
  - 3 notification checkboxes
  - Sound selector: None / Chime / Ding
  - 2 update-related checkboxes
- **Shortcuts tab**: 7 configurable shortcuts with key-capture UI and reset-to-defaults button
- **Providers tab**: provider list with connect/disconnect actions, API key entry
- **Agents tab**: default agent dropdown, agent list display
- **Terminal tab**: default shell selector (Default / Bash / Zsh / Fish)
- **Language tab**: 4 languages (English / Deutsch / Espanol / Francais)
- No autoSave toggle
- No releaseNotes toggle
- No fontSize slider
- No permissions/autoApprove toggle
- No MCP configuration tab
- No Commands configuration tab
- No Keybinds configuration beyond the 7 shortcuts

## 6. Diff Viewer / Code Review

- **NOT implemented as a separate modality**
- No `@pierre/diffs` integration or equivalent
- No split view mode
- No unified view mode
- No split/unified toggle
- No line selection with drag
- No line comments system
- No file accordion for multi-file diffs
- No image/audio diff support
- Code diffs shown only inline within tool call result sections (edit/write tool outputs in MessageList)
- No dedicated review panel

## 7. File Operations & File Tree

- FileTree with recursive lazy-loading of directories
- Git status colors on files: added (green), modified (yellow), deleted (red)
- Directory expand/collapse
- Whiteboard file detection (.graph.mmd / .excalidraw files highlighted)
- Drag support (drag files out of tree)
- File tree toggle (Mod+\)
- No filter/search within file tree
- No file modification markers (A/D/M labels)
- No tooltip with full file path on hover
- No drag-and-drop files into prompt to create @file mentions

## 8. Model Selection

- ModelSelector popover with search input
- Models grouped by provider
- Checkmark indicator for currently selected model
- Settings button (links to provider settings)
- Add button (links to add provider)
- No recent models list
- No visibility toggle for models
- No variant cycling

## 9. Tools & MCP

- Tool calls displayed as expandable sections with status dot indicators (pending/running/completed/failed)
- Generic display for all tool types — no per-tool custom renderers
- MCP toggle switches in StatusPopover
- No dedicated tool result renderers for: read, list, glob, grep, webfetch, task, bash, edit (inline diff), write (inline code), apply_patch (multi-file), todowrite (checklist), question (wizard)

## 10. Keyboard Shortcuts & Commands

- 7 configurable shortcuts:
  - Mod+K — open command palette
  - Mod+, — open settings
  - Mod+O — open file
  - Mod+N — new session
  - Mod+B — toggle sidebar
  - Mod+J — toggle terminal
  - Mod+\ — toggle file tree
- Configurable via Settings > Shortcuts tab with key-capture UI
- Reset to defaults button
- No 40+ command set (only 7 shortcuts + 6 command palette commands)
- No Alt+Up/Alt+Down session navigation
- No Mod+Shift+P binding
- No theme cycling shortcut
- No language cycling shortcut

## 11. Context & Attachments

- Image attachments via file input with thumbnail preview and remove button
- PDF attachments via file input with thumbnail preview and remove button
- ContextPanel for inserting workspace files into context
- @file mentions as inline pills in prompt
- @agent mentions as inline pills in prompt
- No file line-range selection (cannot attach specific lines of a file)
- No drag-and-drop from file tree to prompt

## 12. Themes & Appearance

- 3 themes: OpenSpace, Graphite, Paper
- Color scheme modes: System, Light, Dark
- CSS custom properties for theming
- 3 font families: Space Grotesk, Inter, IBM Plex Sans
- No OKLCH color system
- No 250+ generated CSS tokens
- No fontSize slider
- No 12 monospace font options
- No theme cycling command

## 13. Auth & Providers

- Provider management in Settings > Providers tab
- Connect/disconnect actions per provider
- API key entry per provider
- Server management dialog:
  - Add new server
  - Edit existing server
  - Delete server
  - Set default server
  - Server health checking
- Multiple provider support

## 14. Notifications & Toasts

- ToastHost component for toast notifications
- Toast types: error, info, success
- Auto-dismiss behavior
- Deduplication (prevents duplicate toasts)
- No permission request popups (no tool approval prompts)
- No question popups (no interactive question wizard)
- No update available alerts

## 15. Copy & Share

- Copy-to-clipboard on code blocks in messages
- Share button in TopBar (implementation status unclear — may be placeholder)
- No copy from diff viewer (no diff viewer exists)

## 16. Command Palette

- Command palette triggered by Mod+K
- 6 registered commands
- /slash commands in prompt: reset, clear, compact, whiteboard
- No fuzzy search across 40+ commands
- Limited command coverage (no sidebar, project, workspace, theme, language cycling commands)

## 17. Status & Health

- StatusPopover with 4 tabs:
  - Servers — server connection status
  - MCP — MCP server toggle switches
  - LSP — language server status
  - Plugins — plugin status
- ConnectionStatus badge in UI
- No periodic server health checks (no 10-second polling)
- Connection retry button

## 18. Error Handling

- Toast notifications for errors
- Connection retry button in status area
- No periodic health check polling
- No granular error states in tool call renderers (only generic status dots)

## 19. Platform & Additional Features

- **Terminal**: xterm.js terminal emulator, WebSocket PTY backend
  - No terminal session persistence/serialization
  - Default shell selector in settings (Default / Bash / Zsh / Fish)
- **Whiteboard** (openspace-specific, no opencode equivalent):
  - Excalidraw-based drawing canvas
  - Mermaid diagram support with bidirectional sync (Mermaid ↔ Excalidraw)
  - SSE (Server-Sent Events) for live whiteboard updates
  - BroadcastChannel for multi-window sync
  - Send-to-agent with PNG snapshot capture
  - `/whiteboard` slash command
  - .graph.mmd and .excalidraw file detection in file tree
- **Internationalization**: 4 languages (English, Deutsch, Espanol, Francais)
- **Workspace Management**: git worktrees support (details TBD — less feature-complete than opencode)
- **No desktop wrapper** — web-only, no Tauri
- **No release notes / changelog highlights system**
- **No deep-link protocol handling**
- **No native dialog integration**
- **No auto-updater**
- **No window state persistence**
- **No shiki web worker syntax highlighting** (uses Prism synchronously)
