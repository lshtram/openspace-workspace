# Session Handoff: Phase 0, Task 2 — Refactor WhiteboardFrame

**Session Date:** 2026-02-11  
**Prepared By:** Oracle (oracle_7a3f)  
**Next Task:** Phase 0, Task 2 - Refactor WhiteboardFrame to use useArtifact()  
**Estimated Time:** 3-4 hours

---

## 🎯 Mission Statement

Refactor `WhiteboardFrame.tsx` to use the newly created `useArtifact()` hook, removing ~80 lines of custom SSE/BroadcastChannel/debounce logic while maintaining **100% feature parity**.

**Success = Zero regressions + cleaner code + validated pattern for all future modalities.**

---

## 📋 Prerequisites (Already Complete)

✅ **Task 1 Complete:** Universal `useArtifact()` hook implemented  
✅ **Specification:** Complete API documentation  
✅ **Example:** Refactored WhiteboardFrame ready as reference  
✅ **Documentation:** Clean, organized, archived old docs  

---

## 📁 Critical Files You Need

### **Read These First (In Order)**

1. **[Phase 0 Progress Summary](../progress/PHASE-0-PROGRESS-SUMMARY.md)**
   - What we've accomplished
   - Architecture decisions
   - Current status (21% complete)

2. **[useArtifact Hook Spec](../architecture/USE-ARTIFACT-HOOK-SPEC.md)**
   - Complete API reference
   - Usage examples
   - Options and callbacks

3. **[Refactor Example](../examples/whiteboard-useArtifact-refactor.tsx)**
   - Side-by-side comparison (before/after)
   - Shows exactly what to change
   - Includes detailed comments

4. **[Phase 0 Implementation Plan](../plans/PHASE-0-IMPLEMENTATION-PLAN.md)**
   - Full task breakdown
   - Testing strategy
   - Success criteria

### **Files You'll Modify**

1. **`openspace-client/src/components/whiteboard/WhiteboardFrame.tsx`**
   - Current: 329 lines with custom SSE/BC logic
   - Target: ~250 lines using useArtifact()
   - Changes: Replace custom hooks with two useArtifact() calls

2. **`openspace-client/src/components/whiteboard/useDebouncedSave.ts`**
   - Current: 83 lines
   - Target: DELETE (functionality now in useArtifact)
   - Alternative: Keep as backup until testing complete

### **Files You'll Use (Already Implemented)**

1. **`openspace-client/src/hooks/useArtifact.ts`**
   - Universal hook (339 lines)
   - Handles SSE, BroadcastChannel, debouncing automatically
   - DO NOT MODIFY (unless bugs found)

---

## 🔍 What Changed in Phase 0 So Far?

### ✅ Completed: Task 1 — Extract useArtifact() Hook

**What was built:**
- Universal React hook for artifact loading/editing/sync
- Automatic SSE subscription (agent updates)
- Multi-window sync (BroadcastChannel)
- Debounced auto-save (configurable)
- Custom parse/serialize functions
- Complete test strategy

**Key features:**
```typescript
const { data, setData, save, loading, error, connected, saving, reload } = useArtifact<T>(
  filePath,
  {
    parse: (content) => /* transform raw → typed */,
    serialize: (data) => /* transform typed → raw */,
    debounceMs: 1000,
    onRemoteChange: (data, actor) => { /* handle agent updates */ }
  }
);
```

### 📐 Architecture Decisions Made

1. **Two artifacts for Whiteboard** (.excalidraw + .mmd)
   - Keeps backward compatibility
   - Agents work with Mermaid (logical)
   - Users work with Excalidraw (visual)
   - Reconciliation bridges the gap

2. **Optimistic writes** (last-write-wins for MVP)
   - No ETags yet (deferred to Phase 2)
   - Accept rare conflicts for simplicity

3. **BroadcastChannel for multi-window sync**
   - No server coordination needed
   - Timestamp-based conflict resolution

---

## 🚨 Critical Questions for You to Answer

Before starting Task 2, please answer these questions:

### **1. Testing Approach**
**Q:** Should I write E2E tests or rely on manual testing for the refactored whiteboard?

**Options:**
- **A)** Manual testing only (faster, validates features work)
- **B)** E2E tests with Playwright (slower, more comprehensive)
- **C)** Manual testing now, E2E tests later (recommended)

**Recommendation:** Option C — Manual testing to validate refactor, E2E tests in Task 4 once Hub/MCP are consolidated.

---

### **2. Unit Tests for useArtifact()**
**Q:** Should I write unit tests for the `useArtifact()` hook now or defer?

**Options:**
- **A)** Write unit tests now (validates hook behavior in isolation)
- **B)** Defer until after whiteboard refactor (validates API first)
- **C)** Skip unit tests, rely on integration tests

**Recommendation:** Option B — The whiteboard refactor will validate the API. Unit tests can follow if issues arise.

---

### **3. Rollback Strategy**
**Q:** If the refactor introduces regressions, should I:

**Options:**
- **A)** Keep both versions (WhiteboardFrame.tsx + WhiteboardFrameV2.tsx) during testing
- **B)** Create git branch, revert if issues arise
- **C)** Replace immediately, fix issues incrementally

**Recommendation:** Option B — Create branch `phase-0/task-2-whiteboard-refactor`, test thoroughly, merge when validated.

---

### **4. Handling useDebouncedSave**
**Q:** Should I delete `useDebouncedSave.ts` immediately or keep as backup?

**Options:**
- **A)** Delete immediately (clean break)
- **B)** Keep until whiteboard testing complete
- **C)** Move to archive directory

**Recommendation:** Option B — Keep until all tests pass, then delete in same commit.

---

### **5. Multi-Window Testing**
**Q:** How should I test multi-window sync?

**Options:**
- **A)** Open two browser tabs manually, edit in one, verify update in other
- **B)** Write automated test with two Playwright contexts
- **C)** Skip (trust BroadcastChannel implementation)

**Recommendation:** Option A — Manual test with two tabs is fastest and validates the feature.

---

### **6. SSE Testing**
**Q:** How should I test agent updates via SSE?

**Options:**
- **A)** Use MCP server to call `whiteboard.update`, verify UI update
- **B)** Manually edit .graph.mmd file on disk, verify UI update
- **C)** Mock SSE events in test

**Recommendation:** Option A — Use real MCP flow (most realistic). Option B as backup if MCP not working.

---

### **7. Breaking Changes in Hub API**
**Q:** Task 3 adds `/files/:path` endpoint. Should I:

**Options:**
- **A)** Update useArtifact() now to use `/files` (breaks current Hub)
- **B)** Keep using `/artifacts` for now (backward compatible)
- **C)** Make Hub changes first, then refactor whiteboard

**Recommendation:** Option B — Keep `/artifacts` for now. Task 3 will add `/files` as alias.

---

### **8. Error Handling**
**Q:** If whiteboard load fails (404, parse error, etc.), should I:

**Options:**
- **A)** Show error UI with retry button (current behavior)
- **B)** Fall back to empty whiteboard (create new)
- **C)** Show toast + log error, keep loading spinner

**Recommendation:** Option A — Keep current behavior (error UI + retry).

---

### **9. Performance Testing**
**Q:** Should I measure performance before/after refactor?

**Options:**
- **A)** Use Chrome DevTools to measure load time, save time
- **B)** Add console.time() logs
- **C)** Skip (refactor shouldn't affect performance)

**Recommendation:** Option C — No expected performance impact. Only measure if regressions suspected.

---

### **10. Documentation Updates**
**Q:** After refactoring, should I:

**Options:**
- **A)** Update WhiteboardFrame.tsx with comments explaining useArtifact()
- **B)** Create separate doc explaining the pattern
- **C)** No documentation needed (code is self-explanatory)

**Recommendation:** Option A — Add brief comments in code pointing to useArtifact spec.

---

## 🛠️ Step-by-Step Implementation Guide

### **Phase 1: Preparation (15 minutes)**

1. **Create git branch:**
   ```bash
   git checkout -b phase-0/task-2-whiteboard-refactor
   ```

2. **Read the example:**
   - Open `docs/examples/whiteboard-useArtifact-refactor.tsx`
   - Compare with current `WhiteboardFrame.tsx`
   - Understand what's being replaced

3. **Verify useArtifact() exists:**
   ```bash
   ls openspace-client/src/hooks/useArtifact.ts
   ```

4. **Backup current implementation:**
   ```bash
   cp openspace-client/src/components/whiteboard/WhiteboardFrame.tsx \
      openspace-client/src/components/whiteboard/WhiteboardFrame.backup.tsx
   ```

---

### **Phase 2: Refactor Code (1-2 hours)**

#### **Step 1: Import useArtifact**
```typescript
import { useArtifact } from '../../hooks/useArtifact';
```

#### **Step 2: Remove old state/refs**
Delete:
- `versionRef`
- `channelRef`
- `eventSourceRef`
- Custom SSE setup logic
- Custom BroadcastChannel setup logic

#### **Step 3: Add useArtifact for .excalidraw file**
```typescript
const {
  data: excalidrawData,
  setData: setExcalidrawData,
  loading: loadingExcalidraw,
  error: errorExcalidraw,
  connected: connectedExcalidraw,
} = useArtifact<ExcalidrawData>(excalidrawPath, {
  parse: (content) => {
    try {
      const json = JSON.parse(content);
      return { elements: json.elements || [] };
    } catch {
      return { elements: [] };
    }
  },
  serialize: (data) => JSON.stringify(data, null, 2),
  debounceMs: 1000,
  onRemoteChange: (data, actor) => {
    if (actor === 'agent' && excalidrawAPI) {
      excalidrawAPI.updateScene({ elements: data.elements });
    }
  },
});
```

#### **Step 4: Add useArtifact for .graph.mmd file**
```typescript
const {
  data: mermaidContent,
  setData: setMermaidContent,
  loading: loadingMermaid,
  error: errorMermaid,
  connected: connectedMermaid,
} = useArtifact<string>(mmdPath, {
  parse: (content) => content,
  serialize: (content) => content,
  debounceMs: 1000,
  onRemoteChange: (mmd, actor) => {
    if (actor === 'agent') {
      // Detect diagram type + reconcile
      const reconciled = reconcileGraph(mmd, excalidrawData?.elements || []);
      if (excalidrawAPI) {
        excalidrawAPI.updateScene({ elements: reconciled });
      }
      setExcalidrawData({ elements: reconciled });
      pushToast({ title: 'Whiteboard updated from Agent', tone: 'info' });
    }
  },
});
```

#### **Step 5: Update onChange handler**
```typescript
const onChange = useCallback((nextElements: readonly any[]) => {
  setExcalidrawData({ elements: nextElements });

  try {
    const mermaidCode = excalidrawToMermaid(nextElements, diagramType);
    setMermaidContent(mermaidCode);
  } catch (err) {
    console.warn('[Whiteboard] Failed to generate Mermaid:', err);
  }
}, [diagramType, setExcalidrawData, setMermaidContent]);
```

#### **Step 6: Simplify loading/error states**
```typescript
const loading = loadingExcalidraw || loadingMermaid;
const error = errorExcalidraw || errorMermaid;
const connected = connectedExcalidraw && connectedMermaid;
```

#### **Step 7: Remove useDebouncedSave**
Delete:
```typescript
import { useDebouncedSave } from './useDebouncedSave';
const { save } = useDebouncedSave(excalidrawPath, mmdPath);
```

#### **Step 8: Clean up unused code**
Remove:
- Manual SSE cleanup
- Manual BroadcastChannel cleanup
- Version tracking logic
- Active context notification (will be added to useArtifact in Task 3)

---

### **Phase 3: Testing (1-2 hours)**

#### **Test 1: Initial Load**
1. Start Hub: `cd runtime-hub && npm start`
2. Start Client: `cd openspace-client && npm run dev`
3. Open whiteboard in browser
4. ✅ Verify: Whiteboard loads existing data
5. ✅ Verify: No console errors

#### **Test 2: Auto-Save**
1. Draw something on canvas
2. Wait 1 second (debounce delay)
3. Check file on disk: `cat design/<filename>.excalidraw`
4. ✅ Verify: File updated with new elements
5. ✅ Verify: .graph.mmd also updated

#### **Test 3: Multi-Window Sync**
1. Open whiteboard in two browser tabs (same URL)
2. Draw in Tab 1
3. ✅ Verify: Tab 2 updates automatically (within 1 second)
4. Draw in Tab 2
5. ✅ Verify: Tab 1 updates automatically

#### **Test 4: Agent Updates (SSE)**
1. Open whiteboard in browser
2. Use OpenCode agent to call `whiteboard.update` with new Mermaid
3. ✅ Verify: UI updates automatically
4. ✅ Verify: Toast notification appears ("Whiteboard updated from Agent")
5. ✅ Verify: Canvas reflects new logic

#### **Test 5: Send to Agent**
1. Draw on canvas
2. Click "Send to Agent" button
3. ✅ Verify: Agent receives Mermaid code + PNG snapshot
4. ✅ Verify: Toast notification appears

#### **Test 6: Diagram Type Persistence**
1. Create sequence diagram
2. Reload page
3. ✅ Verify: Still recognized as sequence diagram (not reverted to flowchart)

#### **Test 7: Error Handling**
1. Delete .graph.mmd file manually
2. Reload page
3. ✅ Verify: Shows error UI with retry button
4. Create file again
5. Click retry
6. ✅ Verify: Loads successfully

#### **Test 8: Reconnection**
1. Open whiteboard
2. Stop Hub server
3. ✅ Verify: Status indicator shows "Offline" (red dot)
4. Restart Hub
5. ✅ Verify: Status indicator shows "Live" (green dot)

---

### **Phase 4: Validation & Cleanup (30 minutes)**

1. **Compare file sizes:**
   ```bash
   wc -l openspace-client/src/components/whiteboard/WhiteboardFrame.backup.tsx
   wc -l openspace-client/src/components/whiteboard/WhiteboardFrame.tsx
   ```
   - Expected: ~80 lines removed

2. **Run linter:**
   ```bash
   cd openspace-client && npm run lint
   ```
   - Fix any errors

3. **Run type check:**
   ```bash
   cd openspace-client && npm run type-check
   ```
   - Fix any TypeScript errors

4. **Delete backup if tests pass:**
   ```bash
   rm openspace-client/src/components/whiteboard/WhiteboardFrame.backup.tsx
   rm openspace-client/src/components/whiteboard/useDebouncedSave.ts
   ```

5. **Commit changes:**
   ```bash
   git add .
   git commit -m "refactor(whiteboard): migrate to useArtifact() hook

   - Replace custom SSE/BroadcastChannel with useArtifact()
   - Remove useDebouncedSave (functionality now in useArtifact)
   - Reduce code by ~80 lines (24% reduction)
   - All features tested and working (draw, save, multi-window, SSE)
   - Zero regressions

   Phase 0, Task 2 complete. Next: Hub API simplification."
   ```

---

## 🚨 Common Issues & Solutions

### **Issue 1: TypeScript errors in useArtifact**
**Symptom:** `Cannot find module '../../hooks/useArtifact'`

**Solution:** Check import path is correct. Hook is at `src/hooks/useArtifact.ts`.

---

### **Issue 2: Multi-window sync not working**
**Symptom:** Changes in one tab don't appear in other tab.

**Solutions:**
- Check BroadcastChannel is supported (Chrome, Firefox, Edge)
- Verify both tabs have same URL (channel name includes filePath)
- Check browser console for errors

---

### **Issue 3: SSE not connecting**
**Symptom:** Status indicator stuck on "Offline" (red dot).

**Solutions:**
- Verify Hub is running on port 3001
- Check `VITE_HUB_URL` environment variable
- Inspect Network tab in DevTools (should see EventSource connection)

---

### **Issue 4: Auto-save not triggering**
**Symptom:** File on disk not updating after edits.

**Solutions:**
- Wait full 1 second (debounce delay)
- Check browser console for errors
- Verify Hub `/artifacts/:path` endpoint is working

---

### **Issue 5: Reconciliation breaks on agent update**
**Symptom:** Canvas scrambles when agent updates Mermaid.

**Solutions:**
- Check `reconcileGraph()` logic
- Verify Mermaid parser handles diagram type
- Ensure `excalidrawData?.elements` fallback works

---

## 📊 Success Criteria

### **Must Have (P0)**
- ✅ Whiteboard loads existing data
- ✅ Auto-save works (1s debounce)
- ✅ Multi-window sync works
- ✅ SSE updates work (agent → Hub → Client)
- ✅ "Send to Agent" button works
- ✅ Diagram type persists across reloads
- ✅ Error handling works (404, parse errors)
- ✅ Code reduced by ~80 lines

### **Nice to Have (P1)**
- [ ] Unit tests for useArtifact()
- [ ] E2E tests for whiteboard flows
- [ ] Performance benchmarks

### **Deferred (P2)**
- ETags for conflict detection
- Operational transforms (Yjs)
- Offline support (IndexedDB)

---

## 📈 Expected Outcomes

### **Code Quality**
- **Before:** 329 lines (WhiteboardFrame) + 83 lines (useDebouncedSave) = **412 lines**
- **After:** ~250 lines (WhiteboardFrame) + 0 lines (deleted) = **250 lines**
- **Reduction:** 162 lines (39%)

### **Maintainability**
- ✅ Single pattern for all modalities
- ✅ Less custom logic to debug
- ✅ Type-safe with generics
- ✅ Testable (mock useArtifact)

### **Features**
- ✅ All existing features work
- ✅ Zero regressions
- ✅ Foundation for Drawing V2

---

## 🔗 Quick Links

### **Documentation**
- [Phase 0 Progress Summary](../progress/PHASE-0-PROGRESS-SUMMARY.md)
- [useArtifact Hook Spec](../architecture/USE-ARTIFACT-HOOK-SPEC.md)
- [Refactor Example](../examples/whiteboard-useArtifact-refactor.tsx)
- [Phase 0 Implementation Plan](../plans/PHASE-0-IMPLEMENTATION-PLAN.md)

### **Code**
- `openspace-client/src/hooks/useArtifact.ts` (already implemented)
- `openspace-client/src/components/whiteboard/WhiteboardFrame.tsx` (to refactor)
- `openspace-client/src/components/whiteboard/useDebouncedSave.ts` (to delete)

### **Reference**
- Current Whiteboard: `WhiteboardFrame.tsx` (329 lines)
- Hub Server: `runtime-hub/src/hub-server.ts`
- MCP Server: `runtime-hub/src/mcp/whiteboard-mcp.ts`

---

## 🎯 Your Mission

**Refactor WhiteboardFrame.tsx to use useArtifact() hook with ZERO regressions.**

**Estimated Time:** 3-4 hours (1-2h refactor + 1-2h testing)

**After this task:** Hub API simplification (Task 3), then MCP consolidation (Task 4).

**Questions?** Ask before starting. Better to clarify now than fix regressions later.

---

**Ready? Let's refactor!** 🚀
