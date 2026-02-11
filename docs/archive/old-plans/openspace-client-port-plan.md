# OpenSpace Client Port Plan (Phased, Agent-Ready)

Goal: implement all non-N/A features from `opencode-openspace-feature-parity_v2.md` in a stable, phased approach. Stability for sessions/agents/servers is required before architecture refactors.

Legend: ✅ implemented, ⚠️ partial/limited, ❌ not implemented, 🖥️ optional desktop-only (excluded).

How to use: assign a phase to an agent and give them the “Context to Load” and “Implementation Scope” sections.

---

## Phase 0 — Baseline Stability (Required First)

**Objective**: ensure sessions/agents/servers are reliable before new UX.

**Implementation Scope**
- Harden session SSE event flow and retries.
- Improve error handling/visibility for API requests.
- Ensure reconnection/backoff in session event stream.

**OpenCode References**
- Event flow: `packages/app/src/context/sync.tsx`
- Runtime adapters: `packages/app/src/utils/runtime-adapters.ts`

**OpenSpace Targets**
- `openspace-client/src/hooks/useSessionEvents.ts`
- `openspace-client/src/services/OpenCodeClient.ts`

**Context to Load (Agent)**
- Read: `openspace-client/src/hooks/useSessionEvents.ts`
- Read: `openspace-client/src/services/OpenCodeClient.ts`
- Read: `packages/app/src/context/sync.tsx`

**Acceptance Criteria**
- Session event stream reconnects without manual reload.
- Errors surface via UI toast/log and do not break session state.

---

## Phase 1 — Sessions Core Parity

**Objective**: stable session lifecycle (create/edit/archive/delete).

**Implementation Scope**
- Session title edit.
- Session archive.
- Session delete.
- Session prefetch (adjacent).
- Session history pagination.
- “Unseen” session navigation.

**OpenCode References**
- Session header/menu: `packages/app/src/pages/session/message-timeline.tsx`
- Session handlers: `packages/app/src/pages/session.tsx`
- Prefetch/unseen: `packages/app/src/pages/layout.tsx`

**OpenSpace Targets**
- UI: `openspace-client/src/components/sidebar/SessionSidebar.tsx`
- Data: `openspace-client/src/hooks/useSessions.ts`
- History paging: `openspace-client/src/hooks/useMessages.ts`

**Context to Load (Agent)**
- Read: `openspace-client/src/components/sidebar/SessionSidebar.tsx`
- Read: `openspace-client/src/hooks/useSessions.ts`
- Read: `openspace-client/src/hooks/useMessages.ts`
- Read: `packages/app/src/pages/session/message-timeline.tsx`
- Read: `packages/app/src/pages/layout.tsx`

**Acceptance Criteria**
- Sessions can be renamed, archived, and deleted with immediate UI state updates.
- Large histories load with paging and do not stall UI.

---

## Phase 2 — Message Timeline UX

**Objective**: reliable scrolling for long sessions.

**Implementation Scope**
- Load earlier/backfill with button.
- Auto-scroll with resume button.
- Scroll-spy active message.
- Hash-based message focus.
- Gesture boundary handling for nested scroll areas.

**OpenCode References**
- Timeline: `packages/app/src/pages/session/message-timeline.tsx`
- Scroll spy: `packages/app/src/pages/session/scroll-spy.ts`
- Hash focus: `packages/app/src/pages/session/use-session-hash-scroll.ts`
- Gesture boundary: `packages/app/src/pages/session/message-gesture.ts`

**OpenSpace Targets**
- `openspace-client/src/components/MessageList.tsx`
- `openspace-client/src/hooks/useMessages.ts`

**Context to Load (Agent)**
- Read: `openspace-client/src/components/MessageList.tsx`
- Read: `openspace-client/src/hooks/useMessages.ts`
- Read: `packages/app/src/pages/session/message-timeline.tsx`
- Read: `packages/app/src/pages/session/scroll-spy.ts`

**Acceptance Criteria**
- Scrolling remains smooth past 1k+ messages.
- Auto-scroll resumes cleanly and does not jump on new messages.

---

## Phase 3 — Prompt Input Parity

**Objective**: modern prompt UX without architecture refactor.

**Implementation Scope**
- Contenteditable prompt.
- @mention file/agent + pills.
- Slash commands.
- Prompt history (normal + shell).
- Shell mode (`!`).
- Prompt draft persistence.
- Paste image attachment.
- Drag/drop overlay.
- Context items list (files/comments).
- Auto-accept permissions toggle.
- Stop generation (abort).

**OpenCode References**
- Prompt input: `packages/app/src/components/prompt-input.tsx`
- Prompt history: `packages/app/src/components/prompt-input/history.ts`
- Prompt persistence: `packages/app/src/context/prompt.tsx`
- Context items UI: `packages/app/src/components/prompt-input/context-items.tsx`

**OpenSpace Targets**
- `openspace-client/src/components/PromptInput.tsx`
- `openspace-client/src/components/AgentConsole.tsx`
- New or extended prompt persistence: `openspace-client/src/context/prompt.tsx` (recommended)

**Context to Load (Agent)**
- Read: `openspace-client/src/components/PromptInput.tsx`
- Read: `openspace-client/src/components/AgentConsole.tsx`
- Read: `packages/app/src/components/prompt-input.tsx`
- Read: `packages/app/src/context/prompt.tsx`

**Acceptance Criteria**
- @mentions and slash commands work without breaking IME.
- Prompt drafts persist per session/workspace.

---

## Phase 4 — File Tree + File Tabs

**Objective**: parity for file browsing and open-file workflow.

**Implementation Scope**
- Changes/all toggle.
- File tabs (open files).
- File tooltips + diff badges.
- Drag file to context (complete wiring).

**OpenCode References**
- File tree: `packages/app/src/components/file-tree.tsx`
- Side panel + tabs: `packages/app/src/pages/session/session-side-panel.tsx`
- File tabs content: `packages/app/src/pages/session/file-tabs.tsx`

**OpenSpace Targets**
- `openspace-client/src/components/FileTree.tsx`
- `openspace-client/src/components/AgentConsole.tsx`

**Context to Load (Agent)**
- Read: `openspace-client/src/components/FileTree.tsx`
- Read: `openspace-client/src/components/AgentConsole.tsx`
- Read: `packages/app/src/components/file-tree.tsx`
- Read: `packages/app/src/pages/session/file-tabs.tsx`

**Acceptance Criteria**
- Users can open multiple files in tabs and switch without losing state.

---

## Phase 5 — Terminal Parity

**Objective**: multi-terminal usage with persistence.

**Implementation Scope**
- Multi-terminal tabs.
- Terminal drag-reorder.
- Terminal create/close.
- Buffer serialization.
- Workspace-scoped terminals.

**OpenCode References**
- Terminal panel: `packages/app/src/pages/session/terminal-panel.tsx`
- Terminal state: `packages/app/src/context/terminal.tsx`
- Serialization: `packages/app/src/components/terminal.tsx`

**OpenSpace Targets**
- `openspace-client/src/components/Terminal.tsx`
- `openspace-client/src/hooks/useTerminal.ts`

**Context to Load (Agent)**
- Read: `openspace-client/src/components/Terminal.tsx`
- Read: `openspace-client/src/hooks/useTerminal.ts`
- Read: `packages/app/src/context/terminal.tsx`
- Read: `packages/app/src/components/terminal.tsx`

**Acceptance Criteria**
- Terminals persist across sessions in the same workspace.
- Terminal tabs restore after refresh.

---

## Phase 6 — Models & Agents UX

**Objective**: polish model selection UX.

**Implementation Scope**
- Model tooltip details.
- Provider icons.
- Free/paid gating label.

**OpenCode References**
- Tooltips: `packages/app/src/components/model-tooltip.tsx`
- Provider icon usage: `packages/app/src/components/prompt-input.tsx`
- Gating label: `packages/app/src/components/dialog-select-model.tsx`

**OpenSpace Targets**
- `openspace-client/src/components/ModelSelector.tsx`

**Context to Load (Agent)**
- Read: `openspace-client/src/components/ModelSelector.tsx`
- Read: `packages/app/src/components/model-tooltip.tsx`
- Read: `packages/app/src/components/dialog-select-model.tsx`

**Acceptance Criteria**
- Model list shows tooltips with limits/costs and provider icons.

---

## Phase 7 — Providers + Servers Management

**Objective**: stable server management and defaults.

**Implementation Scope**
- Multi-server list + health.
- Default server management.

**OpenCode References**
- Status popover: `packages/app/src/components/status-popover.tsx`
- Health checks: `packages/app/src/utils/server-health.ts`

**OpenSpace Targets**
- `openspace-client/src/components/DialogManageServers.tsx`
- `openspace-client/src/components/StatusPopover.tsx`

**Context to Load (Agent)**
- Read: `openspace-client/src/components/DialogManageServers.tsx`
- Read: `openspace-client/src/components/StatusPopover.tsx`
- Read: `packages/app/src/components/status-popover.tsx`

**Acceptance Criteria**
- Users can add multiple servers and select default.
- Health state is visible and updates.

---

## Phase 8 — Notifications & Permissions

**Objective**: permission flow parity.

**Implementation Scope**
- Permission prompt with actions.
- Question dock (inline).
- Permission memory (auto-accept).
- Sound cues.

**OpenCode References**
- Prompt dock: `packages/app/src/pages/session/session-prompt-dock.tsx`
- Permission store: `packages/app/src/context/permission.tsx`
- Sound: `packages/app/src/utils/sound.ts`

**OpenSpace Targets**
- `openspace-client/src/components/AgentConsole.tsx`
- `openspace-client/src/hooks/useSessionEvents.ts`

**Context to Load (Agent)**
- Read: `openspace-client/src/components/AgentConsole.tsx`
- Read: `openspace-client/src/hooks/useSessionEvents.ts`
- Read: `packages/app/src/pages/session/session-prompt-dock.tsx`

**Acceptance Criteria**
- Permission requests are visible, actionable, and persist when “always allow”.

---

## Phase 9 — Settings & i18n

**Objective**: match settings system after core parity.

**Implementation Scope**
- Settings dialog with tabs.
- Keybinds customization.
- Providers/permissions/agents/models tabs.
- Language selector + i18n.

**OpenCode References**
- Settings: `packages/app/src/components/settings-*.tsx`
- Language context: `packages/app/src/context/language.tsx`
- Strings: `packages/app/src/i18n/*.ts`

**OpenSpace Targets**
- `openspace-client/src/components/SettingsDialog.tsx`
- `openspace-client/src/context/language.tsx`
- `openspace-client/src/i18n/*.ts`

**Context to Load (Agent)**
- Read: `openspace-client/src/components/TopBar.tsx`
- Read: `packages/app/src/components/settings-*.tsx`
- Read: `packages/app/src/context/language.tsx`

**Acceptance Criteria**
- Settings accessible, persisted, and i18n works end-to-end.

---

## Cross-Phase Testing & Commits

- Each phase should end with tests relevant to the updated components/hooks.
- Commit per phase with feature-focused messages.
- Avoid broad refactors until all phases above are complete.
