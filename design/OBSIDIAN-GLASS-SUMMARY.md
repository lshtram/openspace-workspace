# OpenSpace: Obsidian + Glass Hybrid Design

## Overview

A sophisticated hybrid design combining the **brutalist/minimal aesthetic of Obsidian** with **floating glassmorphism elements** for the agent interface. Optimized for **high information density** matching professional tools like Codex and OpenCode Desktop.

---

## Design Philosophy

### "Information Density First"

Unlike consumer apps that prioritize whitespace and simplicity, OpenSpace targets power users who need maximum information visible at all times.

**Key Metrics:**
- Sidebar width: 220-240px (vs 280px+ in typical apps)
- Font sizes: 11-13px (compact but readable)
- Line heights: 1.5-1.6 (tight but scannable)
- Spacing: 4-12px (minimal gaps)
- Menu heights: 30-38px (vs 44px+ in consumer apps)

---

## Visual System

### Color Palette

**Obsidian Base (Dark UI):**
```css
--bg-primary: #0d0d0d       (Almost black)
--bg-surface: #141414       (Elevated cards)
--bg-elevated: #1a1a1a      (Higher elevation)
--border-default: #222222   (Subtle borders)
--border-strong: #333333    (Visible borders)
--text-primary: #e6e6e6     (High contrast white)
--text-secondary: #888888   (Dimmed)
--text-muted: #555555       (Very dim)
--accent: #5e5ce6           (Purple accent)
```

**Syntax Highlighting (Color-coded code):**
```css
--syntax-keyword: #ff7b72    (Keywords - red/pink)
--syntax-function: #d2a8ff   (Functions - purple)
--syntax-string: #a5d6ff     (Strings - blue)
--syntax-comment: #8b949e    (Comments - gray)
--syntax-number: #79c0ff     (Numbers - cyan)
--syntax-type: #ffa657       (Types - orange)
```

**Glass Overlay:**
```css
--glass-bg: rgba(20, 20, 20, 0.9)
--glass-border: rgba(255, 255, 255, 0.08)
--glass-blur: blur(20px) saturate(150%)
```

### Typography

**Font Stack:**
- UI: `Inter` (clean, readable at small sizes)
- Code: `JetBrains Mono` (excellent legibility)

**Type Scale:**
```
--font-xs: 11px    (Labels, badges, metadata)
--font-sm: 12px    (Nav items, buttons)
--font-base: 13px  (Body text, code)
--font-md: 14px    (Headers, tabs)
```

---

## Layout Structure

### High-Density Chrome

**Title Bar (36px height):**
```
[Brand] | [Voice] [Sketch] [Build*] [Review]          [Find] [Commit]
```
- Compact tab-like navigation
- No wasted vertical space
- Direct access to all activities

**Sidebar (220px width):**
```
EXPLORER          +
─────────────────
Project
  › openspace
    › src
      auth.service.ts    M
      user.controller.ts
      database.ts

Sessions
  Auth refactor
  API design
```
- Tree view with minimal indentation
- Monospace font for files
- Status badges (M=modified)
- 30px section headers

**Tab Bar (34px height):**
```
[auth.service.ts ×] [user.controller.ts ×] [database.ts ×]
```
- Full tab names visible
- Close on hover
- Compact but clickable

### Content Areas

**Code Editor:**
```
  1 │ // Authentication service with JWT support
  2 │
  3 │ import { Injectable, Inject } from '@nestjs/common';
  ...
 16 │     private readonly jwtService: JwtService, // Builder is editing...
```
- Line numbers: 12px, muted color
- Code: 13px, syntax highlighted
- Line height: 1.6 (26px per line)
- 38 lines visible in standard view

**System Diagram (White Canvas):**
- White background with dot grid
- Color-coded nodes (API=orange, Auth=purple, DB=blue)
- Minimal shadows (2px blur)
- Clean connections with labels
- Zoomable/pannable canvas

---

## Glass Agent Companion

### The Hybrid Approach

The agent interface **floats above** the dense Obsidian base:

**Agent Avatar (Collapsed):**
- 44px circle
- Glassmorphism effect
- Subtle glow pulse when working
- Fixed position bottom-right

**Agent Chat (Expanded):**
- 360px width
- Glass backdrop blur
- Floats over content without obscuring
- Smooth spring animation on open/close
- Messages with distinct user/agent styling

### Why This Works

1. **Contrast**: Rough Obsidian base vs smooth glass overlay
2. **Focus**: Agent feels separate but connected
3. **Depth**: Glass creates elevation without heavy shadows
4. **Professional**: High density doesn't feel cluttered

---

## Comparison to Reference Apps

### Codex App

| Feature | Codex | OpenSpace Obsidian |
|---------|-------|-------------------|
| Sidebar width | ~250px | 220px |
| Font size | 12-13px | 11-13px |
| Line height | ~1.5 | 1.5-1.6 |
| Tab height | ~32px | 34px |
| Info density | Very High | Very High |
| Color usage | Minimal | Minimal base + colorful code |

### OpenCode Desktop

| Feature | OpenCode | OpenSpace Obsidian |
|---------|----------|-------------------|
| Sidebar width | ~260px | 220px |
| Message density | High | High (glass overlay) |
| File tree | Icon + text | Icon + text (compact) |
| Activity switching | Sidebar | Top bar (more compact) |
| Agent presence | Sidebar badge | Floating glass (always visible) |

### Key Improvements Over References

1. **More Compact**: 15% narrower sidebar
2. **Glass Agent**: Doesn't consume sidebar space
3. **Syntax Colors**: More vibrant code highlighting
4. **Unified Activity Bar**: All spaces accessible from top
5. **Flexible Layout**: Equal-priority panes vs primary/secondary

---

## Mockup Files

### 1. `obsidian-glass-hybrid.html`
**Code Editor View**
- Full IDE layout with sidebar, tabs, code editor
- Color-coded TypeScript syntax
- Glass agent chat (open by default)
- Right panel with git diff summary
- Compact 3-panel layout

### 2. `obsidian-whiteboard.html`
**System Design View**
- White canvas with architecture diagram
- Multiple colored nodes (API, Auth, Services, DB)
- Left toolbar with drawing tools
- Glass agent floating over whiteboard
- Group containers with dashed borders

---

## Animation Specifications

### Micro-Interactions (150ms)
```css
/* Hover lift */
.element:hover {
    transform: translateY(-2px);
    transition: transform 150ms ease;
}

/* Glass panel hover */
.glass:hover {
    border-color: rgba(255,255,255,0.15);
}
```

### Component Transitions (300ms)
```css
/* Agent chat open */
.agent-chat {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
    transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.agent-chat.open {
    opacity: 1;
    transform: scale(1) translateY(0);
}
```

### Ambient Animations
```css
/* Agent working pulse */
@keyframes agent-pulse {
    0%, 100% { box-shadow: 0 0 20px rgba(94,92,230,0.3); }
    50% { box-shadow: 0 0 40px rgba(94,92,230,0.5); }
}

/* Voice recording */
@keyframes voice-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255,123,114,0.7); }
    50% { box-shadow: 0 0 0 10px rgba(255,123,114,0); }
}

/* Thinking dots */
@keyframes thinking {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
    40% { transform: scale(1); opacity: 1; }
}
```

---

## Responsive Behavior

### Desktop (>1200px)
- 3-panel layout (sidebar, main, right panel)
- Full glass agent chat
- All toolbars visible

### Medium (900-1200px)
- 2-panel layout (sidebar, main)
- Right panel collapses to overlay
- Agent chat remains

### Compact (<900px)
- 1-panel layout
- Sidebar collapses to icons-only rail
- Agent chat becomes smaller
- Tab mode recommended

---

## Implementation Notes

### CSS Architecture
```css
/* Base layer - Obsidian */
.app { background: #0d0d0d; }
.sidebar { background: #141414; }

/* Glass layer - Floating */
.agent-chat {
    background: rgba(20,20,20,0.9);
    backdrop-filter: blur(20px) saturate(150%);
    border: 1px solid rgba(255,255,255,0.08);
}
```

### Performance
- Use `transform` and `opacity` for animations (GPU accelerated)
- `will-change` on frequently animated elements
- Respect `prefers-reduced-motion`
- CSS containment for glass panels

### Accessibility
- High contrast ratios (WCAG AA)
- Keyboard navigation support
- Screen reader labels
- Focus indicators on all interactive elements

---

## Design Principles Applied

1. **Information Density**: Maximize content per pixel
2. **Visual Hierarchy**: Clear distinction between base and overlay
3. **Functional Aesthetics**: Every visual element serves a purpose
4. **Professional Feel**: No childish elements, serious tone
5. **Glass Contrast**: Smooth glass over rough Obsidian creates visual interest

---

*Design Status: Ready for Implementation*
*Last Updated: 2026-02-11*
