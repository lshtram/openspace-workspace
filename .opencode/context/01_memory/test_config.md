# Project Test Configuration

Last Updated: 2026-02-15
Last Verified: All 7 batches passing (104/104, 2 skipped)

---

## Test Suite Overview

| Test Type | Command | File Pattern | Approx Time |
|-----------|---------|--------------|-------------|
| Unit Tests | `npm test` | `**/*.test.ts`, `**/*.test.tsx` | ~30s |
| E2E Tests | `npm run test:e2e:existing` | `e2e/**/*.spec.ts` | ~4min (batched) |
| TypeCheck | `npx tsc --noEmit` | All `.ts/.tsx` files | ~10s |
| Lint | `npm run lint` | All source files | ~5s |

---

## E2E Test Configuration

### Test Commands

```bash
# Run all E2E tests (starts servers automatically)
npm run test:e2e

# Run with existing servers (development mode - RECOMMENDED)
npm run test:e2e:existing -- <test-files>

# Run specific test file
npm run test:e2e:existing -- app.spec.ts

# Run multiple specific files
npm run test:e2e:existing -- app.spec.ts settings.spec.ts
```

### Test File Location
- **Pattern**: `e2e/**/*.spec.ts`
- **Config**: `e2e/playwright.config.ts`
- **Framework**: Playwright with Chromium
- **Working Directory**: `openspace-client/`

### Required Services

| Service | URL | Port | Required For | Verification Command |
|---------|-----|------|--------------|---------------------|
| Runtime Hub | http://localhost:3001 | 3001 | All E2E tests | `curl -s http://localhost:3001/files/src/index.ts` |
| Vite Client | http://127.0.0.1:5173 | 5173 | All E2E tests | `curl -s http://127.0.0.1:5173 \| head -5` |
| OpenCode Server | http://localhost:3000 | 3000 | API calls | `curl -s http://localhost:3000/health` (optional) |

**Critical Configuration Requirements:**

**Hub Configuration:**
- **MUST** set `PROJECT_ROOT=/Users/Shared/dev/dream-news` for drawing/presentation tests
- Start command: `PROJECT_ROOT=/Users/Shared/dev/dream-news npm run start:hub`
- Working directory: `runtime-hub/`
- Verification: `curl -s http://localhost:3001/files/src/index.ts` should return `export const hello = 'world'`

**Client Configuration:**
- **MUST** bind to `127.0.0.1` (Playwright requirement, not `0.0.0.0` or `localhost`)
- Start command: `npm run dev -- --host 127.0.0.1`
- Working directory: `openspace-client/`
- Verification: `curl -s http://127.0.0.1:5173` should return HTML

### Test Project Location
- **Path**: `/Users/Shared/dev/dream-news`
- **Purpose**: E2E test fixture project with diagram and presentation files
- **Required Files**: `design/*.diagram.json`, `design/deck/*.deck.md`, `src/index.ts`
- **Verification**: `ls -la /Users/Shared/dev/dream-news/design/` should show `.diagram.json` files

---

## E2E Test Batches (Recommended Execution Order)

**IMPORTANT**: Always run in batches for test suites with 20+ tests. Batch 1 catches config issues in 5-10 minutes instead of discovering them after 2 hours.

### Batch 1: Smoke Tests
**Tests**: 9 | **Time**: ~20s | **Purpose**: Catch configuration issues early

```bash
npm run test:e2e:existing -- app.spec.ts settings.spec.ts basic-app.spec.ts debug-app.spec.ts
```

**What this catches:**
- Server connectivity issues
- Port conflicts
- Basic rendering failures
- Environment setup problems

### Batch 2: Core Features
**Tests**: 27 | **Time**: ~1.2m | **Purpose**: Core pane system and modality features

```bash
npm run test:e2e:existing -- pane-system.spec.ts drawing.spec.ts presentation.spec.ts
```

**What this tests:**
- Pane splitting, closing, resizing
- Drawing modality (tldraw integration)
- Presentation modality (reveal.js integration)
- Hub PROJECT_ROOT configuration (critical for drawing/presentation)

### Batch 3: Interactions
**Tests**: 9 | **Time**: ~25s | **Purpose**: Basic user interactions

```bash
npm run test:e2e:existing -- terminal.spec.ts files.spec.ts prompt.spec.ts
```

### Batch 4: Session Management
**Tests**: 13 (1 skipped) | **Time**: ~45s | **Purpose**: Session lifecycle

```bash
npm run test:e2e:existing -- session-management.spec.ts session-behavior.spec.ts status.spec.ts
```

### Batch 5: Settings
**Tests**: 22 | **Time**: ~50s | **Purpose**: Settings persistence and UI

```bash
npm run test:e2e:existing -- settings.spec.ts settings-advanced.spec.ts settings-keybinds.spec.ts
```

### Batch 6: Projects & Providers
**Tests**: 19 | **Time**: ~47s | **Purpose**: Project/workspace management

```bash
npm run test:e2e:existing -- projects-workspaces.spec.ts providers.spec.ts agent-modality-control.spec.ts
```

### Batch 7: Edge Cases & Regressions
**Tests**: 17 (1 skipped) | **Time**: ~50s | **Purpose**: Bug regression tests

```bash
npm run test:e2e:existing -- abort-generation.spec.ts debug.spec.ts modality-bugs-regression.spec.ts simple.spec.ts
```

**Total Expected**: 104 passing, 2 skipped

---

## Known Flaky/Skipped Tests

| Test | File | Line | Reason | Status | Action |
|------|------|------|--------|--------|--------|
| Timeline scroll controls | `session-behavior.spec.ts` | 167 | Route mocking unreliable after page reload | Skipped | TODO: Fix route mocking or use different approach |
| BUG-002.2: Whiteboard missing file | `modality-bugs-regression.spec.ts` | 258 | Requires error handling not yet implemented | Skipped | Waiting for BUG-002 fix |

---

## Environment Variables

```bash
# Required for E2E tests
VITE_HUB_URL=http://localhost:3001
PLAYWRIGHT_USE_EXISTING_SERVER=1  # When running against dev servers

# Hub configuration
PROJECT_ROOT=/Users/Shared/dev/dream-news  # Required for drawing/presentation tests
```

---

## Pre-Test Setup (Manual Start)

If starting from scratch without running servers:

```bash
# Terminal 1: Start Hub with test project
cd runtime-hub
PROJECT_ROOT=/Users/Shared/dev/dream-news npm run start:hub

# Terminal 2: Start Client
cd openspace-client
npm run dev -- --host 127.0.0.1

# Terminal 3: Run tests
cd openspace-client
npm run test:e2e:existing -- app.spec.ts  # Start with smoke test
```

### Verification Checklist

Before running E2E tests, verify:

```bash
# 1. Hub is serving test project
curl -s http://localhost:3001/files/src/index.ts
# Expected: export const hello = 'world'

# 2. Client is responding
curl -s http://127.0.0.1:5173 | head -5
# Expected: <!doctype html>

# 3. Test project files exist
ls -la /Users/Shared/dev/dream-news/design/
# Expected: *.diagram.json, deck/*.deck.md files
```

---

## Common Issues & Solutions

### Issue: Drawing/Presentation Tests Fail with "element not found"

**Symptoms:**
- `.tl-canvas` not visible (drawing tests)
- `.reveal` not visible (presentation tests)
- Tests timeout waiting for modality UI

**Root Cause:** Hub not serving test project directory

**Solution:**
```bash
# Kill hub process
pkill -f "start:hub"

# Restart with correct PROJECT_ROOT
cd runtime-hub
PROJECT_ROOT=/Users/Shared/dev/dream-news npm run start:hub

# Verify
curl -s http://localhost:3001/files/src/index.ts
```

### Issue: Client Connection Refused

**Symptoms:**
- Tests fail immediately with connection errors
- `ECONNREFUSED 127.0.0.1:5173`

**Root Cause:** Client not bound to 127.0.0.1 (bound to localhost or 0.0.0.0 instead)

**Solution:**
```bash
# Kill client process
pkill -f "vite"

# Restart with --host 127.0.0.1
cd openspace-client
npm run dev -- --host 127.0.0.1

# Verify
curl -s http://127.0.0.1:5173 | head -1
```

### Issue: Tests Hang or Timeout

**Symptoms:**
- Tests start but never complete
- Playwright process hangs

**Root Cause:** Port conflicts, stale processes, or browser crashes

**Solution:**
```bash
# Kill all related processes
pkill -f "playwright"
pkill -f "chromium"
pkill -f "vite"
pkill -f "start:hub"

# Restart services (see Pre-Test Setup above)
```

### Issue: Race Condition - File Opens Then Closes

**Symptoms:**
- Tests open file via `?file=` parameter but content disappears
- Drawing/presentation tests pass in batches but fail in isolation

**Root Cause:** Layout restoration runs after file opening, wiping out content

**Solution:** This was fixed in commit `60172ab`. Verify `App.tsx` has:
- `layoutRestored` state flag (line 108)
- File opening effect waits for `layoutRestored` (lines 262-277)
- `setLayoutRestored(true)` in finishRestore (line 291)

---

## Unit Test Configuration

### Test Commands

```bash
# Run all unit tests
npm test

# Run in watch mode
npm test -- --watch

# Run specific test file
npm test -- useAgentCommands.test.tsx

# Run with coverage
npm test -- --coverage
```

### Test File Location
- **Pattern**: `src/**/*.test.ts`, `src/**/*.test.tsx`
- **Framework**: Vitest
- **Working Directory**: `openspace-client/`

### Key Test Suites

- `src/hooks/useAgentCommands.test.tsx` - Agent command handling (FILE_CHANGED, SPLIT_PANE)
- `src/components/pane/utils/treeOps.test.ts` - Pane tree operations

---

## Build & Quality Checks

### TypeCheck
```bash
cd openspace-client
npx tsc --noEmit
```
**Expected:** 0 errors

### Lint
```bash
cd openspace-client
npm run lint
```
**Expected:** No errors (warnings acceptable if documented)

### Build
```bash
cd openspace-client
npm run build
```
**Expected:** Successful build, output in `dist/`

---

## Maintenance Notes

**When to Update This File:**
- New test suite added
- Test batch configuration changes
- Service URLs/ports change
- New flaky tests discovered
- Environment variable requirements change
- Common issues discovered and solved
