---
description: Run complete quality verification suite (lint, typecheck, unit tests, E2E). Usage: /verify
---

# Quality Verification Suite

Run all quality gates in sequence. Each step is a blocker - must pass before proceeding.

## Step 1: Static Analysis

Execute from project root:
```bash
cd app && npm run lint && npm run typecheck && cd ..
```

**Requirements**:
- **0 TypeScript errors** (strict mode enforced)
- **0 ESLint errors** (pre-existing warnings OK)

**If fails**: Fix issues before proceeding

## Step 2: Unit Tests

Execute from project root:
```bash
cd app && npm run test:run && cd ..
```

**Requirements**:
- All tests passing (241 tests)
- No skipped tests

**If fails**: Fix failing tests before proceeding

## Step 3: E2E Tests (Chromium)

Execute from project root:
```bash
cd app && npm run test:e2e && cd ..
```

**Requirements**:
- 36/38 tests passing (2 may skip on rate limits - expected)
- No unexpected failures

**If user requests full browser coverage**:
```bash
cd app && npm run test:e2e:all && cd ..
```
- Runs Chromium, Firefox, WebKit (114 tests, ~10 minutes)

## Step 4: Report Results

Summarize:
- ✅ Lint: X errors
- ✅ TypeScript: X errors  
- ✅ Unit Tests: X/241 passing
- ✅ E2E Tests: X/38 passing (Chromium)

**Overall Status**: [PASS/FAIL]

If any gate fails, provide specific guidance on next steps.

---

**Quick Command** (all gates):
```bash
cd app && npm run lint && npm run typecheck && npm run test:run && npm run test:e2e && cd ..
```
