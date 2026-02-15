# E2E Test Validation Process - Implementation Summary

**Date:** 2026-02-15  
**Status:** ✅ COMPLETE

---

## Problem Statement

During this session, we discovered a critical gap in the validation process:

1. **Session notes documented fixes that were never implemented in code**
2. **Tests passed in batches but failed in isolation** due to missing implementation
3. **No systematic verification** that documented changes match actual code changes
4. **No batched execution strategy** for long-running E2E test suites

### Specific Example

Previous session notes claimed:
- "App.tsx modified with layoutRestored state flag"
- "File parameter race condition fixed"

Reality:
- App.tsx was NEVER modified
- The fix existed only in documentation/discussion
- Drawing/presentation tests failed because the fix didn't exist

---

## Solution Implemented

### 1. Updated Janitor Protocol (NSO Global Layer)

**File:** `~/.config/opencode/nso/prompts/Janitor.md`

**New Section:** "E2E & INTEGRATION TEST VALIDATION (MANDATORY)"

**Key Steps:**

1. **Load Project Test Config** - Read `.opencode/context/01_memory/test_config.md`
2. **Verify Code Changes Match Documentation** - CRITICAL step to catch "phantom fixes"
3. **Check E2E Test Coverage** - Ensure tests exist for changed features
4. **Run Tests with Batched Execution** - For suites with 20+ tests
5. **Verify Test Infrastructure** - Check servers, ports, fixtures
6. **Investigate Root Causes** - Systematic debugging approach
7. **Document Results** - Structured YAML output with verdict rules

**Project-Agnostic Design:**
- No hardcoded ports, URLs, or file paths
- References project-specific config file
- Janitor creates config if it doesn't exist
- Works for ANY project

### 2. Created Project Test Configuration

**File:** `.opencode/context/01_memory/test_config.md`

**Contents:**
- Test suite overview (E2E, unit, typecheck, lint)
- E2E batch configuration (7 batches, 104 tests)
- Required services (Hub, Client, ports, verification commands)
- Known flaky tests with reasons
- Common issues and solutions
- Environment variables
- Pre-test setup instructions

**Purpose:**
- Single source of truth for test configuration
- Enables Janitor to run tests correctly
- Documents tribal knowledge (Hub PROJECT_ROOT, client binding, etc.)
- Saves future sessions from rediscovering configuration issues

---

## Batched Execution Strategy

### Why Batch E2E Tests?

**Problem:** Running 104 tests takes ~4 minutes. If configuration is wrong (wrong port, missing env, etc.), you waste 4 minutes before discovering the issue.

**Solution:** Run tests in batches:

1. **Batch 1 (Smoke Tests):** 3-5 critical tests in 20 seconds
   - Catches config issues immediately
   - Tests basic connectivity, rendering, setup
   
2. **Batch 2-N:** Feature groups of 5-10 tests
   - Only run if previous batch passed
   - Stop on first failure
   - Fix before proceeding

**Benefits:**
- Discover config issues in 20 seconds instead of 4 minutes
- Incremental progress tracking
- Early failure detection
- Prevents running hundreds of doomed tests

### Batch Configuration for This Project

| Batch | Tests | Time | Purpose |
|-------|-------|------|---------|
| 1 | 9 | 20s | Smoke tests - catch config issues |
| 2 | 27 | 1.2m | Core features (pane/drawing/presentation) |
| 3 | 9 | 25s | Interactions (terminal/files/prompt) |
| 4 | 13 | 45s | Session management |
| 5 | 22 | 50s | Settings |
| 6 | 19 | 47s | Projects & providers |
| 7 | 17 | 50s | Edge cases & regressions |

**Total:** 104 passing, 2 skipped

---

## Phantom Fix Detection

### The Problem

**Scenario:**
1. Agent discusses a fix: "We need to add layoutRestored state"
2. Session notes document: "App.tsx modified with layoutRestored fix"
3. Code is NEVER actually changed
4. Tests pass in some contexts (batches) but fail in others (isolation)
5. Next session wastes time debugging "why tests fail"

### The Solution

**Step 2 of Janitor Protocol:**

Before running tests, Janitor MUST:
- Read documentation claiming fixes were applied
- Verify EACH fix exists in actual code using:
  - `git diff` (uncommitted changes)
  - `git show` (recent commits)
  - Read actual source files
- If documentation claims fix but code unchanged: **REJECT immediately**

**Example Commands:**
```bash
# Check uncommitted changes
git diff src/App.tsx

# Check recent commits
git log --oneline -5
git show <commit-hash>

# Read actual file
cat src/App.tsx | grep -A5 "layoutRestored"
```

**Result:**
- No more phantom fixes
- Documentation matches reality
- Tests pass consistently

---

## Verdict Rules

Janitor MUST **REJECT** if:
- Any batch fails
- Phantom fixes found (documented but not implemented)
- Tests are flaky (pass inconsistently)
- Infrastructure issues prevent testing (services down, wrong config)

Janitor can only **APPROVE** if:
- All applicable batches pass 100%
- Code changes match documentation
- Infrastructure verified
- Tests pass consistently

---

## Implementation Results

### Commits

**NSO Layer:**
```
commit 25d6bca
feat(janitor): add E2E test validation protocol with project-agnostic process
```

**Project Layer:**
```
commit 91d0d51
docs: add E2E test configuration for openspace project
```

**Bug Fixes (Earlier in Session):**
```
commit 60172ab
fix: URL file parameter race condition and E2E test fixes
```

### Test Results

**Before Fix:**
- Drawing tests: 0/5 passing (failed in isolation)
- Presentation tests: 0/1 passing (failed in isolation)
- Root cause: Missing App.tsx fix (phantom fix)

**After Fix:**
- Drawing tests: 5/5 passing ✅
- Presentation tests: 1/1 passing ✅
- All 7 batches: 104/104 passing (2 skipped) ✅

---

## Process Flow for Future Sessions

### When Janitor Validates E2E Tests:

```
1. READ .opencode/context/01_memory/test_config.md
   ├─ If doesn't exist: infer from package.json and create it
   └─ Load batch config, service requirements, known issues

2. VERIFY code changes match documentation
   ├─ Read session notes/summaries
   ├─ Check git diff / git log
   ├─ Read actual source files
   └─ If mismatch: REJECT immediately

3. CHECK test coverage
   └─ Verify tests exist for changed features

4. RUN tests in batches (if 20+ tests)
   ├─ Batch 1 (smoke tests) first
   ├─ Stop on failure
   ├─ Fix before proceeding
   └─ Document results per batch

5. VERIFY infrastructure (if tests fail)
   ├─ Check services running (curl commands from config)
   ├─ Verify correct configuration (ports, env vars)
   └─ Check fixture files exist

6. INVESTIGATE root causes (if failures persist)
   ├─ Race conditions
   ├─ Selector issues
   ├─ State isolation
   └─ Missing implementation (back to step 2)

7. DOCUMENT results in result.md
   └─ APPROVE only if all batches pass consistently
```

---

## Key Learnings

1. **Documentation ≠ Implementation**
   - Always verify code changes exist
   - Discussion of a fix ≠ implementation of a fix
   
2. **Batch Long Test Suites**
   - Run smoke tests first (catch config issues early)
   - Stop on first failure
   - Don't waste time running doomed tests
   
3. **Project-Specific Config Matters**
   - Hub PROJECT_ROOT must be set correctly
   - Client must bind to correct interface (127.0.0.1)
   - Document tribal knowledge for future sessions
   
4. **Test Consistency Is Critical**
   - Tests must pass in isolation AND in batches
   - Flaky tests must be documented or fixed
   - Race conditions must be resolved

---

## Future Improvements

1. **Automated Config Detection**
   - Janitor could auto-detect ports from running processes
   - Could infer batch groupings from test file structure
   
2. **Test History Tracking**
   - Track which tests fail most often
   - Identify flaky tests automatically
   
3. **Infrastructure Health Check**
   - Pre-test script to verify all services running
   - Auto-restart services if down

---

**This process is now part of NSO and will apply to all future BUILD/DEBUG workflows across all projects.**
