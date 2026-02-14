---
id: REQ-002-WINDOW-PANE-MANAGEMENT
author: oracle_7f3e
status: DRAFT
date: 2026-02-13
task_id: pane-system-floating-agent
---

# REQ-002: Pane System with Floating Agent Conversation

## Status: DRAFT

---

## 1. Overview

### 1.1 Purpose

Define the Pane System architecture for OpenSpace, where:
- **PaneContainer is the main layout** - All content lives in panes
- **Agent Conversation is a floating UI** - Not tied to any specific pane, floats over the entire application
- **Single session-wide conversation** - One floating agent, not one per pane

### 1.2 Scope

- Pane creation, splitting, and resizing
- Tab management within panes
- **Floating Agent Conversation** with three sizes (minimal, expanded, full)
- Content types: whiteboard, editor, presentation, terminal (extensible)
- Default: One pane taking complete screen on startup
- User controls pane layout; agent control deferred to future MCP modality
- Navigation collapse/expand
- Layout persistence per session

### 1.3 Out of Scope

- Agent control over panes via MCP (deferred to future BLK task)
- Floating windows (pop-out)
- Multiple monitor support
- Touch/gesture support

---

## 2. Functional Requirements

### 2.1 Pane System Core

#### REQ-2.1.1: Single Pane Startup
**Priority:** P0 (Must Have)

- Application starts with **ONE pane** taking the complete content area
- Not two panes split horizontally
- Pane should fill available space: top (after navigation), left (after sidebar), right, bottom
- This is called "Zen Mode" - default for new sessions

#### REQ-2.1.2: VS Code-Style Grid Layout
**Priority:** P0 (Must Have)

The system shall use a grid-based layout with:
- Vertical and horizontal splits
- Minimum pane size: 200px width, 150px height
- Maximum split depth: 4 levels
- Equal priority panes (no "main" vs "secondary" distinction)

#### REQ-2.1.3: Pane Splitting
**Priority:** P0 (Must Have)

Users can create new panes via:
- Split Right: `Ctrl/Cmd + \`
- Split Down: `Ctrl/Cmd + Shift + \`
- Context menu on pane header: "Split Right", "Split Down"
- Empty state button: "Split to Add Pane"

#### REQ-2.1.4: Pane Resizing
**Priority:** P0 (Must Have)

- Draggable splitters between panes
- Minimum 8px grab area on splitters
- Visual feedback during drag (highlight splitter)
- Snap to 25%, 33%, 50%, 66%, 75% widths (optional)

#### REQ-2.1.5: Pane Selection
**Priority:** P0 (Must Have)

- User activates pane by clicking the pane title/header line
- Active pane title/header line must use distinct color/typography styling
- Only one active pane at a time
- Active pane is always the default target for opening new content

#### REQ-2.1.6: Pane Closing
**Priority:** P0 (Must Have)

- Close button on pane (if more than one pane exists)
- Keyboard shortcut: `Ctrl/Cmd + W` (closes active tab, or pane if last tab)
- When closing last pane: Prevent closure, show message "Cannot close last pane"
- Remaining panes expand to fill space

#### REQ-2.1.7: Maximum Panes
**Priority:** P1 (Should Have)

- Soft limit: 6 panes (performance warning)
- Hard limit: 12 panes (prevent creation)

---

### 2.2 Tab System

#### REQ-2.2.1: Tabbed Interface Per Pane
**Priority:** P0 (Must Have)

Each pane supports multiple tabs:
- Tab height: 32px
- Tab width: min 80px, max 200px, truncate with ellipsis
- Active tab in active pane: strongest visual emphasis (clear background + stronger text)
- Active tab in inactive pane: still indicated as selected but with reduced emphasis
- Inactive tabs: dimmed state
- Tab overflow: horizontal scroll with arrows

#### REQ-2.2.2: Tab Content Types
**Priority:** P0 (Must Have)

Tabs can contain any of the space types:
- `editor` - Code/text content
- `whiteboard` - Drawing canvas (also called "sketch")
- `presentation` - Slide deck
- `terminal` - Command line
- `dashboard` - Metrics/widgets
- `diff` - Code review comparison
- `browser` - Web preview
- `image/pdf` - Media viewer

#### REQ-2.2.3: Tab Persistence
**Priority:** P1 (Should Have)

- Spaces persist as tabs until explicitly closed
- Switching between tabs preserves state
- Tabs can be reopened from recent history (last 20 closed) (P1)

#### REQ-2.2.4: Tab Operations
**Priority:** P0 (Must Have)

- Close tab: X button or `Ctrl/Cmd + W`
- Switch tabs: Click or `Ctrl/Cmd + 1-9`
- Reorder tabs via drag-and-drop (P1)
- Close others/Close all to the right (context menu) (P1)
- Move tab to another pane (drag to target pane header) (P1)

#### REQ-2.2.5: Tab Preview
**Priority:** P1 (Should Have)

- Hover over tab shows tooltip with full name
- Optional: thumbnail preview on hover

#### REQ-2.2.6: Empty Pane State
**Priority:** P0 (Must Have)

Empty panes display:
- Centered text: "Select content to open"
- Quick actions: Open Whiteboard, Open Editor, Open Presentation
- "Split to Add Pane" button

---

### 2.3 Content Opening Behavior

#### REQ-2.3.1: Default - Current Pane
**Priority:** P0 (Must Have)

When user opens content (whiteboard, editor, presentation):
1. Check if there is an active pane
2. If yes → Open content in **active pane** as new tab
3. If no active pane → Use the first pane

#### REQ-2.3.2: User Controls Pane Creation
**Priority:** P0 (Must Have)

- User decides when to create new panes (via keyboard shortcuts or buttons)
- If user wants content in a new pane:
  1. User creates empty pane (split)
  2. User makes new pane active (clicks it)
  3. User opens content → opens in new pane

#### REQ-2.3.3: Content Type Routing (Future)
**Priority:** P2 (Deferred)

- Agent will decide whether to open content in new pane or current pane
- Requires new MCP modality (deferred to future BLK task)
- User continues with current behavior until then

---

### 2.4 Floating Agent Conversation

#### REQ-2.4.1: Single Session-Wide Conversation
**Priority:** P0 (Must Have)

- **ONE floating agent conversation UI** for the entire session
- NOT one per pane
- Floats over all panes (z-index above pane content)
- Exists regardless of pane count or content

#### REQ-2.4.2: Three Size States
**Priority:** P0 (Must Have)

The agent conversation has three sizes:

**Size A: Minimal (collapsed)**
- Appearance: Small pill/button ~48px wide, ~40px tall
- Contains: Agent icon/avatar, tiny microphone icon, tiny attach icon
- Position: Bottom-right corner (default), movable by drag
- Purpose: Subtle reminder that agent is available

**Size B: Expanded (chat interface)**
- Dimensions: ~40% of viewport width, ~40% of viewport height
- Minimum: 320px width, 300px height
- Maximum: 600px width, 600px height
- Contains:
  - Conversation history (scrollable)
  - Message input area at bottom
  - Attach file button, microphone button
- Position: Floating, user can drag to reposition
- Default position: Center-right area of screen

**Size C: Full (maximum)**
- Dimensions: ~80% of viewport width, ~90% of viewport height
- Contains: Full conversation interface
- Position: Floating, centered on screen
- Covers most of the screen but still floating (not a pane)

#### REQ-2.4.3: State Transitions
**Priority:** P0 (Must Have)

```
Minimal → Expanded: Click on minimal bubble
Expanded → Minimal: Click minimize button or press Escape
Expanded → Full: Click expand button
Full → Expanded: Click collapse button
```

- Transitions should be smooth (150-200ms animation)
- State persists across pane operations
- State persists when content is opened/closed in panes

#### REQ-2.4.4: Draggable Position
**Priority:** P0 (Must Have)

- User can drag the floating conversation to any position
- Position persists during session
- Constrained to viewport (cannot be dragged off-screen)
- Position resets to default on new session

#### REQ-2.4.5: Floating Above Panes
**Priority:** P0 (Must Have)

- Agent conversation floats above all pane content
- Does not affect pane layout
- Does not resize when panes are split/closed
- Z-index higher than pane system

#### REQ-2.4.6: Context Awareness (Visual Only)
**Priority:** P1 (Should Have)

When content is open in a pane (whiteboard, editor, presentation):
- Agent conversation should visually indicate awareness
- Could show small indicator: "Viewing: [content name]"
- This is visual only, does not affect functionality

---

### 2.5 Navigation Panel

#### REQ-2.5.1: Collapsible Navigation
**Priority:** P0 (Must Have)

- Left sidebar (navigation) can be fully collapsed
- Collapse button: single icon (hamburger or arrows)
- Collapsed state: single vertical button bar (48px wide)
- Expanded state: full navigation (220px per Obsidian Hybrid spec)

#### REQ-2.5.2: One-Button Expand
**Priority:** P0 (Must Have)

- Anywhere in collapsed state, click expands navigation
- Keyboard shortcut: `Ctrl/Cmd + B` (toggle)
- Smooth animation: 200ms transition

#### REQ-2.5.3: Navigation Content
**Priority:** P0 (Must Have)

Navigation always accessible, shows:
- Project switcher
- Session list
- File tree (if applicable to current space)
- Space type switcher (quick access to open spaces)
- Settings access

---

### 2.6 Layout Management

#### REQ-2.6.1: Layout Persistence Per Session
**Priority:** P0 (Must Have)

- Layout (pane structure + tab positions) saved with session
- Restored when session is reopened
- Saved in session metadata (JSON format)

#### REQ-2.6.2: New Session - Empty Layout
**Priority:** P0 (Must Have)

- Creates single full-size pane (Zen Mode)
- No tabs open initially
- User opens content manually

#### REQ-2.6.3: New Session - Clone Layout
**Priority:** P1 (Should Have)

- Button: "Use Last Grid" (or "Clone Layout")
- Copies pane structure from another session
- Empty panes (no content)
- Tab structure preserved

#### REQ-2.6.4: Layout Reset
**Priority:** P1 (Should Have)

- Reset to default layout (single full pane)
- Confirmation dialog to prevent accidental data loss

---

### 2.7 User Interactions

#### REQ-2.7.1: Keyboard Shortcuts
**Priority:** P0 (Must Have)

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + \` | Split active pane right |
| `Cmd/Ctrl + Shift + \` | Split active pane down |
| `Cmd/Ctrl + W` | Close active tab (or pane if last tab) |
| `Cmd/Ctrl + 1-9` | Switch to tab 1-9 in active pane |
| `Cmd/Ctrl + B` | Toggle navigation sidebar |
| `Escape` | Minimize agent conversation to minimal size |

#### REQ-2.7.2: Pane Selection
**Priority:** P0 (Must Have)

- Click on pane to activate
- Active pane gets visual indicator
- Only one pane active at a time

---

### 2.8 R7 Interaction and Visual Refinements

#### REQ-2.8.1: Agent Header Legibility
**Priority:** P0 (Must Have)

- Agent header must remain readable over any background.
- Header uses blur plus semi-transparent tint around 50% opacity.
- Fallback color must remain non-transparent even when theme tokens are missing.
- Title text is literal `Agent`, visually emphasized (larger and bolder than body text).

#### REQ-2.8.2: Floating Window Integrity
**Priority:** P0 (Must Have)

- No corner/frame visual artifacts in floating expanded/full windows.
- Drag-to-move is only available from the header area.
- Resizing is available from all edges and corners.

#### REQ-2.8.3: Agent Dock/Grab Pane
**Priority:** P0 (Must Have)

- User can trigger `Grab Pane` from the agent window.
- Agent docks into active pane and fully occupies that pane.
- Original pane content is hidden while docked and restored on undock.
- User can always undock back to floating mode.

#### REQ-2.8.4: Active Pane Invariant
**Priority:** P0 (Must Have)

- There is always an active pane.
- On startup/restore, if active pane is missing, first valid leaf pane becomes active.

#### REQ-2.8.5: Pane Divider Seam
**Priority:** P0 (Must Have)

- Adjacent panes share a single seam line.
- No double-border + margin gap visual effect between pane frames.

#### REQ-2.8.6: Terminal Surface Model
**Priority:** P0 (Must Have)

- Remove top-bar terminal toggle and bottom terminal panel mode.
- Terminal must open as pane content/tab only.

#### REQ-2.8.7: Sidebar Density and Motion
**Priority:** P0 (Must Have)

- Sidebars use compact vertical spacing.
- Open/close behavior uses smooth slide animation (no jump-in).

#### REQ-2.8.8: Agent Composer Layout Density
**Priority:** P0 (Must Have)

- Reduce top/bottom padding around user input text area by at least 50% from current baseline.
- Remove nested-frame appearance in prompt area.
- Input region and message region use distinct backgrounds with a straight edge boundary.

#### REQ-2.8.9: Layout Organization Preference
**Priority:** P0 (Must Have)

- Add user preference: `per-session` or `per-project` pane organization.
- `per-session`: each session stores/restores its own pane layout and content assignment.
- `per-project`: sessions in the same project share pane layout and pane content assignment.
- In `per-project` mode, only agent conversation context/history changes by session.

#### REQ-2.8.10: Selector Population Rules
**Priority:** P0 (Must Have)

- Agent selector lists only top-level agents (e.g., Build, Plan, Oracle).
- Sub-agent/internal modes (e.g., Compaction, Title, Summary) are excluded.
- Model selector lists only models marked active in current configuration.
- Source of truth for model visibility is the persisted model enable/disable state from `Manage models`.
- Settings provide `Connect provider` and `Manage models` with per-model enable/disable toggles.
- Behavior parity with OpenCode client is required for:
  - provider connection entry point,
  - manage-models list and search,
  - per-model enabled/disabled toggle persistence,
  - model selector filtering to enabled models only.

#### REQ-2.8.11: Sidebar Icon Semantics
**Priority:** P0 (Must Have)

- Sessions sidebar control uses sessions/history/list icon.
- File tree sidebar control uses file-tree icon.
- Icons must be distinct from pane split controls.

---

## 3. Non-Functional Requirements

### 3.1 Performance

#### REQ-3.1.1: Pane Switching Speed
**Priority:** P0 (Must Have)

- Switching between tabs: < 100ms
- Splitting panes: < 200ms
- No visible lag during resize drag

#### REQ-3.1.2: Memory Management
**Priority:** P1 (Should Have)

- Inactive tabs (unseen for > 5 min) can be suspended
- Suspended tabs resume < 500ms when activated
- Configurable: auto-suspend on/off, timeout duration

### 3.2 Accessibility

#### REQ-3.2.1: Keyboard Navigation
**Priority:** P0 (Must Have)

- Full keyboard control of panes and tabs
- Arrow keys navigate between panes
- Tab/Shift+Tab navigate within pane
- Focus visible on all interactive elements

#### REQ-3.2.2: Screen Reader Support
**Priority:** P1 (Should Have)

- ARIA labels on panes, tabs, splitters
- Announce pane switches
- Announce tab additions/closures

---

## 4. Data Structures

### 4.1 Pane Layout State

```typescript
interface PaneLayout {
  version: "1.0";
  root: PaneNode;
  activePaneId: string | null;
}

interface PaneNode {
  id: string;
  type: "pane" | "split";
  direction?: "horizontal" | "vertical";
  splitRatio?: number; // 0.0 - 1.0
  children?: PaneNode[];
  tabs?: Tab[];
  activeTabIndex?: number;
}

interface Tab {
  id: string;
  type: "whiteboard" | "editor" | "presentation" | "terminal" | "dashboard" | "diff" | "browser" | "image";
  title: string;
  contentId?: string; // ID of the content (whiteboard ID, file path, etc.)
}
```

### 4.2 Agent Conversation State

```typescript
interface AgentConversationState {
  size: "minimal" | "expanded" | "full";
  position: {
    x: number;
    y: number;
  };
  isVisible: boolean;
}
```

### 4.3 Combined Layout State

```typescript
interface AppLayout {
  version: "1.0";
  panes: PaneLayout;
  agentConversation: AgentConversationState;
  navigationCollapsed: boolean;
}
```

---

## 5. Component Architecture

### 5.1 Pane Components

```
PaneContainer
├── Pane (recursive, for splits)
│   ├── TabBar
│   │   ├── Tab[]
│   │   └── TabActions (split, close)
│   ├── TabContent (whiteboard | editor | presentation | terminal)
│   └── Splitter (between panes)
└── EmptyPane (when no content)
```

### 5.2 Agent Conversation Components

```
AgentConversation (floating, outside PaneContainer)
├── AgentMinimal (minimal size bubble)
├── AgentExpanded (expanded chat interface)
└── AgentFull (full size interface)
```

### 5.3 App Layout Structure

```tsx
// App.tsx structure
<div className="app-container">
  <NavigationSidebar />  {/* Collapsible */}
  <PaneContainer />     {/* Main content area */}
  <AgentConversation /> {/* Floating, z-index above all */}
</div>
```

---

## 6. User Interface Specifications

### 6.1 Pane Container

- Background: `--os-bg-0` (#0d0d0d)
- No visible border when single pane
- Splitters: 4px width, `--os-line` color (#232323)
- Hover splitter: `--os-accent` (#5e5ce6)

### 6.2 Tab Bar

- Height: 32px
- Background: `--os-bg-1` (#141414)
- Active tab: `--os-bg-2` (#1a1a1a), bottom border accent
- Inactive tab: transparent, hover shows `--os-bg-1`
- Text: `--os-text-0` (#e8e8e8) active, `--os-text-1` (#9a9a9a) inactive

### 6.3 Pane Header

Height: 32px
Content left to right:
1. Space type icon (16px)
2. Tab bar (flexible width)
3. Pane actions (right-aligned):
   - Split Right icon
   - Split Down icon
   - Close Pane icon (if multiple panes)

### 6.4 Agent Conversation - Minimal

- Size: 48px width, 40px height
- Background: `--os-bg-2` (#1a1a1a)
- Border: 1px `--os-line` (#232323)
- Border-radius: 20px (pill shape)
- Icon: Agent avatar, 24px

### 6.5 Agent Conversation - Expanded

- Background: `--os-bg-1` (#141414)
- Border: 1px `--os-line` (#232323)
- Border-radius: 12px
- Shadow: 0 8px 32px rgba(0,0,0,0.5)
- Header: 40px height with title, minimize/expand/close buttons

### 6.6 Agent Conversation - Full

- Similar to expanded but larger
- Centered on screen
- Maximum coverage: 90vh, 80vw

### 6.7 Empty Pane State

- Background: `--os-bg-0` (#0d0d0d)
- Icon: 48px space-type placeholder (outlined)
- Text: "Select content to open", `--os-text-1`
- Buttons: ghost style, `--os-line` border

### 6.8 Navigation Collapsed State

- Width: 48px
- Background: `--os-bg-1`
- Single button: expand icon (arrows or hamburger)
- Vertical center alignment

---

## 7. Acceptance Criteria

### Scenario 1: Startup
**Given** the user opens OpenSpace
**When** the application loads
**Then** there is ONE pane taking the complete content area
**And** the agent conversation is visible in minimal size (bottom-right)

### Scenario 2: Opening Content
**Given** the user has one pane open
**When** the user opens a whiteboard
**Then** the whiteboard content appears in the pane as a tab

### Scenario 3: Splitting Pane
**Given** the user has content in a pane
**When** the user presses `Cmd + \`
**Then** the pane splits into two panes
**And** the content remains in the left/top pane
**And** the right/bottom pane is empty

### Scenario 4: Multiple Tabs
**Given** the user has content in a pane
**When** the user opens a presentation while whiteboard is open
**Then** a new tab appears in the active pane
**And** they can switch between whiteboard and presentation tabs

### Scenario 5: Agent Conversation - Minimal to Expanded
**Given** the agent conversation is in minimal size
**When** the user clicks on the minimal bubble
**Then** the conversation expands to ~40% width/height
**And** shows conversation history and input

### Scenario 6: Agent Conversation - Expanded to Full
**Given** the agent conversation is expanded
**When** the user clicks expand button
**Then** the conversation expands to ~80% width/height
**And** conversation takes most of the screen

### Scenario 7: Agent Conversation - Minimize
**Given** the agent conversation is expanded
**When** the user presses Escape
**Then** the conversation minimizes to minimal size

### Scenario 8: Agent Conversation - Context
**Given** the user has a whiteboard open in a pane
**And** the agent conversation is expanded
**When** the user looks at the agent conversation
**Then** they can see visual indication of current content

### Scenario 9: Content Opens in Active Pane
**Given** the user has two panes open
**And** pane B is active (clicked)
**When** the user opens a presentation
**Then** the presentation opens in pane B

### Scenario 10: Closing Last Tab
**Given** a pane has one tab open
**When** the user closes that tab
**Then** the pane shows empty state (not closed)

### Scenario 11: Navigation Toggle
**Given** navigation is expanded
**When** user clicks collapse button
**Then** navigation collapses to 48px width
**And** the main content area expands to fill space

### Scenario 12: Layout Persistence
**Given** the user has arranged panes (editor left, sketch right)
**When** they close and reopen the session
**Then** the same pane arrangement is restored
**And** both spaces reopen in their respective panes

### Scenario 13: Manage Models Parity
**Given** connected providers and model toggles in settings
**When** the user disables a model in `Manage models`
**Then** that model no longer appears in the input prompt model selector
**And** toggled enabled models remain available across reload
**And** the behavior matches OpenCode client semantics for connect/manage/filter flow

---

## 8. Dependencies

- REQ-001: Obsidian Hybrid UI Design System
- Existing whiteboard, editor, presentation components
- Session state management (existing)

---

## 9. Decisions

1. **Zen Mode**: ✅ Yes - **Default** for new sessions. Single full pane, no splits.
2. **Agent Bubble Position**: Default bottom-right corner, but movable
3. **Pane Synchronization**: Uses existing hub refresh mechanism
4. **Layout Organization Preference**: ✅ Implement `per-session` and `per-project` as defined in REQ-2.8.9
5. **Preset Layouts**: ❌ Deferred - but system supports saved configuration objects

---

## 10. Deferred Items

1. **Agent Control Over Panes (MCP)** - Future BLK task
   - Agent decides whether to open content in new pane
   - Requires new modality definition

2. **Agent Conversation Locked to Pane** - Future enhancement
   - User can "lock" conversation to a specific pane
   - Not in initial implementation

3. **Named Layouts** - Future enhancement
   - Save/load named layouts

---

## 11. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2026-02-12 | Oracle | Initial draft (REQ-002) |
| 0.2 | 2026-02-13 | Oracle | Added floating agent conversation (REQ-003 merged) |
| 0.3 | 2026-02-13 | Oracle | Consolidated into single source of truth |
| 0.4 | 2026-02-13 | Oracle | Added R7 refinements: active-pane/title-bar activation clarity, dock/undock agent behavior, terminal-as-pane-only, layout preference mode, selector filtering rules, divider seam rules |

---

## 12. Notes

- The floating agent conversation is inspired by Intercom, Drift, and other chat widgets
- Position should persist during session but reset on new session
- Future consideration: Add keyboard shortcut to toggle agent conversation visibility
- Future consideration: Add sound/notification settings for agent
- Performance of tab persistence may be revisited if memory issues arise
