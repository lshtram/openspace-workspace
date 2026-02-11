---
id: PLAN-FEATURE-PARITY
author: oracle_a1b2
status: DRAFT
date: 2026-02-11
task_id: react-port-completion
---

# OpenSpace React Port Completion Plan

## Context

This plan addresses completing the React port of opencode-client by closing the feature gap. Based on the comprehensive review (COMPREHENSIVE-REVIEW-2026-02-11.md), we identified 29 feature gaps. This plan excludes:
- **Diff viewer modality** (deferred to modality phase)
- **New modalities** (editor, presentation, voice, comments, browser preview)
- **Desktop app** (Tauri - future work)

## Feature Gap Analysis

### Category 1: HIGH PRIORITY (Core UX)

| # | Feature | opencode | openspace | Effort | Impact |
|---|---------|----------|-----------|--------|--------|
| 32-38 | **Dedicated tool renderers** | ✅ 12+ renderers | ⚠️ Generic | 1 week | **HIGH** - Chat UX quality |
| 79 | File watcher integration | ✅ | ❌ | 2 days | **MEDIUM** - Live file updates |
| 25 | Duration timer per turn | ✅ | ❌ | 4 hours | **LOW** - Nice-to-have metric |
| 95 | Navigate sessions (alt+↑/↓) | ✅ | ❌ | 4 hours | **MEDIUM** - Power user feature |
| 244 | Command palette expansion | ✅ 40+ cmds | ✅ 6 cmds | 1 day | **MEDIUM** - Discoverability |

**Total: ~1.5 weeks**

### Category 2: MEDIUM PRIORITY (Settings & Customization)

| # | Feature | opencode | openspace | Effort | Impact |
|---|---------|----------|-----------|--------|--------|
| 202 | Theme selection expansion | ✅ 15 themes | ✅ 3 themes | 2 days | **MEDIUM** - Visual appeal |
| 203 | Font selection expansion | ✅ 12 fonts | ✅ 3 fonts | 2 hours | **LOW** - Minor preference |
| 204 | Font size adjustment | ✅ Slider | ❌ | 2 hours | **LOW** - Accessibility |
| 209 | Configurable shortcuts expansion | ✅ Full editor | ✅ 7 shortcuts | 1 day | **MEDIUM** - Power users |
| 210 | Auto-approve permissions | ✅ | ❌ | 4 hours | **LOW** - Convenience |
| 214 | Language expansion | ✅ 16 langs | ✅ 4 langs | 1 day | **LOW** - i18n coverage |
| 81-83 | Model management features | ✅ 3 features | ❌ | 1 day | **LOW** - Model UX polish |

**Total: ~1 week**

### Category 3: LOW PRIORITY (Polish)

| # | Feature | opencode | openspace | Effort | Impact |
|---|---------|----------|-----------|--------|--------|
| 148 | Home/landing page | ✅ | ❌ | 1 day | **LOW** - Optional flow |
| 156 | Session tabs drag-drop | ✅ | ❌ | 1 day | **LOW** - Power user |
| 157 | Review panel | ✅ | ❌ | **DEFERRED** | Part of diff modality |
| 168 | File line selection | ✅ | ⚠️ | 4 hours | **MEDIUM** - Context precision |
| 231 | Drag file to prompt | ✅ | ⚠️ | 4 hours | **MEDIUM** - UX flow |
| 254-256 | Theme system overhaul | ✅ OKLCH | ❌ Manual | 3 days | **LOW** - Visual consistency |
| 105-106 | Update/release notes | ✅ | ❌ | 1 day | **LOW** - Desktop only |

**Total: ~1 week** (excluding deferred/desktop features)

---

## Recommended Implementation Order

### PHASE 2A: Core UX (Week 1) — HIGHEST ROI

**Goal:** Make chat experience match opencode quality

#### Task 2A-1: Dedicated Tool Renderers (3 days)
**Status:** ✅ Completed
**Priority:** P0 — Closes 6 feature gaps, dramatically improves chat UX

Port the following renderers from opencode `packages/app/src/page/session/message/message-part.tsx`:

1. **`edit` tool renderer** (inline diff view)
   - Use `react-diff-view` or port `@pierre/diffs` integration
   - Show old/new side-by-side with syntax highlighting
   - Collapsible by default
   
2. **`write` tool renderer** (code preview)
   - Syntax-highlighted code block with file path header
   - "Open file" button → navigate to file in tree
   - Copy button
   
3. **`bash` tool renderer** (terminal output)
   - Formatted output with exit code badge
   - ANSI color support via `ansi-to-react`
   - Collapsible for long output
   
4. **`task` tool renderer** (sub-agent recursion)
   - Recursive message part rendering
   - Indent nested levels
   - Show sub-agent ID and status
   
5. **`todowrite` tool renderer** (checklist)
   - Render as interactive checkboxes (read-only)
   - Show status badges (pending/in_progress/completed/cancelled)
   - Priority indicators
   
6. **`question` tool renderer** (wizard)
   - Render as form-like UI with question → answer flow
   - Highlight current question in multi-step wizards

**Files to create:**
```
openspace-client/src/components/message/tool-renderers/
  EditToolRenderer.tsx
  WriteToolRenderer.tsx
  BashToolRenderer.tsx
  TaskToolRenderer.tsx
  TodoWriteToolRenderer.tsx
  QuestionToolRenderer.tsx
  index.ts (registry)
```

**Integration:**
- Update `openspace-client/src/components/SessionView.tsx` to use tool renderer registry
- Map tool names → components
- Fallback to generic renderer for unknown tools

**Acceptance Criteria:**
- [ ] Each tool has dedicated UI (not generic JSON)
- [ ] `edit` tool shows inline diffs
- [ ] `task` tool shows recursive sub-agent calls
- [ ] `todowrite` shows checklist with status
- [ ] All renderers have syntax highlighting where applicable

---

#### Task 2A-2: Session Navigation Shortcuts (2 hours)
**Priority:** P1 — Power user efficiency

**Implementation:**
```typescript
// openspace-client/src/hooks/useSessionNavigation.ts
export function useSessionNavigation() {
  const { sessions, currentSessionId, navigateToSession } = useLayout()
  
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          navigateToPreviousSession()
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          navigateToNextSession()
        }
      }
    }
    
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [currentSessionId, sessions])
}

// Use in openspace-client/src/App.tsx or SessionSidebar.tsx
```

**Acceptance Criteria:**
- [ ] Alt+↑ navigates to previous session
- [ ] Alt+↓ navigates to next session
- [ ] Wraps at start/end of list
- [ ] Works with date-grouped sessions

---

#### Task 2A-3: Duration Timer (2 hours)
**Priority:** P2 — Nice-to-have metric

**Implementation:**
- Add `startedAt` timestamp to turn data model
- Display in turn header: "Completed in 3.2s"
- Format: `< 1s` for fast, `Xs` for seconds, `Xm Ys` for minutes
- Gray out for older turns, highlight for current turn

**Files to modify:**
```
openspace-client/src/components/SessionView.tsx (add timer display)
openspace-client/src/types/index.ts (add startedAt to Turn type)
```

**Acceptance Criteria:**
- [ ] Each turn shows duration after completion
- [ ] Current turn shows "Thinking..." (no duration yet)
- [ ] Format is human-readable

---

#### Task 2A-4: File Watcher Integration (1 day)
**Priority:** P1 — Live file updates without page refresh

**Context:** opencode uses file watcher events from the Go server to update file tree. Our React port should do the same.

**Implementation:**
```typescript
// openspace-client/src/hooks/useFileWatcher.ts
export function useFileWatcher(projectPath: string) {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    const source = new EventSource(`${serverUrl}/events`)
    
    source.addEventListener('file.changed', (e) => {
      const { path, type } = JSON.parse(e.data)
      
      // Invalidate file tree query
      queryClient.invalidateQueries({ queryKey: ['files', projectPath] })
      
      // If file is currently open, show "File changed" notification
      // (optional: auto-reload or prompt user)
    })
    
    return () => source.close()
  }, [projectPath])
}
```

**Integration with existing SSE:**
- Extend `openspace-client/src/context/ServerContext.tsx` SSE handler
- Add `file.changed` event type
- Emit to React Query cache

**Acceptance Criteria:**
- [ ] File tree updates when files change externally
- [ ] No page refresh required
- [ ] Works with git operations (checkout, pull, etc.)

---

### PHASE 2B: Settings & Customization (Week 2)

#### Task 2B-1: Theme System Expansion (2 days)
**Priority:** P1 — Port 8 more themes from opencode

**Themes to port:**
1. Ayu Light / Dark
2. Catppuccin Latte / Mocha
3. Dracula
4. Gruvbox Light / Dark
5. Nord
6. Solarized Light / Dark
7. Tokyo Night

**Implementation:**
- Extract OKLCH color values from opencode `packages/app/src/theme/default-themes.ts`
- Convert to CSS custom properties in `openspace-client/src/styles/themes/`
- Update theme selector in settings

**Files:**
```
openspace-client/src/styles/themes/
  ayu-light.css
  ayu-dark.css
  catppuccin-latte.css
  catppuccin-mocha.css
  dracula.css
  gruvbox-light.css
  gruvbox-dark.css
  nord.css
  solarized-light.css
  solarized-dark.css
  tokyo-night.css
```

**Optional:** Port OKLCH generator if you want dynamic theme creation (3 day effort, low ROI for now)

**Acceptance Criteria:**
- [ ] 11 total themes (current 3 + 8 new)
- [ ] All themes have proper contrast ratios
- [ ] Theme switching is instant (no flash)

---

#### Task 2B-2: Command Palette Expansion (1 day)
**Priority:** P1 — Discoverability

**Commands to add** (from opencode `packages/app/src/context/command/commands.ts`):

**Navigation:**
- Go to file (fuzzy search)
- Go to session (fuzzy search)
- Go to workspace

**View:**
- Toggle compact mode
- Cycle theme
- Cycle language
- Toggle file tree
- Toggle terminal
- Toggle sidebar

**Session:**
- Rename session
- Archive session
- Delete session
- Clear session

**Settings:**
- Open settings
- Open keybindings

**Files:**
- Open file in external editor
- Reveal in Finder/Explorer
- Copy file path

**Workspace:**
- All worktree commands (already have these)

**Implementation:**
```typescript
// openspace-client/src/context/CommandPaletteContext.tsx
// Expand commands array from 6 → 40+ commands
```

**Acceptance Criteria:**
- [ ] 40+ commands available
- [ ] Fuzzy search works
- [ ] Keyboard shortcuts shown next to commands
- [ ] Commands respect context (e.g., "Archive session" only when session selected)

---

#### Task 2B-3: Font & Accessibility Settings (4 hours)
**Priority:** P2 — Accessibility & preference

**Fonts to add:**
- IBM Plex Mono
- Inconsolata
- Roboto Mono
- Source Code Pro
- Ubuntu Mono
- Cascadia Code
- Consolas
- Menlo

**Implementation:**
```typescript
// openspace-client/src/context/SettingsContext.tsx
interface Settings {
  // ... existing
  fontSize: number // 12-20px, default 14
  fontFamily: FontFamily // existing + 8 new fonts
}

// In Settings dialog:
<div>
  <label>Font Size</label>
  <input type="range" min={12} max={20} value={fontSize} />
  <span>{fontSize}px</span>
</div>
```

**Acceptance Criteria:**
- [ ] 11 total font choices
- [ ] Font size adjustable 12-20px
- [ ] Changes apply immediately
- [ ] Persisted in localStorage

---

#### Task 2B-4: Model Management Features (1 day)
**Priority:** P2 — Model UX polish

**Features:**
1. **Recent models list** — Show last 5 used models at top of dropdown
2. **Model visibility toggle** — Hide models you don't use (persist in settings)
3. **Model variant cycling** — Keyboard shortcut to cycle between variants of same provider (e.g., GPT-4 → GPT-4 Turbo → GPT-4o)

**Implementation:**
```typescript
// openspace-client/src/hooks/useModelSelection.ts
interface ModelSettings {
  recentModels: string[] // Last 5 model IDs
  hiddenModels: string[] // Model IDs to hide
}

function useModelSelection() {
  const [settings, setSettings] = useLocalStorage('model-settings', defaultSettings)
  
  const cycleModelVariant = () => {
    // Find all models with same provider as current
    // Switch to next in list
  }
  
  // ...
}
```

**Acceptance Criteria:**
- [ ] Recent models shown at top of dropdown (max 5)
- [ ] Eye icon in dropdown to hide/show models
- [ ] Keyboard shortcut (Cmd+Shift+M) cycles model variants
- [ ] Settings persist across sessions

---

#### Task 2B-5: i18n Expansion (1 day)
**Priority:** P3 — i18n coverage

**Languages to add** (from opencode):
- German (de)
- Italian (it)
- Portuguese (pt)
- Russian (ru)
- Korean (ko)
- Dutch (nl)
- Polish (pl)
- Turkish (tr)
- Swedish (sv)
- Norwegian (no)
- Danish (da)
- Finnish (fi)

**Implementation:**
- Copy translation files from opencode `packages/app/src/i18n/locales/`
- Adapt to openspace structure
- Test with browser language detection

**Acceptance Criteria:**
- [ ] 16 total languages (current 4 + 12 new)
- [ ] All UI strings translated
- [ ] Language selector shows native names

---

### PHASE 2C: Polish & Optional Features (Week 3)

#### Task 2C-1: File Context Precision (4 hours)
**Priority:** P1 — Better agent context

**Features:**
1. **Line selection in file attachment**
   - Click line numbers in file tree preview
   - Drag to select range
   - Attach as `file.ts:10-25`

2. **Drag file to prompt** (complete existing partial impl)
   - Drag from file tree → drop on prompt input
   - Insert as `@file.ts` mention pill

**Implementation:**
```typescript
// openspace-client/src/components/FileTree.tsx
// Add line number gutter on file preview
// Click/drag to select range

// openspace-client/src/components/RichEditor.tsx
// Handle drop event from file tree
```

**Acceptance Criteria:**
- [ ] Can select line ranges in file preview
- [ ] Line range appended to file mention (e.g., `@file.ts:10-25`)
- [ ] Drag file from tree → drop on prompt inserts mention

---

#### Task 2C-2: Landing Page (1 day)
**Priority:** P3 — Optional UX flow

**Design:**
- Server health indicator
- Recent projects (with last opened time)
- "Open Project" button
- Quick actions (settings, docs, GitHub)

**Implementation:**
```typescript
// openspace-client/src/pages/HomePage.tsx
function HomePage() {
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="max-w-2xl">
        <h1>OpenSpace</h1>
        <ServerHealth />
        <RecentProjects />
        <QuickActions />
      </div>
    </div>
  )
}
```

**Route:**
```typescript
// When no project selected, show HomePage
// When project selected, show Layout (current behavior)
```

**Acceptance Criteria:**
- [ ] Landing page shown when no project open
- [ ] Can select recent project
- [ ] Server health visible
- [ ] Can open settings from landing page

---

## Summary

### Total Effort Estimate

| Phase | Duration | Tasks |
|-------|----------|-------|
| **2A: Core UX** | 1 week | Tool renderers (3d), shortcuts (2h), timer (2h), file watcher (1d) |
| **2B: Settings** | 1 week | Themes (2d), command palette (1d), fonts (4h), models (1d), i18n (1d) |
| **2C: Polish** | 3 days | File context (4h), landing page (1d), misc (1d) |
| **TOTAL** | **~2.5 weeks** | 15 tasks |

### Feature Gap Closure

| Category | Before | After | Closed |
|----------|--------|-------|--------|
| Tool Renderers | ⚠️ Generic | ✅ 6 dedicated | 6 gaps |
| Settings | 3 themes, 3 fonts, 4 langs | 11 themes, 11 fonts, 16 langs | 12 gaps |
| Navigation | Basic | + shortcuts + timer | 2 gaps |
| File Ops | Partial drag | Full line selection | 2 gaps |
| Command Palette | 6 commands | 40+ commands | 1 gap |
| Model Management | Basic | + recent + visibility + cycling | 3 gaps |
| **TOTAL** | **29 gaps** | **3 gaps remain** | **26 gaps closed** |

### Remaining Gaps (Acceptable)

1. **Diff viewer** — Deferred to modality phase
2. **Desktop app** — Future work (Tauri)
3. **Review panel** — Part of diff modality

---

## Next Steps

After Phase 2 completion:
1. **Proceed to Phase 3:** Architecture debate for modalities
2. **Validate with user testing:** Ensure parity feels right
3. **Update documentation:** Reflect new features in README

---

## Validation Criteria

**Definition of Done for Phase 2:**
- [ ] All P0 and P1 tasks completed
- [ ] `npm run check` passes
- [ ] `npm run test:e2e` passes
- [ ] Manual testing of each new feature
- [ ] Updated CHANGELOG.md
- [ ] Feature parity comparison table updated (26/29 gaps closed)

**User Acceptance:**
- User confirms: "openspace-client now feels as complete as opencode-client for core chat/session features"
- Ready to proceed with modality architecture debate
