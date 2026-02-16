# OpenCode SolidJS Client Architecture — Research Report

> **Scout ID**: scout_7e3f  
> **Date**: 2026-02-15  
> **Source**: https://github.com/anomalyco/opencode (formerly sst/opencode)  
> **Branch**: `dev`  
> **Stars**: ~105k | **Language Split**: TypeScript 50.4%, MDX 45.5%, CSS 3.2%

---

## 1. Project Overview

OpenCode is an open-source AI coding agent. Key philosophy:

- **100% open source** — MIT licensed
- **Provider-agnostic** — supports Anthropic, OpenAI, Google, local models
- **Client/Server architecture** — server runs locally, TUI/Web/Desktop are just clients
- **Focus on TUI** — built by neovim users and terminal.shop creators
- **SolidJS everywhere** — both TUI (via opentui) and Web/Desktop clients use SolidJS

---

## 2. Monorepo Structure (Turborepo + Bun Workspaces)

```
packages/
├── opencode/          # Core business logic & server (Bun + Hono)
│   └── src/
│       ├── session/   # Session management (index.ts, processor.ts, prompt.ts, etc.)
│       ├── provider/  # LLM provider abstraction (models.ts, provider.ts, transform.ts)
│       ├── mcp/       # MCP integration (index.ts, auth.ts, oauth-provider.ts)
│       ├── server/    # HTTP API server (Hono)
│       ├── config/    # Configuration management
│       ├── tool/      # AI tool definitions
│       ├── agent/     # Agent system
│       ├── permission/# Permission management
│       ├── cli/cmd/tui/ # TUI client (SolidJS + opentui)
│       └── ...
│
├── app/               # Web UI (SolidJS — THE PRIMARY WEB CLIENT)
│   └── src/
│       ├── context/   # SolidJS context providers
│       ├── components/# Reusable UI components
│       ├── pages/     # Route pages
│       ├── hooks/     # Custom hooks
│       ├── i18n/      # Internationalization
│       └── utils/     # Utilities
│
├── desktop/           # Tauri desktop app (wraps packages/app)
├── ui/                # Shared SolidJS UI component library (@opencode-ai/ui)
│   └── src/
│       ├── components/# Button, Dialog, Toast, Tooltip, etc.
│       ├── context/   # UI-level contexts (dialog, code, diff, marked)
│       ├── hooks/     # UI hooks
│       ├── styles/    # Theme & styles
│       └── theme/     # Theming system
│
├── sdk/               # Client SDK (@opencode-ai/sdk)
├── console/           # Admin console (SolidJS)
├── plugin/            # Plugin system (@opencode-ai/plugin)
├── util/              # Shared utilities (@opencode-ai/util)
├── web/               # Public website / share pages
└── slack/             # Slack integration
```

---

## 3. Web Client Architecture (`packages/app`)

### 3.1 Technology Stack

| Concern | Technology |
|---------|-----------|
| Framework | SolidJS 1.9.10 |
| Router | @solidjs/router 0.15.4 |
| Meta | @solidjs/meta 0.29.4 |
| State Management | `solid-js/store` (`createStore`, `produce`, `reconcile`) |
| Build | Vite 7.1.4 + vite-plugin-solid 2.11.10 |
| Styling | TailwindCSS 4.1.11 |
| Testing | Playwright (E2E), happydom (unit) |
| UI Library | @opencode-ai/ui (internal, SolidJS-based) |
| UI Primitives | @kobalte/core 0.13.11 (headless components) |
| Drag & Drop | @thisbeyond/solid-dnd |
| Virtualization | virtua 0.42.3, solid-list 0.3.0 |
| SDK | @opencode-ai/sdk (generated via Stainless) |

### 3.2 Context Provider Architecture

The app uses a **deeply nested provider tree** pattern. From `app.tsx`:

```
AppBaseProviders
  └── ThemeProvider
      └── LanguageProvider
          └── PlatformProvider (injected)
              └── GlobalSDKProvider
                  └── ServerProvider
                      └── GlobalSyncProvider
                          └── LayoutProvider
                              └── SettingsProvider
                                  └── HighlightsProvider
                                      └── ModelsProvider
                                          └── CommandProvider
                                              └── NotificationProvider
                                                  └── DialogProvider
                                                      └── PermissionProvider
                                                          └── Router
```

Per-directory (workspace) providers added inside routes:

```
SDKProvider (per-directory)
  └── SyncProvider
      └── FileProvider
          └── TerminalProvider
              └── PromptProvider
                  └── CommentsProvider
```

### 3.3 Context Files (Full Listing)

```
packages/app/src/context/
├── command.tsx          # Command palette, keybindings
├── comments.tsx         # Code comments/annotations
├── file.tsx             # File content & viewing state
├── global-sdk.tsx       # Global SDK client instance
├── global-sync.tsx      # Global state sync (SSE events, stores)
├── highlights.tsx       # Syntax highlighting
├── language.tsx         # i18n / localization
├── layout.tsx           # Panel layout state (sidebar, terminal, review, tabs)
├── local.tsx            # Local/browser state
├── models.tsx           # Available AI models
├── notification.tsx     # Notification system
├── permission.tsx       # Permission management
├── platform.tsx         # Platform detection (web vs desktop)
├── prompt.tsx           # Prompt input state & context
├── sdk.tsx              # Per-directory SDK client
├── server.tsx           # Server connection management
├── settings.tsx         # User settings
├── sync.tsx             # Per-directory session/message sync
├── terminal.tsx         # Terminal/PTY management
└── global-sync/         # Global sync internals
    ├── bootstrap.ts
    ├── child-store.ts
    ├── event-reducer.ts
    ├── eviction.ts
    ├── queue.ts
    ├── session-load.ts
    ├── session-trim.ts
    ├── types.ts
    └── utils.ts
```

### 3.4 Context Pattern (createSimpleContext)

OpenCode uses a custom `createSimpleContext` utility from their UI library that wraps SolidJS `createContext`/`useContext`:

```tsx
// Typical context definition pattern:
export const { use: useSync, provider: SyncProvider } = createSimpleContext({
  name: "Sync",
  init: () => {
    const globalSync = useGlobalSync()
    const sdk = useSDK()
    // ... setup reactive state ...
    return {
      get data() { return current()[0] },
      get set() { return current()[1] },
      session: { get, sync, diff, todo, history, fetch, archive, ... },
      absolute,
      get directory() { ... },
    }
  },
})
```

Key observations:
- Uses **factory pattern** — `init` function called once within provider
- Returns an **object with getters** for lazy reactive access
- Contexts can depend on other contexts (called inside `init`)
- State is managed with `createStore` (solid-js/store) — NOT individual signals

### 3.5 Important AGENTS.md Rule

> "Always prefer `createStore` over multiple `createSignal` calls"

This is an explicit coding standard in the app's AGENTS.md file.

---

## 4. Page & Panel System

### 4.1 Pages Structure

```
packages/app/src/pages/
├── layout.tsx              # Root layout shell
├── directory-layout.tsx    # Per-workspace layout
├── home.tsx                # Home/landing page
├── session.tsx             # Main session page (largest component)
├── error.tsx               # Error page
├── layout/                 # Layout sub-components
│   └── ...
└── session/                # Session sub-components
    ├── session-side-panel.tsx
    ├── session-mobile-tabs.tsx
    ├── session-prompt-dock.tsx
    ├── session-prompt-helpers.ts
    ├── message-timeline.tsx
    ├── terminal-panel.tsx
    ├── review-tab.tsx
    ├── file-tabs.tsx
    ├── helpers.ts
    └── scroll-spy.ts
```

### 4.2 Session Page Architecture (Main View)

The `session.tsx` is the primary view, composed of:

```
┌─────────────────────────────────────────────────────┐
│ SessionHeader                                        │
├──────────┬──────────────────────┬───────────────────┤
│          │                      │                   │
│ Sidebar  │  MessageTimeline     │  SessionSidePanel │
│ (session │  (chat messages,     │  (file tabs,      │
│  list)   │   auto-scroll)       │   review/diff,    │
│          │                      │   context tab,    │
│          │                      │   file tree)      │
│          │                      │                   │
│          ├──────────────────────┤                   │
│          │  SessionPromptDock   │                   │
│          │  (input + question   │                   │
│          │   dock)              │                   │
├──────────┴──────────────────────┴───────────────────┤
│ TerminalPanel (resizable, bottom)                    │
└─────────────────────────────────────────────────────┘
```

Key layout features:
- **ResizeHandle** components for panel resizing
- **Persisted layout state** via `useLayout()` (widths, open/close, tabs)
- **Mobile responsive** — `createMediaQuery` for desktop detection, mobile tabs
- **Drag & drop** for tab reordering (`@thisbeyond/solid-dnd`)
- **Side panel** with file tree, review diffs, context tab

### 4.3 Layout State Model

From `layout.tsx`, the persisted layout store:

```tsx
createStore({
  sidebar: {
    opened: false,
    width: 344,          // DEFAULT_PANEL_WIDTH
    workspaces: {},
    workspacesDefault: false,
  },
  terminal: {
    height: 280,         // DEFAULT_TERMINAL_HEIGHT
    opened: false,
  },
  review: {
    diffStyle: "split",  // "unified" | "split"
    panelOpened: true,
  },
  fileTree: {
    opened: true,
    width: 344,
    tab: "changes",      // "changes" | "all"
  },
  session: {
    width: 600,          // DEFAULT_SESSION_WIDTH
  },
  mobileSidebar: {
    opened: false,
  },
  sessionTabs: {},       // Record<string, SessionTabs>
  sessionView: {},       // Record<string, SessionView> (scroll pos, review open, etc.)
  handoff: {
    tabs: undefined,
  },
})
```

**Session tabs** are managed per-session-key, with support for:
- Opening, closing, reordering tabs
- Active tab tracking
- Tab handoff between sessions
- Session key pruning (MAX_SESSION_KEYS = 50)

---

## 5. Session & Message Management

### 5.1 Backend Session Architecture

```
packages/opencode/src/session/
├── index.ts        # Session namespace — create, chat, list, get, delete, abort, etc.
├── processor.ts    # SessionProcessor — processes messages with LLM
├── prompt.ts       # SessionPrompt — builds prompts with context
├── message-v2.ts   # MessageV2 — message storage & retrieval
├── message.ts      # Legacy message format
├── compaction.ts   # SessionCompaction — context window compaction
├── retry.ts        # SessionRetry — automatic retry with backoff
├── revert.ts       # SessionRevert — undo operations
├── status.ts       # SessionStatus — idle/running/error states
├── summary.ts      # SessionSummary — generate session summaries
├── system.ts       # System prompts
├── instruction.ts  # AGENTS.md loading
├── llm.ts          # LLM interaction layer
├── todo.ts         # Todo tracking
├── session.sql.ts  # SQLite schema
└── prompt/         # Prompt building sub-modules
```

### 5.2 Frontend Session Sync (`sync.tsx`)

The `SyncProvider` exposes:

```tsx
{
  data,        // Current child store (reactive)
  set,         // Store setter
  status,      // "loading" | "ready"
  ready,       // boolean
  project,     // Current project info
  session: {
    get(id),           // Get session by ID (binary search)
    optimistic: {
      add(input),      // Optimistic message add (binary insert)
      remove(input),   // Optimistic message remove
    },
    addOptimisticMessage(input),  // Convenience for user messages
    sync(sessionID),              // Load session + messages
    diff(sessionID),              // Load session diff
    todo(sessionID),              // Load session todos
    history: {
      more(sessionID),          // Check if more history available
      loading(sessionID),       // Loading state
      loadMore(sessionID, count), // Paginated loading
    },
    fetch(count),     // Fetch more sessions
    more,             // Whether more sessions available
    archive(id),      // Archive session
  },
  absolute,    // Resolve relative paths
  directory,   // Current directory
}
```

Key patterns:
- **Binary search** for sorted session/message arrays
- **Optimistic updates** — add/remove messages immediately, reconcile on server response
- **Paginated message loading** — `messagePageSize = 400`
- **Inflight deduplication** — `runInflight()` prevents duplicate concurrent requests
- **Reconciliation** — `reconcile(data, { key: "id" })` for efficient store updates

### 5.3 Global Sync (`global-sync.tsx`)

The `GlobalSyncProvider` manages:

```tsx
type GlobalStore = {
  ready: boolean
  error?: InitError
  path: Path
  project: Project[]
  provider: ProviderListResponse
  provider_auth: ProviderAuthResponse
  config: Config
  reload: undefined | "pending" | "complete"
}
```

Features:
- **Child store management** — per-directory stores for sessions, messages, parts, diffs, todos
- **SSE event stream** — real-time updates via `globalSDK.event.listen()`
- **Event reducers** — `applyDirectoryEvent()`, `applyGlobalEvent()` handle incoming events
- **Session trimming** — `trimSessions()` limits stored sessions (SESSION_RECENT_LIMIT)
- **VCS cache** — caches version control state per directory
- **Refresh queue** — batched refresh operations

---

## 6. Provider & Model Management

### 6.1 Backend Provider Architecture

```
packages/opencode/src/provider/
├── models.ts      # Model & Provider schemas (Zod)
├── provider.ts    # Provider registration & SDK creation
├── transform.ts   # Model variant transformations
├── auth.ts        # Provider authentication (API keys, OAuth)
├── error.ts       # Provider-specific error handling
└── sdk/copilot/   # GitHub Copilot provider
```

Provider schema:
```tsx
export const Provider = z.object({
  api: z.string().optional(),
  name: z.string(),
  env: z.array(z.string()),
  id: z.string(),
  npm: z.string().optional(),
})
```

Model schema:
```tsx
export const Model = z.object({
  // ... model definition with variants
  provider: z.object({
    npm: z.string().optional(),
    api: z.string().optional(),
  }).optional(),
  variants: z.record(z.string(), z.record(z.string(), z.any())).optional(),
})
```

### 6.2 Frontend Model Context

Models are exposed via `ModelsProvider` context, connected to the global sync's `provider` and `config` data.

---

## 7. MCP Integration

### 7.1 Architecture

Located at `packages/opencode/src/mcp/`:

```
mcp/
├── index.ts           # Main MCP namespace — client management, tool conversion
├── auth.ts            # McpAuth — token storage, OAuth state
├── oauth-provider.ts  # McpOAuthProvider — OAuth flow
└── oauth-callback.ts  # McpOAuthCallback — OAuth callback server
```

### 7.2 Key Patterns

**Client Management:**
- Uses `@modelcontextprotocol/sdk/client` official SDK
- Supports three transport types:
  - `StdioClientTransport` — local command-based servers
  - `StreamableHTTPClientTransport` — remote HTTP servers
  - `SSEClientTransport` — remote SSE servers
- Instance-scoped state management via `Instance.state()`

**Status System:**
```tsx
export const Status = z.discriminatedUnion("status", [
  z.object({ status: z.literal("connected") }),
  z.object({ status: z.literal("disabled") }),
  z.object({ status: z.literal("failed"), error: z.string() }),
  z.object({ status: z.literal("needs_auth") }),
  z.object({ status: z.literal("needs_client_registration"), error: z.string() }),
])
```

**Tool Conversion:**
- MCP tools are converted to AI SDK `dynamicTool` format
- Schema normalization: always `type: "object"`, `additionalProperties: false`
- Timeout support per-call with `resetTimeoutOnProgress: true`

**OAuth Support:**
- Full OAuth2 flow with PKCE
- Local callback server (Bun.serve)
- Browser-open with fallback for headless environments
- State parameter for CSRF protection
- Token persistence via `McpAuth`

---

## 8. UI Component Library (`packages/ui`)

### 8.1 Structure

```
packages/ui/src/
├── components/        # Reusable UI components
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── toast.tsx
│   ├── tooltip.tsx
│   ├── icon-button.tsx
│   ├── avatar.tsx
│   ├── tabs.tsx
│   ├── select.tsx
│   ├── switch.tsx
│   ├── progress.tsx
│   ├── progress-circle.tsx
│   ├── resize-handle.tsx
│   ├── basic-tool.tsx     # Tool display component
│   ├── message-part.tsx   # Message rendering
│   ├── diff.tsx           # Diff viewer
│   ├── code.tsx           # Code viewer/editor
│   └── ...
├── context/           # UI-level contexts
│   ├── dialog.tsx
│   ├── code.tsx
│   ├── diff.tsx
│   ├── marked.tsx
│   └── index.tsx      # createSimpleContext utility + I18nProvider
├── hooks/             # UI hooks (e.g., createAutoScroll)
├── styles/            # Theme tokens & CSS
├── theme/             # Theme system
├── i18n/              # UI-level translations
└── pierre/            # Pierre diffs integration
```

### 8.2 Component Pattern

Components are built on **Kobalte** (headless SolidJS UI primitives):

```tsx
export function Button(props: ButtonProps) {
  const [split, rest] = splitProps(props, ["variant", "size", "icon", "class", "classList"])
  return (
    <Kobalte
      {...rest}
      data-component="button"
      data-variant={split.variant ?? "primary"}
      data-size={split.size ?? "normal"}
      class={split.class}
      classList={split.classList}
    >
      {/* ... */}
    </Kobalte>
  )
}
```

Pattern: `splitProps` → separate concern props from passthrough → `data-*` attributes for styling.

---

## 9. Server API & SDK

### 9.1 API Server

- Built with **Hono** (lightweight web framework)
- Routes defined in `packages/opencode/src/server/routes/`
- API documentation via **hono-openapi** + **Stainless** for SDK generation
- RESTful endpoints for sessions, messages, providers, config, MCP

### 9.2 Client SDK

- Auto-generated TypeScript SDK via **Stainless** (`@opencode-ai/sdk`)
- Client created with `createOpencodeClient({ baseUrl, fetch, directory, throwOnError })`
- Strongly typed API calls: `sdk.client.session.list()`, `sdk.client.session.get({ sessionID })`, etc.
- SSE event stream for real-time updates: `globalSDK.event.listen(callback)`

---

## 10. Code Quality Standards (from AGENTS.md & CONTRIBUTING.md)

### 10.1 General Coding Style

| Rule | Detail |
|------|--------|
| Functions | Keep logic in one function unless composable/reusable |
| Destructuring | **Avoid** — use dot notation to preserve context |
| Control flow | **Avoid `else`** — use early returns |
| Error handling | Prefer `.catch(...)` over `try`/`catch` |
| Types | Precise types, **avoid `any`** |
| Variables | Prefer `const`, avoid `let`; use ternaries |
| Naming | **Single-word** identifiers when possible |
| Inference | Rely on type inference; avoid explicit annotations unless necessary |
| Array methods | Prefer `flatMap`, `filter`, `map` over `for` loops |
| Runtime | Use Bun APIs (`Bun.file()`) when applicable |
| State | Prefer `createStore` over multiple `createSignal` calls |

### 10.2 PR Standards

- **Conventional commits**: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`
- **Scoped**: `feat(app):`, `fix(desktop):`, `chore(opencode):`
- **Issue-first policy**: All PRs must reference an existing issue
- **No AI-generated walls of text** in PRs/issues
- **UI changes** require screenshots/videos
- **Logic changes** require explanation of verification

### 10.3 Testing

- Avoid mocks as much as possible
- Test actual implementation, don't duplicate logic into tests
- Tests cannot run from repo root (must run from package dirs)
- E2E with Playwright

### 10.4 Formatting

- Prettier: `semi: false`, `printWidth: 120`
- No semicolons, 120-char line width

---

## 11. Key Architectural Patterns Summary

### Pattern: Event-Driven Sync
```
Server → SSE Events → GlobalSync Event Listener → Event Reducer → Store Update → UI Re-render
```

### Pattern: Hierarchical Store Management
```
GlobalStore (projects, config, providers)
  └── ChildStore (per-directory: sessions, messages, parts, diffs, permissions, questions)
       └── SyncProvider (per-directory reactive view with optimistic updates)
```

### Pattern: Binary Search for Sorted Collections
All session and message arrays are kept sorted by ID, enabling O(log n) lookups via `Binary.search()`.

### Pattern: Inflight Request Deduplication
```tsx
function runInflight(map, key, task) {
  const pending = map.get(key)
  if (pending) return pending
  const promise = task().finally(() => map.delete(key))
  map.set(key, promise)
  return promise
}
```

### Pattern: Optimistic Updates with Reconciliation
1. Immediately insert message into sorted store
2. Server processes and emits SSE event
3. Event reducer reconciles store with `reconcile(data, { key: "id" })`

### Pattern: Layout Persistence
- Layout state persisted to localStorage via `persisted()` utility
- Session-specific state (scroll, tabs) tracked per session key
- Automatic pruning of old session state (max 50 session keys)

---

## 12. Comparison Notes for openspace-client (React Port)

| Aspect | OpenCode (SolidJS) | Equivalent React Pattern |
|--------|-------------------|------------------------|
| `createSignal` | Fine-grained reactive | `useState` |
| `createStore` | Deep reactive store | Zustand / Redux / `useReducer` |
| `createEffect` | Auto-tracking side effect | `useEffect` with deps |
| `createMemo` | Computed value | `useMemo` |
| `createContext` | Provider/consumer | `React.createContext` |
| `produce` (solid-js/store) | Immer-style mutations | Immer / `produce` |
| `reconcile` | Keyed diffing for stores | Manual diffing or React Query |
| `splitProps` | Prop separation | Custom destructuring |
| `<Show>` | Conditional render | Ternary / `&&` |
| `<For>` | List render | `.map()` |
| `<Switch>/<Match>` | Multi-condition | `switch`/ternary chain |
| `<Dynamic>` | Dynamic component | Dynamic component lookup |
| `onCleanup` | Cleanup in effects | `useEffect` return cleanup |
| `batch` | Batch updates | React 18+ auto-batching |
| `untrack` | Opt out of tracking | `useRef` or callback refs |
| Kobalte | Headless primitives | Radix UI / Headless UI |
| @thisbeyond/solid-dnd | Drag & drop | @dnd-kit/core |

---

## 13. References

- **Repository**: https://github.com/anomalyco/opencode
- **Website**: https://opencode.ai
- **Docs**: https://opencode.ai/docs/
- **Discord**: https://opencode.ai/discord
- **CONTRIBUTING.md**: See Section 10
- **AGENTS.md**: Root and `packages/app/AGENTS.md`
