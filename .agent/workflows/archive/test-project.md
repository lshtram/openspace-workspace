---
description: Run all tests including lint, unit tests, and e2e tests. Usage: /test-project
---

1.  **Run Lint & Typecheck**:
    - Execute `npm run lint` from `app/` to run eslint and TypeScript type checking.

2.  **Run Unit Tests**:
    - Execute `npm run test:run` from `app/` to run the complete vitest test suite.

3.  **Run E2E Tests**:
    - Execute `npm run test:e2e` from `app/` to run Chromium-only tests (standard - 38 tests)
    - For full browser coverage (Chromium, Firefox, WebKit), run `npm run test:e2e:all` only on special request (114 tests)

4.  **Report Results**:
    - Summarize the results of all three test runs.
    - If any step fails, indicate which step(s) failed and provide guidance on next steps.
