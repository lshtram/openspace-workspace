# REQ-MODALITY-PLATFORM-V2 Changelog

**Date:** 2026-02-16  
**Author:** oracle_7c4a  
**Purpose:** Document refinements based on user feedback

---

## Changes Made

### 1. Enhanced Section 4.1 - Pane & Tab System User Stories

#### Added: Tab Management User Stories
- ✅ `US-PANE-005` - User can focus a tab by clicking
- ✅ `US-PANE-006` - User can close a tab with button or keyboard shortcut (Cmd+W)
- ✅ `US-PANE-007` - Opening content in active pane creates new tab (or activates existing)
- ✅ `US-PANE-008` - User can reorder tabs by dragging
- ✅ `US-PANE-009` - User can drag a tab to another pane

#### Added: Pane Configuration Persistence Stories
- ✅ `US-PANE-002` - User can arrange workspace layout and have it persist across sessions (content changes, but pane structure persists)
- ✅ `US-PANE-003` - User can save multiple workspace layouts and switch between them
- ✅ `US-PANE-004` - Last pane configuration is restored on reopen, even if some content is unavailable

#### Clarified: User vs Agent Stories
- Split stories into three subsections:
  - **Pane Management (User)** - Manual control stories
  - **Tab Management (User)** - Tab interaction stories
  - **Agent Control (Agent)** - Programmatic agent actions

---

### 2. Enhanced Section 4.2 - Pane System Functional Requirements

#### Added: Pane Configuration Persistence Requirements (REQ-PANE-009..014)
- ✅ `REQ-PANE-009` - Pane configuration persists to disk (layout tree, split ratios, dimensions)
- ✅ `REQ-PANE-010` - Content tracked separately from pane configuration
- ✅ `REQ-PANE-011` - On restore, pane configuration loads first; content restoration is optional
- ✅ `REQ-PANE-012` - If persisted content is unavailable, pane remains with empty state/placeholder
- ✅ `REQ-PANE-013` - User can save named workspace layouts and switch between them
- ✅ `REQ-PANE-014` - User manual pane operations not intercepted by agent

#### Added: Enhanced Tab Management Requirements (REQ-PANE-015..024)
- ✅ `REQ-PANE-018` - Opening content in active pane creates new tab
- ✅ `REQ-PANE-019` - User can focus tab by clicking or keyboard (Cmd+1..9)
- ✅ `REQ-PANE-020` - User can close tab via button, Cmd+W, or middle-click
- ✅ `REQ-PANE-021` - User can reorder tabs via drag-and-drop
- ✅ `REQ-PANE-022` - User can drag tab to another pane
- ✅ `REQ-PANE-024` - Tab close prompts for save if content is dirty

---

### 3. Fixed Section 5.1 - Presentation Modality (User vs Agent Clarification)

#### Problem
Original user stories mixed user and agent perspectives (e.g., "As a user, I can generate a deck" when actually the agent generates decks).

#### Solution
Split into two clear subsections:

**User (Direct File Editing):**
- User edits `.deck.md` files in the editor (Markdown)
- User views rendered presentation in playback mode
- User controls playback manually
- No WYSIWYG editor for MVP

**Agent (Programmatic Deck Generation):**
- Agent generates complete decks from project artifacts
- Agent creates/updates slides programmatically
- Agent opens presentations and navigates to slides
- Agent controls playback programmatically

#### Key Clarifications
- ✅ `REQ-PRES-014` - Presentation view is read-only; editing happens in editor on `.deck.md` file
- ✅ `REQ-PRES-018` - Presentation UI includes "Edit Source" button to open `.deck.md` in editor
- ✅ `REQ-PRES-019` - WYSIWYG slide editor is explicitly deferred (Future)

---

### 4. Enhanced Section 5.3 - Whiteboard Modality (Diagram Types)

#### Added: User vs Agent Stories Split
Separated manual diagramming (user) from programmatic generation (agent):

**User:**
- Manual drawing with toolbar
- Creating structured diagrams with smart shapes
- Persistent state

**Agent:**
- Programmatic shape CRUD
- Generating diagrams from code/specs
- Camera control

#### Added: Section 5.3.4 - Diagram Types & Building Blocks

**Must Have (MVP):**
- ✅ `REQ-WB-015` - Basic shapes: rectangle, circle, ellipse, triangle, arrow, line, text
- ✅ `REQ-WB-016` - Connectors: straight, elbow, curved with arrow heads
- ✅ `REQ-WB-017` - **Block diagram** shapes: box, rounded box, cylinder, cloud, actor

**Should Have (High Priority):**
- ✅ `REQ-WB-018` - **Class diagram** shapes: class box (name/attributes/methods), interface, abstract, inheritance/composition/aggregation arrows
- ✅ `REQ-WB-019` - **State machine** shapes: state, initial state, final state, transition arrows
- ✅ `REQ-WB-020` - **Flowchart** shapes: process, decision, start/end, input/output, connector

**Could Have (Lower Priority):**
- ✅ `REQ-WB-021` - **Sequence diagram** shapes: lifeline, activation box, message arrows

**Agent Integration:**
- ✅ `REQ-WB-022` - Agent can create/position any supported shape type
- ✅ `REQ-WB-023` - Agent can create connections with anchor points
- ✅ `REQ-WB-024` - Shape library is extensible

---

## New Backlog Items

### Added to Section 8.3 - Planned Backlog Items

1. **BLK-018 - Whiteboard Diagram Types** (P0 - CRITICAL)
   - Requirements: REQ-WB-015..024
   - Exit Criteria: Smart shapes for block/class/state/flow diagrams available
   - Rationale: Agent needs proper building blocks to generate structured diagrams

2. **BLK-019 - Pane Configuration Persistence** (P2 - MEDIUM)
   - Requirements: REQ-PANE-009..014
   - Exit Criteria: Workspace layouts save/restore across sessions
   - Rationale: User can arrange workspace once and have it persist

3. **BLK-020 - Tab Management UX** (P2 - MEDIUM)
   - Requirements: REQ-PANE-015..024
   - Exit Criteria: Tab focus, close, reorder, drag-to-pane working
   - Rationale: Complete tab interaction model

---

## Requirements ID Changes

### Renumbered Due to Insertions

**Presentation:**
- Old `REQ-PRES-017` → New `REQ-PRES-019..020` (deferred items)

**Whiteboard:**
- Old `REQ-WB-015..017` (Modality Unification) → New `REQ-WB-025..027`
- New `REQ-WB-015..024` - Diagram Types & Building Blocks

---

## Key Clarifications Achieved

### 1. Pane Configuration vs Content
**Before:** Ambiguous what persists across sessions  
**After:** Clear separation:
- **Pane configuration** = layout structure, positions, sizes (always persists)
- **Content** = which files/artifacts are open in tabs (optional persistence)

### 2. User vs Agent in Presentation
**Before:** Confusing who does what (user "generates" decks?)  
**After:** Clear roles:
- **User** edits `.deck.md` files directly in editor (Markdown source)
- **Agent** generates decks programmatically from project artifacts
- **No WYSIWYG editor** in MVP (explicitly deferred)

### 3. Whiteboard Building Blocks
**Before:** Generic "whiteboard" with no clarity on diagram types  
**After:** Explicit requirements for:
- Basic shapes (MVP)
- Block diagrams (MVP)
- Class diagrams (Should)
- State machines (Should)
- Flowcharts (Should)
- Sequence diagrams (Could)
- Agent can use all shapes programmatically

---

## Next Steps

1. **Review & Approve** - User confirms these refinements are correct
2. **Prioritize P0 Items** - BLK-012..015, BLK-018 (critical agent control + diagram types)
3. **Technical Specs** - Create detailed TECHSPEC documents for approved backlog items
4. **Implementation** - Begin work on highest priority gaps

---

## Questions for User

1. **Pane Configuration Persistence** - Is the separation between "layout structure" and "tab content" clear now? Should layout always persist but content be optional?

2. **Presentation Editing** - Confirmed: Users edit `.deck.md` in editor, not WYSIWYG? Agent generates full decks?

3. **Whiteboard Diagram Priority** - Should we prioritize class diagrams (Should) to Must for MVP? Common use case for architecture discussions.

4. **Tab Management Priority** - Is P2 correct for tab drag-and-drop (REQ-PANE-021..022), or should this be higher priority?
