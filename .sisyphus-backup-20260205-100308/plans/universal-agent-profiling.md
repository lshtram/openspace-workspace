# Universal Agent Profiling System

## TL;DR

> **Quick Summary**: Build delegation-based profiling infrastructure enabling ALL agents (Prometheus, Sisyphus, Oracle, Librarian, etc.) to continuously improve through automatic performance tracking, challenge documentation, and weekly reviews.
> 
> **Deliverables**:
> - `.agents/` universal profiling infrastructure
> - Delegation tracking (every `delegate_task` logged automatically)
> - Challenge logging system (agents self-report struggles)
> - Performance aggregation and pattern detection
> - Weekly review automation with actionable insights
> - Integration hooks for Prometheus (extensible to other agents)
> 
> **Estimated Effort**: Medium (3-4 weeks)
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 (infrastructure) → Task 2 (profiling scripts) → Task 3 (review automation)

---

## Context

### Original Request
User requested **universal self-improvement system for all agents**:
- Agents document challenges and performance (profiling directive)
- Periodic review of agent performance to identify improvement opportunities
- **Key insight**: Delegation tracking - every `delegate_task` call is a natural profiling hook
- Profile subagents automatically: request log → execution → result log

### Interview Summary
**Key Discussions**:
- **User insight**: Every `delegate_task` invocation is a profiling opportunity
- **Zero-code adoption**: Any agent using `delegate_task` automatically profiled
- **Weekly reviews**: Aggregate performance across ALL agents, identify patterns
- **Example use case**: "Prometheus blocked 15x writing to docs/ → execute surgical improvements plan"

**Oh-My-OpenCode Infrastructure Found**:
- ✅ Session management tools exist (`session_read`, `session_list`, `session_search`)
- ✅ TodoWrite tool for real-time task tracking
- ✅ Background task management with `delegate_task` and `background_output`
- ❌ No structured tool call failure tracking
- ❌ No performance metrics aggregation
- ❌ No capability gap detection across agents

**Identified Gaps**:
- No systematic way to track agent performance over time
- No pattern detection for recurring failures
- No cross-agent capability gap analysis
- No automated review process

---

## Work Objectives

### Core Objective
Build universal profiling infrastructure enabling ALL agents to continuously improve through delegation-based tracking, challenge documentation, and automated weekly reviews.

### Concrete Deliverables
**Universal (all agents)**:
- `.agents/config/` - profiling_directive.md, review_schedule.json
- `.agents/schemas/` - delegation_request.schema.json, delegation_result.schema.json, challenge.schema.json
- `.agents/logs/` - delegation_requests.jsonl, delegation_results.jsonl, {agent}_challenges.jsonl
- `.agents/scripts/` - log_delegation_request.ts, log_delegation_result.ts, log_challenge.ts
- `.agents/scripts/` - aggregate_performance.ts, detect_patterns.ts, generate_review.ts
- `.agents/docs/` - UNIVERSAL_PROFILING.md, WEEKLY_REVIEW.md

**Prometheus integration** (example - extensible to other agents):
- Hook integration for challenge logging on tool failures
- Delegation wrapper for automatic request/result logging

### Definition of Done
- [ ] Universal profiling system captures delegation requests/results automatically
- [ ] Challenge logging works across agents (verified by test data)
- [ ] Weekly review script aggregates performance across all agents
- [ ] Performance trends tracked (success rates, duration, tool usage)
- [ ] Pattern detection identifies recurring failures (threshold: 5+ occurrences)
- [ ] Profiling has zero performance impact (async logging, no blocking)
- [ ] Documentation complete for agent integration

### Must Have
- **Universal profiling coverage**: Every `delegate_task` call logged (request + result)
- **Delegation-based tracking**: Parent-child agent relationships captured
- **Challenge documentation**: Agents self-report struggles, workarounds, missing capabilities
- **Zero-code adoption**: Agents using `delegate_task` automatically profiled
- **Privacy**: Redact sensitive paths (secrets, tokens, .env) in all logs
- **Performance**: Async logging, no blocking, fail silently on errors
- **Weekly reviews**: Automated report generation with actionable insights

### Must NOT Have (Guardrails)
- **NO full prompt logging** - Only first 200 chars for privacy
- **NO blocking on logging failures** - Fail silently, log error, continue execution
- **NO unbounded log growth** - Rotation policy (archive after 90 days)
- **NO secrets in logs** - Redact file paths containing "secret", "token", "key" in logs
- **NO auto-execution of action items** - Human review required
- **NO performance degradation** - Profiling must be async/non-blocking

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure exists**: NO (building from scratch)
- **Automated tests**: Tests-after (verification scenarios per task)
- **Framework**: Bash commands (file checks, jq validation, script execution)

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

Each task includes specific QA scenarios executed by the agent using:
- **Bash**: File checks, JSON validation (jq), script execution, log inspection

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately - Foundation):
└── Task 1: Create .agents/ universal profiling infrastructure

Wave 2 (After Wave 1 - Profiling Scripts):
├── Task 2: Implement delegation profiling scripts
└── Task 3: Integrate Prometheus with profiling system (example)

Wave 3 (After Wave 2 - Review Automation):
└── Task 4: Create weekly review automation and documentation

Critical Path: Task 1 → Task 2 → Task 4
Parallel Speedup: ~20% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 3, 4 | None (must be first) |
| 2 | 1 | 3, 4 | 3 (partially) |
| 3 | 1, 2 | 4 | None |
| 4 | 1, 2 | None | None |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1 | category="quick" (directory + schema creation) |
| 2 | 2, 3 | category="deep" (logging scripts) + category="unspecified-high" (integration) |
| 3 | 4 | category="deep" (review automation + pattern detection) |

---

## TODOs

- [ ] 1. Create .agents/ universal profiling infrastructure

  **What to do**:
  - Create directory hierarchy:
    - `.agents/config/` - profiling_directive.md (guidelines for all agents), review_schedule.json
    - `.agents/schemas/` - delegation_request.schema.json, delegation_result.schema.json, challenge.schema.json
    - `.agents/logs/` - delegation_requests.jsonl, delegation_results.jsonl, {agent}_challenges.jsonl
    - `.agents/scripts/` - placeholders for profiling scripts (Task 2 implements these)
    - `.agents/docs/` - system documentation placeholder
  - Create `.agents/config/profiling_directive.md`:
    - Guidelines for ALL agents on self-reporting challenges
    - How to use `.agents/scripts/log_challenge.ts` when encountering tool failures
    - Privacy rules: redact sensitive paths
  - Create `.agents/config/review_schedule.json`:
    - Review frequency: weekly
    - Metrics to track: delegation success rate, tool failure rate, avg task duration
  - Create 3 JSON schemas:
    - `delegation_request.schema.json`: parent_agent, subagent_type, category, prompt_summary (200 chars max), timestamp, session_id, request_id
    - `delegation_result.schema.json`: request_id, duration_ms, status (success|failure|timeout), tools_used (array), error_message
    - `challenge.schema.json`: agent, timestamp, event_type (tool_failure|capability_gap|unexpected_behavior), details, desired_capability
  - Add `.gitignore` entry: `.agents/logs/` (privacy - may contain sensitive query data)
  - Create `.agents/README.md` explaining universal profiling system

  **Must NOT do**:
  - Do NOT create actual logging scripts yet (Task 2 handles implementation)
  - Do NOT create per-agent directories (universal infrastructure only)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Directory setup and schema creation, straightforward task
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - All skills lack domain overlap with directory/schema creation

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (must complete first)
  - **Blocks**: Tasks 2, 3, 4 (all depend on this foundation)
  - **Blocked By**: None (first task)

  **References**:
  - **Pattern Reference**: `.librarian/` directory structure (similar agent self-improvement system)
  - **Pattern Reference**: `.prometheus/` directory (similar structure for agent tooling)

  **Acceptance Criteria**:

  ```
  Scenario: Universal directory structure created
    Tool: Bash
    Preconditions: None
    Steps:
      1. ls -la .agents/
      2. Assert: Directory exists (exit code 0)
      3. ls -la .agents/config/ .agents/schemas/ .agents/logs/ .agents/scripts/ .agents/docs/
      4. Assert: All 5 subdirectories exist (exit code 0)
      5. cat .gitignore | grep ".agents/logs/"
      6. Assert: Contains ".agents/logs/" entry
      7. cat .agents/README.md | grep "universal profiling"
      8. Assert: README explains universal profiling system
    Expected Result: Complete directory structure
    Evidence: All directories exist, gitignore updated, README created

  Scenario: JSON schemas valid and complete
    Tool: Bash
    Preconditions: Schemas created
    Steps:
      1. cat .agents/schemas/delegation_request.schema.json | jq '.properties.parent_agent'
      2. Assert: Schema has parent_agent field
      3. cat .agents/schemas/delegation_result.schema.json | jq '.properties.duration_ms'
      4. Assert: Schema has duration_ms field
      5. cat .agents/schemas/challenge.schema.json | jq '.properties.desired_capability'
      6. Assert: Schema has desired_capability field
    Expected Result: All schemas valid JSON
    Evidence: jq parses successfully

  Scenario: Profiling directive created with guidelines
    Tool: Bash
    Preconditions: Config directory exists
    Steps:
      1. cat .agents/config/profiling_directive.md | grep "log_challenge.ts"
      2. Assert: Mentions challenge logging script
      3. cat .agents/config/profiling_directive.md | grep -i "redact"
      4. Assert: Mentions redaction for sensitive data
      5. cat .agents/config/review_schedule.json | jq '.review_frequency'
      6. Assert: Review schedule configured
    Expected Result: Configuration complete
    Evidence: Directive and schedule files exist with content
  ```

  **Commit**: YES
  - Message: `feat(agents): create universal profiling infrastructure for all agents`
  - Files: `.agents/`, `.gitignore`, `.agents/config/*.{md,json}`, `.agents/schemas/*.json`, `.agents/README.md`
  - Pre-commit: `ls -la .agents/config/ .agents/schemas/ .agents/logs/`

---

- [ ] 2. Implement delegation profiling scripts

  **What to do**:
  - Create `.agents/scripts/log_delegation_request.ts`:
    - Takes input: parent_agent, subagent_type, category, prompt (first 200 chars), timestamp, session_id
    - Validates against `.agents/schemas/delegation_request.schema.json`
    - Generates unique request_id (UUID)
    - Appends to `.agents/logs/delegation_requests.jsonl`
    - Returns request_id for correlation with result
  - Create `.agents/scripts/log_delegation_result.ts`:
    - Takes input: request_id (from request log), duration_ms, status, tools_used (array), error_message (if failed)
    - Validates against `.agents/schemas/delegation_result.schema.json`
    - Appends to `.agents/logs/delegation_results.jsonl`
  - Create `.agents/scripts/log_challenge.ts`:
    - Takes input: agent, timestamp, event_type, details, desired_capability
    - Validates against `.agents/schemas/challenge.schema.json`
    - Redacts sensitive paths (containing "secret", "token", "key", ".env")
    - Appends to `.agents/logs/{agent}_challenges.jsonl`
  - All scripts:
    - Accept JSON input via stdin OR command-line args
    - Fail silently on errors (log error to stderr, exit 0)
    - Async/non-blocking (append-only operations)
  - Make runnable:
    - `echo '{"parent_agent":"prometheus","subagent_type":"explore","prompt":"Find patterns..."}' | bun run .agents/scripts/log_delegation_request.ts`
    - `echo '{"request_id":"test-123","duration_ms":5000,"status":"success"}' | bun run .agents/scripts/log_delegation_result.ts`
    - `echo '{"agent":"prometheus","event_type":"tool_failure","tool":"write","details":"blocked"}' | bun run .agents/scripts/log_challenge.ts`

  **Must NOT do**:
  - Do NOT log full prompts (only first 200 chars for privacy)
  - Do NOT block execution on logging failures (fail silently, log error)
  - Do NOT skip redaction for sensitive paths

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Schema validation, async logging, error handling, UUID generation
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - All skills lack domain overlap

  **Parallelization**:
  - **Can Run In Parallel**: YES (partially with Task 3)
  - **Parallel Group**: Wave 2 (with Task 3)
  - **Blocks**: Tasks 3, 4 (integration and review depend on these scripts)
  - **Blocked By**: Task 1 (needs schemas and log directories)

  **References**:
  - **Schema**: `.agents/schemas/*.json` (Task 1)
  - **Logging Pattern**: `.prometheus/scripts/log_file_operation.ts` (if exists - similar JSONL logging)

  **Acceptance Criteria**:

  ```
  Scenario: Log delegation request with schema validation
    Tool: Bash
    Preconditions: Task 1 completed (schemas exist)
    Steps:
      1. echo '{"parent_agent":"prometheus","subagent_type":"explore","category":"deep","prompt":"Find all usages of X in codebase","timestamp":"2026-02-05T10:00:00Z"}' | bun run .agents/scripts/log_delegation_request.ts
      2. Assert: Exit code 0
      3. tail -1 .agents/logs/delegation_requests.jsonl | jq '.parent_agent'
      4. Assert: Output is "prometheus"
      5. tail -1 .agents/logs/delegation_requests.jsonl | jq '.request_id'
      6. Assert: UUID format (36 chars with hyphens)
    Expected Result: Request logged with generated request_id
    Evidence: delegation_requests.jsonl entry

  Scenario: Log delegation result linked to request
    Tool: Bash
    Preconditions: Request logged
    Steps:
      1. REQ_ID=$(tail -1 .agents/logs/delegation_requests.jsonl | jq -r '.request_id')
      2. echo "{\"request_id\":\"$REQ_ID\",\"duration_ms\":3500,\"status\":\"success\",\"tools_used\":[\"lsp_find_references\",\"read\"]}" | bun run .agents/scripts/log_delegation_result.ts
      3. Assert: Exit code 0
      4. tail -1 .agents/logs/delegation_results.jsonl | jq '.request_id'
      5. Assert: Output equals $REQ_ID (correlation works)
    Expected Result: Result linked to request via request_id
    Evidence: delegation_results.jsonl with matching request_id

  Scenario: Log challenge with sensitive path redaction
    Tool: Bash
    Preconditions: Task 1 completed
    Steps:
      1. echo '{"agent":"prometheus","event_type":"tool_failure","tool":"write","details":"Attempted write to .env.secret blocked"}' | bun run .agents/scripts/log_challenge.ts
      2. Assert: Exit code 0
      3. tail -1 .agents/logs/prometheus_challenges.jsonl | jq '.details'
      4. Assert: Does NOT contain ".env.secret" (redacted)
    Expected Result: Sensitive paths redacted in challenge log
    Evidence: Redaction applied

  Scenario: Logging failures do not crash
    Tool: Bash
    Preconditions: Scripts exist
    Steps:
      1. echo 'INVALID JSON' | bun run .agents/scripts/log_delegation_request.ts
      2. Assert: Exit code 0 (fail silently, don't crash)
    Expected Result: Invalid input handled gracefully
    Evidence: Script exits cleanly despite bad input
  ```

  **Commit**: YES
  - Message: `feat(agents): implement delegation profiling and challenge logging scripts`
  - Files: `.agents/scripts/log_delegation_request.ts`, `.agents/scripts/log_delegation_result.ts`, `.agents/scripts/log_challenge.ts`
  - Pre-commit: `echo '{"parent_agent":"test","subagent_type":"explore","prompt":"test"}' | bun run .agents/scripts/log_delegation_request.ts && tail -1 .agents/logs/delegation_requests.jsonl | jq '.'`

---

- [ ] 3. Integrate Prometheus with profiling system (example integration)

  **What to do**:
  - Update `.opencode/hooks/prometheus-md-only/main.ts` (if permissions already expanded):
    - On tool failure (BLOCK), call `.agents/scripts/log_challenge.ts`:
      - Pass: agent="prometheus", event_type="tool_failure", tool="write", path, error message
      - Append to `.agents/logs/prometheus_challenges.jsonl`
      - Example: `echo '{"agent":"prometheus","event_type":"tool_failure","tool":"write","path":"src/test.ts","error":"blocked by prometheus-md-only","desired_capability":"Write permission for src/"}' | bun run .agents/scripts/log_challenge.ts`
  - Add delegation wrapper (optional - demonstrates pattern):
    - In Prometheus system prompt or delegation layer
    - Call `log_delegation_request.ts` BEFORE each `delegate_task`
    - Call `log_delegation_result.ts` AFTER `background_output` completes
    - Make logging transparent (zero user-visible impact)
  - Document integration pattern in `.agents/docs/INTEGRATION.md`:
    - How to add profiling to any agent
    - Hook integration example (Prometheus)
    - Delegation wrapper example
    - Testing integration

  **Must NOT do**:
  - Do NOT modify hook if permissions not yet expanded (depends on surgical improvements plan)
  - Do NOT block agent execution on logging failures

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: System integration, hook modification, careful coordination
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - All skills lack domain overlap

  **Parallelization**:
  - **Can Run In Parallel**: YES (partially - can start while Task 2 completes)
  - **Parallel Group**: Wave 2 (with Task 2)
  - **Blocks**: Task 4 (review needs profiling data)
  - **Blocked By**: Task 1 (needs infrastructure), Task 2 (needs logging scripts)

  **References**:
  - **Hook**: `.opencode/hooks/prometheus-md-only/main.ts`
  - **Logging Scripts**: `.agents/scripts/*.ts` (Task 2)
  - **delegate_task Pattern**: Prometheus system prompt (search for "delegate_task" examples)

  **Acceptance Criteria**:

  ```
  Scenario: Hook logs challenges on tool failures
    Tool: Bash
    Preconditions: Task 1, 2 completed, hook updated
    Steps:
      1. Simulate blocked write: bun run .opencode/hooks/prometheus-md-only/main.ts --path="src/test.ts" --operation="write"
      2. Assert: Exit code 1 (blocked)
      3. tail -1 .agents/logs/prometheus_challenges.jsonl | jq '.agent'
      4. Assert: Output is "prometheus"
      5. tail -1 .agents/logs/prometheus_challenges.jsonl | jq '.event_type'
      6. Assert: Output is "tool_failure"
    Expected Result: Blocked write logged as challenge
    Evidence: Challenge entry in prometheus_challenges.jsonl

  Scenario: Integration documentation created
    Tool: Bash
    Preconditions: Documentation written
    Steps:
      1. cat .agents/docs/INTEGRATION.md | grep "How to add profiling"
      2. Assert: Integration guide exists
      3. cat .agents/docs/INTEGRATION.md | grep "log_challenge.ts"
      4. Assert: Mentions challenge logging usage
    Expected Result: Integration guide complete
    Evidence: Documentation file with examples
  ```

  **Commit**: YES
  - Message: `feat(agents): integrate Prometheus with universal profiling system`
  - Files: `.opencode/hooks/prometheus-md-only/main.ts` (if updated), `.agents/docs/INTEGRATION.md`
  - Pre-commit: `cat .agents/docs/INTEGRATION.md | grep "profiling"`

---

- [ ] 4. Create weekly review automation and documentation

  **What to do**:
  - Create `.agents/scripts/aggregate_performance.ts`:
    - Reads all logs: delegation_requests.jsonl, delegation_results.jsonl, *_challenges.jsonl
    - Calculates metrics:
      - Per-agent delegation success rate (successful / total)
      - Average task duration by subagent type
      - Tool failure frequency (grouped by tool name)
      - Top challenges by frequency
    - Outputs JSON summary to `.agents/audits/performance-{YYYY-MM-DD}.json`
  - Create `.agents/scripts/detect_patterns.ts`:
    - Reads aggregated performance JSON
    - Identifies patterns:
      - Same failure repeated N+ times (pattern threshold: 5)
      - Subagent timeout patterns (duration > 2min repeatedly)
      - Tool success rate drops (compare week-over-week)
    - Outputs pattern analysis to `.agents/audits/patterns-{YYYY-MM-DD}.json`
  - Create `.agents/scripts/generate_review.ts`:
    - Reads performance + patterns JSON
    - Generates human-readable markdown report: `.agents/audits/review-{YYYY-MM-DD}.md`
    - Report sections:
      - **Executive Summary**: Top 3 insights
      - **Top Failure Patterns**: Most frequent issues with recommendations
      - **Performance Trends**: Success rates, duration trends
      - **Capability Gaps**: Derived from challenges (frequency >= 3)
      - **Action Items**: Specific next steps (e.g., "Execute prometheus-surgical-improvements.md")
  - Create `.agents/docs/UNIVERSAL_PROFILING.md`:
    - System overview (delegation-based profiling concept)
    - How to use `log_challenge.ts` from any agent
    - Log schemas explanation
    - Privacy and redaction rules
    - Integration guide for new agents (zero code - just use delegate_task)
  - Create `.agents/docs/WEEKLY_REVIEW.md`:
    - How to run review: `bun run .agents/scripts/generate_review.ts`
    - How to interpret results
    - Sample output with annotations
    - Action item prioritization guide
  - Make runnable:
    - `bun run .agents/scripts/aggregate_performance.ts`
    - `bun run .agents/scripts/detect_patterns.ts`
    - `bun run .agents/scripts/generate_review.ts`

  **Must NOT do**:
  - Do NOT execute action items automatically (human review required)
  - Do NOT skip pattern detection thresholds (require N occurrences to avoid noise)
  - Do NOT generate reports without sufficient data (require minimum 7 days of logs)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex log analysis, pattern detection algorithms, trend calculation
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - All skills lack domain overlap

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (final task)
  - **Blocks**: None (final deliverable)
  - **Blocked By**: Tasks 1, 2 (needs logs and profiling scripts)

  **References**:
  - **Log Data**: `.agents/logs/*.jsonl` (Task 1 schemas, Task 2 data)
  - **Librarian Review**: `.librarian/scripts/analyze_failures.ts` (if exists - similar pattern detection)

  **Acceptance Criteria**:

  ```
  Scenario: Aggregate performance from logs
    Tool: Bash
    Preconditions: Tasks 1, 2 completed, logs have data (seed test data)
    Steps:
      1. # Seed test data
      2. echo '{"parent_agent":"prometheus","subagent_type":"explore","request_id":"r1","timestamp":"2026-02-05T10:00:00Z"}' >> .agents/logs/delegation_requests.jsonl
      3. echo '{"request_id":"r1","duration_ms":3000,"status":"success","tools_used":["read"]}' >> .agents/logs/delegation_results.jsonl
      4. bun run .agents/scripts/aggregate_performance.ts
      5. Assert: Exit code 0
      6. cat .agents/audits/performance-*.json | jq '.metrics.delegation_success_rate'
      7. Assert: Output is between 0 and 100
    Expected Result: Performance metrics aggregated
    Evidence: performance-{date}.json with calculated metrics

  Scenario: Detect failure patterns
    Tool: Bash
    Preconditions: Performance data exists
    Steps:
      1. # Seed repeated failures
      2. for i in {1..6}; do echo "{\"agent\":\"prometheus\",\"event_type\":\"tool_failure\",\"tool\":\"write\",\"details\":\"blocked\",\"timestamp\":\"2026-02-05T0$i:00:00Z\"}" >> .agents/logs/prometheus_challenges.jsonl; done
      3. bun run .agents/scripts/aggregate_performance.ts
      4. bun run .agents/scripts/detect_patterns.ts
      5. Assert: Exit code 0
      6. cat .agents/audits/patterns-*.json | jq '.patterns | length'
      7. Assert: Output > 0 (pattern detected from 6 repeated failures)
    Expected Result: Repeated failure pattern identified
    Evidence: patterns-{date}.json with detected pattern

  Scenario: Generate human-readable review report
    Tool: Bash
    Preconditions: Performance and patterns exist
    Steps:
      1. bun run .agents/scripts/generate_review.ts
      2. Assert: Exit code 0
      3. cat .agents/audits/review-*.md | grep "## Top Failure Patterns"
      4. Assert: Report has failure patterns section
      5. cat .agents/audits/review-*.md | grep "## Action Items"
      6. Assert: Report has action items section
      7. cat .agents/audits/review-*.md | grep -i "prometheus"
      8. Assert: Report mentions agents (contains data)
    Expected Result: Complete review report generated
    Evidence: review-{date}.md with all required sections

  Scenario: Documentation created and comprehensive
    Tool: Bash
    Preconditions: Scripts exist
    Steps:
      1. cat .agents/docs/UNIVERSAL_PROFILING.md | grep "delegation-based profiling"
      2. Assert: Explains profiling concept
      3. cat .agents/docs/WEEKLY_REVIEW.md | grep "generate_review.ts"
      4. Assert: Explains how to run review
      5. cat .agents/docs/UNIVERSAL_PROFILING.md | grep "log_challenge.ts"
      6. Assert: Documents challenge logging usage
    Expected Result: Complete documentation set
    Evidence: 2+ doc files with comprehensive content
  ```

  **Commit**: YES
  - Message: `feat(agents): add weekly review automation with performance analysis and pattern detection`
  - Files: `.agents/scripts/aggregate_performance.ts`, `.agents/scripts/detect_patterns.ts`, `.agents/scripts/generate_review.ts`, `.agents/docs/*.md`
  - Pre-commit: `echo '{"parent_agent":"test","subagent_type":"explore","request_id":"test"}' >> .agents/logs/delegation_requests.jsonl && bun run .agents/scripts/aggregate_performance.ts`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(agents): create universal profiling infrastructure for all agents` | `.agents/`, schemas, config | Directory structure exists |
| 2 | `feat(agents): implement delegation profiling and challenge logging scripts` | `.agents/scripts/*.ts` | Delegation logging works |
| 3 | `feat(agents): integrate Prometheus with universal profiling system` | hook (optional), integration docs | Challenge logged on failure |
| 4 | `feat(agents): add weekly review automation with performance analysis and pattern detection` | scripts, docs | Review report generated |

---

## Success Criteria

### Verification Commands
```bash
# Verify infrastructure
ls -la .agents/config/ .agents/schemas/ .agents/logs/
cat .agents/config/profiling_directive.md | grep "log_challenge"

# Verify delegation profiling
echo '{"parent_agent":"test","subagent_type":"explore","prompt":"test"}' | bun run .agents/scripts/log_delegation_request.ts
tail -1 .agents/logs/delegation_requests.jsonl | jq '.request_id'

# Verify challenge logging
echo '{"agent":"test","event_type":"tool_failure","tool":"write","details":"blocked"}' | bun run .agents/scripts/log_challenge.ts
tail -1 .agents/logs/test_challenges.jsonl | jq '.agent'

# Verify weekly review
bun run .agents/scripts/aggregate_performance.ts
bun run .agents/scripts/detect_patterns.ts
bun run .agents/scripts/generate_review.ts
cat .agents/audits/review-*.md | grep "## Top Failure Patterns"
```

### Final Checklist
- [ ] Universal profiling infrastructure operational (verified by .agents/ directory structure)
- [ ] Delegation tracking captures requests and results (verified by delegation_requests.jsonl entries)
- [ ] Challenge logging works across agents (verified by test_challenges.jsonl)
- [ ] Pattern detection identifies recurring failures (verified by patterns-{date}.json)
- [ ] Weekly review automation generates reports (verified by review-{date}.md)
- [ ] Documentation complete (verified by 3+ docs in .agents/docs/)
- [ ] Prometheus integration example working (verified by prometheus_challenges.jsonl)
- [ ] Zero performance impact (verified by async logging, fail-silent errors)
