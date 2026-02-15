---
id: PATTERNS-OPENSPACE-MEMORY
author: oracle_9d3a
status: FINAL
date: 2026-02-11
task_id: memory-patterns
---

# Patterns

## Architectural Patterns
- NSO Hexagon Squad architecture.
- Two-tier documentation (System-wide vs Project-specific).
- Skills should be in global NSO (~/.config/opencode/nso/skills/) not project-specific.
- **Integration Pattern**: When integrating external skills:
  - Merge into existing skills rather than creating duplicates
  - Use clear, descriptive names (not code names like "Prometheus")
  - Update workflow documentation to reflect new skill names
  - Make user-initiated features explicit (not automatic)
- **Automatic Routing Pattern**: Router monitors every user message
  - Confidence threshold ≥20% activates workflow
  - Low confidence (<20%) = normal conversation
  - No explicit `/router` command needed

- **Internal Hub API Pattern (Modality Platform V2)**: For complex artifacts that require central storage and multimodal access:
  - Implement a central `ArtifactStore` (The Spine) in a dedicated hub service.
  - Expose the store via a local HTTP Internal API (e.g., Express) to allow communication from MCP servers and other tools.
  - Implement MCP servers (The Hands) that wrap the Internal API as tools (`read_whiteboard`, `update_whiteboard`).
  - Use ESM for MCP servers and Hub components to leverage modern SDKs and libraries (like `node-fetch`).
  - **Evolution (2026-02-12)**: Modality Platform V2 consolidates all modalities into:
    - ONE Hub (:3001) with `/files/:path`, `/events`, `/context/active` endpoints
    - ONE MCP process (`modality-mcp.ts`) with namespaced tools (`drawing.*`, `editor.*`, etc.)
    - Universal `useArtifact()` hook in React client for consistent artifact management

- **Artifact-First Documentation Pattern (NSO Global)**:
  - Plans/specs/checklists/reports must be created as actual files (default under `docs/`).
  - Chat summaries are secondary to persisted artifacts.
  - Chat-only delivery is allowed only when user explicitly requests it.

- **Universal Artifact Pattern**: Use `useArtifact<T>()` hook for all modalities (Drawing, Editor, Presentation, Voice, etc.):
  - Automatic SSE subscription for agent updates
  - Multi-window sync via BroadcastChannel
  - Debounced auto-save (configurable)
  - Custom parse/serialize functions
  - Type-safe with TypeScript generics
  - Single pattern reduces boilerplate by ~30-40% per modality
  - Example: `useArtifact<SceneGraph>('design/auth.json', { parse: JSON.parse, serialize: JSON.stringify })`

- **Incremental Patch Reducer Pattern**: For complex artifacts (like diagrams/whiteboards) where multiple tools/agents perform granular updates:
  - Implement a `Reducer` (e.g., `DiagramReducer`) that accepts an array of `IOperation` patches.
  - Each `IOperation` specifies `type` (add/remove/update), `entity` (node/edge), and `data`.
  - The reducer manages the transformation from `Operation[]` to a new `ArtifactState`.
  - This allows the Hub to perform validation and transaction-like updates before persisting.

- **Registry Pattern for Tool UI**: Decoupling tool-specific rendering from the main message list using a central registry.
  - Define a standard `ToolRenderer` interface.
  - Implement a registry (`registerToolRenderer`, `getToolRenderer`).
  - Use a `BaseToolRenderer` for consistent collapsible UI and status indicators.
  - Renderers register themselves via side-effect imports in the registry index.

- **Intent Validation Hook Pattern**: Use pre-tool-execution hooks to enforce security and safety policies.
  - Implement a `validate_intent` hook that runs before sensitive tools (e.g., `edit`, `bash`).
  - Block operations that violate policy (e.g., editing `.env` files, force pushing to main).
  - Provide clear security alerts in the logs when an operation is blocked.

## Coding Standards
- TDD Mandatory (RED -> GREEN -> REFACTOR).
- Logical logging (LOG FIRST).
- Minimal diffs.
- **ANSI Stripping**: Standardize on regex-based ANSI escape code stripping for raw terminal output in UI components.

## Frontend/UI Patterns
- **Design Lock (Obsidian Hybrid)**:
  - Canonical visual reference: `design/mockups/obsidian-glass-hybrid.html`
  - Mode-by-mode references: `design/mockups/pages/index.html`
  - Style guide for all agents: `design/STYLE-GUIDE-OBSIDIAN-HYBRID.md`
  - Implementation CSS baseline: `openspace-client/src/styles/obsidian-hybrid.css`
  - Rule: Reuse these before introducing new visual patterns.
- **Two-Zone Scrollable Layout**: When components at top and bottom of a container need independent scrolling:
  - Use flex container with `flex-col` on parent
  - Middle zone: `flex-1 min-h-0 overflow-y-auto` (allows shrinking and scrolling)
  - Bottom zone: `max-h-[Npx] overflow-y-auto` (constrained height with internal scroll)
  - Example: SessionSidebar (header fixed, sessions list scrollable, workspace manager constrained)
  - **Why**: Prevents UI overlap when bottom component blocks clickable elements in middle zone

- **Nested Scrolling Handling**: Use `data-scrollable="true"` on elements that handle their own overflow.
  - The parent scroll container should check `event.target.closest("[data-scrollable]")` to decide whether to stop propagation of scroll/wheel events.
  - Prevents "scroll chaining" where scrolling the end of a child container triggers the parent's scroll.

## Testing Standards
- **E2E Tests (Playwright)**: Integration tests use REAL servers (Vite dev + API), not mocks
- **E2E Configuration**: Always run with `-c e2e/playwright.config.ts` flag (use `npm run test:e2e:existing`)
- **E2E Test Projects**: Use real project directories (e.g., `/Users/Shared/dev/dream-news`) instead of temporary workspaces
- **Validation Workflow**: Use `npm run check` (fast) for development, `npm run pre-pr` (comprehensive) before pushing

- **Radix Popover Outside-Click Pattern**: When dismissing Radix UI popovers in E2E tests:
  - Do NOT click arbitrary coordinates (e.g., `page.mouse.click(0, 0)`)
  - Radix only registers dismissal when clicking on a real DOM element
  - Solution: Click `document.body` or another visible, real element on the page
  - Example: `await page.locator('body').click()` instead of `await page.mouse.click(0, 0)`

- **Floating UI E2E Interaction Pattern**: When testing floating/overlay UI elements (modals, floating windows, dropdowns):
  - Always assert visibility (`.toBeVisible()`) before interacting
  - Use `{ force: true }` for clicks on elements that may be obscured by floating layers
  - Floating agent windows may cover underlying UI — account for z-index stacking order in test assertions
  - Prefer `data-testid` selectors over positional/CSS selectors for elements inside floating containers

- **ContentEditable vs Textarea Prompt Input**: The agent prompt uses `contentEditable` div, not `<textarea>`:
  - `fill()` works but may not trigger all event handlers
  - Use `pressSequentially()` for typing that must trigger key handlers
  - `contentEditable` elements use `textContent` not `value` for reading content
  - Selector pattern: `div[contenteditable="true"]` or role-based `textbox`

- **E2E Selector Resilience Pattern**: When UI architecture changes, selectors break first:
  - Centralize all selectors in a single `selectors.ts` file
  - Prefer `data-testid` > `aria-label` > `role` > CSS class selectors (in order of stability)
  - Keep action helpers (e.g., `actions.ts`) as thin wrappers around selectors
  - When overhauling selectors, verify each one against actual rendered DOM before writing tests

## Conventions
- Use CamelCase for interfaces.
- Use kebab-case for file names.
- Global NSO system is at ~/.config/opencode/nso/.
- Project-specific context is at ./.opencode/context/.
- Canonical NSO suggestions backlog is `.opencode/context/01_memory/nso-improvements.md`.
- **Skill Naming**: Use plain English descriptors (e.g., "requirement-elicitation" not "Prometheus")
- **Router Priority**: DEBUG > REVIEW > PLAN > BUILD (when multiple match)

## Gotchas
- NSO skills were duplicated between high-reliability-framework and global location.
- Migration completed 2026-02-08 to consolidate all NSO skills globally.
- **Integration Tip**: When adding multi-expert patterns, clearly define when to use debate vs. simple checklist.
- **User Control**: Archive/d documentation features should be user-initiated, not automatic.
- **Automatic Router**: If router confidence is borderline (20-30%), may need user confirmation
- **E2E Test Failures**: Running E2E tests without proper config flag (`-c e2e/playwright.config.ts`) causes "Cannot navigate to invalid URL" errors
- **UI Overlap**: Components at bottom of scrollable containers can block interactive elements - use constrained heights with internal scrolling
- **Test Cleanup**: E2E tests may create artifacts (worktrees, workspace dirs) with restrictive permissions requiring manual deletion
- **Dirty Root Merge Pattern**: If root `master` is heavily dirty, perform merge/push from a separate clean integration worktree based on `origin/master`, then remove both integration and feature worktrees.

- **Data Schema Migration Pattern**: When upgrading data-dependent libraries (like Tldraw), always implement a schema migration layer to handle version mismatches (e.g., `tldrawMapper` fixing V1 props to V2 props).
- **Strict Validation Gotcha**: Validation logic for external data should be lenient or version-aware to avoid crashing on valid but slightly different data (e.g., optional props in Tldraw shapes).

- **Agent Conversation Default = Expanded**: The agent conversation UI defaults to 'expanded' (floating window), NOT collapsed sidebar. E2E tests must account for this by looking for the floating agent panel first. Selectors: look for floating overlay container with agent messages.
- **Pane System Binary Tree**: The pane layout uses a binary tree of `LeafPaneNode` / `SplitPaneNode`. Tests that manipulate panes must understand this tree structure — splitting creates a new `SplitPaneNode` parent with two `LeafPaneNode` children.
- **Slash Command Availability**: Local commands (`/whiteboard`, `/editor`) are always available in the prompt. Server-side commands (tool-based) depend on MCP server configuration and may not be present. E2E tests should only assert commands that are guaranteed available.
- **E2E Mass Fix Strategy**: When overhauling many E2E tests at once (20+ spec files), fix selectors/actions files first, then work through spec files group-by-group. Run tests per-group to catch issues incrementally rather than running all 89 tests each time.

## Approved Practices
- Follow NSO instructions.md for all operations.
- When fixing NSO duplication: prefer global location, keep better versions.
- **Traceability Matrix**: Every requirement must have verification method (REQ-ID → test/command).
- **Multi-Expert Review**: Use for complex decisions; skip for straightforward implementations.
- **Conversation Archiving**: User must explicitly request; never automatic.
- **Router Monitoring**: Always run router_monitor.py before responding to user messages.
