# OpenSpace Visual Design System

## Overview

This directory contains the complete visual design system and mockups for the OpenSpace multi-modal AI workspace.

**Design Philosophy: "Calm Power"**
- Power users get infinite flexibility
- New users get gentle guidance  
- The interface gets out of the way
- Beauty emerges from function

---

## Files

### `/architecture/VISUAL-ARCHITECTURE-OPENSPACE.md`
Complete visual architecture document containing:
- Design principles
- Design system specifications (colors, typography, spacing)
- Component specifications
- Layout system
- Interaction patterns
- Activity-specific UI guidelines
- Implementation phases

### `/STYLE-GUIDE-OBSIDIAN-HYBRID.md`  **(Current Team Reference)**
Locked style guide for implementation agents:
- Dense shell metrics (36/32/28 bars)
- Obsidian + selective glass rules
- Typography and spacing constraints
- Accent and chat-color policy
- Do/Don't checklist for consistency

### `/mockups/obsidian-glass-hybrid.html`  **(Locked Visual Direction)**
Canonical single-file visual reference selected for implementation.

### `/mockups/pages/index.html`  **(Mode-by-Mode References)**
Separate reference pages for each major mode:
1. Drawing
2. Text/Code
3. Pretty Markdown
4. Large Agent Discussion
5. Presentation
6. Progress Dashboard

Shared CSS for these pages:
- `/mockups/pages/_obsidian-reference.css`

**To view:** Open `mockups/pages/index.html` in a web browser

---

## Design System Highlights

### Color Palette
- **Primary Background**: `#0A0A0B` (Deep void)
- **Secondary**: `#141416` (Elevated surfaces)
- **Accent**: `#6366F1` → `#A855F7` (Indigo to Purple gradient)
- **Text Primary**: `#FAFAFA` (High contrast)
- **Text Secondary**: `#A1A1AA` (Medium contrast)

### Typography
- **Sans**: Inter (UI elements, labels)
- **Mono**: JetBrains Mono (code, timestamps)
- **Display**: Space Grotesk (headings, stats)

### Key Interactions
- **Activity Ribbon**: Top bar for switching between activity spaces
- **Navigation Panel**: Collapsible file tree and session browser
- **Pane System**: Resizable, draggable, multi-pane layout
- **Agent Companion**: Floating, omnipresent AI chat interface
- **Tab Mode**: Alternative to panes for focused work

---

## Core Concepts

### 1. Activity Spaces
Seven specialized workspaces:
- 🎙️ **Voice** - Voice-first ideation and transcription
- ✏️ **Sketch** - Visual thinking with whiteboard
- 📊 **Dashboard** - Project overview and metrics
- 🎬 **Present** - Slide decks and narration
- 💻 **Build** - Code editor and IDE features
- 🔍 **Review** - Diff viewer and code review
- ⚙️ **Configure** - Settings and workflows

### 2. Three UI Layers
1. **Agent Companion** (Bottom/Float) - Always-accessible AI
2. **Navigation** (Left) - File tree, sessions, agents
3. **Activity Space** (Center) - Context-specific workspace

### 3. Multi-Modal by Design
- Every space can be displayed as pane or tab
- User arranges layout to match mental model
- Agent understands spatial context
- Seamless cross-space navigation

---

## Next Steps

### Phase 1: Foundation
1. Implement design tokens (CSS variables)
2. Build base components (Button, Input, Panel, Tab)
3. Create Activity Ribbon component
4. Implement Navigation Panel
5. Build Agent Companion widget

### Phase 2: Activity Spaces
1. Build each activity space component
2. Implement pane management system
3. Create drag/resize interactions
4. Build tab mode alternative

### Phase 3: Polish
1. Add micro-interactions and animations
2. Implement keyboard shortcuts
3. Accessibility audit
4. Performance optimization

---

## Design Principles Checklist

- [x] Spatial Freedom - No artificial constraints
- [x] Contextual Adaptation - UI adapts to activity
- [x] Calm Presence - Agent always accessible, never intrusive
- [x] Seamless Flow - Purposeful transitions
- [x] Deliberate Density - Information-rich when needed

---

*Created: 2026-02-11*
*Status: Ready for Implementation*
