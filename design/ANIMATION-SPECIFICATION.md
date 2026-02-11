---
id: ANIMATION-SPEC
author: oracle_a1b2
status: DRAFT
date: 2026-02-11
task_id: openspace-animations
---

# OpenSpace Animation Specification

## Animation Philosophy

> "Motion with purpose. Every animation serves the user - either providing feedback, guiding attention, or revealing relationships. Nothing moves without reason."

**Principles:**
1. **Meaningful** - Animations communicate state changes
2. **Performant** - 60fps on all modern devices
3. **Consistent** - Same easing and timing patterns throughout
4. **Accessible** - Respect prefers-reduced-motion

---

## Timing System

### Duration Scale
```css
--duration-instant: 0ms;      /* Immediate state changes */
--duration-fast: 150ms;       /* Micro-interactions, hovers */
--duration-normal: 300ms;     /* Standard transitions, opens/closes */
--duration-slow: 500ms;       /* Emphasis, page transitions */
--duration-deliberate: 800ms; /* Complex sequences, onboarding */
```

### Easing Functions
```css
--ease-linear: linear;
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);     /* Default transitions */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* Bouncy, playful */
--ease-out: cubic-bezier(0, 0, 0.2, 1);           /* Exit animations */
--ease-in: cubic-bezier(0.4, 0, 1, 1);            /* Enter animations */
--ease-elastic: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* Attention */
```

---

## Animation Categories

### 1. Micro-Interactions (Fast / 150ms)

**Purpose:** Provide immediate feedback on user actions

#### Hover States
```css
.activity-item:hover {
    transform: translateY(-2px);
    transition: transform var(--duration-fast) var(--ease-spring);
}
```
- Buttons lift slightly
- Cards gain elevation
- Icons scale to 1.05x

#### Active/Pressed
```css
.button:active {
    transform: scale(0.96);
    transition: transform 100ms var(--ease-out);
}
```
- Immediate feedback
- Subtle compression
- 100ms for responsiveness

#### Focus States
```css
.input:focus {
    box-shadow: 0 0 0 2px var(--accent-color);
    transition: box-shadow var(--duration-fast) var(--ease-smooth);
}
```
- Ring appears instantly
- Fades in over 150ms
- Provides clear affordance

### 2. Component Transitions (Normal / 300ms)

**Purpose:** Smooth state changes within components

#### Panel Expansion (Navigation, Sidebars)
```css
.nav-panel {
    width: 72px;
    transition: width var(--duration-normal) var(--ease-smooth);
}

.nav-panel.expanded {
    width: 240px;
}
```
- Width animates smoothly
- Content fades in with delay
- Stagger children 50ms apart

#### Tab Switching
```css
.tab-content {
    opacity: 0;
    transform: translateX(20px);
    transition: 
        opacity var(--duration-normal) var(--ease-smooth),
        transform var(--duration-normal) var(--ease-smooth);
}

.tab-content.active {
    opacity: 1;
    transform: translateX(0);
}
```
- Outgoing: fade + slide left
- Incoming: fade + slide from right
- Creates directional flow

#### Modal/Dialog Open
```css
.modal-overlay {
    opacity: 0;
    transition: opacity var(--duration-normal) var(--ease-smooth);
}

.modal-content {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
    transition: 
        opacity var(--duration-normal) var(--ease-spring),
        transform var(--duration-normal) var(--ease-spring);
}

.modal.open .modal-overlay { opacity: 1; }
.modal.open .modal-content { 
    opacity: 1; 
    transform: scale(1) translateY(0); 
}
```
- Backdrop fades first
- Content scales up with spring
- 50ms delay between layers

### 3. Layout Animations (Slow / 500ms)

**Purpose:** Reveal structural changes and spatial relationships

#### Pane Resize
```css
.pane {
    transition: flex var(--duration-slow) var(--ease-smooth);
}
```
- Smooth flex grow/shrink
- Content inside can opt-out
- Divider shows preview line during drag

#### Split/Merge Panes
```css
@keyframes paneEnter {
    from {
        opacity: 0;
        transform: scaleX(0);
        transform-origin: left;
    }
    to {
        opacity: 1;
        transform: scaleX(1);
    }
}

.pane-new {
    animation: paneEnter var(--duration-slow) var(--ease-spring);
}
```
- New pane grows from edge
- Existing content slides
- Maintains spatial context

#### Activity Switch
```css
.workspace {
    opacity: 0;
    transform: translateY(10px);
    transition: 
        opacity var(--duration-slow) var(--ease-smooth),
        transform var(--duration-slow) var(--ease-smooth);
}

.workspace.active {
    opacity: 1;
    transform: translateY(0);
}
```
- Fade + subtle slide
- Old content fades first
- New content fades in

### 4. Ambient Animations (Continuous)

**Purpose:** Indicate state without demanding attention

#### Agent Presence Pulse
```css
@keyframes agent-pulse {
    0%, 100% { 
        box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
    }
    50% { 
        box-shadow: 0 0 40px rgba(99, 102, 241, 0.5);
    }
}

.agent-avatar.working {
    animation: agent-pulse 2s ease-in-out infinite;
}
```
- 2 second cycle
- Gentle glow breathing
- Stops when work complete

#### Voice Recording Indicator
```css
@keyframes voice-pulse {
    0%, 100% { 
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
    }
    50% { 
        box-shadow: 0 0 0 15px rgba(239, 68, 68, 0);
    }
}

.voice-btn.active {
    animation: voice-pulse 1.5s ease-in-out infinite;
}
```
- Red ring expands outward
- 1.5 second cycle
- Clear recording indication

#### Loading/Shimmer
```css
@keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
}

.shimmer {
    background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.1) 50%,
        transparent 100%
    );
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
}
```
- Horizontal wave effect
- 2 second loop
- Used on skeleton screens

#### Thinking Dots
```css
@keyframes thinking {
    0%, 80%, 100% { 
        transform: scale(0.6); 
        opacity: 0.4; 
    }
    40% { 
        transform: scale(1); 
        opacity: 1; 
    }
}

.thinking-dots span {
    animation: thinking 1.4s ease-in-out infinite both;
}

.thinking-dots span:nth-child(1) { animation-delay: -0.32s; }
.thinking-dots span:nth-child(2) { animation-delay: -0.16s; }
```
- Three dots scaling sequentially
- 1.4 second total cycle
- Universal "thinking" indicator

### 5. Entry Animations (Staggered)

**Purpose:** Introduce elements in a coordinated sequence

#### Page Load Sequence
```javascript
const entranceSequence = [
    { selector: '.activity-dock', delay: 0, duration: 500 },
    { selector: '.nav-rail', delay: 100, duration: 500 },
    { selector: '.main-area', delay: 200, duration: 500 },
    { selector: '.agent-companion', delay: 300, duration: 500 },
];
```
- Top-to-bottom flow
- 100ms stagger between elements
- Spring easing for playfulness

#### List Items
```css
@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateX(-20px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

.list-item {
    opacity: 0;
    animation: slideIn var(--duration-normal) var(--ease-spring) forwards;
}

.list-item:nth-child(1) { animation-delay: 0ms; }
.list-item:nth-child(2) { animation-delay: 50ms; }
.list-item:nth-child(3) { animation-delay: 100ms; }
/* ... continue pattern */
```
- 50ms stagger per item
- Max 10 items animated
- Rest appear instantly

#### Message Bubbles
```css
@keyframes messageIn {
    from {
        opacity: 0;
        transform: translateY(10px) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.message {
    animation: messageIn var(--duration-normal) var(--ease-spring);
}
```
- Scale + translate + opacity
- Spring for natural feel
- Stagger in conversation

---

## Performance Guidelines

### GPU Acceleration
Always use transform and opacity for animations:
```css
/* GOOD - GPU accelerated */
.element {
    transform: translateX(100px);
    opacity: 0.5;
}

/* AVOID - Triggers layout */
.element {
    left: 100px;
    width: 50%;
}
```

### will-change Strategy
```css
.element {
    will-change: transform, opacity;
}

/* Remove after animation */
.element.animation-complete {
    will-change: auto;
}
```

### CSS containment
```css
.animated-container {
    contain: layout style paint;
}
```

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
    
    .ambient-animation {
        animation: none !important;
    }
}
```

---

## Specific Component Animations

### Activity Dock

**Entry:**
- Slides down from top
- Fades in
- Spring easing
- Duration: 500ms

**Hover on Items:**
- Scale to 1.05
- Slight lift (translateY -2px)
- Duration: 150ms

**Active State:**
- Background fills
- Indicator dot appears (scale 0 → 1)
- Duration: 200ms

### Navigation Rail

**Collapse/Expand:**
- Width animates (72px ↔ 240px)
- Text fades in/out with opacity
- Duration: 300ms
- Stagger text: 50ms delay

**Item Hover:**
- Background fades in
- Icon subtle scale
- Duration: 150ms

**Active Item:**
- Glow border appears
- Icon color changes
- Duration: 200ms

### Agent Companion

**Avatar Hover:**
- Scale to 1.1
- Glow intensifies
- Duration: 300ms
- Spring easing

**Chat Open:**
- Scale from 0.95 → 1
- TranslateY from 10px → 0
- Opacity 0 → 1
- Duration: 300ms
- Spring easing

**New Message:**
- Slide up + fade in
- Scale from 0.95 → 1
- Duration: 300ms
- Spring easing

**Voice Toggle:**
- Button pulses (red ring)
- Duration: 1.5s continuous
- Ease-in-out

### Pane System

**Resize:**
- Flex basis animates
- Duration: 500ms
- Smooth easing
- Content can use resize observer to adjust

**Split:**
- New pane scales from edge
- 0.95 → 1 scale
- Duration: 500ms
- Spring easing

**Close:**
- Scale to 0.95
- Opacity to 0
- Duration: 200ms
- Ease out

### Glass Panels

**Hover:**
- Border color lightens
- Subtle glow appears
- Duration: 200ms

**Focus:**
- Ring animation (scale 0 → 1)
- Border color change
- Duration: 150ms

---

## Animation Playground

### Testing Checklist

- [ ] 60fps on mid-range laptop
- [ ] 30fps minimum on older devices
- [ ] Respects prefers-reduced-motion
- [ ] No layout thrashing
- [ ] Smooth on 120Hz displays
- [ ] No jank during scroll
- [ ] Consistent timing across browsers

### Tools
- Chrome DevTools Performance tab
- Firefox Developer Tools Animation inspector
- React DevTools Profiler (if using React)
- CSS Triggers website for property reference

---

## Implementation Notes

### React/Vue/Angular
- Use Framer Motion (React) or similar library
- AnimatePresence for exit animations
- LayoutGroup for shared element transitions

### Vanilla JS/CSS
- Use CSS transitions for simple state changes
- Use CSS animations for continuous effects
- Use Web Animations API for complex sequences

### Performance Budget
- Max 3 simultaneous animations
- Max 10 elements animated at once
- Monitor frame drops in production

---

*Version: 1.0*
*Last Updated: 2026-02-11*
