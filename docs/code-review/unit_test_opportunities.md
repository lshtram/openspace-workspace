# Unit Test Opportunities - Reducing E2E Test Burden

**Goal:** Maximize unit test coverage for business logic to reduce expensive E2E tests and improve test execution speed.

**Current State:** Only 2 unit tests (serialize.test.ts, layout-scroll.test.ts)  
**Opportunity:** ~1,800 lines of testable code in `/utils` and `/context` directories

---

## Philosophy: The Testing Pyramid

```
        /\
       /E2E\      ← 30-40 tests (integration, user workflows)
      /------\
     /  Integ \   ← 20-30 tests (component integration)
    /----------\
   /    Unit    \ ← 100-150 tests (business logic, utilities)
  /--------------\
```

**Target Distribution:**
- **Unit Tests:** 60-70% (fast, isolated, many tests)
- **Integration Tests:** 20-30% (component interactions)
- **E2E Tests:** 10-20% (critical user workflows only)

---

## Part 1: High-Value Unit Test Opportunities

### 🔥 Tier 1: Pure Functions (Highest ROI)

These are pure functions with no side effects - perfect for unit testing:

#### `/utils/prompt.ts` - Prompt Parsing (204 lines)
**Current Coverage:** None  
**Test Value:** 🔥🔥🔥 (Critical business logic)

**Recommended Tests (20 tests):**
```typescript
describe('extractPromptFromParts', () => {
  // Basic extraction
  ✅ extracts plain text from text part
  ✅ extracts empty string when no text part exists
  ✅ extracts longest text part when multiple exist
  
  // File mentions
  ✅ extracts @file mention with correct path
  ✅ extracts @file mention with selection (line range)
  ✅ converts absolute path to relative path
  ✅ handles @file with query parameters (?start=10&end=20)
  ✅ handles multiple @file mentions in correct order
  ✅ handles @file with no source text (data URL)
  ✅ handles @file with invalid start/end positions
  
  // Agent mentions
  ✅ extracts @agent mention with name
  ✅ handles multiple @agent mentions
  
  // Image attachments
  ✅ extracts image from data URL
  ✅ uses custom attachment name if provided
  ✅ uses default attachment name if not provided
  
  // Edge cases
  ✅ handles text with special characters (emoji, unicode)
  ✅ handles mismatched inline positions (start > text.length)
  ✅ handles inline values not found in text (search fallback)
  ✅ handles overlapping inline elements (sorts by position)
  ✅ preserves content position tracking (start/end)
})

describe('selectionFromFileUrl', () => {
  ✅ parses selection from query params
  ✅ returns undefined if no query params
  ✅ returns undefined if params are invalid
  ✅ sets startChar/endChar to 0
})

describe('textPartValue', () => {
  ✅ returns longest non-synthetic text part
  ✅ filters out synthetic parts
  ✅ filters out ignored parts
  ✅ returns undefined if no valid parts
})
```

---

#### `/utils/same.ts` - Array Equality (7 lines)
**Current Coverage:** None  
**Test Value:** 🔥 (Simple but critical utility)

**Recommended Tests (6 tests):**
```typescript
describe('same', () => {
  ✅ returns true for identical arrays
  ✅ returns true for same reference
  ✅ returns false for different lengths
  ✅ returns false for different elements
  ✅ returns false if one is undefined
  ✅ handles empty arrays correctly
})
```

---

#### `/utils/id.ts` - ID Generation (100 lines)
**Current Coverage:** None  
**Test Value:** 🔥🔥🔥 (Critical for data integrity)

**Recommended Tests (15 tests):**
```typescript
describe('Identifier.ascending', () => {
  ✅ generates ID with correct prefix (ses_, msg_, etc.)
  ✅ generates ID with correct length (26 chars)
  ✅ includes timestamp in ID
  ✅ increments counter for same timestamp
  ✅ resets counter when timestamp changes
  ✅ returns given ID if already has prefix
  ✅ throws error if given ID has wrong prefix
  ✅ generates sortable IDs (ascending order)
})

describe('Identifier.descending', () => {
  ✅ generates descending sortable IDs
  ✅ uses bitwise NOT for descending order
})

describe('Identifier.schema', () => {
  ✅ creates Zod schema with correct prefix validation
})

// Internal function tests
describe('bytesToHex', () => {
  ✅ converts bytes to hex string with padding
})

describe('randomBase62', () => {
  ✅ generates string of correct length
  ✅ uses only base62 characters (0-9, A-Z, a-z)
  ✅ uses crypto.getRandomValues if available
  ✅ falls back to Math.random if crypto unavailable
})
```

---

#### `/utils/base64.ts` - Base64 Decode (11 lines)
**Current Coverage:** None  
**Test Value:** 🔥 (Error handling critical)

**Recommended Tests (3 tests):**
```typescript
describe('decode64', () => {
  ✅ decodes valid base64 string
  ✅ returns undefined for invalid base64
  ✅ returns undefined for undefined input
})
```

---

#### `/utils/persist.ts` - Persistence Logic (452 lines)
**Current Coverage:** None  
**Test Value:** 🔥🔥🔥 (Complex, critical for data integrity)

**Recommended Tests (30 tests):**
```typescript
describe('localStorage quota handling', () => {
  ✅ detects QuotaExceededError by name
  ✅ detects QuotaExceededError by code (22, 1014)
  ✅ detects NS_ERROR_DOM_QUOTA_REACHED
  ✅ detects QUOTA_EXCEEDED_ERR
  ✅ returns false for non-quota errors
})

describe('evict', () => {
  ✅ removes largest items first when quota exceeded
  ✅ skips items without LOCAL_PREFIX
  ✅ skips the keep key
  ✅ stops evicting when write succeeds
  ✅ returns false if eviction fails to free space
})

describe('write', () => {
  ✅ writes to storage directly if space available
  ✅ removes and retries if write fails
  ✅ evicts items if removal doesn't help
  ✅ caches value even if localStorage fails
  ✅ throws non-quota errors
})

describe('cache management', () => {
  ✅ caches up to CACHE_MAX_ENTRIES (500)
  ✅ caches up to CACHE_MAX_BYTES (8MB)
  ✅ prunes oldest entries when cache full
  ✅ skips caching values larger than max bytes
  ✅ updates cache on hit (LRU behavior)
})

describe('merge', () => {
  ✅ merges objects deeply
  ✅ preserves arrays from value (no merge)
  ✅ returns defaults if value is undefined
  ✅ returns null if value is null
  ✅ handles nested objects
  ✅ adds new keys from value to defaults
  ✅ returns value for primitive types
})

describe('Persist.global', () => {
  ✅ returns target with GLOBAL_STORAGE
  ✅ includes legacy keys if provided
})

describe('Persist.workspace', () => {
  ✅ generates storage key with checksum
  ✅ prefixes key with "workspace:"
})

describe('Persist.session', () => {
  ✅ includes session ID in key
  ✅ prefixes key with "session:"
})

describe('Persist.scoped', () => {
  ✅ uses session storage if session provided
  ✅ uses workspace storage if no session
})
```

---

#### `/utils/worktree.ts`, `/utils/agent.ts`, `/utils/perf.ts`, `/utils/sound.ts`
**Test Value:** 🔥 (Need to review these files)

**Estimated Tests:** 20-30 additional tests

---

### 🔥 Tier 2: Context Logic (Business Rules)

These contain business logic that can be extracted and tested:

#### `/context/settings.tsx` - Settings Validation & Defaults
**Testable Logic:**
- Default settings object structure
- Setting validation (Zod schemas if used)
- Setting migrations
- Keybind parsing and normalization

**Recommended Tests (15 tests):**
```typescript
describe('settings defaults', () => {
  ✅ has correct default color scheme
  ✅ has correct default theme
  ✅ has correct default font
  ✅ has correct default notification settings
  ✅ has correct default sound settings
})

describe('keybind normalization', () => {
  ✅ normalizes "mod" to platform-specific key
  ✅ lowercases keybind strings
  ✅ validates keybind format
  ✅ detects conflicts
  ✅ handles "none" for unassigned
})

describe('setting migration', () => {
  ✅ migrates from v1 to v2 schema
  ✅ migrates from v2 to v3 schema
  ✅ handles missing fields gracefully
  ✅ preserves unknown fields
  ✅ validates migrated data
})
```

---

#### `/context/models.tsx` - Model Selection Logic
**Testable Logic:**
- Model filtering by capability
- Model sorting
- Default model selection
- Provider availability checking

**Recommended Tests (10 tests):**
```typescript
describe('model filtering', () => {
  ✅ filters models by capability (chat, completion, etc.)
  ✅ filters hidden models
  ✅ filters unavailable models
})

describe('model sorting', () => {
  ✅ sorts by provider, then name
  ✅ puts default model first
})

describe('default model selection', () => {
  ✅ selects first available model
  ✅ fallbacks to any model if preferred unavailable
  ✅ returns null if no models available
})
```

---

#### `/context/sync.tsx` - Message Synchronization
**Testable Logic:**
- Message deduplication
- Message ordering
- Draft message handling

**Recommended Tests (8 tests):**
```typescript
describe('message deduplication', () => {
  ✅ removes duplicate messages by ID
  ✅ keeps latest version of duplicate
})

describe('message ordering', () => {
  ✅ sorts messages by timestamp
  ✅ sorts by ID if timestamps equal
})

describe('draft handling', () => {
  ✅ preserves draft when syncing
  ✅ clears draft on send
  ✅ restores draft on undo
})
```

---

### 🔥 Tier 3: Component Helpers

#### `/addons/serialize.ts` - Terminal Serialization
**Current Coverage:** Comprehensive tests exist but are SKIPPED  
**Action:** **FIX SKIPPED TESTS** (highest priority!)

---

#### `/context/layout-scroll.ts` - Layout Scroll Logic
**Current Coverage:** Has test file but needs review  
**Action:** Review and expand existing tests

---

## Part 2: Integration Test Opportunities

These test component interactions without full browser automation:

### Component Integration (Solid.js Testing Library)

**Tool:** `@solidjs/testing-library` + `@testing-library/user-event`

#### Dialog Components (10 tests)
```typescript
describe('DialogSelectModel', () => {
  ✅ renders model list
  ✅ filters models by search query
  ✅ selects model on click
  ✅ closes on model selection
  ✅ shows "no results" when filter returns empty
  ✅ highlights selected model
  ✅ keyboard navigation (arrow keys)
  ✅ keyboard selection (Enter)
  ✅ keyboard cancel (Escape)
  ✅ focus traps in dialog
})
```

#### Prompt Input Component (15 tests)
```typescript
describe('PromptInput', () => {
  ✅ renders textarea
  ✅ handles text input
  ✅ handles Shift+Enter (newline)
  ✅ handles Enter (submit)
  ✅ shows @mention autocomplete on @
  ✅ inserts @file pill on Tab
  ✅ removes pill on Backspace
  ✅ shows slash command menu on /
  ✅ executes slash command on Enter
  ✅ handles paste (text)
  ✅ handles paste (image)
  ✅ handles drag and drop (file)
  ✅ shows character count
  ✅ disables submit when empty
  ✅ preserves content on blur
})
```

#### File Tree Component (8 tests)
```typescript
describe('FileTree', () => {
  ✅ renders root nodes
  ✅ expands folder on click
  ✅ collapses folder on second click
  ✅ opens file on click
  ✅ shows loading state while fetching
  ✅ shows empty state when no files
  ✅ keyboard navigation
  ✅ filters by search query
})
```

---

## Part 3: Revised Test Strategy

### Before: E2E-Heavy Approach
```
E2E Tests: ~110 (81%)
Unit Tests: ~17 (10%)
Integration: ~15 (9%)
─────────────────────
Total: ~142 tests
Execution Time: ~30-45 minutes
```

### After: Balanced Pyramid Approach
```
E2E Tests: ~40 (20%)          ← Reduced by 70 tests!
Integration: ~50 (25%)        ← Increased by 35 tests
Unit Tests: ~110 (55%)        ← Increased by 93 tests
─────────────────────
Total: ~200 tests
Execution Time: ~10-15 minutes ← 3x faster!
```

---

## Part 4: What to Move from E2E to Unit Tests

### Candidates for Unit Tests (Remove from E2E):

#### ❌ **Remove from E2E** → ✅ **Add to Unit Tests**

1. **Prompt Parsing Logic** (Currently: E2E in prompt.spec.ts)
   - ❌ E2E: Type "@file", verify pill appears
   - ✅ Unit: Test `extractPromptFromParts()` directly

2. **ID Generation** (Currently: Not tested)
   - ✅ Unit: Test `Identifier.ascending()`, `Identifier.descending()`

3. **Settings Persistence** (Currently: E2E in settings.spec.ts)
   - ❌ E2E: Change setting, verify localStorage
   - ✅ Unit: Test `persist()` merge logic, quota handling
   - ✅ Integration: Test settings component updates store

4. **Model Filtering** (Currently: E2E in model-picker.spec.ts)
   - ❌ E2E: Open picker, search, verify results
   - ✅ Unit: Test model filtering function
   - ✅ Integration: Test picker component renders filtered list

5. **Keybind Normalization** (Currently: E2E in settings-keybinds.spec.ts)
   - ❌ E2E: Change keybind, verify it works
   - ✅ Unit: Test keybind parsing, conflict detection
   - ✅ Integration: Test keybind component updates store
   - ✅ E2E: ONE smoke test that keybind triggers action

---

## Part 5: Implementation Roadmap

### Phase 1: Fix Existing Tests (1 week)
- [x] Fix skipped serialize.test.ts
- [x] Review layout-scroll.test.ts
- [x] Add npm script: `npm run test:unit`

### Phase 2: High-Value Unit Tests (2 weeks)
Priority order:
1. `/utils/prompt.ts` (20 tests) - Critical for prompt parsing
2. `/utils/id.ts` (15 tests) - Critical for data integrity
3. `/utils/persist.ts` (30 tests) - Critical for data persistence
4. `/utils/same.ts`, `/utils/base64.ts` (9 tests) - Quick wins

**Total: ~74 unit tests**

### Phase 3: Context Business Logic (2 weeks)
1. Settings validation & defaults (15 tests)
2. Model filtering & selection (10 tests)
3. Message sync logic (8 tests)
4. Other context helpers (20 tests)

**Total: ~53 unit tests**

### Phase 4: Component Integration (2 weeks)
1. Dialog components (10 tests)
2. Prompt input (15 tests)
3. File tree (8 tests)
4. Other components (17 tests)

**Total: ~50 integration tests**

### Phase 5: Streamline E2E Tests (1 week)
- Remove E2E tests now covered by unit/integration
- Keep only critical user workflow E2E tests
- Target: Reduce from ~110 to ~40 E2E tests

---

## Part 6: Updated Test Commands

### New `package.json` scripts:
```json
{
  "scripts": {
    "test": "bun test",
    "test:unit": "bun test src/**/*.test.ts",
    "test:integration": "bun test src/**/*.integration.test.ts",
    "test:e2e": "playwright test",
    "test:all": "bun run test:unit && bun run test:integration && bun run test:e2e",
    "test:watch": "bun test --watch",
    "test:coverage": "bun test --coverage"
  }
}
```

---

## Part 7: Benefits Summary

### Speed Improvements
- **Unit tests:** ~0.1s per test = 11 seconds for 110 tests
- **Integration tests:** ~0.5s per test = 25 seconds for 50 tests
- **E2E tests:** ~5-15s per test = 5-10 minutes for 40 tests
- **Total:** ~6-11 minutes (vs. 30-45 minutes with E2E-heavy approach)

### Developer Experience
- ✅ Run unit tests on every file save (watch mode)
- ✅ Get instant feedback (11s vs. 5min)
- ✅ Debug failures faster (no browser needed)
- ✅ Easier to write (no Playwright setup)
- ✅ More reliable (no flaky browser timing issues)

### CI/CD Benefits
- ✅ Faster PR checks (6min vs. 30min)
- ✅ Run unit tests on every commit
- ✅ Run E2E only on main branch merges
- ✅ Parallel test execution (unit + integration)

### Maintenance Benefits
- ✅ Unit tests rarely break on refactors
- ✅ Clear test failure messages (function-level)
- ✅ Easier to achieve high coverage (>80%)
- ✅ Tests document code behavior

---

## Summary

**Current State:**
- 2 unit tests (1 skipped)
- 30 E2E tests
- ~1,800 lines of untested business logic

**Recommended State:**
- 110 unit tests (pure functions, business logic)
- 50 integration tests (component interactions)
- 40 E2E tests (critical user workflows)
- ~80%+ code coverage

**Key Actions:**
1. ✅ Fix skipped serialize.test.ts
2. ✅ Add 74 high-value unit tests (Phase 2)
3. ✅ Add 53 context logic unit tests (Phase 3)
4. ✅ Add 50 component integration tests (Phase 4)
5. ✅ Reduce E2E tests from 110 to 40 (Phase 5)

**Result:** 3x faster test suite, better coverage, easier maintenance!
