# OpenCode vs OpenSpace Client Feature Parity (Verified)

Scope: OpenCode web client (`packages/app`) + OpenCode desktop shell (`packages/desktop`) compared to OpenSpace React client (`openspace-client`).

Legend: ✅ implemented, ⚠️ partial/limited, ❌ not implemented, 🖥️ optional desktop-only

Columns:
- OpenCode ref: verified file location in `packages/app` (web UI) or `packages/desktop` (optional)
- OpenSpace ref: verified file location in `openspace-client`, or recommended target if missing

---

## Projects & Workspaces

| Feature | OpenCode | OpenSpace | OpenCode ref | OpenSpace ref / target |
| --- | --- | --- | --- | --- |
| Multi-project list | ✅ | ✅ | packages/app/src/pages/layout.tsx | openspace-client/src/components/sidebar/ProjectRail.tsx |
| Project rail active state | ✅ | ✅ | packages/app/src/pages/layout/sidebar-project.tsx | openspace-client/src/components/sidebar/ProjectRail.tsx |
| Add project from picker | ✅ | ✅ | packages/app/src/pages/layout.tsx | openspace-client/src/components/DialogSelectDirectory.tsx |
| Rename project | ✅ | ❌ | packages/app/src/pages/layout.tsx | target: openspace-client/src/components/sidebar/ProjectRail.tsx |
| Close/remove project | ✅ | ❌ | packages/app/src/pages/layout.tsx | target: openspace-client/src/components/sidebar/ProjectRail.tsx |
| Worktree/workspace grouping | ✅ | ❌ | packages/app/src/pages/layout/sidebar-workspace.tsx | target: openspace-client/src/components/sidebar/ProjectRail.tsx |
| Workspace rename per branch | ✅ | ❌ | packages/app/src/pages/layout.tsx | target: openspace-client/src/components/sidebar/ProjectRail.tsx |
| Workspace create/reset/delete | ✅ | ❌ | packages/app/src/pages/layout.tsx | target: openspace-client/src/components/sidebar/ProjectRail.tsx |
| Project deep-link open | ✅ | ❌ | packages/app/src/pages/layout/deep-links.ts | target: openspace-client/src/App.tsx |
| Last project/session restore | ✅ | ⚠️ | packages/app/src/pages/layout.tsx | openspace-client/src/hooks/useSessions.ts |

---

## Sessions

| Feature | OpenCode | OpenSpace | OpenCode ref | OpenSpace ref / target |
| --- | --- | --- | --- | --- |
| Session list per project | ✅ | ✅ | packages/app/src/pages/layout.tsx | openspace-client/src/components/sidebar/SessionSidebar.tsx |
| Create new session | ✅ | ✅ | packages/app/src/pages/session.tsx | openspace-client/src/components/sidebar/SessionSidebar.tsx |
| Session title edit | ✅ | ✅ | packages/app/src/pages/session/message-timeline.tsx | openspace-client/src/components/sidebar/SessionSidebar.tsx |
| Session archive | ✅ | ✅ | packages/app/src/pages/session/message-timeline.tsx | openspace-client/src/components/sidebar/SessionSidebar.tsx, openspace-client/src/hooks/useSessionActions.ts |
| Session delete | ✅ | ✅ | packages/app/src/pages/session/message-timeline.tsx | openspace-client/src/components/sidebar/SessionSidebar.tsx, openspace-client/src/hooks/useSessionActions.ts |
| Parent/child session navigation | ✅ | ❌ | packages/app/src/pages/session/message-timeline.tsx | target: openspace-client/src/components/MessageList.tsx |
| Session prefetch (adjacent) | ✅ | ✅ | packages/app/src/pages/layout.tsx | openspace-client/src/App.tsx |
| Session history pagination | ✅ | ✅ | packages/app/src/pages/session/message-timeline.tsx | openspace-client/src/hooks/useMessages.ts, openspace-client/src/components/MessageList.tsx |
| Session navigation keybinds | ✅ | ❌ | packages/app/src/pages/layout.tsx | target: openspace-client/src/components/AgentConsole.tsx |
| “Unseen” session navigation | ✅ | ✅ | packages/app/src/pages/layout.tsx | openspace-client/src/components/sidebar/SessionSidebar.tsx, openspace-client/src/App.tsx |

---

## Message Timeline

| Feature | OpenCode | OpenSpace | OpenCode ref | OpenSpace ref / target |
| --- | --- | --- | --- | --- |
| Turn grouping (user + assistants) | ✅ | ✅ | packages/app/src/pages/session/message-timeline.tsx | openspace-client/src/components/MessageList.tsx |
| Load earlier/backfill | ✅ | ❌ | packages/app/src/pages/session/message-timeline.tsx | target: openspace-client/src/hooks/useMessages.ts |
| Scroll-spy active message | ✅ | ❌ | packages/app/src/pages/session/scroll-spy.ts | target: openspace-client/src/components/MessageList.tsx |
| Hash-based message focus | ✅ | ❌ | packages/app/src/pages/session/use-session-hash-scroll.ts | target: openspace-client/src/components/MessageList.tsx |
| Gesture boundary handling | ✅ | ❌ | packages/app/src/pages/session/message-gesture.ts | target: openspace-client/src/components/MessageList.tsx |
| Auto-scroll w/ resume button | ✅ | ❌ | packages/app/src/pages/session/message-timeline.tsx | target: openspace-client/src/components/MessageList.tsx |
| Tool output collapse/expand | ✅ | ✅ | packages/app/src/pages/session/message-timeline.tsx | openspace-client/src/components/MessageList.tsx |
| Reasoning collapse/expand | ✅ | ✅ | packages/app/src/pages/session/message-timeline.tsx | openspace-client/src/components/MessageList.tsx |
| Markdown + code highlight | ✅ | ✅ | packages/app/src/pages/session/message-timeline.tsx | openspace-client/src/components/MessageList.tsx |
| Copy assistant content | ✅ | ✅ | packages/app/src/pages/session/message-timeline.tsx | openspace-client/src/components/MessageList.tsx |
| Per-message timestamp | ✅ | ✅ | packages/app/src/pages/session/message-timeline.tsx | openspace-client/src/components/MessageList.tsx |
| Error banner on assistant error | ✅ | ✅ | packages/app/src/pages/session/message-timeline.tsx | openspace-client/src/components/MessageList.tsx |

---

## Prompt Input

| Feature | OpenCode | OpenSpace | OpenCode ref | OpenSpace ref / target |
| --- | --- | --- | --- | --- |
| Contenteditable prompt | ✅ | ❌ | packages/app/src/components/prompt-input.tsx | target: openspace-client/src/components/PromptInput.tsx |
| @mention file/agent + pills | ✅ | ❌ | packages/app/src/components/prompt-input.tsx | target: openspace-client/src/components/PromptInput.tsx |
| Slash commands | ✅ | ❌ | packages/app/src/components/prompt-input.tsx | target: openspace-client/src/components/PromptInput.tsx |
| Prompt history (normal + shell) | ✅ | ❌ | packages/app/src/components/prompt-input.tsx + prompt-input/history.ts | target: openspace-client/src/components/PromptInput.tsx |
| Shell mode (`!`) | ✅ | ❌ | packages/app/src/components/prompt-input.tsx | target: openspace-client/src/components/PromptInput.tsx |
| Prompt draft persistence | ✅ | ❌ | packages/app/src/context/prompt.tsx | target: openspace-client/src/hooks/useSessions.ts or new context |
| Drag/drop attachments | ✅ | ⚠️ | packages/app/src/components/prompt-input.tsx + prompt-input/drag-overlay.tsx | openspace-client/src/components/PromptInput.tsx |
| Paste image attachment | ✅ | ❌ | packages/app/src/components/prompt-input.tsx + prompt-input/attachments.ts | target: openspace-client/src/components/PromptInput.tsx |
| Multi-image attachments | ✅ | ✅ | packages/app/src/components/prompt-input.tsx | openspace-client/src/components/PromptInput.tsx |
| Attachment preview/remove | ✅ | ✅ | packages/app/src/components/prompt-input.tsx | openspace-client/src/components/PromptInput.tsx |
| Context items list (files/comments) | ✅ | ❌ | packages/app/src/components/prompt-input/context-items.tsx | target: openspace-client/src/components/PromptInput.tsx |
| Auto-accept permissions toggle | ✅ | ❌ | packages/app/src/components/prompt-input.tsx + context/permission.tsx | target: openspace-client/src/components/PromptInput.tsx |
| Stop generation (abort) | ✅ | ❌ | packages/app/src/pages/session.tsx | target: openspace-client/src/components/AgentConsole.tsx |

---

## Context & Review - N/A opensoace-client


| Feature | OpenCode | OpenSpace | OpenCode ref | OpenSpace ref / target |
| --- | --- | --- | --- | --- |
| Session diff review panel | ✅ | ❌ | packages/app/src/pages/session/review-tab.tsx | target: openspace-client/src/components/ReviewPanel.tsx |
| Unified/split diff toggle | ✅ | ❌ | packages/app/src/pages/session/review-tab.tsx | target: openspace-client/src/components/ReviewPanel.tsx |
| Diff navigation (prev/next) | ✅ | ❌ | packages/app/src/pages/session/review-tab.tsx | target: openspace-client/src/components/ReviewPanel.tsx |
| Inline review comments | ✅ | ❌ | packages/app/src/pages/session/file-tabs.tsx | target: openspace-client/src/components/ReviewPanel.tsx |
| Add selection to context | ✅ | ❌ | packages/app/src/pages/session/file-tabs.tsx | target: openspace-client/src/components/ReviewPanel.tsx |
| Context usage indicator | ✅ | ✅ | packages/app/src/components/session-context-usage.tsx | openspace-client/src/components/ContextMeter.tsx |

---

## File Tree & File Tabs 

| Feature | OpenCode | OpenSpace | OpenCode ref | OpenSpace ref / target |
| --- | --- | --- | --- | --- |
| Lazy directory loading | ✅ | ✅ | packages/app/src/components/file-tree.tsx | openspace-client/src/components/FileTree.tsx |
| File status markers | ✅ | ✅ | packages/app/src/components/file-tree.tsx | openspace-client/src/components/FileTree.tsx |
| Changes/all toggle | ✅ | ❌ | packages/app/src/pages/session/session-side-panel.tsx | target: openspace-client/src/components/FileTree.tsx |
| Drag file to context | ✅ | ⚠️ | packages/app/src/components/file-tree.tsx | openspace-client/src/components/FileTree.tsx |
| File tabs (open files) | ✅ | ❌ | packages/app/src/pages/session/session-side-panel.tsx + file-tabs.tsx | target: openspace-client/src/components/AgentConsole.tsx |
| File tooltips + diff badges | ✅ | ❌ | packages/app/src/components/file-tree.tsx | target: openspace-client/src/components/FileTree.tsx |

---

## Terminal

| Feature | OpenCode | OpenSpace | OpenCode ref | OpenSpace ref / target |
| --- | --- | --- | --- | --- |
| Single PTY | ✅ | ✅ | packages/app/src/components/terminal.tsx | openspace-client/src/components/Terminal.tsx |
| Multi-terminal tabs | ✅ | ❌ | packages/app/src/pages/session/terminal-panel.tsx | target: openspace-client/src/components/Terminal.tsx |
| Terminal drag-reorder | ✅ | ❌ | packages/app/src/pages/session/terminal-panel.tsx | target: openspace-client/src/components/Terminal.tsx |
| Terminal create/close | ✅ | ❌ | packages/app/src/context/terminal.tsx | target: openspace-client/src/hooks/useTerminal.ts |
| Terminal buffer serialization | ✅ | ❌ | packages/app/src/components/terminal.tsx | target: openspace-client/src/components/Terminal.tsx |
| Workspace-scoped terminals | ✅ | ❌ | packages/app/src/context/terminal.tsx | target: openspace-client/src/hooks/useTerminal.ts |
| Resize handle | ✅ | ✅ | packages/app/src/pages/session/terminal-panel.tsx | openspace-client/src/components/Terminal.tsx |

---

## Models & Agentsv

| Feature | OpenCode | OpenSpace | OpenCode ref | OpenSpace ref / target |
| --- | --- | --- | --- | --- |
| Agent list from server | ✅ | ✅ | packages/app/src/context/sync.tsx | openspace-client/src/hooks/useAgents.ts |
| Agent selector | ✅ | ✅ | packages/app/src/components/prompt-input.tsx | openspace-client/src/components/AgentSelector.tsx |
| Model selector | ✅ | ✅ | packages/app/src/components/dialog-select-model.tsx | openspace-client/src/components/ModelSelector.tsx |
| Provider grouping | ✅ | ✅ | packages/app/src/components/dialog-select-model.tsx | openspace-client/src/components/ModelSelector.tsx |
| Model tooltip details | ✅ | ❌ | packages/app/src/components/model-tooltip.tsx | target: openspace-client/src/components/ModelSelector.tsx |
| Provider icons | ✅ | ❌ | packages/app/src/components/prompt-input.tsx | target: openspace-client/src/components/ModelSelector.tsx |
| Free/paid gating label | ✅ | ❌ | packages/app/src/components/dialog-select-model.tsx | target: openspace-client/src/components/ModelSelector.tsx |

---

## Providers

| Feature | OpenCode | OpenSpace | OpenCode ref | OpenSpace ref / target |
| --- | --- | --- | --- | --- |
| Provider list | ✅ | ✅ | packages/app/src/components/dialog-select-provider.tsx | openspace-client/src/components/DialogSelectProvider.tsx |
| Connect provider | ✅ | ✅ | packages/app/src/components/dialog-select-provider.tsx | openspace-client/src/components/DialogConnectProvider.tsx |
| Provider auth status UI | ✅ | ⚠️ | packages/app/src/components/dialog-select-provider.tsx | openspace-client/src/components/DialogConnectProvider.tsx |

---

## Status (Servers, MCP, LSP, Plugins)

| Feature | OpenCode | OpenSpace | OpenCode ref | OpenSpace ref / target |
| --- | --- | --- | --- | --- |
| Connection check/offline state | ✅ | ✅ | packages/app/src/components/status-popover.tsx | openspace-client/src/components/ConnectionStatus.tsx |
| MCP status list | ✅ | ✅ | packages/app/src/components/status-popover.tsx | openspace-client/src/components/StatusPopover.tsx |
| MCP toggle connect/disconnect | ✅ | ✅ | packages/app/src/components/status-popover.tsx | openspace-client/src/components/StatusPopover.tsx |
| LSP status list | ✅ | ✅ | packages/app/src/components/status-popover.tsx | openspace-client/src/components/StatusPopover.tsx |
| Plugins list | ✅ | ✅ | packages/app/src/components/status-popover.tsx | openspace-client/src/components/StatusPopover.tsx |
| Multi-server list + health | ✅ | ✅ | packages/app/src/components/status-popover.tsx | openspace-client/src/components/StatusPopover.tsx, openspace-client/src/components/DialogManageServers.tsx |
| Default server management | ✅ | ✅ | packages/app/src/components/status-popover.tsx | openspace-client/src/components/DialogManageServers.tsx, openspace-client/src/context/ServerContext.tsx |

---

## Layout & Navigation - N/A opensoace-client

| Feature | OpenCode | OpenSpace | OpenCode ref | OpenSpace ref / target |
| --- | --- | --- | --- | --- |
| Sidebar toggle | ✅ | ✅ | packages/app/src/pages/layout.tsx | openspace-client/src/App.tsx |
| Mobile tabs (session/changes) | ✅ | ❌ | packages/app/src/pages/session/session-mobile-tabs.tsx | target: openspace-client/src/App.tsx |
| Review panel split view | ✅ | ❌ | packages/app/src/pages/session/session-side-panel.tsx | target: openspace-client/src/AgentConsole.tsx |
| Sidebar hover-expand | ✅ | ❌ | packages/app/src/pages/layout.tsx | target: openspace-client/src/App.tsx |
| Command palette | ✅ | ❌ | packages/app/src/context/command.tsx | target: openspace-client/src/components/CommandPalette.tsx |

---

## Notifications & Permissions

| Feature | OpenCode | OpenSpace | OpenCode ref | OpenSpace ref / target |
| --- | --- | --- | --- | --- |
| Permission prompt with actions | ✅ | ❌ | packages/app/src/pages/session/session-prompt-dock.tsx | target: openspace-client/src/components/AgentConsole.tsx |
| Question dock (inline) | ✅ | ❌ | packages/app/src/pages/session/session-prompt-dock.tsx | target: openspace-client/src/components/AgentConsole.tsx |
| Permission memory (auto-accept) | ✅ | ❌ | packages/app/src/context/permission.tsx | target: openspace-client/src/hooks/useSessionEvents.ts |
| Sound cues | ✅ | ❌ | packages/app/src/utils/sound.ts | target: openspace-client/src/components/AgentConsole.tsx |

---

## Settings & i18n

| Feature | OpenCode | OpenSpace | OpenCode ref | OpenSpace ref / target |
| --- | --- | --- | --- | --- |
| Settings dialog | ✅ | ❌ | packages/app/src/components/settings-*.tsx | target: openspace-client/src/components/SettingsDialog.tsx |
| Keybinds customization | ✅ | ❌ | packages/app/src/components/settings-commands.tsx | target: openspace-client/src/components/SettingsDialog.tsx |
| Providers settings | ✅ | ❌ | packages/app/src/components/settings-providers.tsx | target: openspace-client/src/components/SettingsDialog.tsx |
| Permissions settings | ✅ | ❌ | packages/app/src/components/settings-permissions.tsx | target: openspace-client/src/components/SettingsDialog.tsx |
| Agents settings | ✅ | ❌ | packages/app/src/components/settings-agents.tsx | target: openspace-client/src/components/SettingsDialog.tsx |
| Models settings | ✅ | ❌ | packages/app/src/components/settings-models.tsx | target: openspace-client/src/components/SettingsDialog.tsx |
| Language selector | ✅ | ❌ | packages/app/src/context/language.tsx | target: openspace-client/src/context/language.tsx |
| Multi-locale strings | ✅ | ❌ | packages/app/src/i18n/*.ts | target: openspace-client/src/i18n/*.ts |

---

## Optional Desktop Features (OpenCode Desktop) - N/A opensoace-client

| Feature | OpenCode Desktop | OpenSpace | OpenCode ref | OpenSpace ref / target |
| --- | --- | --- | --- | --- |
| Native menu bar (macOS) | 🖥️✅ | ❌ | packages/desktop/src/menu.ts | optional |
| Menu keyboard shortcuts | 🖥️✅ | ❌ | packages/desktop/src/menu.ts | optional |
| Check for updates menu item | 🖥️✅ | ❌ | packages/desktop/src/menu.ts + updater.ts | optional |
| Install CLI menu item | 🖥️✅ | ❌ | packages/desktop/src/menu.ts | optional |
| Native open/save dialogs | 🖥️✅ | ❌ | packages/desktop/src/index.tsx | optional |
| Deep link protocol | 🖥️✅ | ❌ | packages/desktop/src/index.tsx | optional |
| OS notifications | 🖥️✅ | ❌ | packages/desktop/src/index.tsx | optional |
| Default server URL storage | 🖥️✅ | ❌ | packages/desktop/src/index.tsx | optional |
| Webview zoom | 🖥️✅ | ❌ | packages/desktop/src/webview-zoom.ts | optional |

---

## Notes

- The table lists only features that are verified in source.
- Where OpenSpace lacks the feature, the target file is a recommended insertion point, not necessarily the only option.
- If you want a CSV or a tracker-friendly format, I can export this.
