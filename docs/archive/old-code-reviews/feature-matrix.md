# Detailed Feature List & Code Map
**Source:** `opencode-web` (SolidJS codebase: `opencode/packages/app` and `opencode/packages/ui`)
**Target:** `openspace-client` (React port)

## 1. Chat Interface (`session-turn.tsx`, `message-part.tsx`)

### Message Rendering
-   [ ] **User Message Display**: Render user prompt text. (`session-turn.tsx` lines 372-441)
    -   [ ] **Attachments**: Display image/file attachments with preview click. (`UserMessageDisplay`, lines 375-404)
    -   [ ] **Copy Text**: Button to copy message content. (`UserMessageDisplay`, lines 421-438)
    -   [ ] **Highlighting**: Syntax highlighting for file references (`@file`) and agent mentions (`@agent`). (`HighlightedText`, lines 447-482)
    -   [ ] **Collapsible**: Long messages collapse with "Show More". (`UserMessageDisplay`, lines 407-420)
-   [ ] **Assistant Message Display**: Render agent response. (`AssistantMessageDisplay`, lines 291-302)
    -   [ ] **Streaming**: Handle streaming updates (via `useSessionEvents` / `onSseEvent`).
    -   [ ] **Markdown**: Render rich markdown (tables, code blocks, math). (`PART_MAPPING["text"]`, `PART_MAPPING["reasoning"]`)
    -   [ ] **Reasoning Blocks**: Collapsible "Thinking" blocks for reasoning models. (`PART_MAPPING["reasoning"]`, lines 712-724)
    -   [ ] **Steps/Tools**: Group tool calls into a "Steps" collapsible section. (`SessionTurn`, lines 573-656)
    -   [ ] **Status Indicators**: Dynamic status text based on active tool (e.g., "Scanning codebase...", "Running tests..."). (`computeStatusFromPart`, lines 31-68)
    -   [ ] **Retry**: Option to retry failed generation. (`SessionTurn`, lines 391-397)

### Tool Rendering (`message-part.tsx`)
-   [ ] **Generic Tool**: Fallback for unknown tools. (`GenericTool`, lines 635-647)
-   [ ] **File Operations**:
    -   [ ] **Read**: Show file path and load status. (`ToolRegistry["read"]`, lines 726-764)
    -   [ ] **List/Glob/Grep**: Show search parameters and scrollable results. (`ToolRegistry["list"]`, etc.)
    -   [ ] **Edit/Write**: Show **Git-style Diff** view (Before/After). (`ToolRegistry["edit"]`, lines 1056-1108)
    -   [ ] **Patch**: Display multi-file patch summary with Add/Delete counts. (`ToolRegistry["apply_patch"]`, lines 1168-1243)
-   [ ] **Shell/Bash**: Show command and output in a code block. (`ToolRegistry["bash"]`, lines 1033-1054)
-   [ ] **Web Fetch**: Show URL and fetch status. (`ToolRegistry["webfetch"]`, lines 843-872)
-   [ ] **Tasks/Sub-agents**: Recursive rendering of sub-agent steps. (`ToolRegistry["task"]`, lines 874-1031)
-   [ ] **Todos**: Interactive checklist for agent plans. (`ToolRegistry["todowrite"]`, lines 1245-1291)
-   [ ] **Questions**:
    -   [ ] **Clarification**: Render agent questions to user. (`ToolRegistry["question"]`, lines 1293-1336)
    -   [ ] **Interactive Form**: Radio/Checkbox/Text inputs for replying to agent. (`QuestionPrompt`, lines 1338-1579)

### Safety & Permissions (`message-part.tsx`)
-   [ ] **Permission Prompt**: "Allow Once / Allow Always / Deny" for sensitive tools (shell, write). (`ToolPartDisplay`, lines 649-663)
-   [ ] **Locking**: UI locks while waiting for permission decision.

## 2. Input Area (`prompt-input.tsx`)

### Editing & Input
-   [ ] **Rich Text Editor**: `contenteditable` div with "Pill" support for mentions. (`PromptInput`, lines 118-612)
-   [ ] **Drag & Drop**: Drop files to attach. (`handleGlobalDrop`, lines 406-420)
-   [ ] **Paste**: Paste files/images from clipboard. (`handlePaste`, lines 354-385)
-   [ ] **History**: Up/Down arrow navigation through prompt history. (`navigateHistory`, lines 947-987)
-   [ ] **Slash Commands**: `/command` menu (e.g., `/reset`, `/clear`). (`handleSlashSelect`, lines 527-551)
-   [ ] **Mentions**: `@` menu to reference files or agents. (`handleAtSelect`, lines 453-460)

### Context Management
-   [ ] **Context Meter**: Visual indicator of context window usage. (`SessionContextUsage`)
-   [ ] **Model Selector**: Dropdown to switch models per-turn. (`ModelSelectorPopover`)
-   [ ] **Agent Selector**: Dropdown to switch active agent.

## 3. Navigation & File Tree (`file-tree.tsx`)

-   [ ] **File Explorer**: Nested directory tree.
-   [ ] **Git Status**: Color-coded files (Green=Added, Red=Deleted, Yellow=Modified). (`FileTree`, lines 235-246)
-   [ ] **Drag & Drop**: Drag files from tree to prompt input. (`onDragStart`, lines 207-230)
-   [ ] **Ignored Files**: Visual dimming for `.gitignore` files. (`Tooltip`, lines 320-350)

## 4. Connection & Status (`status-popover.tsx`)

-   [ ] **Health Check**: Poll server health (`/health`). (`checkHealth`, lines 22-33)
-   [ ] **Server List**: Multi-server support with status indicators. (`StatusPopover`, lines 207-301)
-   [ ] **MCP Status**: List connected MCP servers, toggle enabled/disabled. (`StatusPopover`, lines 303-348)
-   [ ] **LSP Status**: Show language server connection states. (`StatusPopover`, lines 351-379)
-   [ ] **Plugin List**: Show active plugins.

## 5. Providers & Auth (`dialog-connect-provider.tsx`)

-   [ ] **Provider Flow**: Wizard to connect new AI providers (OpenAI, Anthropic, etc.).
-   [ ] **API Key Input**: Secure input for API keys. (`DialogConnectProvider`, lines 236-309)
-   [ ] **OAuth Flow**: Handle OAuth callbacks (e.g., "Connect with Google"). (`DialogConnectProvider`, lines 311-449)

## 6. Testing Strategy

### Unit Tests
-   *Minimal*: Very few unit tests found in `src`. (`serialize.test.ts`, `layout-scroll.test.ts`)

### E2E / System Tests (`opencode/packages/app/e2e/`)
-   **Comprehensive Playwright Suite**:
    -   `prompt.spec.ts`: Chat interaction, mentions, attachments.
    -   `session.spec.ts`: Session lifecycle.
    -   `file-tree.spec.ts`: File operations.
    -   `settings-*.spec.ts`: Configuration flows.
    -   `terminal.spec.ts`: Terminal PTY interaction.
    -   `status-popover.spec.ts`: Connection monitoring.

**Validation Strategy:**
The React port should aim to pass the same **Playwright E2E scenarios** defined in `opencode/packages/app/e2e/`. Since unit coverage is low, E2E parity is the primary validation metric.
