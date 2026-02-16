# REQ-BLOCKING-FIXES-B1-B4

**Status:** Draft  
**Created:** 2026-02-15  
**Author:** Analyst (ID: analyst_47a3)  
**Architecture Review Reference:** `docs/ARCHITECTURE_REVIEW_OPENSPACE.md`  
**Priority:** BLOCKING  

---

## Overview

This requirements document addresses four blocking issues identified in the comprehensive architecture review of OpenSpace (`REVIEW-OPENSPACE-FULL`). These issues must be resolved before the codebase can be considered production-ready:

- **B1:** Race condition in TldrawWhiteboard remote updates
- **B2:** Performance issue from JSON.stringify comparison
- **B3:** Console.log pollution in production code
- **B4:** Missing authentication/bind address control on Hub server

All fixes must maintain current test coverage (468 client unit, 135 hub unit, 82 E2E) and TypeScript strict mode (0 errors).

---

## User Stories

### B1: Race Condition Fix

**US-B1-001: Preserve Local Edits During Remote Updates**  
As a user editing a whiteboard while another user makes changes,  
I want my edits to be preserved even if they occur during a remote update,  
So that I never lose work due to timing conflicts.

### B2: Performance Fix

**US-B2-001: Smooth Canvas Interaction**  
As a user dragging shapes on a large whiteboard diagram,  
I want the canvas to remain responsive without jank,  
So that I can work efficiently on complex diagrams.

### B3: Logging Fix

**US-B3-001: Clean Production Console**  
As a user running OpenSpace in production,  
I want a clean browser console without debug spam,  
So that I can see only relevant errors and warnings.

**US-B3-002: Development-Only Debug Logs**  
As a developer debugging whiteboard issues,  
I want detailed logging available in development mode,  
So that I can diagnose issues without polluting production.

### B4: Security Fix

**US-B4-001: Control Hub Network Exposure**  
As a system administrator deploying OpenSpace,  
I want to control which network interface the Hub binds to,  
So that I can prevent unauthorized network access to local files.

**US-B4-002: Secure Default Binding**  
As a user running OpenSpace locally,  
I want the Hub to bind only to localhost by default,  
So that my system is not exposed to the network without my knowledge.

---

## Functional Requirements

### B1: Race Condition in TldrawWhiteboard Remote Updates

**Location:** `openspace-client/src/components/whiteboard/TldrawWhiteboard.tsx` (lines 94-96)

**REQ-B1-001: Replace Time-Based Flag with Sequence Counter**  
The system SHALL replace the `setTimeout(100ms)` suppression mechanism with a sequence counter or change tracking mechanism that:
- Distinguishes local changes from remote changes deterministically
- Never drops user edits regardless of timing
- Maintains backward compatibility with the existing `useArtifact` hook

**REQ-B1-002: Change Source Tracking**  
The system SHALL track the source of each change event with one of:
- **Option A (Sequence Counter):** Each local change increments a counter; remote changes include their own sequence number
- **Option B (Change ID):** Each change generates a unique ID; remote changes carry their ID from the server
- **Option C (Source Flag):** Editor state includes a `source: 'local' | 'remote'` flag cleared only after change processing completes

**REQ-B1-003: Zero Data Loss**  
The system SHALL ensure that:
- No user edit is silently dropped during remote updates
- If a conflict occurs (simultaneous edit to the same shape), the local change takes precedence
- Remote changes are applied only to shapes that have not been locally modified since the remote update began

---

### B2: JSON.stringify Performance Issue

**Location:** `openspace-client/src/components/whiteboard/TldrawWhiteboard.tsx` (lines 150-155)

**REQ-B2-001: Remove JSON.stringify Comparison**  
The system SHALL remove the full `JSON.stringify` comparison from the `handleChange` callback:
```typescript
// REMOVE THIS:
if (
  JSON.stringify(prev.nodes) === JSON.stringify(partialDiagram.nodes) &&
  JSON.stringify(prev.edges) === JSON.stringify(partialDiagram.edges)
) {
  return prev;
}
```

**REQ-B2-002: Rely on Debounced Auto-Save**  
The system SHALL:
- Let `useArtifact`'s 1000ms debounce handle Hub save throttling
- Rely on React reconciliation for state update optimization (faster than stringify)
- Trust the existing `isRemoteUpdateRef` flag to prevent update loops

**REQ-B2-003: Performance Validation**  
The fix SHALL be validated by:
- Creating a diagram with 50+ nodes and 30+ edges
- Dragging a shape continuously for 5 seconds
- Measuring frame rate (target: 60fps, minimum: 30fps)
- No increase in Hub write frequency (should remain ~1 write per second during continuous edits)

---

### B3: Console.log Calls in Production

**Location:** Throughout codebase (~40+ in TldrawWhiteboard + tldrawMapper, more in other files)

**REQ-B3-001: Create Development-Only Logging Utility**  
The system SHALL provide a logging utility that:
- Is completely removed from production builds (tree-shakeable)
- Provides namespaced logging (e.g., `createLogger('TldrawWhiteboard')`)
- Supports log levels: `debug`, `info`, `warn`, `error`
- Is enabled only when `import.meta.env.DEV === true`

**Proposed API:**
```typescript
// src/lib/logger.ts
export function createLogger(namespace: string, options?: { enabled?: boolean }): {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

// Usage:
const log = createLogger('TldrawWhiteboard');
log.debug('handleChange processing shapes:', shapes.length);
```

**REQ-B3-002: Replace All console.log Calls in Client Package**  
The system SHALL replace ALL `console.log` calls in `openspace-client/src/` with the logging utility:
- Priority files: `TldrawWhiteboard.tsx`, `tldrawMapper.ts`, `useArtifact.ts`
- Scope: All `.ts` and `.tsx` files in `openspace-client/src/`
- Exception: Keep `console.error` and `console.warn` for actual errors/warnings

**REQ-B3-003: Replace All console.log Calls in Hub Package**  
The system SHALL replace ALL `console.log` calls in `runtime-hub/src/` with structured logging:
- Use the same logger utility (Node.js compatible)
- Format: `[HubServer] <context> <message> <metadata>`
- Keep existing structured logging pattern but replace raw `console.log`

**REQ-B3-004: Update Coding Standards**  
The system SHALL update `CODING_STANDARDS.md` to:
- Add STRICT prohibition on `console.log` in production code
- Require use of the logging utility for all debug output
- Add linting rule to catch violations (ESLint `no-console` with exceptions)

**Proposed CODING_STANDARDS.md Addition:**
```markdown
## 3. Logging Standards (STRICT)

**FORBIDDEN:** Using `console.log()` directly in production code.

**REQUIRED:** Use the logging utility for all debug output:
- **Development:** `createLogger(namespace).debug(message, ...args)`
- **Errors:** `console.error()` for actual errors (production-visible)
- **Warnings:** `console.warn()` for actual warnings (production-visible)

**Tree-Shaking:** The logger MUST be tree-shakeable in production builds.
All debug/info calls MUST be eliminated at build time.

**ESLint Configuration:**
```json
{
  "rules": {
    "no-console": ["error", { "allow": ["warn", "error"] }]
  }
}
```
```

---

### B4: No Hub Authentication

**Location:** `runtime-hub/src/hub-server.ts`

**REQ-B4-001: Add Bind Address Configuration**  
The system SHALL support bind address configuration through multiple sources:
1. **CLI Flag:** `--bind <address>` (highest priority)
2. **Environment Variable:** `HUB_BIND_ADDRESS` (second priority)
3. **Default:** `127.0.0.1` (localhost only)

**REQ-B4-002: Parse CLI Arguments**  
The system SHALL parse CLI arguments in `hub-server.ts`:
```typescript
// Proposed implementation:
function parseBindAddress(): string {
  // Priority 1: CLI flag
  const cliArgIndex = process.argv.indexOf('--bind');
  if (cliArgIndex !== -1 && process.argv[cliArgIndex + 1]) {
    return process.argv[cliArgIndex + 1];
  }
  
  // Priority 2: Environment variable
  if (process.env.HUB_BIND_ADDRESS) {
    return process.env.HUB_BIND_ADDRESS;
  }
  
  // Priority 3: Default
  return '127.0.0.1';
}
```

**REQ-B4-003: Update Hub Server Startup**  
The system SHALL modify `startHubServer()` to:
```typescript
export async function startHubServer(
  port = Number(process.env.HUB_PORT || 3001),
  bindAddress?: string
): Promise<void> {
  const bind = bindAddress ?? parseBindAddress();
  const { app } = createHubApp();
  
  await new Promise<void>((resolve) => {
    app.listen(port, bind, () => {
      console.log(`[HubServer] Internal API listening on ${bind}:${port}`);
      resolve();
    });
  });
}
```

**REQ-B4-004: Validate Bind Address**  
The system SHALL validate the bind address:
- Must be a valid IPv4 address or hostname
- Log a WARNING if binding to `0.0.0.0` (all interfaces)
- Reject invalid addresses with a clear error message

**REQ-B4-005: Document Security Model**  
The system SHALL add documentation to `README.md` and/or `docs/`:
- Security implications of binding to `0.0.0.0`
- How to expose Hub on a network (with warnings)
- Recommendation: Use SSH tunnel or VPN for remote access instead of exposing Hub directly

---

## Non-Functional Requirements

### NFR-001: Performance
- B2 fix MUST NOT introduce new performance bottlenecks
- Whiteboard interactions MUST maintain 30+ FPS on diagrams with 100+ nodes
- Hub save frequency MUST remain at ~1 write/second during continuous edits

### NFR-002: Security
- B4 default binding to `127.0.0.1` MUST prevent accidental network exposure
- CLI flag and env var MUST override default securely (no injection vulnerabilities)

### NFR-003: Maintainability
- B3 logging utility MUST be reusable across all modalities (whiteboard, drawing, presentation, editor, agent)
- Logger MUST be trivial to integrate: max 2 lines per file (import + create)

### NFR-004: Test Coverage
- All fixes MUST maintain or improve current test coverage
- B1 fix MUST include unit tests for race condition scenarios
- B3 fix MUST include tests for tree-shaking in production builds
- B4 fix MUST include tests for bind address priority resolution

### NFR-005: Backward Compatibility
- B1, B2, B3 fixes MUST NOT break existing whiteboard functionality
- B4 fix MUST NOT break existing Hub server API endpoints
- All changes MUST pass existing E2E tests without modification

---

## Acceptance Criteria

### B1: Race Condition Fix

- [ ] `setTimeout(100ms)` removed from `TldrawWhiteboard.tsx`
- [ ] Sequence counter or change tracking mechanism implemented
- [ ] Unit tests added for race condition scenarios:
  - [ ] User edit during remote update is preserved
  - [ ] Simultaneous edits to same shape favor local change
  - [ ] Remote changes applied only to unmodified shapes
- [ ] Manual testing: Two users editing same whiteboard simultaneously with no data loss

### B2: Performance Fix

- [ ] `JSON.stringify` comparison removed from `handleChange`
- [ ] Performance test passes: 50+ node diagram, 5-second drag, 30+ FPS
- [ ] Hub write frequency unchanged (~1 write/second during edits)
- [ ] No increase in memory usage or GC pressure
- [ ] Existing E2E whiteboard tests pass

### B3: Logging Fix

- [ ] Logging utility created at `src/lib/logger.ts`
- [ ] Utility is tree-shakeable (verified by production build size comparison)
- [ ] ALL `console.log` calls replaced in `openspace-client/src/`:
  - [ ] `TldrawWhiteboard.tsx` (~40+ calls)
  - [ ] `tldrawMapper.ts` (~20+ calls)
  - [ ] All other `.ts`/`.tsx` files
- [ ] ALL `console.log` calls replaced in `runtime-hub/src/`
- [ ] `CODING_STANDARDS.md` updated with strict prohibition
- [ ] ESLint rule `no-console` added with `allow: ["warn", "error"]`
- [ ] Production build console is clean (no debug logs)
- [ ] Development mode shows namespaced debug logs

### B4: Security Fix

- [ ] `parseBindAddress()` function implemented with priority: CLI > env > default
- [ ] `startHubServer()` accepts and uses bind address parameter
- [ ] Default bind address is `127.0.0.1`
- [ ] Warning logged when binding to `0.0.0.0`
- [ ] Invalid bind addresses rejected with error
- [ ] Unit tests for bind address priority resolution
- [ ] README or docs updated with security guidance
- [ ] Hub server starts successfully with:
  - [ ] No flags (binds to `127.0.0.1:3001`)
  - [ ] `--bind 0.0.0.0` (binds to all interfaces with warning)
  - [ ] `HUB_BIND_ADDRESS=192.168.1.10` (binds to specific IP)

---

## Scope Boundary

### In Scope

- **B1:** TldrawWhiteboard race condition fix only (does not affect drawing or other modalities)
- **B2:** TldrawWhiteboard performance fix only (other components unaffected)
- **B3:** Console.log removal in BOTH `openspace-client` AND `runtime-hub` packages
- **B4:** Hub server bind address control (does not add authentication)

### Out of Scope

- **Authentication:** B4 does NOT implement authentication (separate feature request)
- **Authorization:** No role-based access control or permissions
- **Encryption:** No TLS/SSL implementation (use reverse proxy if needed)
- **Conflict Resolution UI:** B1 resolves conflicts automatically (local wins), no user-facing conflict UI
- **Performance Profiling:** B2 fix resolves known issue, does not include comprehensive performance audit
- **Logging Infrastructure:** B3 creates utility, does not add log aggregation, monitoring, or alerting
- **Other Modalities:** Fixes are specific to whiteboard (B1, B2) and do not modify drawing, presentation, or editor

---

## Constraints

### Technical Constraints

- **TypeScript Strict Mode:** All fixes MUST compile with 0 TypeScript errors in strict mode
- **Test Coverage:** Current thresholds (60%+) MUST be maintained
- **API Stability:** No breaking changes to existing APIs (Hub endpoints, React hooks, MCP tools)
- **Bundle Size:** B3 logger MUST NOT increase production bundle size (tree-shaking required)

### Operational Constraints

- **Deployment:** Fixes should be deployable independently (no interdependencies between B1-B4)
- **Rollback:** Each fix MUST be revertible without affecting other fixes
- **Documentation:** User-facing changes (B4 CLI flag) MUST be documented before release

### Resource Constraints

- **Effort:** Each fix should be completable in 1-2 development cycles
- **Dependencies:** No new external dependencies without approval (use existing tools where possible)

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **B1:** Sequence counter adds complexity, introduces new bugs | High | Medium | Comprehensive unit tests for race conditions; manual testing with two users; code review by Oracle |
| **B2:** Removing stringify breaks change detection, causes infinite loops | High | Low | Trust existing `isRemoteUpdateRef` flag; validate with performance tests; monitor Hub write frequency |
| **B3:** Logger not tree-shakeable, increases production bundle | Medium | Medium | Verify tree-shaking with build size comparison; use Rollup/Vite analysis tools; test in production mode |
| **B3:** Missed console.log calls in codebase | Low | High | Use grep/ripgrep to find ALL instances; add ESLint rule to prevent future violations |
| **B4:** Binding to wrong interface exposes Hub to network | High | Low | Default to `127.0.0.1`; log warning for `0.0.0.0`; document security implications clearly |
| **B4:** CLI parsing conflicts with other flags | Low | Low | Use standard `--bind` syntax; document flag in `--help` output; test with other CLI flags |

---

## Dependencies

### File Dependencies

| Fix | Primary Files | Secondary Files |
|-----|---------------|-----------------|
| **B1** | `TldrawWhiteboard.tsx` | `useArtifact.ts`, `tldrawMapper.ts` |
| **B2** | `TldrawWhiteboard.tsx` | `useArtifact.ts` |
| **B3** | Create `src/lib/logger.ts` | ALL `.ts`/`.tsx` files in both packages, `CODING_STANDARDS.md`, `eslint.config.js` |
| **B4** | `hub-server.ts` | `README.md`, `docs/` (for security documentation) |

### System Dependencies

- **B1, B2:** Depend on `useArtifact` hook behavior (debounce, SSE sync)
- **B3:** Depends on Vite tree-shaking configuration
- **B4:** Depends on Express `listen()` API (no breaking changes expected)

### Coordination Requirements

- **B1 + B2:** Both modify `TldrawWhiteboard.tsx` — implement together or in strict sequence
- **B3:** Requires coordination between client and Hub packages (use same logger utility)
- **B4:** Independent, can be implemented in parallel with B1-B3

---

## Implementation Order Recommendation

1. **B3 First:** Create logging utility (enables better debugging for B1/B2)
2. **B2 Second:** Remove stringify (simpler fix, validates performance baseline)
3. **B1 Third:** Race condition fix (more complex, benefits from B3 logging)
4. **B4 Fourth:** Hub security (independent, can be done in parallel)

**Rationale:** B3 improves observability for debugging B1/B2. B2 is simpler and validates that React reconciliation works as expected. B1 is most complex and benefits from clean logging. B4 is independent.

---

## Validation Plan

### Unit Tests

- **B1:** Race condition scenarios (3+ test cases)
- **B2:** Performance characteristics (frame rate, write frequency)
- **B3:** Logger tree-shaking, namespace isolation
- **B4:** Bind address priority resolution (4+ test cases)

### Integration Tests

- **B1:** Multi-tab whiteboard sync (use existing E2E framework)
- **B2:** Large diagram interaction (create 50-node fixture)
- **B3:** Production build console verification (manual inspection)
- **B4:** Hub server startup with various configurations (unit tests sufficient)

### E2E Tests

- ALL existing E2E tests MUST pass without modification
- Consider adding E2E test for B1 (multi-user scenario) if feasible with Playwright

### Manual Testing Checklist

- [ ] **B1:** Open same whiteboard in two browser tabs, edit simultaneously, verify no data loss
- [ ] **B2:** Create large diagram (50+ nodes), drag shapes continuously, verify smooth interaction
- [ ] **B3:** Build production bundle, open console, verify no debug logs
- [ ] **B4:** Start Hub with no flags (verify `127.0.0.1`), with `--bind 0.0.0.0` (verify warning), with env var (verify override)

---

## References

- **Architecture Review:** `docs/ARCHITECTURE_REVIEW_OPENSPACE.md`
- **TldrawWhiteboard:** `openspace-client/src/components/whiteboard/TldrawWhiteboard.tsx`
- **Hub Server:** `runtime-hub/src/hub-server.ts`
- **Coding Standards:** `CODING_STANDARDS.md`
- **NSO Instructions:** `/Users/opencode/.config/opencode/nso/instructions.md`
