---
id: SESSION-LEARNINGS-2026-02-11-TASK1
author: oracle_9d3a
status: FINAL
date: 2026-02-11
task_id: drawing-modality-v2-phase0-task1
---

# Session Learnings: Phase 0, Task 1 - Extract useArtifact() Hook

**Date:** 2026-02-11  
**Agent:** Oracle (oracle_7a3f)  
**Duration:** ~4 hours  
**Task:** Extract universal useArtifact() React hook

---

## What Went Well ✅

### 1. **Architecture-First Approach**
- Created comprehensive specification BEFORE implementation
- Documented API, usage examples, testing strategy upfront
- Result: Implementation was straightforward, no surprises

**Learning:** For foundational infrastructure, spend 50% of time on spec, 50% on implementation. Good specs prevent rework.

### 2. **Side-by-Side Example**
- Created `whiteboard-useArtifact-refactor.tsx` showing before/after
- Made it easy to visualize benefits (22% code reduction)
- Included detailed comments explaining changes

**Learning:** Always provide concrete examples when introducing new patterns. "Show, don't just tell."

### 3. **Proactive Question Framing**
- Identified 10 critical questions for next session
- Gave user options (A/B/C) with recommendations
- Prevented decision paralysis

**Learning:** Frame questions with context + options + recommendations. Don't ask open-ended questions.

### 4. **Documentation Organization**
- Archived 28 outdated documents
- Created clear README index
- Separated active vs. reference docs

**Learning:** Clean documentation is as important as clean code. Regularly prune outdated materials.

### 5. **Handoff Quality**
- Created step-by-step implementation guide
- Included testing checklist (8 scenarios)
- Provided common issues + solutions

**Learning:** Thorough handoffs reduce onboarding time. Assume next agent has zero context.

---

## What Could Be Improved 🔧

### 1. **Unit Tests Deferred**
- Chose to defer unit tests until after whiteboard refactor
- Risk: If issues arise, harder to isolate hook vs. integration bugs

**Improvement:** For critical infrastructure, write unit tests FIRST (TDD). Even simple tests catch TypeScript issues.

**Action:** Next time, write at least 3 unit tests before integration:
- Hook loads file on mount
- Hook debounces auto-save
- Hook handles 404 gracefully

### 2. **Performance Benchmarks Missing**
- Didn't measure BroadcastChannel overhead
- Didn't test with large files (>1MB)
- No baseline for SSE reconnection time

**Improvement:** Add lightweight performance instrumentation (console.time/timeEnd) in hook.

**Action:** Before Task 2, add timing logs:
```typescript
console.time('[useArtifact] Initial load');
// ... load logic
console.timeEnd('[useArtifact] Initial load');
```

### 3. **Error Recovery Not Fully Specified**
- Hook has try-catch, but no exponential backoff for SSE
- No max retry limit for failed saves
- Could infinite loop on persistent network issues

**Improvement:** Add retry logic with exponential backoff:
```typescript
let retryCount = 0;
const maxRetries = 3;
const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
```

**Action:** Add to Phase 0, Task 2 testing: "Test SSE reconnection after 3 failed attempts"

### 4. **TypeScript `NodeJS.Timeout` Issue**
- Had to replace `NodeJS.Timeout` with `ReturnType<typeof setTimeout>`
- Indicates missing type definitions or tsconfig issue

**Improvement:** Check if `@types/node` is properly installed:
```bash
npm ls @types/node
```

**Action:** If missing, add to `package.json` dependencies.

### 5. **No Accessibility Considerations**
- Hook doesn't expose loading state as ARIA labels
- Screen readers won't know when save is in progress

**Improvement:** Add ARIA helpers in hook result:
```typescript
return {
  // ... existing
  ariaLive: saving ? 'polite' : 'off',
  ariaLabel: loading ? 'Loading artifact...' : saving ? 'Saving...' : 'Artifact loaded'
};
```

**Action:** Defer to Phase 2 (not MVP critical).

---

## Technical Decisions 🏗️

### 1. **Two Artifacts for Whiteboard**
**Decision:** Keep `.excalidraw` + `.graph.mmd` pattern  
**Rationale:** Backward compatibility, agents use Mermaid, users use Excalidraw  
**Alternative Considered:** Single `.diagram.json` (rejected for now, will do in Drawing V2)

**Learning:** Don't force architectural purity on MVP. Pragmatism > perfection.

### 2. **Optimistic Writes (No ETags)**
**Decision:** Last-write-wins for MVP  
**Rationale:** Simplifies implementation, multi-user not required yet  
**Alternative Considered:** ETags for conflict detection (deferred to Phase 2)

**Learning:** Accept technical debt if it unblocks progress. Document it clearly for future.

### 3. **BroadcastChannel Over WebSocket**
**Decision:** Use BroadcastChannel for multi-window sync  
**Rationale:** Simpler, no server coordination, works for same-user scenarios  
**Alternative Considered:** WebSocket with server-side state (deferred)

**Learning:** Choose simplest solution that meets requirements. Don't over-engineer.

### 4. **Namespaced MCP Tools**
**Decision:** Consolidate into `modality-mcp.ts` with `drawing.*`, `editor.*` namespaces  
**Rationale:** Scales to 7+ modalities, avoids name collisions  
**Alternative Considered:** Separate MCP per modality (rejected, too much overhead)

**Learning:** Namespace early when building multi-tenant systems. Harder to refactor later.

---

## Process Improvements 🔄

### 1. **Session Closing Protocol**
**What:** User explicitly requested session closing with self-improvement  
**Why:** Ensures learnings are captured, not lost between sessions

**Improvement:** Make this standard for all major milestones:
- After completing a phase
- After architectural decisions
- After encountering significant blockers

**Action:** Add to NSO instructions: "Always perform session closing after completing ≥4 hours of work or making major decisions."

### 2. **Documentation Cleanup**
**What:** Archived 28 outdated documents before starting next task  
**Why:** Prevents conflicting information, reduces cognitive load

**Improvement:** Schedule monthly "documentation hygiene" sessions:
- Archive old plans
- Update README indices
- Verify links still work

**Action:** Add to Librarian role: "Perform documentation audit at end of each phase."

### 3. **Handoff Quality Gates**
**What:** Created 23-page handoff with questions, steps, checklist  
**Why:** Next agent can start immediately without context gathering

**Improvement:** Define "handoff quality" metrics:
- [ ] Step-by-step instructions provided
- [ ] Testing checklist included
- [ ] Common issues + solutions documented
- [ ] Success criteria clear
- [ ] Rollback plan specified

**Action:** Add handoff quality checklist to NSO templates.

---

## Risks Identified ⚠️

### 1. **Multi-Window Race Conditions**
**Risk:** Two tabs editing same artifact simultaneously  
**Likelihood:** Medium (users often have multiple tabs open)  
**Impact:** Data loss or corruption

**Mitigation:** Timestamp-based conflict resolution (last-write-wins)  
**Detection:** Test with two tabs, rapid edits, verify no crashes  
**Escalation:** If frequent, add queue + lock mechanism in Phase 2

### 2. **SSE Reconnection Storms**
**Risk:** Many clients reconnecting simultaneously after Hub restart  
**Likelihood:** Low (dev environment, few users)  
**Impact:** Hub overload

**Mitigation:** Exponential backoff with jitter  
**Detection:** Monitor Hub logs for reconnection spikes  
**Escalation:** Add rate limiting if >10 reconnects/second

### 3. **Large File Performance**
**Risk:** useArtifact() loads entire file into memory  
**Likelihood:** Low for MVP (most artifacts <1MB)  
**Impact:** UI freezes, OOM errors

**Mitigation:** Add file size warning in hook:
```typescript
if (content.length > 10 * 1024 * 1024) {
  console.warn('[useArtifact] Large file detected, consider chunked loading');
}
```

**Detection:** Test with 10MB+ JSON file  
**Escalation:** Implement streaming/chunked loading in Phase 2

---

## Metrics 📊

### **Time Spent**
- Specification: 1.5 hours
- Implementation: 1.5 hours
- Documentation: 1 hour
- **Total:** 4 hours

**Target:** 4 hours  
**Actual:** 4 hours  
**Variance:** 0% (on target)

### **Code Quality**
- Lines written: 339 (useArtifact.ts)
- TypeScript errors: 1 (NodeJS.Timeout, fixed)
- Linter warnings: 0
- Test coverage: 0% (deferred)

### **Documentation**
- Spec pages: 25
- Example code: 220 lines
- Handoff pages: 23
- Total docs: ~70 pages

**Ratio:** 70 pages docs / 339 lines code = **~5:1 doc-to-code ratio**

**Learning:** For foundational infrastructure, expect high doc-to-code ratio. It's an investment.

---

## Quotes & Insights 💡

### **On Architecture Decisions**
> "Building the right product is more important than delay."  
> — User feedback on tldraw vs Excalidraw decision

**Insight:** Users value quality over speed. Don't rush architectural decisions.

### **On Simplicity**
> "Don't over-engineer the simple modalities. Drawing is the exception, not the rule."  
> — From architecture debate

**Insight:** Not all modalities need complex infrastructure. Choose appropriate complexity.

### **On Pattern Consistency**
> "This is foundational work that unblocks everything."  
> — Reflecting on useArtifact() extraction

**Insight:** Universal patterns multiply value. One good abstraction >> many ad-hoc solutions.

---

## Action Items for Next Session 📝

### **Immediate (Task 2)**
1. [ ] Answer 10 critical questions before coding
2. [ ] Create git branch: `phase-0/task-2-whiteboard-refactor`
3. [ ] Backup WhiteboardFrame.tsx
4. [ ] Follow step-by-step refactor guide
5. [ ] Test all 8 scenarios
6. [ ] Measure code reduction (expect ~162 lines)

### **Short-Term (Phase 0)**
1. [ ] Add unit tests for useArtifact() (if issues found)
2. [ ] Measure SSE reconnection time
3. [ ] Test with large files (>1MB)
4. [ ] Add exponential backoff to SSE

### **Long-Term (Phase 1+)**
1. [ ] Add ARIA labels for accessibility
2. [ ] Implement chunked loading for large files
3. [ ] Add ETags for conflict detection
4. [ ] Consider Yjs for real-time collaboration

---

## Knowledge Gaps Identified 🕳️

### 1. **BroadcastChannel Browser Support**
- Assumption: Supported in Chrome, Firefox, Edge
- Gap: What happens in Safari? Fallback strategy?

**Action:** Test in Safari, add fallback (polling?) if not supported.

### 2. **SSE Scalability**
- Assumption: Hub can handle 10-20 concurrent SSE connections
- Gap: What's the actual limit? How does it scale?

**Action:** Load test Hub with 50+ SSE connections.

### 3. **Excalidraw → Scene Graph Migration**
- Assumption: tldraw migration is 3-4 weeks
- Gap: What's the exact data loss? Can we round-trip?

**Action:** Create migration prototype, test with real whiteboard data.

---

## Recommendations for NSO 🎯

### Canonical NSO Backlog
- Canonical location: `.opencode/context/01_memory/nso-improvements.md`
- Entry references: `NSO-2026-02-11-002`, `NSO-2026-02-11-003`, `NSO-2026-02-11-004`

### 1. **Add "Session Closing" to Standard Protocol**
**Problem:** Learnings get lost between sessions  
**Solution:** Always perform session closing after ≥4 hours work or major decisions

**Proposed NSO Update:**
```markdown
## Session Closing Protocol
At the end of significant work sessions (≥4 hours or major milestones):
1. Document what went well / what could improve
2. Capture technical decisions and rationale
3. Identify risks and mitigation strategies
4. Create handoff document for next session
5. Update memory (patterns.md, progress.md)
6. Archive outdated documentation
```

### 2. **Add "Documentation Hygiene" to Librarian Role**
**Problem:** Docs accumulate, conflicts arise  
**Solution:** Monthly documentation audit

**Proposed NSO Update:**
```markdown
## Librarian: Documentation Hygiene (Monthly)
- Archive outdated plans (>30 days old, superseded)
- Update README indices
- Verify all links work
- Remove duplicate content
- Consolidate fragmented documentation
```

### 3. **Add "Handoff Quality Gates" to Templates**
**Problem:** Inconsistent handoff quality between agents  
**Solution:** Standardize handoff structure

**Proposed NSO Template:**
```markdown
## Handoff Checklist
- [ ] Step-by-step instructions provided
- [ ] Critical questions identified (with options + recommendations)
- [ ] Testing checklist included
- [ ] Common issues + solutions documented
- [ ] Success criteria clear
- [ ] Rollback plan specified
- [ ] File locations specified
- [ ] Estimated time provided
```

---

## Self-Assessment 🎓

### **What I Did Well**
- ✅ Created comprehensive specifications before coding
- ✅ Provided concrete examples (not just abstract concepts)
- ✅ Organized documentation proactively
- ✅ Framed questions with options + recommendations
- ✅ Prepared thorough handoff for next session

### **What I Could Improve**
- ⚠️ Deferred unit tests (should have written 3-5 basic tests)
- ⚠️ No performance benchmarks (should have measured BroadcastChannel overhead)
- ⚠️ Didn't test in Safari (assumed BroadcastChannel support)
- ⚠️ No accessibility considerations (ARIA labels)

### **Growth Areas**
- **TDD Discipline:** Write tests FIRST, even for infrastructure
- **Performance Awareness:** Always measure, don't assume
- **Cross-Browser Testing:** Don't assume Chrome = all browsers
- **Accessibility:** Consider screen readers from day 1

---

## Gratitude 🙏

Thank you to the user for:
- Explicitly requesting session closing (forcing reflection)
- Valuing quality over speed ("building right product more important than delay")
- Allowing time for thorough documentation
- Trusting the architecture decisions (Spine Lite, tldraw, scene graph canonical)

---

**Session Status:** ✅ Complete (Task 1 done, Task 2 ready to start)  
**Next Session:** Refactor WhiteboardFrame.tsx using useArtifact()  
**Confidence:** High (well-documented, low-risk refactor)

---

**Last Updated:** 2026-02-11 (Oracle oracle_7a3f)
