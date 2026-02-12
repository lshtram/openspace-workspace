# REQ-002: Window/Pane Management System

## Status: DRAFT

---

## 1. Overview

### 1.1 Purpose
Define the window and pane management system for OpenSpace, enabling users to work with multiple spaces (editor, sketch, dashboard, etc.) in a flexible, VS Code-style layout that persists per session.

### 1.2 Scope
- Pane creation, splitting, and resizing
- Tab management within panes
- Space-to-pane assignment
- Layout persistence per session
- Layout cloning between sessions
- Navigation collapse/expand

### 1.3 Out of Scope
- Floating windows (pop-out) - future enhancement
- Multiple monitor support - future enhancement
- Touch/gesture support - future enhancement

---

## 2. Functional Requirements

### 2.1 Pane System

#### REQ-2.1.1: VS Code-Style Grid Layout
**Priority:** P0 (Must Have)

The system shall use a grid-based layout with:
- Vertical and horizontal splits
- Minimum pane size: 200px width, 150px height
- Maximum split depth: 4 levels (arbitrary but reasonable limit)
- Equal priority panes (no "main" vs "secondary" distinction)

#### REQ-2.1.2: Pane Creation
**Priority:** P0 (Must Have)

Users can create new panes via:
- Split Right (Ctrl/Cmd + \)
- Split Down (Ctrl/Cmd + Shift + \)
- Context menu on pane header: "Split Right", "Split Down"
- Empty state button: "Split to Add Pane"

#### REQ-2.1.3: Pane Resizing
**Priority:** P0 (Must Have)

- Draggable splitters between panes
- Minimum 8px grab area on splitters
- Visual feedback during drag (highlight splitter)
- Snap to 25%, 33%, 50%, 66%, 75% widths

#### REQ-2.1.4: Pane Selection
**Priority:** P0 (Must Have)

- Click anywhere in pane to activate
- Visual indicator: 2px accent border on active pane
- Only one active pane at a time
- Keyboard shortcut: Ctrl/Cmd + 1-9 to jump to pane by number

#### REQ-2.1.5: Pane Closing
**Priority:** P0 (Must Have)

- Close button on pane header (if multiple panes exist)
- Keyboard shortcut: Ctrl/Cmd + W (closes active tab, or pane if last tab)
- Remaining panes expand to fill space proportionally

### 2.2 Tab System

#### REQ-2.2.1: Tabbed Interface Per Pane
**Priority:** P0 (Must Have)

Each pane shall support multiple tabs:
- Tab height: 32px (matching Obsidian Hybrid density spec)
- Tab width: min 80px, max 200px, truncate with ellipsis
- Active tab: distinct background color
- Inactive tabs: dimmed state
- Tab overflow: horizontal scroll with arrows

#### REQ-2.2.2: Tab Content
**Priority:** P0 (Must Have)

Tabs can contain any of the 8 space types:
- editor/viewer - code/text content
- sketch - whiteboard/drawing canvas
- dashboard - metrics/widgets
- presentation - slides
- diff - code review comparison
- terminal - shell/command line
- browser - web preview
- image/pdf - media viewer

#### REQ-2.2.3: Tab Persistence
**Priority:** P0 (Must Have)

- Spaces persist as tabs until explicitly closed
- Switching between tabs preserves state
- Tabs can be reopened from recent history (last 20 closed)

#### REQ-2.2.4: Tab Operations
**Priority:** P0 (Must Have)

- Reorder tabs via drag-and-drop
- Close tab: X button or Ctrl/Cmd + W
- Close others (context menu)
- Close all to the right (context menu)
- Duplicate tab (context menu)
- Move tab to another pane (drag to target pane header)

#### REQ-2.2.5: Tab Preview
**Priority:** P1 (Should Have)

- Hover over tab shows tooltip with full name
- Optional: thumbnail preview on hover (configurable)

### 2.3 Space Assignment

#### REQ-2.3.1: Opening Spaces
**Priority:** P0 (Must Have)

When user opens a space (via command palette, file tree, or menu):
1. If pane is active → open as new tab in active pane
2. If pane has existing content → add new tab
3. If no pane active → create new pane (full area) and open there

#### REQ-2.3.2: Empty Pane State
**Priority:** P0 (Must Have)

Empty panes display:
- Large centered icon (space type placeholder)
- Text: "Select a space to open"
- Quick actions: Recent spaces, New file, Open file
- "Split to Add Pane" button

#### REQ-2.3.3: Space Type Indicator
**Priority:** P1 (Should Have)

- Tab shows icon indicating space type
- Color coding for space types (subtle, matching Obsidian palette)
- Editor: document icon
- Sketch: pencil icon
- Dashboard: grid icon
- Presentation: slides icon
- Diff: compare icon
- Terminal: terminal icon
- Browser: globe icon
- Image/PDF: image icon

#### REQ-2.3.4: Multiple Modalities Visible
**Priority:** P0 (Must Have)

System supports simultaneous view of different space types:
- Example: Editor left pane, Sketch right pane
- Each pane operates independently
- No restriction on space type combinations

### 2.4 Layout Management

#### REQ-2.4.1: Layout Persistence Per Session
**Priority:** P0 (Must Have)

- Layout (pane structure + tab positions) saved with session
- Restored when session is reopened
- Saved in session metadata (JSON format)

#### REQ-2.4.2: New Session - Empty Layout
**Priority:** P0 (Must Have)

Button: "Create Empty Session"
- Creates single full-size pane
- No tabs open initially
- User opens content manually

#### REQ-2.4.3: New Session - Clone Layout
**Priority:** P0 (Must Have)

Button: "Use Last Grid" (or "Clone Layout")
- Copies pane structure from another session
- Empty panes (no content)
- Tab structure preserved (placeholder tabs indicating space types)
- Source: Most recently used layout OR explicit selection from saved layouts

#### REQ-2.4.4: Named Layouts
**Priority:** P1 (Should Have)

- Save current layout with custom name
- List of saved layouts in settings
- Load saved layout into current session
- Delete/overwrite saved layouts

#### REQ-2.4.5: Layout Reset
**Priority:** P1 (Should Have)

- Reset to default layout (single full pane)
- Confirmation dialog to prevent accidental data loss

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
- Keyboard shortcut: Ctrl/Cmd + B (toggle)
- Smooth animation: 200ms transition

#### REQ-2.5.3: Navigation Content
**Priority:** P0 (Must Have)

Navigation always accessible, shows:
- Project switcher
- Session list
- File tree (if applicable to current space)
- Space type switcher (quick access to open spaces)
- Settings access

### 2.6 Agent Companion

#### REQ-2.6.1: Floating Bubble Mode
**Priority:** P0 (Must Have)

- Default state: floating bubble (64px diameter)
- Position: bottom-right corner (default), movable anywhere
- Always on top of all panes
- Click to expand to full pane view
- Visual: microphone icon or agent avatar

#### REQ-2.6.2: Full Pane Mode
**Priority:** P0 (Must Have)

- Expanded state fills a pane (not floating)
- Full conversation view with history
- Input area at bottom
- Can be minimized back to bubble
- Can be "popped" to floating from pane view

#### REQ-2.6.3: Agent Persistence
**Priority:** P0 (Must Have)

- Agent state persists across mode switches
- Conversation history maintained
- Recording state preserved

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

#### REQ-3.1.3: Maximum Panes
**Priority:** P1 (Should Have)

- Soft limit: 8 panes (performance warning)
- Hard limit: 16 panes (prevent creation)

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

### 3.3 State Management

#### REQ-3.3.1: Layout Schema
**Priority:** P0 (Must Have)

Layout saved as JSON structure:
```json
{
  "version": "1.0",
  "root": {
    "type": "split",
    "direction": "horizontal",
    "splitRatio": 0.5,
    "children": [
      {
        "type": "pane",
        "tabs": [
          {"type": "editor", "file": "src/App.tsx", "state": {...}},
          {"type": "editor", "file": "src/index.css", "state": {...}}
        ],
        "activeTabIndex": 0
      },
      {
        "type": "pane",
        "tabs": [
          {"type": "sketch", "whiteboardId": "abc123", "state": {...}}
        ],
        "activeTabIndex": 0
      }
    ]
  },
  "navigationCollapsed": false
}
```

#### REQ-3.3.2: Auto-Save
**Priority:** P0 (Must Have)

- Layout auto-saves every 5 seconds during changes
- Saves on session close
- Recovery: restore last known layout on crash/reopen

---

## 4. User Interface Specifications

### 4.1 Pane Header

Height: 32px (matching Obsidian Hybrid tab bar)
Content left to right:
1. Space type icon (16px)
2. Tab bar (flexible width)
3. Pane actions (right-aligned):
   - Split Right icon
   - Split Down icon
   - Close Pane icon (if multiple panes)

### 4.2 Tab Appearance

Active tab:
- Background: `--os-bg-2` (#1a1a1a)
- Text: `--os-text-0` (#e8e8e8)
- Border-bottom: 2px `--os-accent` (#5e5ce6)

Inactive tab:
- Background: transparent
- Text: `--os-text-1` (#9a9a9a)
- Hover: background `--os-bg-1` (#141414)

### 4.3 Splitter Appearance

- Width: 4px (8px grab area)
- Color: `--os-line` (#232323)
- Hover: `--os-accent` (#5e5ce6)
- Active drag: `--os-accent` with 50% opacity background

### 4.4 Empty Pane State

- Background: `--os-bg-0` (#0d0d0d)
- Icon: 48px space-type placeholder (outlined)
- Text: "Select a space to open", `--os-text-1`
- Buttons: ghost style, `--os-line` border

### 4.5 Navigation Collapsed State

- Width: 48px
- Background: `--os-bg-1`
- Single button: expand icon (arrows or hamburger)
- Vertical center alignment

---

## 5. Decisions

1. **Layout Sharing**: ❌ Deferred - not implementing now
2. **Preset Layouts**: ❌ Deferred - but system supports saved configuration objects that can be used for "Use Last Grid" functionality
3. **Zen Mode**: ✅ Yes - This is the **default** for new sessions. Single full pane, no splits.
4. **Pane Synchronization**: ✅ Uses existing hub refresh mechanism. When file changes, hub notifies all panes. No additional sync layer needed. Acceptable delay: ~1 second.

## 6. Updated Specifications

### 6.1 Zen Mode (Default)
- New sessions start in Zen Mode by default
- Single pane occupying full content area
- No visible splitters
- Navigation can still be toggled
- User manually creates splits when needed

### 6.2 Agent Bubble Position
- Default position: **center of screen** (not corner)
- Acts as reminder of available tools (load code, open code, etc.)
- Floating above all content
- Movable by user

### 6.3 File Synchronization
- Uses existing hub file watching
- Hub detects file changes → broadcasts refresh event
- All panes with that file receive update
- No special sync for duplicate editor panes
- Acceptable latency: 1-2 seconds

---

## 6. Dependencies

- REQ-001: Obsidian Hybrid UI Design System (completed)
- React Resizable Panels library (or custom implementation)
- Session state management (existing)

---

## 7. Acceptance Criteria

### Scenario 1: Basic Pane Operations
Given a user has OpenSpace open
When they press Ctrl+\\
Then the current pane splits vertically
And both panes remain visible

### Scenario 2: Tab Management
Given a user has a pane with a text editor open
When they open a sketch space
Then a new tab appears in the active pane
And they can switch between editor and sketch tabs

### Scenario 3: Layout Persistence
Given a user has arranged panes (editor left, sketch right)
When they close and reopen the session
Then the same pane arrangement is restored
And both spaces reopen in their respective panes

### Scenario 4: Clone Layout
Given a user has Session A with a 3-pane layout
When they create a new session using "Use Last Grid"
Then the new session has the same 3-pane structure
But with empty panes

### Scenario 5: Navigation Toggle
Given navigation is expanded
When user clicks collapse button
Then navigation collapses to 48px width
And the main content area expands to fill space

---

## 8. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2026-02-12 | Oracle | Initial draft based on user requirements |

---

## Notes

- Performance of tab persistence (REQ-2.2.3) may be revisited if memory issues arise
- Future enhancement: Floating/detachable panes for multi-monitor support
- Agent companion behavior detailed in separate requirements if needed
