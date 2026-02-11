# Phase 0 Progress Summary

**Date:** 2026-02-11  
**Session:** Drawing V2 Architecture Implementation  
**Agent:** Oracle (oracle_7a3f)

---

## What We Accomplished Today

### ✅ Task 1: Extract useArtifact() Hook (COMPLETE)

We successfully created a **universal React hook** that provides a consistent interface for loading, editing, and synchronizing artifact files across all modalities.

#### Files Created

1. **`src/hooks/useArtifact.ts`** (339 lines)
   - Comprehensive implementation with TypeScript generics
   - Features:
     - Automatic SSE subscription for agent updates
     - Multi-window sync via BroadcastChannel
     - Debounced auto-save (configurable, default 1000ms)
     - Custom parse/serialize functions
     - Error handling and reconnection logic
     - Manual save + reload methods
     - Loading, error, connected, saving states
     - Callbacks: onRemoteChange, onSaved, onSaveError

2. **`docs/architecture/USE-ARTIFACT-HOOK-SPEC.md`** (25 pages)
   - Complete API specification
   - Usage examples for all modalities (Whiteboard, Editor, Presentation, Drawing V2)
   - Integration requirements for Hub & MCP
   - Testing strategy
   - Migration plan
   - Success criteria
   - Risks & mitigations

3. **`docs/examples/whiteboard-useArtifact-refactor.tsx`** (220 lines)
   - Shows how to refactor WhiteboardFrame.tsx
   - Side-by-side comparison (before/after)
   - 22% code reduction (329 → 250 lines)
   - Demonstrates two-artifact pattern (.excalidraw + .mmd)
   - Detailed comments explaining changes

4. **`docs/plans/PHASE-0-IMPLEMENTATION-PLAN.md`** (23 pages)
   - Comprehensive implementation plan for Phase 0
   - Task breakdown (4 tasks over 5 days)
   - Progress tracker
   - Success criteria
   - Time tracking
   - Design decisions & open questions

---

## Key Design Decisions

### 1. Universal Pattern for All Modalities

The `useArtifact()` hook establishes a **single pattern** for all modalities:

```typescript
const { data, setData, save, loading, error, connected, saving, reload } = useArtifact<T>(
  filePath,
  {
    parse: (content) => /* transform raw content to typed data */,
    serialize: (data) => /* transform typed data back to content */,
    debounceMs: 1000,
    onRemoteChange: (data, actor) => { /* handle agent updates */ }
  }
);
```

**Benefits:**
- Consistent API across Drawing, Editor, Presentation, Voice, Comments, Browser
- Less boilerplate (no custom SSE/BroadcastChannel logic per modality)
- Type-safe (TypeScript generics)
- Testable (mock the hook)
- Maintainable (one place to fix bugs)

### 2. Two Artifacts for Whiteboard

Current whiteboard uses two files:
- `.excalidraw` — Layout data (positions, sizes, colors)
- `.graph.mmd` — Logical data (nodes, edges, Mermaid syntax)

**Decision:** Keep this pattern for backward compatibility.

**Rationale:**
- Agents work with Mermaid (logical, text-based)
- Users work with Excalidraw (visual, layout-based)
- Reconciliation bridges the gap

**Future (Drawing V2):**
- Switch to single `.diagram.json` (scene graph canonical)
- Mermaid becomes import/export adapter

### 3. Optimistic Writes (No Conflict Resolution Yet)

**Decision:** Accept last-write-wins for MVP.

**Deferred to Phase 2:**
- ETags for conflict detection
- Operational transforms (Yjs)
- Write queues

**Rationale:**
- Simplifies MVP
- Multi-user collaboration not required yet
- Most conflicts are same-user (different windows)

### 4. Namespaced MCP Tools

**Decision:** Consolidate all MCP servers into `modality-mcp.ts` with namespaced tools.

**Example:**
```
whiteboard.list
whiteboard.read
whiteboard.update
drawing.inspect_scene
drawing.propose_patch
drawing.apply_patch
editor.read
editor.write
```

**Benefits:**
- One MCP process (less overhead)
- Clear modality ownership
- Scales to 7+ modalities
- No name collisions

---

## Architecture Overview

### Current Flow (Whiteboard)

```
User edits Excalidraw
  ↓
onChange() handler
  ↓
useDebouncedSave()
  ↓
POST /artifacts/.excalidraw (Hub)
  ↓
ArtifactStore.write()
  ↓
EventEmitter.emit('FILE_CHANGED')
  ↓
SSE /events → Client
  ↓
EventSource.onmessage
  ↓
Reload Mermaid + Reconcile
  ↓
Update Excalidraw canvas
```

### New Flow (with useArtifact)

```
User edits Excalidraw
  ↓
setData() from useArtifact()
  ↓
Internal debounce (1000ms)
  ↓
Serialize via opts.serialize
  ↓
POST /artifacts/.excalidraw (Hub)
  ↓
ArtifactStore.write()
  ↓
EventEmitter.emit('FILE_CHANGED')
  ↓
SSE /events → All clients
  ↓
useArtifact() SSE handler
  ↓
Fetch latest content
  ↓
Parse via opts.parse
  ↓
Call opts.onRemoteChange
  ↓
Update state + trigger reconciliation
```

**Differences:**
- ✅ Simplified (fewer custom handlers)
- ✅ Automatic BroadcastChannel sync
- ✅ Reconnection logic built-in
- ✅ Type-safe (generic `useArtifact<T>`)

---

## Next Steps (Phase 0 Remaining)

### Task 2: Refactor WhiteboardFrame (Day 2)
**Goal:** Replace custom logic with `useArtifact()`  
**Time:** 3-4 hours  
**Steps:**
1. Create backup of original WhiteboardFrame.tsx
2. Replace SSE/BroadcastChannel with two `useArtifact()` calls
3. Remove `useDebouncedSave` hook
4. Test all features (draw, save, multi-window, SSE)

### Task 3: Hub API Simplification (Day 3)
**Goal:** Add `/files` endpoint + unified `/context/active`  
**Time:** 2-3 hours  
**Steps:**
1. Add `/files/:path` (alias to `/artifacts`)
2. Add unified `/context/active` endpoint
3. Mark old endpoints as deprecated
4. Update documentation

### Task 4: MCP Consolidation (Day 4-5)
**Goal:** Merge whiteboard-mcp.ts into modality-mcp.ts  
**Time:** 6-8 hours  
**Steps:**
1. Create `modality-mcp.ts` with namespaced tools
2. Migrate whiteboard tools
3. Add shared helper functions
4. Test with OpenCode agent
5. Delete `whiteboard-mcp.ts`

---

## Testing Strategy

### Unit Tests (Task 2)
- `useArtifact` loads file on mount
- `useArtifact` debounces auto-save
- `useArtifact` handles 404 gracefully
- `useArtifact` syncs across windows
- `useArtifact` handles SSE updates
- `useArtifact` prevents save loops

### Integration Tests (Task 3)
- Two browser windows editing same file (multi-window sync)
- Agent updates file via MCP (SSE propagation)
- Network error during save (retry logic)

### E2E Tests (Task 4)
- Full whiteboard workflow (draw → auto-save → agent update → reload)
- MCP tool workflow (agent calls whiteboard.update → Hub → Client)

---

## Timeline

| Phase | Tasks | Duration | Status |
|-------|-------|----------|--------|
| **Phase 0** | Infrastructure Prep | 1 week | 🟡 In Progress (21% complete) |
| ├─ Task 1 | Extract useArtifact() | 1 day | ✅ Done |
| ├─ Task 2 | Refactor Whiteboard | 1 day | ⏳ Pending |
| ├─ Task 3 | Hub Simplification | 0.5 day | ⏳ Pending |
| └─ Task 4 | MCP Consolidation | 1.5 days | ⏳ Pending |
| **Phase 1** | Drawing Foundations | 2 weeks | ⏳ Not Started |
| **Phase 2** | tldraw Integration | 2 weeks | ⏳ Not Started |
| **Phase 3** | Agent Patch Operations | 2 weeks | ⏳ Not Started |
| **Phase 4** | Mermaid Adapters | 1 week | ⏳ Not Started |
| **Phase 5** | Diagram Type Support | 2 weeks/type | ⏳ Not Started |

**Total:** 10-12 weeks  
**Completed:** 1 day (Task 1)  
**Remaining:** 4 days (Phase 0) + 9-11 weeks (Phase 1-5)

---

## Success Metrics

### Phase 0 Success Criteria
- ✅ `useArtifact()` hook implemented
- [ ] Whiteboard refactored with no regressions
- [ ] Multi-window sync works
- [ ] SSE updates work (agent → Hub → Client)
- [ ] Auto-save works (1s debounce)
- [ ] MCP consolidated (one server)
- [ ] All whiteboard MCP tools work

### Drawing V2 Success Criteria (Long-Term)
- Scene graph is canonical (not Mermaid)
- tldraw replaces Excalidraw
- Agent patch operations work (inspect/propose/apply)
- Validation pipeline enforces constraints
- Mermaid import/export works (with fidelity warnings)
- Support 5 diagram types (flowchart, sequence, class, state, ER)

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Multi-window race conditions** | Data loss | Medium | Timestamp-based conflict resolution |
| **SSE reconnection failures** | Missed agent updates | Low | Exponential backoff, visual indicator |
| **MCP config issues** | Tools not available | Medium | Absolute paths, clear error messages |
| **Parse/serialize errors** | Hook crashes | Low | Try-catch, fallback to raw string |
| **Large files (>10MB)** | Slow loading | Low | Defer to P2 (warn user) |

---

## Open Questions

1. **Should we add useArtifact() unit tests now or after whiteboard refactor?**
   - Leaning toward: After refactor (validate API first)

2. **How to handle large files (>10MB)?**
   - Deferred to P2 (not expected for MVP)

3. **Should MCP tools use `/files` or `/artifacts` endpoint?**
   - Keep `/artifacts` for now (avoid breaking changes)

4. **When to remove deprecated endpoints?**
   - Phase 2 (after feature parity team merges)

---

## Resources

### Documentation Created
- [useArtifact Hook Spec](../architecture/USE-ARTIFACT-HOOK-SPEC.md)
- [Refactor Example](../examples/whiteboard-useArtifact-refactor.tsx)
- [Phase 0 Implementation Plan](./PHASE-0-IMPLEMENTATION-PLAN.md)

### Previous Planning Docs
- [Drawing V2 Architecture](../../openspace-client/docs/architecture/drawing-modality-implementation-guide-v2.md)
- [Modality Architecture Debate](../architecture/MODALITY-ARCHITECTURE-DEBATE.md)
- [tldraw vs Excalidraw Comparison](../architecture/TECH-COMPARISON-EXCALIDRAW-TLDRAW.md)

### Code References
- **New:** `openspace-client/src/hooks/useArtifact.ts`
- Current Whiteboard: `openspace-client/src/components/whiteboard/WhiteboardFrame.tsx`
- Current MCP: `runtime-hub/src/mcp/whiteboard-mcp.ts`
- Current Hub: `runtime-hub/src/hub-server.ts`
- ArtifactStore: `runtime-hub/src/services/ArtifactStore.ts`

---

## Parallel Work (Feature Parity Team)

**Reminder:** A separate team is handling feature parity implementation (26 feature gaps, 2.5 weeks).

**Git Coordination:**
- **Our team (Drawing V2):**
  - `openspace-client/src/hooks/` (new)
  - `openspace-client/src/lib/drawing/` (new)
  - `runtime-hub/src/mcp/` (refactor)
  - `runtime-hub/src/hub-server.ts` (minor changes)

- **Feature parity team:**
  - `openspace-client/src/components/` (existing)
  - `openspace-client/src/context/` (existing)
  - `openspace-client/src/styles/` (existing)

**Low risk of conflicts** (different directories).

---

## What to Do Next

### Immediate (Day 2)
1. **Refactor WhiteboardFrame.tsx** using the example in `docs/examples/whiteboard-useArtifact-refactor.tsx`
2. **Test whiteboard functionality** (draw, save, multi-window, SSE)
3. **Document any issues** encountered during refactor

### Then (Day 3)
1. **Simplify Hub API** (add `/files` + unified `/context`)
2. **Update Hub documentation**
3. **Test backward compatibility** (ensure `/artifacts` still works)

### Finally (Day 4-5)
1. **Consolidate MCP servers** into `modality-mcp.ts`
2. **Test with OpenCode agent** (whiteboard.read, whiteboard.update)
3. **Verify SSE propagation** (agent update → Hub → Client)
4. **Delete old MCP server** (whiteboard-mcp.ts)

---

## Questions for Next Session

1. **Should I proceed with Task 2 (refactor whiteboard)?**
   - Or do you want to review the `useArtifact()` implementation first?

2. **Do you want me to create unit tests for `useArtifact()` now?**
   - Or defer until after whiteboard refactor?

3. **Any concerns about the two-artifact pattern for whiteboard?**
   - (.excalidraw + .mmd)

4. **Should we test the refactored whiteboard manually or write E2E tests?**
   - Manual testing faster, E2E tests more comprehensive

5. **When should we notify the feature parity team about Hub API changes?**
   - Before or after implementation?

---

**Status:** Phase 0 is 21% complete (Task 1 done). Ready to proceed with Task 2 (refactor whiteboard) or pause for review.

**Last Updated:** 2026-02-11 (Oracle oracle_7a3f)
