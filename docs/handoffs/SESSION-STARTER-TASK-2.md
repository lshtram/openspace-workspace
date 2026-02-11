# 🚀 SESSION STARTER: Phase 0, Task 2 — Refactor WhiteboardFrame

**Copy and paste this into your next session:**

---

## Prompt for Next Session

```
I need to continue Phase 0, Task 2 of the Drawing Modality V2 implementation for OpenSpace.

CONTEXT:
- Task 1 is complete: Universal useArtifact() hook is implemented
- Task 2: Refactor WhiteboardFrame.tsx to use useArtifact()
- Goal: Remove ~80 lines of custom SSE/BroadcastChannel logic
- Timeline: 3-4 hours (refactor + testing)
- Expected: Zero regressions, all features working

CRITICAL FILES TO READ FIRST:
1. /Users/Shared/dev/openspace/docs/handoffs/SESSION-HANDOFF-TASK-2.md (COMPLETE HANDOFF)
2. /Users/Shared/dev/openspace/docs/progress/PHASE-0-PROGRESS-SUMMARY.md (current status)
3. /Users/Shared/dev/openspace/docs/architecture/USE-ARTIFACT-HOOK-SPEC.md (hook API)
4. /Users/Shared/dev/openspace/docs/examples/whiteboard-useArtifact-refactor.tsx (refactor example)

BEFORE YOU START, ASK ME THESE QUESTIONS:
1. Testing approach: Manual testing, E2E tests, or both?
2. Should I write unit tests for useArtifact() now or defer?
3. Rollback strategy: Keep both versions during testing or use git branch?
4. Should I delete useDebouncedSave.ts immediately or keep as backup?
5. Multi-window testing: Manual (two tabs) or automated (Playwright)?
6. SSE testing: Use MCP server or manually edit .mmd files?
7. Hub API: Keep using /artifacts or switch to /files now?
8. Error handling: Keep current behavior (error UI + retry)?
9. Performance testing: Measure before/after or skip?
10. Documentation: Add comments in code or separate doc?

THEN:
- Create git branch: phase-0/task-2-whiteboard-refactor
- Backup current WhiteboardFrame.tsx
- Follow step-by-step guide in SESSION-HANDOFF-TASK-2.md
- Test all 8 scenarios (load, save, multi-window, SSE, etc.)
- Commit with detailed message

DO NOT:
- Skip questions (clarify first!)
- Modify useArtifact.ts (already implemented)
- Change Hub or MCP servers (Tasks 3 & 4)
- Add new features (just refactor existing code)

FILES TO MODIFY:
- openspace-client/src/components/whiteboard/WhiteboardFrame.tsx (refactor)
- openspace-client/src/components/whiteboard/useDebouncedSave.ts (delete after testing)

EXPECTED OUTCOME:
- 162 lines removed (39% reduction)
- All features working (zero regressions)
- Pattern validated for Drawing V2

Let's start by reading the handoff document and answering the 10 questions.
```

---

## Quick Reference

### **Documentation Structure**
```
docs/
├── README.md                          ← Documentation index
├── handoffs/
│   └── SESSION-HANDOFF-TASK-2.md     ← YOU ARE HERE (complete guide)
├── progress/
│   └── PHASE-0-PROGRESS-SUMMARY.md   ← Current status
├── architecture/
│   ├── USE-ARTIFACT-HOOK-SPEC.md     ← Hook API reference
│   └── MODALITY-ARCHITECTURE-DEBATE.md
├── examples/
│   └── whiteboard-useArtifact-refactor.tsx ← Refactor example
└── plans/
    └── PHASE-0-IMPLEMENTATION-PLAN.md ← Full task breakdown
```

### **File Locations**
- **Hook:** `openspace-client/src/hooks/useArtifact.ts` (339 lines, implemented)
- **Target:** `openspace-client/src/components/whiteboard/WhiteboardFrame.tsx` (329 lines, to refactor)
- **Delete:** `openspace-client/src/components/whiteboard/useDebouncedSave.ts` (83 lines, after testing)

### **Testing Checklist**
- [ ] Initial load works
- [ ] Auto-save works (1s debounce)
- [ ] Multi-window sync works
- [ ] Agent updates via SSE work
- [ ] "Send to Agent" button works
- [ ] Diagram type persists
- [ ] Error handling works
- [ ] Reconnection works

### **Success Criteria**
- ✅ 162 lines removed (39%)
- ✅ Zero regressions
- ✅ All 8 tests pass
- ✅ TypeScript compiles
- ✅ Linter passes

---

## Tips for Success

1. **Read handoff document FIRST** — It has step-by-step instructions
2. **Ask questions BEFORE coding** — Clarify approach upfront
3. **Create git branch** — Easy rollback if needed
4. **Test incrementally** — Don't wait until end
5. **Compare with example** — Use whiteboard-useArtifact-refactor.tsx as reference

---

**Estimated Time:** 3-4 hours  
**Difficulty:** Medium (refactor existing code, maintain features)  
**Risk:** Low (can rollback, well-documented pattern)

**Ready to start? Copy the prompt above! 🚀**
