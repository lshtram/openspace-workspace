# Prometheus Self-Improvement v2: Universal Agent Profiling Edition

## Executive Summary

**Original Plan**: Expand Prometheus file permissions + self-improvement tools  
**Enhanced Plan (v2)**: PLUS universal profiling system for ALL agents

###Key Addition: Delegation-Based Profiling

**Your insight**: Every `delegate_task` call is a natural profiling hook!

```
delegate_task(explore, "Find patterns...")
  ↓ AUTOMATICALLY LOG:
  - Request: parent=prometheus, subagent=explore, timestamp, prompt
  ↓ Task executes...
  ↓ AUTOMATICALLY LOG:
  - Result: duration, status, tools_used, failures
```

### What This Gives Us

**For Prometheus**:
- Challenge logging (tool failures → `.agents/logs/prometheus_challenges.jsonl`)
- Delegation tracking (which subagents called, performance, failures)
- Integration with universal review system

**For ALL Agents** (Sisyphus, Oracle, Librarian, etc.):
- Same profiling automatically (zero code per agent)
- Weekly performance reviews identify patterns
- Capability gap detection ("Oracle needs LSP caching - timed out 12x")

---

## New Tasks Added

### Task 0: Create `.agents/` Universal Infrastructure
**Wave 0** (before everything else)

**What**: 
- `.agents/config/profiling_directive.md` (guidelines for all agents)
- `.agents/schemas/*.json` (delegation_request, delegation_result, challenge)
- `.agents/logs/` (delegation_requests.jsonl, delegation_results.jsonl, {agent}_challenges.jsonl)
- `.agents/scripts/` (placeholders for Task 13, 14)
- `.agents/docs/` (system documentation)

**Why**: Universal foundation that all agents can log to

### Task 1: Enhanced (Prometheus Hook + Profiling)
**Original**: Expand permissions to docs/requirements/, .agent/, docs/  
**Enhanced**: PLUS log tool failures to `.agents/logs/prometheus_challenges.jsonl`

**Example**: 
- Prometheus tries `Write("src/test.ts")` → BLOCKED
- Hook automatically logs:
  ```jsonl
  {
    "agent": "prometheus",
    "event_type": "tool_failure",
    "tool": "write",
    "path": "src/test.ts",
    "error": "prometheus-md-only blocked",
    "desired_capability": "Write permission for src/"
  }
  ```

### Task 13: Delegation Profiling Hooks
**Wave 4** (after Prometheus tools built)

**What**:
- `.agents/scripts/log_delegation_request.ts` (called before delegate_task)
- `.agents/scripts/log_delegation_result.ts` (called after background_output)
- `.agents/scripts/log_challenge.ts` (reusable helper for any agent)

**Integration**: Wrap delegate_task calls with logging (transparent to user)

### Task 14: Weekly Review Automation
**Wave 5** (final deliverable)

**What**:
- `.agents/scripts/aggregate_performance.ts` (crunch all logs)
- `.agents/scripts/detect_patterns.ts` (identify top failures)
- `.agents/scripts/generate_review.ts` (human-readable report)
- `.agents/docs/UNIVERSAL_PROFILING.md` (system guide)

**Output**: Weekly markdown report like:
```markdown
# Agent Performance Review: 2026-02-05

## Top Failure Patterns
1. **Prometheus Write Blocked** (15 occurrences)
   - Pattern: docs/requirements/ write attempts blocked
   - Recommendation: Execute prometheus-self-improvement.md Task 1

2. **LSP Timeout** (12 occurrences)
   - Pattern: lsp_find_references on files >5000 lines
   - Recommendation: Investigate LSP caching
```

---

## Integration with Original Plan

**Tasks 2-12**: UNCHANGED from original prometheus-self-improvement.md

**New Dependencies**:
- Task 1 now depends on Task 0 (needs `.agents/` infrastructure)
- Task 13 depends on Task 0 (needs schemas + log directories)
- Task 14 depends on Task 13 (needs profiling data)

**New Wave Structure**:
- Wave 0: Universal setup (Task 0)
- Wave 1-3: Original prometheus tasks (with profiling integrated in Task 1)
- Wave 4: Documentation + profiling integration (Tasks 10-13)
- Wave 5: Review automation (Task 14)

---

## How Other Agents Adopt This

**Zero code needed!** Any agent that uses `delegate_task` automatically participates:

1. **Agent calls delegate_task** → Request logged to `.agents/logs/delegation_requests.jsonl`
2. **Task completes** → Result logged to `.agents/logs/delegation_results.jsonl`
3. **Agent encounters tool failure** → Call `.agents/scripts/log_challenge.ts`
4. **Weekly review** → All agents analyzed together

**Example - Sisyphus** (no changes needed):
```typescript
// Sisyphus already does this:
delegate_task(category="quick", ...)

// System automatically logs:
// - parent_agent: "sisyphus"
// - category: "quick"
// - Result with duration, tool success rate
```

---

## Implementation Recommendation

**Option A**: Update existing prometheus-self-improvement.md in-place  
**Option B**: Create new file prometheus-self-improvement-v2.md  
**Option C**: Create separate universal-profiling.md plan, then reference it

**My recommendation**: **Update in-place** - Tasks 0, 13, 14 are small additions, original Tasks 2-12 unchanged.

---

## User Question

**Should I**:
1. **Write the full enhanced plan** (original + 3 new tasks) to `.sisyphus/plans/prometheus-self-improvement-v2.md`?
2. **Just document the additions** (Tasks 0, 13, 14) and let you decide how to integrate?
3. **Create a separate universal-profiling.md** plan that can be referenced by prometheus/librarian/future agents?

I lean toward **Option 1** (complete v2 plan) since the changes are well-integrated. What's your preference?
