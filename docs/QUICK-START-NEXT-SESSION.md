# 🚀 Quick Start: Next Session (Task 2)

**Goal:** Refactor WhiteboardFrame.tsx to use useArtifact()  
**Time:** 3-4 hours  
**Difficulty:** Medium

---

## Copy This Prompt to Start:

```
I need to continue Phase 0, Task 2 of the Drawing Modality V2 implementation.

Read these files FIRST:
1. /Users/Shared/dev/openspace/docs/handoffs/SESSION-HANDOFF-TASK-2.md
2. /Users/Shared/dev/openspace/docs/examples/whiteboard-useArtifact-refactor.tsx

BEFORE coding, ask me these 10 questions from SESSION-HANDOFF-TASK-2.md.

Then follow the step-by-step guide.
```

---

## File Locations

**Read First:**
- `docs/handoffs/SESSION-HANDOFF-TASK-2.md` (26 pages, complete guide)
- `docs/examples/whiteboard-useArtifact-refactor.tsx` (before/after)

**Modify:**
- `openspace-client/src/components/whiteboard/WhiteboardFrame.tsx`
- `openspace-client/src/components/whiteboard/useDebouncedSave.ts` (delete)

**Reference:**
- `docs/architecture/USE-ARTIFACT-HOOK-SPEC.md` (hook API)
- `openspace-client/src/hooks/useArtifact.ts` (already done)

---

## Testing Checklist

- [ ] Initial load works
- [ ] Auto-save works (1s debounce)
- [ ] Multi-window sync works (two tabs)
- [ ] SSE updates work (agent → UI)
- [ ] "Send to Agent" button works
- [ ] Diagram type persists
- [ ] Error handling works
- [ ] Reconnection works

---

## Expected Results

- **Code reduction:** 162 lines (39%)
- **Regressions:** Zero
- **Time:** 3-4 hours

---

**Start here:** `docs/handoffs/SESSION-HANDOFF-TASK-2.md` 🎯
