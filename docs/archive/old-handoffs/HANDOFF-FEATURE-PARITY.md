---
id: HANDOFF-FEATURE-PARITY
author: oracle_a1b2
status: APPROVED
date: 2026-02-11
task_id: feature-parity-implementation
---

# Task Handoff: Feature Parity Implementation

## Context for New Agent

You are receiving this task as part of the **OpenSpace React Port Completion** project. This handoff provides everything you need to implement Phase 2: Feature Parity (closing the gap between opencode-client and openspace-client).

---

## Project Background

**What is OpenSpace?**
- A React port of the opencode AI coding assistant client
- Currently functional with: SSE streaming, terminal, sessions, file tree, MCP integration, whiteboard modality
- Goal: Achieve feature parity with opencode, then add 6 additional modalities (editor, diff, presentation, voice, comments, browser)

**What is opencode?**
- Reference implementation in SolidJS
- Production-grade with 121+ features
- Located at `/Users/Shared/dev/opencode/` (read-only reference)

**Current State:**
- Comprehensive review completed: `docs/reviews/COMPREHENSIVE-REVIEW-2026-02-11.md`
- Feature gap identified: 29 missing features
- This task closes 26 of those gaps (excluding diff viewer modality, desktop app, and new modalities)

---

## Your Mission

**Implement Phase 2 from:** `docs/plans/FEATURE-PARITY-PLAN.md`

**Duration:** ~2.5 weeks

**Phases:**
- Phase 2A: Core UX (Week 1) — Tool renderers, shortcuts, file watcher
- Phase 2B: Settings & Customization (Week 2) — Themes, command palette, fonts, i18n
- Phase 2C: Polish (3 days) — File context, landing page

**Success Criteria:**
- 26 feature gaps closed
- All tests pass (`npm run check`, `npm run test:e2e`)
- UX matches opencode quality for chat/session features

---

## Critical Files & Resources

### Primary Task Document
📄 **`docs/plans/FEATURE-PARITY-PLAN.md`**
- Complete implementation plan with acceptance criteria
- Task breakdown, effort estimates, file locations
- **This is your primary reference**

### Reference Implementation (Read-Only)
📂 **`/Users/Shared/dev/opencode/`**
- SolidJS implementation to reference
- Key directories:
  - `packages/app/src/page/session/message/message-part.tsx` — Tool renderers
  - `packages/app/src/theme/default-themes.ts` — Theme definitions
  - `packages/app/src/context/command/commands.ts` — Command palette
  - `packages/app/src/i18n/locales/` — Translations

**Note:** Files in `/Users/Shared/dev/opencode/` must be read using:
```bash
python3 -c "with open('/Users/Shared/dev/opencode/path/to/file') as f: print(f.read())"
```
(Workaround for cross-directory file access)

### Codebase You're Modifying
📂 **`/Users/Shared/dev/openspace/openspace-client/`**
- React + Vite + TypeScript + TailwindCSS
- State: React Query + Context API
- Key files:
  - `src/components/SessionView.tsx` — Message rendering
  - `src/context/SettingsContext.tsx` — Settings state
  - `src/context/CommandPaletteContext.tsx` — Commands
  - `src/context/LayoutContext.tsx` — Layout state
  - `src/styles/themes/` — Theme CSS

### Review Document (Context)
📄 **`docs/reviews/COMPREHENSIVE-REVIEW-2026-02-11.md`**
- Full feature comparison table (lines 137-284)
- Code quality assessment
- Architecture critique (for context, not for this task)

---

## Implementation Guidance

### Phase 2A: Core UX (Week 1) — PRIORITY

#### Task 2A-1: Dedicated Tool Renderers (3 days) ⭐ HIGHEST PRIORITY

**Goal:** Port 6 tool renderers from opencode to make chat UX match quality.

**Current State:**
- openspace shows generic expandable JSON for tool calls
- opencode has 12+ custom renderers with syntax highlighting, diffs, etc.

**Implementation Pattern:**

1. **Create renderer components:**
   ```
   openspace-client/src/components/message/tool-renderers/
     EditToolRenderer.tsx      — Inline diff view
     WriteToolRenderer.tsx     — Code preview with syntax highlight
     BashToolRenderer.tsx      — Terminal output with ANSI colors
     TaskToolRenderer.tsx      — Recursive sub-agent display
     TodoWriteToolRenderer.tsx — Checklist with status badges
     QuestionToolRenderer.tsx  — Wizard/form UI
     index.ts                  — Registry export
   ```

2. **Reference implementations:**
   - opencode: `packages/app/src/page/session/message/message-part.tsx` (lines ~200-800)
   - Look for `case 'edit':`, `case 'write':`, etc.

3. **Libraries to use:**
   - **Diff rendering:** `react-diff-view` (npm install) OR port `@pierre/diffs` logic
   - **ANSI colors:** `ansi-to-react` (already in package.json)
   - **Syntax highlighting:** `react-syntax-highlighter` (already in use)

4. **Integration point:**
   - Modify `src/components/SessionView.tsx` where tool calls render
   - Add tool name → component mapping
   - Fallback to generic renderer for unknown tools

**Acceptance Criteria:**
- [ ] `edit` tool shows side-by-side diff (old vs new)
- [ ] `write` tool shows code with file path header
- [ ] `bash` tool shows colored output with exit code
- [ ] `task` tool shows nested sub-agent calls (recursive)
- [ ] `todowrite` tool shows checkbox list with status badges
- [ ] `question` tool shows Q&A wizard format
- [ ] All have syntax highlighting where applicable
- [ ] All are collapsible for long content

**Testing:**
- Create test session with each tool type
- Verify rendering matches opencode quality
- Check performance with large outputs (e.g., 1000+ line bash output)

---

#### Task 2A-2: File Watcher Integration (1 day)

**Goal:** Update file tree in real-time when files change externally.

**Current State:**
- File tree only updates on manual refresh
- opencode uses SSE `file.changed` events from server

**Implementation:**

1. **Extend SSE handler:**
   - File: `src/context/ServerContext.tsx`
   - Add `file.changed` event type to SSE listener
   - Emit to React Query cache

2. **Invalidate queries:**
   ```typescript
   // In ServerContext.tsx SSE handler
   source.addEventListener('file.changed', (e) => {
     const { path, type } = JSON.parse(e.data)
     queryClient.invalidateQueries({ queryKey: ['files', projectPath] })
   })
   ```

3. **Optional:** Show toast notification for changed files

**Acceptance Criteria:**
- [ ] File tree updates when files change via git operations
- [ ] File tree updates when files edited externally
- [ ] No page refresh required
- [ ] Works with concurrent sessions

**Testing:**
- Open file tree
- Run `git checkout other-branch` in terminal
- Verify tree updates without refresh

---

#### Task 2A-3 & 2A-4: Shortcuts & Timer (4 hours total)

**Quick wins — low effort, high value.**

**2A-3: Session Navigation (Alt+↑/↓):**
- Add keyboard handler in `src/App.tsx` or `src/components/SessionSidebar.tsx`
- Navigate to previous/next session
- Wrap at list boundaries

**2A-4: Duration Timer:**
- Add `startedAt` timestamp to turn model
- Display in turn header: "Completed in 3.2s"
- Format helper: `< 1s`, `Xs`, `Xm Ys`

---

### Phase 2B: Settings & Customization (Week 2)

#### Task 2B-1: Theme Expansion (2 days)

**Goal:** Port 8 additional themes from opencode (total: 3→11 themes).

**Themes to add:**
- Ayu Light/Dark
- Catppuccin Latte/Mocha  
- Dracula
- Gruvbox Light/Dark
- Nord
- Solarized Light/Dark
- Tokyo Night

**Implementation:**

1. **Extract from opencode:**
   - File: `packages/app/src/theme/default-themes.ts`
   - Copy OKLCH color values

2. **Convert to CSS custom properties:**
   ```
   openspace-client/src/styles/themes/
     ayu-light.css
     ayu-dark.css
     ... (9 new files)
   ```

3. **Update theme selector:**
   - File: `src/context/SettingsContext.tsx`
   - Add new theme options

**Acceptance Criteria:**
- [ ] 11 total themes available
- [ ] Proper contrast ratios (WCAG AA)
- [ ] Theme switching is instant (no flash)
- [ ] Persisted in localStorage

**Note:** Do NOT port the OKLCH generator (complex, low ROI). Just copy the final color values.

---

#### Task 2B-2: Command Palette Expansion (1 day)

**Goal:** Expand from 6 commands to 40+ commands.

**Reference:**
- opencode: `packages/app/src/context/command/commands.ts`

**Categories to add:**
- Navigation (go to file, go to session)
- View (toggle compact, cycle theme, cycle language)
- Session (rename, archive, delete, clear)
- Files (open external, reveal in finder, copy path)
- Workspace (worktree commands - some already exist)

**Implementation:**
- File: `src/context/CommandPaletteContext.tsx`
- Expand `commands` array
- Add keyboard shortcuts where applicable
- Group by category for better UX

**Acceptance Criteria:**
- [ ] 40+ commands available
- [ ] Fuzzy search works
- [ ] Shortcuts shown next to commands
- [ ] Commands respect context (e.g., session commands only when session selected)

---

#### Tasks 2B-3, 2B-4, 2B-5: Fonts, Models, i18n

**These are straightforward additions — follow the plan in FEATURE-PARITY-PLAN.md:**

- **2B-3:** Add 8 fonts + font size slider (4 hours)
- **2B-4:** Recent models, visibility toggle, variant cycling (1 day)
- **2B-5:** Add 12 languages (1 day) — copy from opencode i18n files

---

### Phase 2C: Polish (3 days)

#### File Context Precision & Landing Page

**Follow FEATURE-PARITY-PLAN.md sections Task 2C-1 and 2C-2.**

Low priority — can defer if time is tight.

---

## Development Workflow

### Setup (First Time)

```bash
cd /Users/Shared/dev/openspace/openspace-client
npm install
npm run dev
```

**Verify:**
- App loads at http://localhost:5173
- Terminal opens at bottom
- Session list shows on left

### Development Loop

1. **Make changes**
2. **Check types:** `npm run check` (fast)
3. **Run E2E tests:** `npm run test:e2e:existing` (slower, but comprehensive)
4. **Commit frequently:** Small, atomic commits

### Testing

**Fast check (during development):**
```bash
npm run check  # TypeScript + lint + format
```

**Full validation (before pushing):**
```bash
npm run pre-pr  # Includes E2E tests
```

**E2E tests:**
```bash
npm run test:e2e:existing  # Uses real project at /Users/Shared/dev/dream-news
```

**Important:** Always run with `-c e2e/playwright.config.ts` flag (handled by npm scripts).

---

## Code Quality Standards

### From NSO Instructions (Global)

1. **Observability:** Add logging for I/O operations (file reads, API calls)
2. **Loop Safety:** Any polling/retry logic must respect MIN_INTERVAL
3. **Interface-First:** Define TypeScript types before implementation
4. **Defensive Programming:** Public functions start with assertions

### From Project Patterns

1. **TDD Mandatory:** RED → GREEN → REFACTOR
2. **Minimal diffs:** Don't reformat unrelated code
3. **No console.log spam:** Use proper logging or remove
4. **TypeScript strict mode:** No `any` types without justification

### From Code Review Findings

**Current code quality issues to AVOID in new code:**
- ❌ `console.log` spam (RichEditor has 15 instances)
- ❌ `any` types (whiteboard has ~15 instances)
- ❌ Deprecated APIs (`document.execCommand`)
- ❌ Module-level mutable state (terminal hook issue)
- ❌ JSON.stringify comparisons (expensive)

**Best practices to FOLLOW:**
- ✅ React Query for server state
- ✅ Context API for UI state (not Zustand/Redux)
- ✅ TailwindCSS for styling (no CSS modules)
- ✅ TypeScript strict mode
- ✅ E2E tests for user flows

---

## Edge Cases & Gotchas

### From Patterns & Review

1. **E2E tests require proper config:**
   - Always use `npm run test:e2e:existing`
   - Don't run `playwright test` directly
   - Uses real project at `/Users/Shared/dev/dream-news`

2. **opencode file reading:**
   - Can't use `read` tool directly on `/Users/Shared/dev/opencode/`
   - Must use: `python3 -c "with open('...') as f: print(f.read())"`

3. **Theme switching:**
   - Must update CSS custom properties
   - Must not cause flash (use `document.documentElement.classList`)
   - Must persist to localStorage

4. **SSE connection:**
   - Already implemented in ServerContext
   - Reconnects automatically on disconnect
   - Don't create duplicate connections

5. **File tree updates:**
   - React Query cache invalidation triggers re-fetch
   - Don't mutate cache directly
   - Use `queryClient.invalidateQueries()`

---

## Communication & Questions

### When to Ask for Help

- **Architectural decisions:** If FEATURE-PARITY-PLAN.md is unclear
- **Blockers:** If stuck for more than 1 hour
- **Scope changes:** If you discover missing requirements

### What to Report

**Daily updates should include:**
- Tasks completed (with acceptance criteria checklist)
- Tasks in progress
- Blockers or questions
- Estimated completion date

**Final deliverable:**
- All acceptance criteria met
- Tests passing
- CHANGELOG.md updated
- Feature parity table updated (in memory/progress.md)

---

## Success Metrics

**Definition of Done:**
- [ ] All P0 and P1 tasks from FEATURE-PARITY-PLAN.md completed
- [ ] All P2 tasks completed (or explicitly deferred with reason)
- [ ] `npm run check` passes (no TypeScript/lint errors)
- [ ] `npm run test:e2e` passes (all E2E tests green)
- [ ] Manual testing completed for each feature
- [ ] CHANGELOG.md updated with new features
- [ ] No new code quality issues (console.log, any types, etc.)

**Feature Gap Closure:**
- Before: 29 gaps
- After: 3 gaps (diff viewer, desktop app, review panel — deferred)
- **Target: 26 gaps closed**

---

## File Checklist for Reference

### Read These First
- [ ] `docs/plans/FEATURE-PARITY-PLAN.md` (your primary guide)
- [ ] `docs/reviews/COMPREHENSIVE-REVIEW-2026-02-11.md` (Part 2 & 3 for context)
- [ ] `.opencode/context/01_memory/patterns.md` (coding patterns)

### Reference These During Implementation
- [ ] opencode `packages/app/src/page/session/message/message-part.tsx` (tool renderers)
- [ ] opencode `packages/app/src/theme/default-themes.ts` (themes)
- [ ] opencode `packages/app/src/context/command/commands.ts` (commands)
- [ ] opencode `packages/app/src/i18n/locales/*` (translations)

### Modify These
- [ ] `openspace-client/src/components/SessionView.tsx` (tool renderers)
- [ ] `openspace-client/src/context/ServerContext.tsx` (file watcher)
- [ ] `openspace-client/src/context/SettingsContext.tsx` (themes, fonts)
- [ ] `openspace-client/src/context/CommandPaletteContext.tsx` (commands)
- [ ] `openspace-client/src/styles/themes/*` (new theme CSS files)

---

## Timeline Expectations

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| **2A: Core UX** | 1 week | Tool renderers working, file watcher live, shortcuts active |
| **2B: Settings** | 1 week | 11 themes, 40+ commands, 11 fonts, 16 languages |
| **2C: Polish** | 3 days | File line selection, landing page (optional) |
| **Buffer** | 2 days | Bug fixes, testing, documentation |
| **TOTAL** | **~2.5 weeks** | Feature parity achieved |

---

## Final Notes

**This is a well-scoped, high-value task.**

You're not inventing new architecture — you're porting proven UX patterns from opencode to React. The review document and feature plan provide clear guidance.

**Key to success:**
1. Follow the plan (don't over-engineer)
2. Reference opencode implementations (don't reinvent)
3. Test frequently (don't accumulate bugs)
4. Communicate blockers early (don't get stuck)

**When you're done:**
- openspace-client will feel as complete as opencode-client for core features
- We'll be ready to add modalities (editor, diff, presentation, etc.)
- The team will be confident in the React port's quality

---

## Handoff Checklist

**Before starting, verify:**
- [ ] You have access to `/Users/Shared/dev/openspace/`
- [ ] You can read files from `/Users/Shared/dev/opencode/` (using python3 workaround)
- [ ] `npm run dev` starts the app successfully
- [ ] `npm run check` passes (baseline)
- [ ] You've read FEATURE-PARITY-PLAN.md completely
- [ ] You understand the priority (2A > 2B > 2C)

**Ready to start?** Begin with Task 2A-1 (Tool Renderers) — highest ROI, 3-day effort.

Good luck! 🚀
