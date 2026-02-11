---
id: VISUAL-ARCH-OPENSPACE
author: oracle_a1b2
status: DRAFT
date: 2026-02-11
task_id: openspace-ui-design
---

# OpenSpace Visual Architecture Document

## Vision Statement

> OpenSpace is a multi-modal AI workspace that feels like a natural extension of the user's mind. Every pixel serves a purpose. Every interaction respects the user's intent. Every space adapts to the task while maintaining the comforting presence of an ever-present AI companion.

**Design Philosophy: "Calm Power"**
- Power users get infinite flexibility
- New users get gentle guidance
- The interface gets out of the way
- Beauty emerges from function

---

## 1. Design Principles

### 1.1 Spatial Freedom
- No artificial constraints on window placement
- Users arrange space to match their mental model
- Layouts persist and adapt

### 1.2 Contextual Adaptation
- UI chrome adapts to current activity
- Relevant controls appear, irrelevant ones recede
- Agent understands spatial context

### 1.3 Calm Presence
- Agent is always accessible, never intrusive
- Visual hierarchy guides attention
- Micro-interactions provide feedback without distraction

### 1.4 Seamless Flow
- Transitions are purposeful and fluid
- State changes are predictable
- Undo is always available

### 1.5 Deliberate Density
- Information-rich when needed
- Zen-like when focus required
- User controls information density

---

## 2. Design System

### 2.1 Color Palette

**Primary Colors:**
```
--os-bg-primary: #0A0A0B        (Deep void - main background)
--os-bg-secondary: #141416      (Elevated surfaces)
--os-bg-tertiary: #1C1C1F       (Higher elevation)
--os-bg-quaternary: #242428     (Interactive elements)
```

**Accent Colors:**
```
--os-accent-primary: #6366F1    (Indigo - primary actions)
--os-accent-secondary: #8B5CF6  (Violet - secondary actions)
--os-accent-tertiary: #A855F7   (Purple - highlights)
--os-accent-gradient: linear-gradient(135deg, #6366F1 0%, #A855F7 100%)
```

**Semantic Colors:**
```
--os-success: #22C55E
--os-warning: #F59E0B
--os-error: #EF4444
--os-info: #3B82F6
```

**Agent Colors:**
```
--os-agent-builder: #6366F1    (Indigo)
--os-agent-oracle: #8B5CF6     (Violet)
--os-agent-janitor: #10B981    (Emerald)
--os-agent-designer: #F43F5E   (Rose)
```

**Text Colors:**
```
--os-text-primary: #FAFAFA      (High emphasis)
--os-text-secondary: #A1A1AA    (Medium emphasis)
--os-text-tertiary: #71717A     (Low emphasis)
--os-text-disabled: #52525B     (Disabled)
```

**Border Colors:**
```
--os-border-subtle: rgba(255, 255, 255, 0.06)
--os-border-default: rgba(255, 255, 255, 0.1)
--os-border-strong: rgba(255, 255, 255, 0.15)
--os-border-accent: rgba(99, 102, 241, 0.5)
```

### 2.2 Typography

**Font Family:**
```css
--os-font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--os-font-mono: 'JetBrains Mono', 'Fira Code', monospace;
--os-font-display: 'Space Grotesk', sans-serif;
```

**Type Scale:**
```
--os-text-xs: 11px    (line-height: 16px,  letter-spacing: 0.01em)
--os-text-sm: 12px    (line-height: 18px,  letter-spacing: 0)
--os-text-base: 13px  (line-height: 20px,  letter-spacing: 0)
--os-text-md: 14px    (line-height: 22px,  letter-spacing: 0)
--os-text-lg: 16px    (line-height: 24px,  letter-spacing: -0.01em)
--os-text-xl: 20px    (line-height: 28px,  letter-spacing: -0.02em)
--os-text-2xl: 24px   (line-height: 32px,  letter-spacing: -0.02em)
--os-text-3xl: 32px   (line-height: 40px,  letter-spacing: -0.03em)
```

**Font Weights:**
```
--os-font-normal: 400
--os-font-medium: 500
--os-font-semibold: 600
--os-font-bold: 700
```

### 2.3 Spacing System

**Base Unit: 4px**
```
--os-space-1: 4px
--os-space-2: 8px
--os-space-3: 12px
--os-space-4: 16px
--os-space-5: 20px
--os-space-6: 24px
--os-space-8: 32px
--os-space-10: 40px
--os-space-12: 48px
--os-space-16: 64px
```

**Border Radius:**
```
--os-radius-sm: 4px    (inputs, small buttons)
--os-radius-md: 6px    (cards, panels)
--os-radius-lg: 8px    (modals, floating elements)
--os-radius-xl: 12px   (agent companion, large surfaces)
--os-radius-full: 9999px (pills, avatars)
```

### 2.4 Shadows & Elevation

```
--os-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3)
--os-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.2)
--os-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)
--os-shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.4)
--os-shadow-glow: 0 0 20px rgba(99, 102, 241, 0.3)
```

### 2.5 Animation & Motion

**Timing Functions:**
```
--os-ease-default: cubic-bezier(0.4, 0, 0.2, 1)
--os-ease-in: cubic-bezier(0.4, 0, 1, 1)
--os-ease-out: cubic-bezier(0, 0, 0.2, 1)
--os-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)
```

**Durations:**
```
--os-duration-instant: 0ms
--os-duration-fast: 100ms
--os-duration-normal: 200ms
--os-duration-slow: 300ms
--os-duration-slower: 500ms
```

**Standard Transitions:**
- Micro-interactions: 100ms ease-out
- Panel transitions: 200ms ease-default
- Layout changes: 300ms ease-default
- Agent state changes: 500ms with spring easing

---

## 3. Component Specifications

### 3.1 Activity Ribbon (Top Bar)

**Dimensions:**
- Height: 40px
- Full width

**Visual Style:**
- Background: --os-bg-primary
- Border-bottom: 1px solid --os-border-default

**Activity Items:**
- Size: 32px × 32px
- Border-radius: --os-radius-md
- Icon size: 18px
- Gap between items: --os-space-1

**States:**
- Default: opacity 0.6, --os-text-secondary
- Hover: opacity 0.9, --os-text-primary, bg --os-bg-tertiary
- Active: opacity 1, --os-accent-primary, bg with 10% accent

**Animation:**
- Hover: scale(1.05), 100ms
- Active indicator: sliding underline or glow

### 3.2 Navigation Panel

**Dimensions:**
- Min-width: 48px (collapsed icons)
- Max-width: 320px (expanded)
- Default expanded: 240px

**Visual Style:**
- Background: --os-bg-secondary
- Border-right: 1px solid --os-border-default

**Sections:**
- Section header: 12px uppercase, --os-text-tertiary, letter-spacing 0.05em
- Item height: 28px
- Item padding: --os-space-2 --os-space-3
- Icon size: 16px
- Icon margin-right: --os-space-2

**Tree Indentation:**
- Per-level indent: --os-space-4
- Guide line: 1px solid --os-border-subtle

**File States:**
- Modified: dot indicator (4px) in --os-warning
- Added: dot indicator in --os-success
- Deleted: strikethrough text in --os-error
- Selected: bg --os-bg-quaternary, left border 2px --os-accent-primary

**Drag States:**
- Drop target: dashed border 1px --os-accent-primary, bg with 5% accent
- Dragging: opacity 0.7, scale(0.98), shadow-lg

### 3.3 Pane Window Chrome

**Header:**
- Height: 36px
- Background: --os-bg-tertiary
- Border-bottom: 1px solid --os-border-default
- Padding: 0 --os-space-3

**Title:**
- Font: --os-text-sm, --os-font-medium
- Color: --os-text-primary
- Max-width: 60% (truncates with ellipsis)

**Window Controls:**
- Size: 24px × 24px
- Icon size: 14px
- Gap: --os-space-1
- Border-radius: --os-radius-sm
- Hover bg: --os-bg-quaternary

**Buttons (right to left):**
- Close: × icon
- Maximize/Restore: 🗖 / 🗗 icons
- Pop-out: ⧉ icon
- Split: ⫯ icon (dropdown for direction)

**Resize Handles:**
- Width: 4px
- Hover: bg --os-accent-primary with 30% opacity
- Active: bg --os-accent-primary with 50% opacity

### 3.4 Agent Companion

**Collapsed State (Avatar):**
- Size: 48px × 48px
- Border-radius: --os-radius-full
- Background: --os-accent-gradient
- Shadow: --os-shadow-lg + --os-shadow-glow
- Status indicator: 12px dot, positioned bottom-right
  - Working: pulsing --os-accent-primary
  - Idle: solid --os-success
  - Error: solid --os-error

**Default Expanded:**
- Width: 320px
- Min-height: 160px
- Max-height: 400px
- Border-radius: --os-radius-xl
- Background: --os-bg-secondary
- Border: 1px solid --os-border-default
- Shadow: --os-shadow-xl

**Header:**
- Height: 44px
- Avatar: 32px × 32px
- Name: --os-text-md, --os-font-semibold
- Status: --os-text-xs, --os-text-secondary
- Controls: minimize (🗕), maximize (🗗), close (×)

**Message Area:**
- Padding: --os-space-3
- Max-height: 280px (scrollable)
- Message bubble padding: --os-space-2 --os-space-3
- Border-radius: --os-radius-md
- User message: align right, bg --os-bg-quaternary
- Agent message: align left, bg --os-bg-tertiary

**Input Area:**
- Min-height: 44px
- Max-height: 120px (auto-expands)
- Padding: --os-space-3
- Border-top: 1px solid --os-border-default
- Placeholder: --os-text-tertiary

**Voice Button:**
- Size: 36px × 36px
- Border-radius: --os-radius-full
- Default: bg --os-bg-quaternary
- Active (listening): 
  - bg --os-accent-primary
  - Animated ring effect (pulsing scale 1 → 1.3)
  - Color: white

**Positioning:**
- Default: bottom-right, 24px from edges
- Can be dragged anywhere
- Snaps to edges within 20px
- Can be moved to secondary monitor

### 3.5 Secondary Space Thumbnails

**Dimensions:**
- Width: 200px
- Height: 140px
- Border-radius: --os-radius-md

**Visual Style:**
- Background: --os-bg-secondary
- Border: 1px solid --os-border-default
- Shadow: --os-shadow-md

**Header:**
- Height: 28px
- Padding: 0 --os-space-2
- Icon: 14px
- Title: --os-text-xs, truncated
- Close: × on hover

**Preview:**
- Scale: 25% of actual content
- Real-time updates
- Click to promote to primary

**Arrangement:**
- Horizontal scroll container
- Gap: --os-space-3
- Bottom padding: --os-space-4

### 3.6 Tab Bar

**Dimensions:**
- Height: 36px
- Background: --os-bg-secondary

**Tab:**
- Min-width: 120px
- Max-width: 200px
- Height: 32px
- Padding: 0 --os-space-3
- Border-radius: --os-radius-sm
- Gap between tabs: --os-space-1

**Tab States:**
- Inactive: bg transparent, --os-text-secondary
- Hover: bg --os-bg-tertiary
- Active: bg --os-bg-quaternary, --os-text-primary, top border 2px --os-accent-primary

**Close Button:**
- Appears on hover (or always visible in settings)
- Size: 16px × 16px
- Border-radius: --os-radius-sm

**New Tab Button:**
- Width: 32px
- + icon

### 3.7 Activity-Specific UIs

#### Whiteboard Space

**Toolbar:**
- Position: left edge, vertically centered
- Width: 48px
- Background: --os-bg-secondary with blur backdrop
- Border-radius: --os-radius-lg
- Padding: --os-space-2

**Tool Buttons:**
- Size: 40px × 40px
- Border-radius: --os-radius-md
- Icon size: 20px
- Active: bg --os-accent-primary, color white
- Keyboard shortcut badge: --os-text-xs, --os-text-tertiary, bottom-right

**Canvas:**
- Infinite scroll
- Grid: dots at --os-space-4 intervals, --os-border-subtle color
- Background: --os-bg-primary

**Selection:**
- Border: 1px solid --os-accent-primary
- Resize handles: 8px squares at corners
- Rotate handle: circle above top-center

**Properties Panel:**
- Position: right edge
- Width: 240px
- Background: --os-bg-secondary
- Sections with collapsible headers

#### Editor Space

**Minimap:**
- Width: 80px
- Background: --os-bg-secondary
- Current view highlight: --os-accent-primary with 20% opacity

**Gutter:**
- Width: 48px
- Line numbers: --os-text-tertiary, right-aligned
- Fold indicators: triangles

**Code Area:**
- Font: --os-font-mono, --os-text-md
- Line height: 1.6

**Breadcrumbs:**
- Height: 28px
- Background: --os-bg-tertiary
- Font: --os-text-sm
- Separator: / or >

**Agent Presence in Code:**
- Cursor: colored by agent, with agent name label
- Selection: colored highlight with 20% opacity
- Working indicator: spinner near cursor

#### Dashboard Space

**Widget Grid:**
- Gap: --os-space-4
- Auto-responsive columns (min 280px)

**Widget Card:**
- Background: --os-bg-secondary
- Border-radius: --os-radius-lg
- Padding: --os-space-4
- Shadow: --os-shadow-md

**Widget Header:**
- Height: 32px
- Title: --os-text-md, --os-font-semibold
- Actions: ··· menu on right

**Chart Colors:**
- Use accent palette for data series
- Gradients for area charts

---

## 4. Layout System

### 4.1 Pane Management

**Container:**
- Flexbox or CSS Grid
- Gaps: --os-space-1 between panes
- Resize handles: 4px draggable areas

**Minimum Sizes:**
- Pane: 240px × 160px
- Navigation: 48px (collapsed), 160px (expanded)
- Agent: 160px × 120px (expanded)

**Maximum Panes:**
- Recommended: 4-6 visible
- Hard limit: 12 (performance)

**Splitting:**
- Horizontal: ctrl/cmd + \ (or right-click → split)
- Vertical: ctrl/cmd + shift + \ (or right-click → split)
- Split maintains 50/50 ratio by default
- Recenters on resize

### 4.2 Responsive Behavior

**Large Screens (>1600px):**
- Multiple panes comfortable
- Navigation expanded by default
- Agent expanded by default

**Medium Screens (1200-1600px):**
- 2-3 panes optimal
- Navigation collapsed or overlay
- Agent collapsed or small

**Small Screens (<1200px):**
- Tab mode recommended
- Single pane
- Navigation overlay (slide-out)
- Agent collapsed to avatar

**Touch Devices:**
- Larger touch targets (min 44px)
- Swipe gestures for navigation
- Pinch to zoom in whiteboard
- Long-press for context menus

### 4.3 Layout Presets

**Default:**
- Navigation: left, 240px
- Main area: remaining
- Agent: bottom-right, floating
- Single pane in main area

**Split:**
- Navigation: left, 48px (icons only)
- Main area: 2 panes side-by-side (50/50)
- Agent: collapsed

**Focus:**
- Navigation: hidden
- Main area: single pane, full size
- Agent: collapsed
- All chrome minimized

**Review:**
- Navigation: right, 200px (file list)
- Main area: 2 panes (diff viewer)
- Agent: expanded, left side

---

## 5. Interaction Patterns

### 5.1 Drag & Drop

**Visual Feedback:**
- Drag start: element scales to 0.95, opacity 0.8
- Drag over valid target: target highlights with dashed border
- Drop: subtle bounce animation

**Supported Operations:**
- File from nav to pane: opens file
- File from nav to agent: attaches as context
- Pane to edge: splits in that direction
- Pane to another pane: swaps contents

### 5.2 Context Menus

**Trigger:** Right-click or long-press

**Style:**
- Background: --os-bg-secondary
- Border: 1px solid --os-border-default
- Border-radius: --os-radius-md
- Shadow: --os-shadow-lg
- Min-width: 160px
- Padding: --os-space-1 0

**Menu Item:**
- Height: 32px
- Padding: 0 --os-space-3
- Icon: 16px, left side
- Label: --os-text-sm
- Shortcut: --os-text-xs, --os-text-tertiary, right side

**States:**
- Hover: bg --os-bg-quaternary
- Disabled: opacity 0.4
- Separator: 1px line, --os-border-default, margin --os-space-1 0

### 5.3 Tooltips

**Trigger:** Hover with 400ms delay

**Style:**
- Background: --os-bg-quaternary
- Color: --os-text-primary
- Padding: --os-space-1 --os-space-2
- Border-radius: --os-radius-sm
- Font: --os-text-xs
- Max-width: 240px

**Position:** Automatic (prefers top, flips if needed)

### 5.4 Notifications (Toast)

**Position:** Top-right, stacked

**Style:**
- Background: --os-bg-secondary
- Border-left: 3px solid (color by type)
- Border-radius: --os-radius-md
- Shadow: --os-shadow-lg
- Padding: --os-space-3
- Max-width: 360px

**Animation:**
- Enter: slide from right + fade in
- Exit: fade out + slide up

**Duration:**
- Success: 3000ms
- Info: 5000ms
- Warning: 8000ms
- Error: persistent (user dismisses)

### 5.5 Modals & Dialogs

**Overlay:**
- Background: rgba(0, 0, 0, 0.7)
- Backdrop-filter: blur(4px)

**Dialog:**
- Background: --os-bg-secondary
- Border-radius: --os-radius-lg
- Shadow: --os-shadow-xl
- Min-width: 400px
- Max-width: 90vw
- Max-height: 90vh

**Animation:**
- Overlay: fade in 200ms
- Dialog: scale(0.95 → 1) + fade in 200ms with spring easing

---

## 6. Activity-Specific Specifications

### 6.1 Voice Space

**Recording Interface:**
- Central waveform visualization
- Pulsing circle during recording
- Time display: --os-text-2xl, monospace
- Peak level indicator

**Waveform:**
- Color: --os-accent-gradient
- Height: 120px
- Real-time rendering
- Smooth animations

**Transcription:**
- Scrollable list
- Timestamp badges
- Entity highlighting
- Confidence indicators (subtle opacity)

### 6.2 Sketch Space (Whiteboard)

**Canvas:**
- Infinite plane
- Dot grid pattern
- Pan: space + drag or middle mouse
- Zoom: ctrl + scroll or pinch

**Tools:**
- Selection (V)
- Hand/Pan (H)
- Rectangle (R)
- Ellipse (E)
- Arrow (A)
- Line (L)
- Text (T)
- Image (I)

**Selection:**
- Bounding box with resize handles
- Rotation handle
- Context toolbar appears near selection

**Properties Panel:**
- Position & dimensions
- Fill color & opacity
- Stroke color, width, style
- Text properties (if applicable)
- Effects (shadow, blur)

### 6.3 Dashboard Space

**Widgets:**
- Draggable grid layout
- Resizable (discrete sizes: 1×1, 2×1, 2×2, etc.)
- Configurable per widget

**Widget Types:**
- Stats (number with trend)
- Chart (line, bar, pie)
- List (tasks, files, sessions)
- Activity feed
- Agent status
- System health

### 6.4 Present Space

**Slide View:**
- Main slide: 16:9 ratio, centered
- Navigator: thumbnails on left
- Speaker notes: bottom panel (collapsible)

**Presentation Mode:**
- Full screen
- Slide fills viewport
- Controls auto-hide
- Click or arrow keys to advance

**Narration:**
- Script panel
- Audio waveform
- Sync indicators (which text is being spoken)

### 6.5 Build Space (Editor)

**Layout:**
- Editor: 60% width
- Sidebar (file tree): 20%
- Panel (terminal/preview): 20% bottom
- Resizable dividers

**Tabs:**
- Document tabs
- Preview tabs
- Tool tabs (terminal, output, problems)

**Status Bar:**
- Line/column
- File encoding
- Language mode
- Git branch
- Error/warning counts
- Agent status

### 6.6 Review Space (Diff)

**Layout:**
- Side-by-side (default)
- Unified (toggle)

**Diff Visualization:**
- Added lines: green bg, + prefix
- Removed lines: red bg, - prefix
- Modified: yellow bg with word-level diff
- Unchanged: neutral

**Comment Threads:**
- Inline, collapsible
- Avatar + name
- Timestamp
- Resolve checkbox

---

## 7. Agent Presence System

### 7.1 Visual Indicators

**Agent Orb:**
- Floating avatar
- Status ring (color-coded)
- Working: pulsing animation
- Thinking: subtle bounce
- Error: red pulse

**In-Activity Presence:**
- Cursor: colored, with name tag
- Selection: translucent highlight
- Activity indicator: small spinner

### 7.2 Status States

**Idle:**
- Static avatar
- No animation
- Available message

**Working:**
- Pulsing ring (1.5s cycle)
- Status text: "Working on..."
- Progress indicator (if available)

**Thinking:**
- Bouncing avatar
- Status text: "Thinking..."
- Animated ellipsis

**Error:**
- Red ring pulse
- Status text: error message
- Retry button visible

**Collaborating:**
- Multiple cursors visible
- Different colors per agent
- Name tags follow cursors

---

## 8. Accessibility

### 8.1 Keyboard Navigation

**Global Shortcuts:**
- Cmd/Ctrl + P: Command palette
- Cmd/Ctrl + Shift + P: Quick navigation
- Cmd/Ctrl + B: Toggle navigation
- Cmd/Ctrl + J: Toggle terminal
- Cmd/Ctrl + \\: Split pane horizontally
- Cmd/Ctrl + Shift + \\: Split pane vertically
- Cmd/Ctrl + W: Close current pane
- Cmd/Ctrl + N: New pane
- Cmd/Ctrl + Tab: Next pane
- Cmd/Ctrl + Shift + Tab: Previous pane

**Activity Shortcuts:**
- Cmd/Ctrl + 1-7: Switch to activity 1-7
- Cmd/Ctrl + Shift + 1-7: Move current pane to activity

**Agent Shortcuts:**
- Cmd/Ctrl + Shift + A: Focus agent input
- Cmd/Ctrl + Shift + V: Toggle voice mode
- Escape: Collapse agent

### 8.2 Focus Management

- Visible focus ring: 2px solid --os-accent-primary, offset 2px
- Tab order: logical, top-to-bottom, left-to-right
- Focus trap in modals
- Skip link for main content

### 8.3 Screen Reader

- ARIA labels on all interactive elements
- Live regions for agent messages
- Role attributes for custom components
- Alt text for icons and images

### 8.4 Motion Preferences

- Respect `prefers-reduced-motion`
- Disable animations
- Instant transitions
- Static agent presence

---

## 9. Implementation Phases

### Phase 1: Foundation (Weeks 1-4)
**Goal:** Core windowing and theming system

**Deliverables:**
- Design system implementation (tokens, components)
- Pane management system (drag, resize, split)
- Activity ribbon with switching
- Basic navigation panel
- Agent companion (floating, resizable)
- One activity space (Editor or Whiteboard)

**Quality Criteria:**
- 60fps animations
- Smooth resizing
- No layout thrashing
- Theme switching works

### Phase 2: Multi-Space (Weeks 5-8)
**Goal:** Multiple spaces and navigation

**Deliverables:**
- All 7 activity spaces functional
- Multiple navigation panels
- Secondary space thumbnails
- Tab mode implementation
- Pop-out windows
- Layout save/restore

**Quality Criteria:**
- Spaces load <500ms
- Layouts persist across sessions
- Pop-out works on dual monitors

### Phase 3: Polish (Weeks 9-12)
**Goal:** Delight and refinement

**Deliverables:**
- Micro-interactions
- Advanced animations
- Keyboard shortcuts complete
- Accessibility audit
- Performance optimization
- Mobile responsive

**Quality Criteria:**
- Lighthouse score >90
- WCAG 2.1 AA compliance
- Feels "better than Apple"

### Phase 4: Advanced (Weeks 13-16)
**Goal:** Power user features

**Deliverables:**
- Layout marketplace
- Custom widgets
- Plugin API
- Agent scripting
- Advanced collaboration

---

## 10. Success Metrics

### User Experience
- Task completion time improved 30%
- User satisfaction score >4.5/5
- Feature discovery rate >80%
- Error recovery rate >95%

### Performance
- First paint <1s
- Time to interactive <2s
- Layout shift <0.1
- Animation frame rate >55fps

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard-only usability
- Screen reader compatibility
- Color contrast ratios met

---

## Appendix A: Iconography

**Style:**
- Outline style (2px stroke)
- 24×24 viewBox
- 2px corner radius
- Consistent stroke caps (round)

**Categories:**
- Navigation (files, search, git, etc.)
- Activities (voice, sketch, present, etc.)
- Actions (add, delete, edit, etc.)
- Media (play, pause, record, etc.)
- Agent (builder, oracle, janitor, etc.)

**Source:**
- Lucide icons as base
- Custom icons for OpenSpace-specific concepts

---

## Appendix B: Voice & Tone

**Agent Communication:**
- Professional but friendly
- Concise but complete
- Action-oriented
- Context-aware

**Examples:**
- Good: "Opening auth.service.ts in a new pane."
- Bad: "I have opened the file you requested."
- Good: "I can help with that. Should I update the diagram or the code first?"
- Bad: "What would you like me to do?"

**UI Text:**
- Imperative for actions: "Save file", "Split pane"
- Descriptive for states: "3 unsaved changes"
- Minimal words, maximum clarity

---

*Document Version: 0.1*
*Last Updated: 2026-02-11*
*Next Review: Upon completion of Phase 1*
