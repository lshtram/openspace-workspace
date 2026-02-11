# Comprehensive Test Coverage Recommendations - OpenCode Web Interface

**Document Version:** 2.0  
**Date:** February 5, 2026  
**Based on:** Review of `opencode/packages/app/e2e/` test suite (30 E2E tests, 2 unit tests)

---

## Executive Summary

**Current E2E Test Coverage:** 30 test files covering ~40% of critical user-facing features  
**Current Unit Test Coverage:** 2 test files (minimal coverage)  
**Test Quality:** High - well-structured helpers, good cleanup patterns, cross-platform support  

**Key Findings:**
- ✅ **Excellent coverage:** Settings, keybinds, workspace management, status indicators
- ⚠️ **Partial coverage:** Prompt features, file operations, session management, terminal
- ❌ **No coverage:** Error handling, authentication, real-time streaming, performance, accessibility

---

## Part 1: Existing Tests (Keep & Maintain)

### ✅ Core App Navigation (5 tests)
- [x] Home page renders with "Open project" and server picker button
- [x] Server picker dialog opens from home
- [x] Project route redirects to `/session` and prompt is visible
- [x] Command palette opens and closes
- [x] Titlebar back/forward navigates between sessions

### ✅ Prompt & Input (4 tests)
- [x] Send prompt and receive AI reply (full round-trip with SDK polling)
- [x] URL updates with session ID on first prompt
- [x] @mention inserts file pill token with autocomplete
- [x] /open slash command opens file picker dialog
- [x] Context panel opens after seeded context

### ✅ Session Management (4 tests)
- [x] Rename session via header menu
- [x] Archive session via header menu
- [x] Delete session via header menu with confirmation
- [x] Share/unshare session when feature enabled

### ✅ Files (3 tests)
- [x] Open file from palette and render content with syntax highlighting
- [x] File tree expand folders (CURRENTLY SKIPPED - needs fixing)
- [x] File viewer renders package.json content

### ✅ Models & Providers (4 tests)
- [x] Model selection updates prompt footer
- [x] /model slash command opens picker
- [x] Model variant/thinking level cycling
- [x] Hide/show models in picker
- [x] Custom provider form validation
- [x] Add/remove custom models and headers

### ✅ Settings - General (11 tests)
- [x] Dialog opens, switches tabs, closes
- [x] Language change updates labels dynamically
- [x] Color scheme change persists to localStorage and updates DOM
- [x] Theme change persists to localStorage and updates CSS
- [x] Font change persists and updates CSS variables
- [x] Notification agent toggle persists
- [x] Notification permissions toggle persists
- [x] Notification errors toggle persists
- [x] Sound agent selection persists
- [x] Updates on startup toggle persists
- [x] Release notes toggle persists

### ✅ Settings - Keybinds (8 tests)
- [x] Change sidebar toggle keybind and verify behavior
- [x] Reset all keybinds to defaults
- [x] Clear a keybind (unassigned state)
- [x] Change settings open keybind
- [x] Change new session keybind
- [x] Change file open keybind
- [x] Change terminal toggle keybind
- [x] Change command palette keybind

### ✅ Status & Monitoring (7 tests)
- [x] Status popover opens and shows all tabs (Servers, MCP, LSP, Plugins)
- [x] Servers tab shows current server
- [x] Switch to MCP tab
- [x] Switch to LSP tab
- [x] Switch to Plugins tab
- [x] Close popover on Escape
- [x] Close popover on outside click
- [x] Set default server via status popover (persists to localStorage)

### ✅ Projects & Workspaces (8 tests)
- [x] Switch between projects from sidebar
- [x] Edit project name and startup script
- [x] Close project via hover menu
- [x] Enable/disable workspaces from project menu
- [x] Create workspace
- [x] Rename workspace
- [x] Reset workspace (git reset functionality)
- [x] Delete workspace with confirmation
- [x] Reorder workspaces by drag and drop

### ✅ Sidebar (2 tests)
- [x] Sidebar collapse/expand
- [x] Session link navigation

### ✅ Terminal (2 tests)
- [x] Terminal panel toggle with keyboard shortcut
- [x] Terminal initialization
- [x] Create second terminal tab

### ✅ Unit Tests (2 tests)
- [x] Terminal serialization: ANSI color preservation (CURRENTLY SKIPPED - needs fixing)
- [x] Terminal serialization: round-trip without garbage characters
- [x] Layout scroll context (content not verified)

---

## Part 2: Critical Missing Tests (Priority 1 - Must Add)

### 🔴 Error Handling & Resilience

#### Server Connection Errors
- [ ] Server unreachable: display error message with retry button
- [ ] Server connection timeout: show loading state, then error after timeout
- [ ] WebSocket disconnection: show connection lost indicator
- [ ] WebSocket reconnection: automatic retry with success indicator
- [ ] Server 500 error: display user-friendly error message
- [ ] Server 503 (maintenance): show maintenance message

#### API & LLM Errors
- [ ] API 400 Bad Request: display validation error
- [ ] API 401 Unauthorized: redirect to login/auth flow
- [ ] API 403 Forbidden: show permission denied message
- [ ] API 404 Not Found: handle missing session/file gracefully
- [ ] API 429 Rate Limit: show rate limit message with cooldown timer
- [ ] LLM timeout: show timeout error with retry option
- [ ] LLM streaming error mid-response: partial content + error indicator
- [ ] Model not available: fallback to default model or show picker

#### Client-Side Errors
- [ ] Network offline: detect offline state, queue actions, sync on reconnect
- [ ] localStorage quota exceeded: graceful degradation, show warning
- [ ] Invalid session ID in URL: redirect to new session
- [ ] Corrupted localStorage data: clear and reinitialize
- [ ] JavaScript error boundary: catch errors, show fallback UI, report to user
- [ ] Memory leak detection in long sessions (performance test)

### 🔴 Real-time & Streaming Features

#### Streaming Response Rendering
- [ ] Streaming text appears incrementally (not all at once)
- [ ] Code blocks format correctly during streaming
- [ ] Cancel streaming mid-response
- [ ] Streaming error handling (connection lost during stream)
- [ ] Multiple code blocks in single streaming response
- [ ] Very long streaming response (10,000+ characters)

#### Live Updates
- [ ] Session list updates when session created in another tab
- [ ] Session rename reflects in sidebar immediately
- [ ] File changes reflect in open file viewer
- [ ] Server status updates in real-time

### 🔴 Authentication & Authorization

#### OAuth & Provider Auth
- [ ] OAuth login flow (redirect, callback, token storage)
- [ ] OAuth token refresh on expiration
- [ ] OAuth provider disconnect
- [ ] Multiple provider authentication (GitHub Copilot, OpenAI, etc.)
- [ ] Provider API key validation
- [ ] Custom provider authentication headers

#### Session Security
- [ ] Token expiration: detect and prompt re-auth
- [ ] Invalid token: clear session and redirect to login
- [ ] Multi-device session conflicts
- [ ] Secure token storage (not in plain localStorage)

### 🔴 Prompt Advanced Features

#### Input Edge Cases
- [ ] Multiline input with Shift+Enter
- [ ] Very long prompt (10,000+ characters)
- [ ] Prompt with special characters (emoji, unicode, markdown)
- [ ] Prompt history navigation (up/down arrows)
- [ ] Prompt auto-save on navigation away
- [ ] Prompt recovery after browser crash
- [ ] Empty prompt submission (should be blocked)

#### @Mentions & Attachments
- [ ] Multiple @file mentions in single prompt
- [ ] @mention non-existent file (error handling)
- [ ] @mention large file (size warning)
- [ ] @mention binary file (should prevent or warn)
- [ ] Drag and drop file into prompt
- [ ] Paste image into prompt
- [ ] Remove file pill token

#### Slash Commands
- [ ] /model with fuzzy search
- [ ] /open with fuzzy file search
- [ ] Unknown slash command (error message)
- [ ] Slash command autocomplete
- [ ] Escape to cancel slash command

### 🔴 File System Operations

#### File Tree Edge Cases
- [ ] Large directory tree (1000+ files) performance
- [ ] Symbolic link handling (show as links, don't follow)
- [ ] Hidden files toggle (.gitignore, .env)
- [ ] File permissions errors (unreadable files)
- [ ] Binary file detection (show warning, don't render)
- [ ] File watching: updates on external file changes
- [ ] Git status indicators in file tree (modified, added, deleted)

#### File Viewer Edge Cases
- [ ] Very large file (1MB+) rendering with virtual scrolling
- [ ] File with invalid UTF-8 encoding
- [ ] File not found error handling
- [ ] File changed during viewing (show reload prompt)
- [ ] Line number display
- [ ] Syntax highlighting for 50+ languages
- [ ] Search within file

---

## Part 3: Important Missing Tests (Priority 2 - Should Add)

### 🟡 Session Features

#### Advanced Operations
- [ ] Session forking (duplicate with context)
- [ ] Session export to markdown/JSON
- [ ] Session import from file
- [ ] Session search (search content across all sessions)
- [ ] Session tagging/labels
- [ ] Session filter by date range
- [ ] Session filter by agent type
- [ ] Session filter by model
- [ ] Bulk session archive
- [ ] Bulk session delete with confirmation

#### Session List UI
- [ ] Pagination (if > 100 sessions)
- [ ] Infinite scroll in session list
- [ ] Empty state: no sessions yet
- [ ] Loading state: fetching sessions
- [ ] Session preview on hover
- [ ] Session last message timestamp

### 🟡 Terminal Advanced Features

#### Terminal Interaction
- [ ] Terminal input (typing commands)
- [ ] Terminal output rendering (stdout/stderr)
- [ ] Terminal keyboard shortcuts (Ctrl+C, Ctrl+D)
- [ ] Terminal copy/paste (text selection)
- [ ] Terminal search (Ctrl+F)
- [ ] Terminal clear (Ctrl+L)
- [ ] Terminal scrollback limits (10,000 lines)
- [ ] Terminal resize (width/height change)
- [ ] Terminal link detection and click

#### Multiple Terminals
- [ ] Create multiple terminal tabs
- [ ] Switch between terminal tabs
- [ ] Rename terminal tab
- [ ] Close terminal tab
- [ ] Terminal tab persistence across sessions

### 🟡 Code Viewer/Editor

#### Viewing
- [ ] Diff view for file changes
- [ ] Split view (multiple files side-by-side)
- [ ] Code minimap
- [ ] Breadcrumb navigation
- [ ] Go to line number
- [ ] Code folding (collapse functions/blocks)

#### Editing (if supported)
- [ ] Edit file content
- [ ] Save changes
- [ ] Undo/redo
- [ ] Format document
- [ ] Auto-save

### 🟡 Accessibility (A11y)

#### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Enter to activate buttons
- [ ] Escape to close dialogs/popovers
- [ ] Arrow keys to navigate lists
- [ ] Keyboard-only: create session, send prompt, receive reply

#### Screen Reader Support
- [ ] ARIA labels on all interactive elements
- [ ] ARIA live regions for dynamic content (streaming responses)
- [ ] ARIA landmarks (navigation, main, complementary)
- [ ] Focus management in dialogs (trap focus, restore on close)
- [ ] Announcement of loading/error states

#### Visual Accessibility
- [ ] High contrast mode support
- [ ] Reduced motion preference (disable animations)
- [ ] Zoom to 200% without breaking layout
- [ ] Color contrast ratios meet WCAG AA (4.5:1 text, 3:1 UI)

### 🟡 Performance

#### Load Time
- [ ] Initial page load < 2s (with cache)
- [ ] Time to interactive < 3s
- [ ] First contentful paint < 1s
- [ ] Bundle size monitoring (warn if > 500KB)

#### Runtime Performance
- [ ] Long session history (100+ messages) renders smoothly
- [ ] Large file tree (1000+ files) renders smoothly
- [ ] Memory usage stays < 200MB after 1 hour use
- [ ] No memory leaks in long-running sessions
- [ ] Smooth scrolling (60fps) in session list
- [ ] Hot module replacement works without full reload

### 🟡 Data Persistence

#### localStorage Management
- [ ] localStorage quota check before write
- [ ] localStorage graceful degradation (use in-memory fallback)
- [ ] localStorage sync between tabs (changes reflect immediately)
- [ ] localStorage migration on version upgrade
- [ ] Clear localStorage on logout

#### IndexedDB (if used)
- [ ] Store large session data in IndexedDB
- [ ] IndexedDB quota management
- [ ] IndexedDB migration on schema change

#### Offline Mode
- [ ] Detect offline state
- [ ] Queue actions while offline
- [ ] Sync actions when back online
- [ ] Show offline indicator

---

## Part 4: Nice-to-Have Tests (Priority 3 - Can Add Later)

### 🟢 Internationalization (i18n)

- [ ] RTL language support (Arabic, Hebrew)
- [ ] Language switching preserves application state
- [ ] Date/time formatting matches locale
- [ ] Number formatting matches locale
- [ ] Pluralization rules (1 item vs 2 items)
- [ ] Missing translation fallback to English
- [ ] All UI strings externalized (no hardcoded English)

### 🟢 Mobile/Responsive

- [ ] Mobile layout renders correctly (320px width)
- [ ] Tablet layout renders correctly (768px width)
- [ ] Touch gestures (swipe sidebar, pinch zoom)
- [ ] Virtual keyboard doesn't overlap input
- [ ] Responsive breakpoints (mobile/tablet/desktop)
- [ ] Mobile navigation patterns (hamburger menu)
- [ ] Portrait/landscape orientation handling

### 🟢 UI Component Library

#### Dialog Component
- [ ] Dialog opens with focus on first element
- [ ] Dialog closes on Escape
- [ ] Dialog closes on outside click (if dismissible)
- [ ] Dialog focus trap (Tab doesn't leave dialog)
- [ ] Dialog scrollable content (if content exceeds viewport)
- [ ] Dialog restore focus to trigger on close

#### Dropdown Menu
- [ ] Keyboard navigation (arrow keys)
- [ ] Typeahead search in long menus
- [ ] Menu closes on selection
- [ ] Menu closes on Escape
- [ ] Menu closes on outside click

#### Tooltip
- [ ] Tooltip shows on hover after delay (500ms)
- [ ] Tooltip hides on mouse leave
- [ ] Tooltip keyboard accessible (show on focus)
- [ ] Tooltip doesn't overflow viewport

#### Loading States
- [ ] Skeleton loaders for slow content
- [ ] Spinner for long operations (> 1s)
- [ ] Progress bars for known-duration operations

#### Empty States
- [ ] Empty session list: "No sessions yet" message
- [ ] Empty file tree: "No files in project" message
- [ ] Empty search results: "No results found" message

### 🟢 Search & Filtering

- [ ] Global search (find text across all sessions)
- [ ] File search within project (fuzzy match)
- [ ] Session content search (find in current session)
- [ ] Search result highlighting
- [ ] Search history (recent searches)
- [ ] Search filters (by date, agent, model)

### 🟢 Clipboard Operations

- [ ] Copy code blocks (click to copy button)
- [ ] Copy file paths from file tree
- [ ] Copy session share links
- [ ] Copy AI response
- [ ] Paste permission handling (browser prompt)
- [ ] Paste formatting (preserve markdown)

### 🟢 Notifications

- [ ] Browser notification permission request
- [ ] Browser notification on agent reply (when tab not focused)
- [ ] In-app notification display (toast)
- [ ] Notification dismiss behavior (auto-dismiss after 5s)
- [ ] Notification grouping (multiple messages)
- [ ] Notification sound (configurable)

### 🟢 Theme & Appearance

- [ ] Custom theme creation (color picker UI)
- [ ] Theme export to JSON
- [ ] Theme import from JSON
- [ ] System color scheme detection (light/dark)
- [ ] Dynamic theme switching without flicker
- [ ] Theme preview before applying

### 🟢 Agent Switching

- [ ] Switch between "build" and "plan" agents (Tab key)
- [ ] Agent indicator shows current agent
- [ ] "plan" agent: read-only mode, asks permission for bash
- [ ] "plan" agent: denies file edits by default
- [ ] @general subagent invocation (for complex searches)

### 🟢 Workspace Advanced

- [ ] Open existing workspace on startup
- [ ] Workspace conflict handling (same dir already open)
- [ ] Failed workspace reset UI (show error)
- [ ] Failed workspace delete UI (show error)
- [ ] Workspace git branch indicator

---

## Part 5: Test Infrastructure Improvements

### Test Utilities
- [ ] Add visual regression testing (Percy, Chromatic)
- [ ] Add component snapshot testing (Storybook)
- [ ] Add API mocking layer (MSW)
- [ ] Add test data factories (faker.js)

### CI/CD Integration
- [ ] Run E2E tests on PR (GitHub Actions)
- [ ] Run visual regression tests on PR
- [ ] Fail PR if tests fail
- [ ] Test coverage reporting (upload to Codecov)
- [ ] Performance regression detection

### Cross-Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Part 6: OpenSpace Client Port Test Plan

**Context:** The React port (`openspace-client`) should achieve functional parity with the SolidJS implementation (`opencode/packages/app`) for in-scope features: **Chat Interface**, **Input**, **Status/Connection**, and **Providers/Auth**.

### Porting Strategy
1. **Copy test infrastructure** from `opencode/packages/app/e2e/`:
   - `fixtures.ts`, `actions.ts`, `selectors.ts`, `utils.ts`
   - Adjust selectors if `data-*` attributes differ in React

2. **Port critical tests first** (blocking parity):
   - TC-01: Send prompt & receive reply (`prompt.spec.ts`)
   - TC-02: Rename session (`session.spec.ts`)
   - TC-03: Delete session (`session.spec.ts`)
   - TC-04: Status popover tabs (`status-popover.spec.ts`)
   - TC-05: Server status (`status-popover.spec.ts`)
   - TC-06: Change model (`model-picker.spec.ts`)

3. **Exclude out-of-scope features** (for now):
   - File tree & operations
   - Terminal (implemented but not priority)
   - Settings (unless critical for connection)

4. **Success criteria:**
   - All ported E2E tests pass in `openspace-client`
   - Visual parity with original (screenshot comparison)
   - Performance parity (load time < 3s)

---

## Part 7: Test Execution Recommendations

### Test Prioritization Matrix

| Priority | Category | Test Count | Estimated Effort | Impact |
|----------|----------|------------|------------------|--------|
| P0 | Fix skipped tests | 2 | 1 day | High |
| P1 | Error handling | 15 | 5 days | Critical |
| P1 | Real-time streaming | 6 | 3 days | Critical |
| P1 | Auth flows | 8 | 4 days | Critical |
| P1 | Prompt advanced | 12 | 4 days | High |
| P1 | File system | 7 | 3 days | High |
| P2 | Session features | 12 | 5 days | Medium |
| P2 | Terminal advanced | 9 | 4 days | Medium |
| P2 | Accessibility | 12 | 6 days | High |
| P2 | Performance | 6 | 4 days | Medium |
| P3 | i18n | 7 | 3 days | Low |
| P3 | Mobile/responsive | 6 | 4 days | Medium |
| P3 | Component library | 15 | 5 days | Low |

**Total Estimated Effort:** ~51 days (10+ weeks)

### Phased Rollout

**Phase 1 (Weeks 1-2): Stabilization**
- Fix 2 skipped tests
- Add error handling tests (15 tests)
- Add real-time streaming tests (6 tests)
- **Outcome:** Stable, production-ready error handling

**Phase 2 (Weeks 3-4): Security & Core UX**
- Add auth flow tests (8 tests)
- Add prompt advanced tests (12 tests)
- Add file system tests (7 tests)
- **Outcome:** Secure auth, robust prompt handling

**Phase 3 (Weeks 5-7): Advanced Features**
- Add session feature tests (12 tests)
- Add terminal advanced tests (9 tests)
- Add accessibility tests (12 tests)
- Add performance tests (6 tests)
- **Outcome:** Feature-complete, accessible, performant

**Phase 4 (Weeks 8-10): Polish**
- Add i18n tests (7 tests)
- Add mobile/responsive tests (6 tests)
- Add component library tests (15 tests)
- **Outcome:** Production-ready for global, mobile users

---

## Summary

**Current State:**
- ✅ 30 E2E tests + 2 unit tests
- ✅ ~40% feature coverage
- ✅ High test quality (well-structured, cross-platform)

**Recommended Additions:**
- 🔴 **Priority 1:** 48 critical tests (error handling, streaming, auth, prompt, files)
- 🟡 **Priority 2:** 39 important tests (sessions, terminal, a11y, performance)
- 🟢 **Priority 3:** 53 nice-to-have tests (i18n, mobile, components)

**Total Comprehensive Coverage:** ~172 tests (existing 32 + new 140)

**Next Steps:**
1. Fix 2 currently skipped tests (file-tree.spec.ts, serialize.test.ts)
2. Implement Phase 1 (stabilization) tests
3. Set up CI/CD for automated test execution
4. Port critical tests to `openspace-client` React port
5. Begin Phase 2 (security & core UX) tests

---

**Document Maintainer:** OpenCode Team  
**Last Updated:** February 5, 2026  
**Next Review:** After Phase 1 completion
