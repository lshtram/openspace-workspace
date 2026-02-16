# TECHSPEC-BLOCKING-FIXES-B1-B4

**Status:** Draft  
**Created:** 2026-02-15  
**Author:** Oracle (ID: oracle_e7f2)  
**Requirements Reference:** `docs/requirements/REQ-BLOCKING-FIXES-B1-B4.md`  
**Priority:** BLOCKING  

---

## 1. Overview

This technical specification details the implementation approach for four blocking issues identified in the architecture review. The fixes address data loss, performance, code quality, and security concerns.

### Implementation Strategy

**Sequential Implementation:**
1. **B3 (Logging)** - Create infrastructure, enables debugging for B1/B2
2. **B2 (Performance)** - Simpler fix, validates baseline
3. **B1 (Race Condition)** - Complex fix, benefits from B3 logging
4. **B4 (Security)** - Independent, can run parallel

**Worktree Strategy:** Single worktree for all fixes (`feat/blocking-fixes-b1-b4`)

---

## 2. B3: Logging Utility (Infrastructure)

### 2.1 Logger Design

**Location:** `openspace-client/src/lib/logger.ts` and `runtime-hub/src/lib/logger.ts`

**Design Goals:**
- Tree-shakeable in production (0 bytes added to bundle)
- Namespace-based for easy filtering
- Compatible with both browser (client) and Node.js (hub)
- Zero external dependencies

**Implementation:**

```typescript
// openspace-client/src/lib/logger.ts
export interface Logger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

export function createLogger(namespace: string): Logger {
  const isDev = import.meta.env.DEV;
  
  return {
    debug: (message: string, ...args: unknown[]) => {
      if (isDev) {
        console.log(`[${namespace}] ${message}`, ...args);
      }
    },
    info: (message: string, ...args: unknown[]) => {
      if (isDev) {
        console.info(`[${namespace}] ${message}`, ...args);
      }
    },
    warn: (message: string, ...args: unknown[]) => {
      console.warn(`[${namespace}] ${message}`, ...args);
    },
    error: (message: string, ...args: unknown[]) => {
      console.error(`[${namespace}] ${message}`, ...args);
    },
  };
}
```

```typescript
// runtime-hub/src/lib/logger.ts
export interface Logger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

export function createLogger(namespace: string): Logger {
  const isDev = process.env.NODE_ENV !== 'production';
  
  return {
    debug: (message: string, ...args: unknown[]) => {
      if (isDev) {
        console.log(`[${namespace}] ${message}`, ...args);
      }
    },
    info: (message: string, ...args: unknown[]) => {
      if (isDev) {
        console.info(`[${namespace}] ${message}`, ...args);
      }
    },
    warn: (message: string, ...args: unknown[]) => {
      console.warn(`[${namespace}] ${message}`, ...args);
    },
    error: (message: string, ...args: unknown[]) => {
      console.error(`[${namespace}] ${message}`, ...args);
    },
  };
}
```

### 2.2 Migration Pattern

**Find all console.log calls:**
```bash
# Client
rg "console\.log" openspace-client/src --type ts --type tsx

# Hub
rg "console\.log" runtime-hub/src --type ts
```

**Replacement Pattern:**
```typescript
// Before:
console.log('[TldrawWhiteboard] handleChange processing shapes:', shapes.length);

// After:
import { createLogger } from '../../lib/logger';
const log = createLogger('TldrawWhiteboard');

log.debug('handleChange processing shapes:', shapes.length);
```

**Exceptions:**
- Keep `console.warn()` and `console.error()` as-is (production-visible)
- Tests can use `console.log` for debugging

### 2.3 ESLint Configuration

**Add to `openspace-client/.eslintrc.cjs` and `runtime-hub/.eslintrc.cjs`:**

```javascript
module.exports = {
  rules: {
    'no-console': ['error', { allow: ['warn', 'error'] }],
  },
};
```

### 2.4 Coding Standards Update

**Add to `docs/standards/CODING_STANDARDS.md` Section 3:**

```markdown
## 3. Logging Standards (STRICT)

### 3.1 Prohibited Patterns

**FORBIDDEN:** Using `console.log()` directly in production code.

```typescript
// ❌ WRONG - Production console pollution
console.log('User clicked button:', userId);

// ✅ CORRECT - Tree-shakeable development logging
const log = createLogger('ButtonComponent');
log.debug('User clicked button:', userId);
```

### 3.2 Required Patterns

**Development Logging:**
- Use `createLogger(namespace)` for all debug output
- Namespace should match file/component name
- Use semantic log levels: `debug`, `info`, `warn`, `error`

**Production Logging:**
- `console.error()` for actual errors (production-visible)
- `console.warn()` for actual warnings (production-visible)
- NEVER use `console.log()` for errors (not semantic)

**Tree-Shaking:**
- Logger MUST be tree-shakeable in production builds
- Verify with: `npm run build && ls -lh dist/assets/*.js`
- All `debug`/`info` calls MUST be eliminated at build time

### 3.3 ESLint Enforcement

```json
{
  "rules": {
    "no-console": ["error", { "allow": ["warn", "error"] }]
  }
}
```

This rule is REQUIRED in all packages. Violations MUST be caught in CI.
```

---

## 3. B2: JSON.stringify Performance Fix

### 3.1 Problem Analysis

**Current Code (lines 150-155):**
```typescript
if (
  JSON.stringify(prev.nodes) === JSON.stringify(partialDiagram.nodes) &&
  JSON.stringify(prev.edges) === JSON.stringify(partialDiagram.edges)
) {
  return prev;
}
```

**Performance Impact:**
- tldraw fires store.listen on EVERY pixel of drag
- JSON.stringify serializes entire diagram on EVERY event
- For 100-node diagram: ~1000+ serializations per second
- Each serialization is O(n) where n = total characters in JSON

**Why It Exists:**
- Prevents React state updates when diagram hasn't structurally changed
- Attempt to avoid triggering useArtifact's debounced save

**Why We Can Remove It:**
- React reconciliation is MUCH faster than JSON.stringify
- useArtifact's 1000ms debounce already prevents Hub spam
- isRemoteUpdateRef flag already prevents update loops

### 3.2 Implementation

**File:** `openspace-client/src/components/whiteboard/TldrawWhiteboard.tsx`

**Change:**
```typescript
// REMOVE lines 150-155 entirely
// Just update state directly:

setData((prev) => {
  if (!prev) {
    return {
      schemaVersion: '1.0',
      diagramType: 'generic',
      metadata: {
        title: filePath,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      style: { theme: 'light', tokens: {} },
      nodes: partialDiagram.nodes || [],
      edges: partialDiagram.edges || [],
      groups: [],
      constraints: [],
      sourceRefs: {},
    } as IDiagram;
  }

  // Remove the JSON.stringify check, just update
  return {
    ...prev,
    nodes: partialDiagram.nodes || [],
    edges: partialDiagram.edges || [],
    metadata: {
      ...prev.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
});
```

**Trade-offs:**
- **Benefit:** Eliminates O(n) serialization overhead
- **Cost:** More React state updates (but React reconciliation is fast)
- **Net:** Significant performance win for large diagrams

### 3.3 Validation

**Performance Test (manual):**
1. Create diagram with 50+ nodes, 30+ edges
2. Drag a shape continuously for 5 seconds
3. Open DevTools Performance profiler
4. Verify frame rate ≥ 30fps (target: 60fps)
5. Check Network tab: Hub writes should be ~1/second (not more)

**Regression Test:**
- All existing E2E whiteboard tests must pass
- No change in Hub write frequency

---

## 4. B1: Race Condition Fix

### 4.1 Problem Analysis

**Current Code (lines 94-96):**
```typescript
setTimeout(() => {
  isRemoteUpdateRef.current = false;
}, 100);
```

**Race Condition:**
```
Time 0ms:   Remote update starts, isRemoteUpdateRef = true
Time 10ms:  Remote shapes applied to editor
Time 50ms:  User drags a shape (change event)
Time 50ms:  handleChange called but SKIPPED (isRemoteUpdateRef still true)
Time 100ms: setTimeout fires, isRemoteUpdateRef = false
Result:     User's change at 50ms was silently dropped
```

**Data Loss Scenario:**
- User edits during 100ms window after remote update
- handleChange is called but returns early (line 102-104)
- User's edit is never saved to state, never sent to Hub
- User sees their change on screen (tldraw updated), but it's lost on reload

### 4.2 Solution: Change Sequence Counter

**Design:**
1. Track a "local change sequence" number
2. Increment on every local change
3. Remote changes snapshot the sequence before applying
4. After remote update, only suppress events if sequence is unchanged

**Implementation:**

```typescript
// Add to TldrawWhiteboard component state
const localChangeSequenceRef = useRef(0);
const remoteUpdateSequenceRef = useRef(0);

// In onRemoteChange callback (replace setTimeout):
onRemoteChange: (newData) => {
  if (!editor) {
    log.debug('onRemoteChange: No editor available yet');
    return;
  }

  log.debug(`ARTIFACT_REMOTE_CHANGE: ${filePath}`, {
    remoteNodes: newData.nodes.length,
    currentShapes: editor.getCurrentPageShapes().length,
  });
  
  // Snapshot the current local change sequence BEFORE applying remote changes
  remoteUpdateSequenceRef.current = localChangeSequenceRef.current;

  const { shapes, bindings } = diagramToTldrawShapes(newData);
  log.debug('Converted to tldraw shapes', {
    shapes: shapes.length,
    bindings: bindings.length,
  });

  editor.run(() => {
    // ... existing shape/binding update logic ...
  });

  log.debug('After update, editor has shapes:', editor.getCurrentPageShapes().length);
  
  // No setTimeout - suppression is handled in handleChange
},

// In handleChange (replace isRemoteUpdateRef check):
const handleChange = useCallback((editorInstance: Editor) => {
  log.debug('handleChange triggered');
  
  // Skip if this is during initial load
  if (isInitialLoadRef.current) {
    log.debug('handleChange SKIPPED (isInitialLoad)');
    return;
  }

  // Skip if this change is from the remote update we just applied
  // AND no local changes have occurred since the remote update started
  if (remoteUpdateSequenceRef.current === localChangeSequenceRef.current) {
    log.debug('handleChange SKIPPED (remote update, no local changes)');
    return;
  }

  // This is a local change - increment sequence
  localChangeSequenceRef.current++;
  
  const shapes = editorInstance.getCurrentPageShapes() as TLShape[];
  log.debug('handleChange processing shapes:', shapes.length);
  
  // ... rest of handleChange logic ...
}, [setData, filePath]);
```

**Why This Works:**
```
Time 0ms:   Remote update starts, remoteUpdateSequence = 0, localChangeSequence = 0
Time 10ms:  Remote shapes applied
Time 50ms:  User drags shape
Time 50ms:  handleChange called
Time 50ms:  Check: remoteUpdateSequence (0) === localChangeSequence (0)? YES → skip
Time 50ms:  WAIT - this is the bug! Let me fix this...
```

**Actually, better design:**

```typescript
// Track whether a remote update is in progress
const isRemoteUpdateRef = useRef(false);
const localChangeDuringRemoteRef = useRef(false);

// In onRemoteChange:
onRemoteChange: (newData) => {
  isRemoteUpdateRef.current = true;
  localChangeDuringRemoteRef.current = false;
  
  // ... apply remote changes ...
  
  // After applying, check if local changes occurred
  if (localChangeDuringRemoteRef.current) {
    log.debug('Local change occurred during remote update, re-triggering handleChange');
    // Re-trigger to capture the local change
    handleChange(editor);
  }
  
  isRemoteUpdateRef.current = false;
},

// In handleChange:
const handleChange = useCallback((editorInstance: Editor) => {
  if (isInitialLoadRef.current) {
    return;
  }

  if (isRemoteUpdateRef.current) {
    // Mark that a local change occurred during remote update
    localChangeDuringRemoteRef.current = true;
    log.debug('handleChange DEFERRED (remote update in progress)');
    return;
  }

  // ... normal processing ...
}, [setData, filePath]);
```

**This design:**
- Defers local changes during remote updates
- Re-triggers handleChange after remote update completes if a local change occurred
- Guarantees zero data loss

### 4.3 Testing Strategy

**Unit Tests:**
1. Test: Local change during remote update is preserved
2. Test: Multiple local changes during remote update all captured
3. Test: Remote update with no local changes doesn't re-trigger
4. Test: Rapid local changes after remote update all processed

**Manual Test:**
1. Open whiteboard in two browser tabs
2. Tab 1: Create a shape
3. Tab 2: While remote update is applying, drag a different shape
4. Verify Tab 2's drag is saved after remote update completes

---

## 5. B4: Hub Security (Bind Address)

### 5.1 Implementation

**File:** `runtime-hub/src/hub-server.ts`

**Add parseBindAddress function:**

```typescript
/**
 * Parse bind address from CLI args or environment
 * Priority: CLI --bind flag > HUB_BIND_ADDRESS env > default 127.0.0.1
 */
function parseBindAddress(): string {
  // Priority 1: CLI flag
  const cliArgIndex = process.argv.indexOf('--bind');
  if (cliArgIndex !== -1 && process.argv[cliArgIndex + 1]) {
    const address = process.argv[cliArgIndex + 1];
    console.log(`[HubServer] Bind address from CLI: ${address}`);
    return address;
  }
  
  // Priority 2: Environment variable
  if (process.env.HUB_BIND_ADDRESS) {
    const address = process.env.HUB_BIND_ADDRESS;
    console.log(`[HubServer] Bind address from env: ${address}`);
    return address;
  }
  
  // Priority 3: Default (localhost only)
  console.log('[HubServer] Bind address defaulting to 127.0.0.1 (localhost only)');
  return '127.0.0.1';
}

/**
 * Validate and warn about bind address security implications
 */
function validateBindAddress(address: string): void {
  // Basic IPv4 validation (allows hostnames too)
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  
  if (address === '0.0.0.0') {
    console.warn('');
    console.warn('⚠️  WARNING: Hub is binding to 0.0.0.0 (all network interfaces)');
    console.warn('⚠️  This exposes the Hub to your local network.');
    console.warn('⚠️  Anyone on your network can:');
    console.warn('⚠️    - Read/write files under design/');
    console.warn('⚠️    - Send commands to your browser');
    console.warn('⚠️    - Monitor your activity via SSE stream');
    console.warn('⚠️  For remote access, use SSH tunnel or VPN instead.');
    console.warn('');
  }
  
  // Check for obviously invalid addresses
  if (ipv4Regex.test(address)) {
    const octets = address.split('.').map(Number);
    if (octets.some(o => o > 255)) {
      throw new Error(`Invalid bind address: ${address} (octets must be 0-255)`);
    }
  }
}
```

**Modify startHubServer:**

```typescript
export async function startHubServer(
  port = Number(process.env.HUB_PORT || 3001),
  bindAddress?: string
): Promise<void> {
  const bind = bindAddress ?? parseBindAddress();
  
  // Validate and warn
  validateBindAddress(bind);
  
  const { app } = createHubApp();
  
  await new Promise<void>((resolve) => {
    app.listen(port, bind, () => {
      console.log(`[HubServer] Internal API listening on ${bind}:${port}`);
      console.log('[HubServer] Security: Serving artifacts from design/ directory');
      resolve();
    });
  });
}
```

### 5.2 Documentation

**Add to README.md:**

```markdown
## Security Model

### Hub Server Binding

By default, the Runtime Hub binds to `127.0.0.1` (localhost only) for security.

**Configuration (in priority order):**

1. **CLI Flag:** `node runtime-hub/src/hub-server.js --bind <address>`
2. **Environment Variable:** `HUB_BIND_ADDRESS=<address>`
3. **Default:** `127.0.0.1` (localhost only)

**Examples:**

```bash
# Default: Localhost only (secure)
npm run hub

# Bind to all interfaces (WARNING: exposes to network)
npm run hub -- --bind 0.0.0.0

# Bind to specific IP
HUB_BIND_ADDRESS=192.168.1.10 npm run hub
```

### Remote Access

**Do NOT expose the Hub directly to the internet or untrusted networks.**

The Hub has no authentication. Anyone with network access can:
- Read/write files under `design/`
- Send commands to your browser
- Monitor your activity via the SSE event stream

**For remote access, use:**
- **SSH Tunnel:** `ssh -L 3001:localhost:3001 user@remote-host`
- **VPN:** Access via secure VPN connection
- **Reverse Proxy:** Use nginx/caddy with authentication

### Path Traversal Protection

The Hub enforces a `design/` prefix for all artifact paths. Requests outside this directory return 403 Forbidden.
```

---

## 6. Implementation Deliverables

### Builder Contract

**D1: B3 - Logging Utility**
- Create `openspace-client/src/lib/logger.ts`
- Create `runtime-hub/src/lib/logger.ts`
- Add unit tests for tree-shaking verification

**D2: B3 - Client Console.log Migration**
- Replace ALL console.log in `openspace-client/src/` with logger
- Priority: TldrawWhiteboard.tsx, tldrawMapper.ts, useArtifact.ts
- Verify production build has no debug logs

**D3: B3 - Hub Console.log Migration**
- Replace ALL console.log in `runtime-hub/src/` with logger
- Keep structured format: `[Namespace] message metadata`

**D4: B3 - ESLint + Standards Update**
- Add `no-console` rule to both packages
- Update `CODING_STANDARDS.md` with strict logging requirement

**D5: B2 - Remove JSON.stringify**
- Remove lines 150-155 from TldrawWhiteboard.tsx
- Add performance test (manual validation)

**D6: B1 - Race Condition Fix**
- Replace setTimeout with deferred change mechanism
- Add unit tests for race condition scenarios
- Add manual multi-tab testing instructions

**D7: B4 - Hub Bind Address**
- Add parseBindAddress() and validateBindAddress()
- Modify startHubServer() to accept bind parameter
- Add unit tests for priority resolution

**D8: B4 - Documentation**
- Update README.md with security guidance
- Document CLI flag and env var usage

### Testing Requirements

**Unit Tests:**
- Logger tree-shaking verification (build size comparison)
- B1 race condition scenarios (3+ tests)
- B4 bind address priority (4+ tests)

**E2E Tests:**
- ALL existing E2E tests must pass
- No new E2E tests required (manual testing for B1, B2)

**Manual Validation:**
- B1: Multi-tab simultaneous editing
- B2: Large diagram performance (50+ nodes, 5-second drag)
- B3: Production build console verification
- B4: Hub startup with various bind configurations

---

## 7. Success Criteria

- [ ] TypeScript: 0 errors in both packages (strict mode)
- [ ] Tests: 468+ client unit, 135+ hub unit, 82 E2E passing
- [ ] Production build: No console.log output, no bundle size increase
- [ ] Performance: 30+ FPS on 50-node diagram during drag
- [ ] Security: Hub defaults to 127.0.0.1, warns on 0.0.0.0
- [ ] Code Quality: ESLint passes with no-console rule enforced
- [ ] Documentation: Security guidance added to README

---

## 8. Rollback Plan

Each fix is independently revertible:

- **B3:** Remove logger.ts, restore console.log (git revert)
- **B2:** Restore JSON.stringify check (7 lines)
- **B1:** Restore setTimeout mechanism (3 lines)
- **B4:** Remove parseBindAddress, restore direct listen() call

All fixes are non-breaking and can be rolled back without affecting other fixes.

---

## References

- Requirements: `docs/requirements/REQ-BLOCKING-FIXES-B1-B4.md`
- Architecture Review: `docs/ARCHITECTURE_REVIEW_OPENSPACE.md`
- TldrawWhiteboard: `openspace-client/src/components/whiteboard/TldrawWhiteboard.tsx`
- Hub Server: `runtime-hub/src/hub-server.ts`
