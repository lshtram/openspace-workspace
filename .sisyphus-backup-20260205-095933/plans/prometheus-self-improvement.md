# Prometheus Self-Improvement System (with Universal Agent Profiling)

## TL;DR

> **Quick Summary**: Transform Prometheus from a read-only planner to an empowered planning consultant capable of authoring requirements, guidelines, and architectural directives while maintaining safety boundaries. **PLUS**: Build universal profiling system enabling ALL agents (Prometheus, Sisyphus, Oracle, Librarian, etc.) to continuously improve through delegation-based performance tracking and weekly reviews.
> 
> **Deliverables**:
> - **Universal (all agents)**: `.agents/` profiling infrastructure with delegation tracking
> - **Prometheus-specific**: Expanded file permissions (requirements, guidelines, docs - NO source code)
> - `.prometheus/` directory for planning artifacts, templates, and self-audit logs
> - Plan quality audit system with Momus integration scoring
> - Requirements authoring toolkit with template library
> - Self-improvement protocol with profiling integration
> - Anti-patterns library learned from failed plans
> - Weekly performance review automation for all agents
> 
> **Estimated Effort**: Medium (4-5 weeks for full system + universal profiling)
> **Parallel Execution**: YES - 5 waves (universal setup → permissions → tools → quality → enablement)
> **Critical Path**: Task 0 (universal) → Task 1 (permissions) → Task 3 (templates) → Task 7 (quality) → Task 13 (profiling integration)

---

## Context

### Original Request
User identified two critical issues:
1. **File naming problem**: Requirements files use numbered names (e.g., `REQ-CORE-001-through-039.md`) requiring renaming when requirements expand
2. **Capability gap**: Prometheus cannot write requirements or guidelines directly, creating handoff overhead

### Enhanced Request (Universal Profiling)
User requested **universal self-improvement system for all agents**:
- Agents document challenges and performance (profiling directive)
- Periodic review of agent performance to identify improvement opportunities
- **Key insight**: Delegation tracking - every `delegate_task` call is a natural profiling hook
- Profile subagents automatically: request log → execution → result log

### Interview Summary
**Key Discussions**:
- **Current constraint**: Prometheus restricted to `.sisyphus/*.md` only (enforced by `prometheus-md-only` hook)
- **Failure mode**: Requirements documentation requires Sisyphus handoff instead of direct authoring
- **User insight**: Requirements/guidelines ARE planning artifacts (logical fit for Prometheus to author)
- **Parallel improvement**: Similar self-improvement work in progress for Librarian agent
- **NEW - Universal profiling**: All agents should participate in continuous improvement system

**Oh-My-OpenCode Infrastructure Found**:
- ✅ Session management tools exist (`session_read`, `session_list`, `session_search`)
- ✅ TodoWrite tool for real-time task tracking
- ✅ Background task management with `delegate_task` and `background_output`
- ❌ No structured tool call failure tracking
- ❌ No performance metrics aggregation
- ❌ No capability gap detection across agents

**Identified Gaps**:
- Prometheus cannot update guidelines when patterns are discovered
- Prometheus cannot create requirements files directly during planning sessions
- No systematic way to capture "what makes a good plan" (quality metrics)
- No anti-pattern library to avoid repeating planning mistakes
- No template library for common planning scenarios
- **NEW**: No universal profiling system for agent self-improvement

---

## Work Objectives

### Core Objective
Expand Prometheus capabilities to author requirements, guidelines, and planning documentation while maintaining strict safety boundaries (NO code execution), PLUS build universal self-improvement infrastructure enabling ALL agents (Prometheus, Sisyphus, Oracle, Librarian, etc.) to continuously evolve through delegation-based profiling, challenge documentation, and periodic performance review.

### Concrete Deliverables
**Universal (all agents)**:
- `.agents/config/` - profiling_directive.md, review_schedule.json
- `.agents/schemas/` - delegation_request.schema.json, delegation_result.schema.json, challenges.schema.json
- `.agents/logs/` - delegation_requests.jsonl, delegation_results.jsonl, {agent}_challenges.jsonl
- `.agents/scripts/` - aggregate_performance.ts, detect_patterns.ts, generate_review.ts
- `.agents/docs/` - UNIVERSAL_PROFILING.md (system documentation)

**Prometheus-specific**:
- Updated `.opencode/hooks/prometheus-md-only/main.ts` with expanded permissions + profiling integration
- `.prometheus/config/` - file_permissions.json, quality_metrics.json, autonomy_policy.json
- `.prometheus/templates/` - requirement, guideline, ADR, work plan templates
- `.prometheus/logs/` - plan_quality.jsonl, gap_requests.jsonl, metis_scores.jsonl
- `.prometheus/anti-patterns/` - documented planning mistakes with solutions
- `.prometheus/scripts/` - quality auditor, gap detector, template generator

### Definition of Done
- [ ] Universal profiling system captures delegation requests/results automatically
- [ ] Prometheus can create/edit files in `docs/requirements/`, `.agent/`, `docs/` (markdown only)
- [ ] File naming guideline updated to semantic names (verified by reading guideline file)
- [ ] Plan quality audit system generates scores for completed plans (Momus integration)
- [ ] Template library covers 5+ common planning scenarios
- [ ] Self-improvement protocol documented with autonomy boundaries
- [ ] All Prometheus file operations logged to both `.prometheus/logs/` AND `.agents/logs/`
- [ ] Weekly review script aggregates performance across all agents
- [ ] Profiling has zero performance impact (async logging, no blocking)

### Must Have
- **Universal profiling coverage**: Every `delegate_task` call logged (request + result)
- **Delegation-based tracking**: Parent-child agent relationships captured
- **Challenge documentation**: Agents self-report struggles, workarounds, missing capabilities
- **Surgical permission expansion**: Only markdown files in specific directories (requirements, guidelines, docs)
- **Code execution forbidden**: Prometheus CANNOT write TypeScript, JavaScript, Python, config files
- **Dual audit trail**: Prometheus logs to both `.prometheus/logs/` (specific) and `.agents/logs/` (universal)
- **Quality feedback loop**: Momus scores tracked over time to measure planning improvement
- **Template-driven authoring**: Common planning tasks use vetted templates
- **Anti-pattern detection**: System flags when plans contain known bad patterns
- **Autonomy boundaries**: Prometheus can AUTHOR but user approves before "official" status
- **Rollback capability**: File versioning for guideline changes
- **Privacy**: Redact sensitive paths (secrets, tokens, .env) in all logs

### Must NOT Have (Guardrails)
- **NO source code access** - TypeScript, JavaScript, Python, Go, any programming language
- **NO config file modification** - package.json, tsconfig.json, .gitignore (except specific cases)
- **NO execution permission** - Prometheus NEVER runs code, only writes markdown
- **NO unbounded permission creep** - Explicit whitelist of allowed paths, explicit blacklist of forbidden paths
- **NO self-modifying hooks** - Prometheus cannot edit the `prometheus-md-only` hook itself
- **NO database access** - No SQL, no ORM files
- **NO secrets in logs** - Redact file paths containing "secret", "token", "key" in audit logs
- **NO vague acceptance criteria** - All tests are executable bash commands with assertions
- **NO performance degradation** - Profiling must be async/non-blocking
- **NO unbounded log growth** - Rotation policy for `.agents/logs/` (archive after 90 days)

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.
> This is NOT conditional — it applies to EVERY task, regardless of test strategy.

### Test Decision
- **Infrastructure exists**: NO (building from scratch)
- **Automated tests**: Tests-after (integration tests + QA scenarios per task)
- **Framework**: bun test (TypeScript-based system)

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

Each task includes specific QA scenarios executed by the agent using:
- **Bash**: File permission checks, grep verification, JSON validation
- **Bun**: TypeScript compilation, hook execution, script validation

**Evidence Requirements**:
- Command outputs captured
- File permissions verified (`ls -la`, stat commands)
- Content validation (grep, jq for JSON)
- All evidence referenced by specific assertions

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 0 (Start Immediately - Universal Foundation):
└── Task 0: Create .agents/ universal profiling infrastructure

Wave 1 (After Wave 0 - Permission Expansion):
├── Task 1: Update prometheus-md-only hook with expanded permissions + profiling hooks
└── Task 2: Create .prometheus/ directory structure

Wave 2 (After Wave 1 - Tooling Foundation):
├── Task 3: Build template library for common planning tasks
├── Task 4: Implement file operation audit logger
└── Task 5: Create requirements authoring toolkit

Wave 3 (After Wave 2 - Quality System):
├── Task 6: Build plan quality metrics collector
├── Task 7: Integrate Momus scoring for plan audits
├── Task 8: Create anti-pattern detection system
└── Task 9: Build gap detection for missing capabilities

Wave 4 (After Wave 3 - Documentation & Integration):
├── Task 10: Document self-improvement protocol
├── Task 11: Update file naming guideline (first real use case)
├── Task 12: Create integration test suite
└── Task 13: Integrate Prometheus with universal profiling (delegate_task hooks)

Wave 5 (After Wave 4 - Enablement):
└── Task 14: Create weekly review automation and user guide

Critical Path: Task 0 → Task 1 → Task 3 → Task 7 → Task 13 → Task 14
Parallel Speedup: ~40% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 0 | None | 1, 13, 14 | None (must be first) |
| 1 | 0 | 3, 4, 5, 11, 13 | 2 |
| 2 | None | 3, 4, 5, 6, 7, 8, 9 | 1 |
| 3 | 1, 2 | 5, 11 | 4, 5 |
| 4 | 1, 2 | 11, 12 | 3, 5 |
| 5 | 1, 2, 3 | 11, 12 | 4 |
| 6 | 2 | 7, 12 | 7, 8, 9 |
| 7 | 2, 6 | 12 | 8, 9 |
| 8 | 2 | 12 | 6, 7, 9 |
| 9 | 2 | 12 | 6, 7, 8 |
| 10 | All (0-9) | None | 11, 12, 13 |
| 11 | 1, 3 | None | 10, 12, 13 |
| 12 | 1, 4, 5, 6, 7, 8, 9 | None | 10, 11, 13 |
| 13 | 0, 1, 2 | 14 | 10, 11, 12 |
| 14 | 0, 13 | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 0 | 0 | category="quick" (directory setup, schema creation) |
| 1 | 1, 2 | category="deep" (hook modification) + category="quick" (directory) |
| 2 | 3, 4, 5 | category="deep" (template design, logging system, toolkit) |
| 3 | 6, 7, 8, 9 | category="deep" (metrics, scoring, pattern detection) |
| 4 | 10, 11, 12, 13 | category="writing" (docs) + category="unspecified-high" (testing + profiling integration) |
| 5 | 14 | category="deep" (review automation) |

---

## TODOs

- [ ] 0. Create .agents/ universal profiling infrastructure

  **What to do**:
  - Create directory hierarchy:
    - `.agents/config/` - profiling_directive.md (guidelines for all agents), review_schedule.json
    - `.agents/schemas/` - delegation_request.schema.json, delegation_result.schema.json, challenge.schema.json
    - `.agents/logs/` - delegation_requests.jsonl, delegation_results.jsonl, {agent}_challenges.jsonl
    - `.agents/scripts/` - placeholders for profiling scripts (Task 13 implements these)
    - `.agents/docs/` - system documentation placeholder
  - Create `.agents/config/profiling_directive.md`:
    - Guidelines for ALL agents on self-reporting challenges
    - How to use `.agents/scripts/log_challenge.ts` when encountering tool failures
    - Privacy rules: redact sensitive paths
  - Create `.agents/config/review_schedule.json`:
    - Review frequency: weekly
    - Metrics to track: delegation success rate, tool failure rate, avg task duration
  - Create 3 JSON schemas:
    - `delegation_request.schema.json`: parent_agent, subagent_type, category, prompt_summary, timestamp, session_id
    - `delegation_result.schema.json`: request_id, duration_ms, status (success|failure|timeout), tools_used, error_message
    - `challenge.schema.json`: agent, timestamp, event_type (tool_failure|capability_gap|unexpected_behavior), details, desired_capability
  - Add `.gitignore` entry: `.agents/logs/` (privacy - may contain sensitive query data)
  - Create `.agents/README.md` explaining universal profiling system

  **Must NOT do**:
  - Do NOT create actual logging scripts yet (Task 13 handles implementation)
  - Do NOT create per-agent directories (universal infrastructure only)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Directory setup and schema creation, straightforward task
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - All skills lack domain overlap with directory/schema creation

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 0 (must complete first)
  - **Blocks**: Task 1, 13, 14 (all depend on this universal foundation)
  - **Blocked By**: None (first task)

  **References**:
  - **Pattern Reference**: `.librarian/` directory structure (similar agent self-improvement system)
  - **Schema Pattern**: `.prometheus/schemas/` from draft (similar JSONL schema structure)

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
  ```

  **Commit**: YES
  - Message: `feat(agents): create universal profiling infrastructure for all agents`
  - Files: `.agents/`, `.gitignore`, `.agents/config/*.{md,json}`, `.agents/schemas/*.json`, `.agents/README.md`
  - Pre-commit: `ls -la .agents/config/ .agents/schemas/ .agents/logs/`

---

- [ ] 1. Update prometheus-md-only hook with expanded permissions + profiling hooks

  **What to do**:
  - Edit `.opencode/hooks/prometheus-md-only/main.ts`:
    - Add ALLOWED_PATHS array: `docs/requirements/`, `.agent/`, `docs/`, `.prometheus/`
    - Add FORBIDDEN_PATHS array: `src/`, `app/`, `api/`, any TypeScript/JavaScript/Python files
    - Update validation logic to check file extension (must be `.md`) AND path whitelist
    - Add audit logging: append to `.prometheus/logs/file_operations.jsonl` on every Write/Edit
    - **NEW - Profiling integration**: On tool failure (BLOCK), call `.agents/scripts/log_challenge.ts`:
      - Pass: agent="prometheus", event_type="tool_failure", tool="write", path, error message
      - Append to `.agents/logs/prometheus_challenges.jsonl`
      - Example: `echo '{"agent":"prometheus","event_type":"tool_failure","tool":"write","path":"src/test.ts","error":"blocked by prometheus-md-only","desired_capability":"Write permission for src/"}' | bun run .agents/scripts/log_challenge.ts`
  - Test hook with sample Write attempts:
    - `docs/requirements/test.md` → ALLOW
    - `src/test.ts` → BLOCK (and log challenge)
    - `.agent/GUIDELINES.md` → ALLOW
    - `package.json` → BLOCK (and log challenge)

  **Must NOT do**:
  - Do NOT allow ANY non-markdown files (strict `.md` extension check)
  - Do NOT allow modification of the hook itself (self-modification prevention)
  - Do NOT skip audit logging (every file operation must be logged to BOTH `.prometheus/logs/` AND `.agents/logs/`)
  - Do NOT skip challenge logging on failures (profiling requirement)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: TypeScript hook modification with security implications, validation logic
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - `git-master`: Not needed for single file edit

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Tasks 3, 4, 5, 11, 13 (all require new permissions)
  - **Blocked By**: Task 0 (needs .agents/ infrastructure for challenge logging)

  **References**:
  - **Current Hook**: `.opencode/hooks/prometheus-md-only/main.ts` (read this first to understand current logic)
  - **Draft Analysis**: `.sisyphus/drafts/openspace-requirements-expansion.md` lines 494-530 (contains permission expansion design)
  - **Pattern Reference**: Other hooks in `.opencode/hooks/` for error message patterns

  **Acceptance Criteria**:

  ```
  Scenario: Prometheus can write to allowed paths (requirements)
    Tool: Bash
    Preconditions: Hook updated and active
    Steps:
      1. As Prometheus, attempt to Write a file: echo '# Test' > /tmp/test-req.md
      2. Simulate hook check: bun run .opencode/hooks/prometheus-md-only/main.ts --path="docs/requirements/test.md" --operation="write"
      3. Assert: Exit code 0 (allowed)
      4. cat .prometheus/logs/file_operations.jsonl | tail -1 | jq '.path'
      5. Assert: Output is "docs/requirements/test.md" (operation logged)
    Expected Result: Requirements path allowed and logged
    Evidence: Hook allows operation, file_operations.jsonl entry

  Scenario: Prometheus blocked from source code
    Tool: Bash
    Preconditions: Hook updated
    Steps:
      1. Simulate hook check: bun run .opencode/hooks/prometheus-md-only/main.ts --path="src/test.ts" --operation="write"
      2. Assert: Exit code 1 (blocked)
      3. bun run .opencode/hooks/prometheus-md-only/main.ts --path="src/test.ts" --operation="write" 2>&1 | grep "Prometheus cannot write source code"
      4. Assert: Error message explains restriction
    Expected Result: Source code write blocked with clear error
    Evidence: Exit code 1, error message

  Scenario: Prometheus can write to .agent/ guidelines
    Tool: Bash
    Preconditions: Hook updated
    Steps:
      1. Simulate: bun run .opencode/hooks/prometheus-md-only/main.ts --path=".agent/GUIDELINES.md" --operation="edit"
      2. Assert: Exit code 0 (allowed)
    Expected Result: Guidelines path allowed
    Evidence: Exit code 0

  Scenario: Non-markdown files blocked even in allowed paths
    Tool: Bash
    Preconditions: Hook updated
    Steps:
      1. Simulate: bun run .opencode/hooks/prometheus-md-only/main.ts --path="docs/requirements/test.json" --operation="write"
      2. Assert: Exit code 1 (blocked - not .md extension)
    Expected Result: Non-markdown blocked regardless of path
    Evidence: Exit code 1

  Scenario: Blocked operations logged as challenges
    Tool: Bash
    Preconditions: Hook updated, Task 0 completed (.agents/ exists)
    Steps:
      1. Simulate: bun run .opencode/hooks/prometheus-md-only/main.ts --path="src/test.ts" --operation="write"
      2. Assert: Exit code 1 (blocked)
      3. tail -1 .agents/logs/prometheus_challenges.jsonl | jq '.agent'
      4. Assert: Output is "prometheus"
      5. tail -1 .agents/logs/prometheus_challenges.jsonl | jq '.event_type'
      6. Assert: Output is "tool_failure"
      7. tail -1 .agents/logs/prometheus_challenges.jsonl | jq '.desired_capability'
      8. Assert: Contains description of what Prometheus wanted to do
    Expected Result: Blocked write logged as challenge for review
    Evidence: Challenge entry in .agents/logs/prometheus_challenges.jsonl
  ```

  **Commit**: YES
  - Message: `feat(prometheus): expand file permissions for requirements/guidelines authoring`
  - Files: `.opencode/hooks/prometheus-md-only/main.ts`
  - Pre-commit: `bun run .opencode/hooks/prometheus-md-only/main.ts --path="docs/requirements/test.md" --operation="write"`

---

- [ ] 2. Create .prometheus/ directory structure

  **What to do**:
  - Create directory hierarchy:
    - `.prometheus/config/` - file_permissions.json, quality_metrics.json, autonomy_policy.json
    - `.prometheus/templates/` - requirement.md, guideline.md, adr.md, work-plan.md, etc.
    - `.prometheus/logs/` - file_operations.jsonl, plan_quality.jsonl, gap_requests.jsonl, metis_scores.jsonl
    - `.prometheus/anti-patterns/` - documented planning mistakes
    - `.prometheus/scripts/` - audit tools (TypeScript)
    - `.prometheus/docs/` - self-improvement protocol documentation
  - Add `.gitignore` entry: `.prometheus/logs/` (privacy - may contain user query data)
  - Create `.prometheus/README.md` explaining purpose and structure

  **Must NOT do**:
  - Do NOT create log files yet (schemas come in Task 4)
  - Do NOT create templates yet (Task 3 handles template design)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple directory creation, no complex logic
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - All skills lack domain overlap with mkdir operations

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Tasks 3, 4, 5, 6, 7, 8, 9 (all require directory structure)
  - **Blocked By**: None (can start immediately)

  **References**:
  - **Pattern Reference**: `.librarian/` directory structure (from librarian-self-improvement.md) - similar organization

  **Acceptance Criteria**:

  ```
  Scenario: Directory structure created correctly
    Tool: Bash
    Preconditions: None
    Steps:
      1. ls -la .prometheus/
      2. Assert: Directory exists (exit code 0)
      3. ls -la .prometheus/config/ .prometheus/templates/ .prometheus/logs/ .prometheus/anti-patterns/ .prometheus/scripts/ .prometheus/docs/
      4. Assert: All 6 subdirectories exist (exit code 0)
      5. cat .gitignore | grep ".prometheus/logs/"
      6. Assert: Contains ".prometheus/logs/" entry
      7. cat .prometheus/README.md
      8. Assert: File exists and contains "self-improvement" (non-empty)
    Expected Result: Complete directory hierarchy with gitignore
    Evidence: All directories exist, gitignore updated, README created
  ```

  **Commit**: YES
  - Message: `feat(prometheus): initialize self-improvement directory structure`
  - Files: `.prometheus/`, `.gitignore`, `.prometheus/README.md`
  - Pre-commit: `ls -la .prometheus/`

---

- [ ] 3. Build template library for common planning tasks

  **What to do**:
  - Create template files in `.prometheus/templates/`:
    - `requirement-template.md` - Standard requirement format (ID, category, priority, description, acceptance criteria)
    - `guideline-template.md` - Behavioral guideline format (rule, rationale, examples)
    - `adr-template.md` - Architecture Decision Record format (context, decision, consequences)
    - `work-plan-template.md` - Standard work plan structure (TL;DR, context, objectives, TODOs, verification, commit strategy)
    - `metis-consultation.md` - Template for requesting Metis gap analysis
    - `momus-review.md` - Template for high-accuracy plan review requests
  - Each template includes:
    - Placeholder sections with `[FILL THIS]` markers
    - Examples of good vs bad content
    - Checklist of required elements
  - Create `.prometheus/scripts/instantiate_template.ts`:
    - Takes template name + variables as input
    - Returns filled template with placeholders replaced
    - Usage: `bun run .prometheus/scripts/instantiate_template.ts --template=requirement --id=REQ-CORE-040 --title="Session persistence"`

  **Must NOT do**:
  - Do NOT create overly complex templates (keep simple and flexible)
  - Do NOT enforce rigid structure (templates are guidance, not mandates)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Template design requires understanding of planning best practices, markdown generation logic
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Not relevant to markdown templates

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5)
  - **Blocks**: Task 5, 11 (requirements toolkit uses templates; guideline update uses template)
  - **Blocked By**: Tasks 1, 2 (needs permissions and directory)

  **References**:
  - **Existing Format**: `docs/requirements/official/REQ-CORE-001-through-039.md` - extract requirement format from this
  - **Guideline Format**: `.agent/GUIDELINES.md` - extract guideline structure
  - **ADR Pattern**: Search `**/*.md` for "Architecture Decision Record" or "ADR" examples
  - **Plan Format**: `.sisyphus/plans/librarian-self-improvement.md` - this is the work plan template reference

  **Acceptance Criteria**:

  ```
  Scenario: Template files exist and are valid markdown
    Tool: Bash
    Preconditions: Task 2 completed
    Steps:
      1. ls .prometheus/templates/ | grep ".md"
      2. Assert: At least 5 .md files exist
      3. for template in .prometheus/templates/*.md; do head -5 "$template" | grep "# "; done
      4. Assert: Each template has a header (exit code 0)
    Expected Result: All templates exist and well-formed
    Evidence: File list, markdown headers present

  Scenario: Template instantiation script works
    Tool: Bash
    Preconditions: Templates created
    Steps:
      1. bun run .prometheus/scripts/instantiate_template.ts --template=requirement --id=REQ-TEST-001 --title="Test Requirement"
      2. Assert: Exit code 0
      3. bun run .prometheus/scripts/instantiate_template.ts --template=requirement --id=REQ-TEST-001 --title="Test Requirement" | grep "REQ-TEST-001"
      4. Assert: Output contains the requirement ID
      5. bun run .prometheus/scripts/instantiate_template.ts --template=requirement --id=REQ-TEST-001 --title="Test Requirement" | grep "Test Requirement"
      6. Assert: Output contains the title
    Expected Result: Template filled with provided variables
    Evidence: Output contains ID and title
  ```

  **Commit**: YES
  - Message: `feat(prometheus): add template library for requirements, guidelines, ADRs, plans`
  - Files: `.prometheus/templates/*.md`, `.prometheus/scripts/instantiate_template.ts`
  - Pre-commit: `bun run .prometheus/scripts/instantiate_template.ts --template=requirement --id=TEST --title="Test" | grep "TEST"`

---

- [ ] 4. Implement file operation audit logger

  **What to do**:
  - Create `.prometheus/schemas/file_operations.schema.json` with fields:
    - timestamp, session_id, agent, operation (write | edit | delete), path, file_type, size_bytes, success, error_message
  - Create `.prometheus/scripts/log_file_operation.ts`:
    - Called by prometheus-md-only hook after each file operation
    - Appends JSONL entry to `.prometheus/logs/file_operations.jsonl`
    - Redacts sensitive paths (containing "secret", "token", "key", ".env")
    - Validates against schema before appending
  - Update hook from Task 1 to call this logger after successful operations
  - Make runnable: `echo '{"path":"test.md","operation":"write","success":true}' | bun run .prometheus/scripts/log_file_operation.ts`

  **Must NOT do**:
  - Do NOT log file contents (only metadata)
  - Do NOT skip redaction for sensitive paths

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: JSONL logging, schema validation, path redaction logic
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - All skills lack domain overlap

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 5)
  - **Blocks**: Tasks 11, 12 (integration tests need logging)
  - **Blocked By**: Tasks 1, 2 (needs hook update and directory)

  **References**:
  - **Schema Pattern**: `.librarian/schemas/failures.schema.json` (similar JSONL schema structure)
  - **Hook Integration**: `.opencode/hooks/prometheus-md-only/main.ts` (updated in Task 1)

  **Acceptance Criteria**:

  ```
  Scenario: Log successful file operation
    Tool: Bash
    Preconditions: Task 2 completed (directory exists)
    Steps:
      1. echo '{"path":"docs/requirements/test.md","operation":"write","success":true,"size_bytes":1234}' | bun run .prometheus/scripts/log_file_operation.ts
      2. Assert: Exit code 0
      3. tail -1 .prometheus/logs/file_operations.jsonl | jq '.path'
      4. Assert: Output is "docs/requirements/test.md"
      5. tail -1 .prometheus/logs/file_operations.jsonl | jq '.operation'
      6. Assert: Output is "write"
    Expected Result: Operation logged correctly
    Evidence: file_operations.jsonl contains entry

  Scenario: Redact sensitive paths
    Tool: Bash
    Preconditions: Logger exists
    Steps:
      1. echo '{"path":".env.secret","operation":"write","success":true}' | bun run .prometheus/scripts/log_file_operation.ts
      2. Assert: Exit code 0
      3. tail -1 .prometheus/logs/file_operations.jsonl | jq '.path'
      4. Assert: Output is "[REDACTED]" (sensitive path hidden)
    Expected Result: Sensitive path redacted in log
    Evidence: path="[REDACTED]"
  ```

  **Commit**: YES
  - Message: `feat(prometheus): implement file operation audit logger with redaction`
  - Files: `.prometheus/schemas/file_operations.schema.json`, `.prometheus/scripts/log_file_operation.ts`
  - Pre-commit: `echo '{"path":"test.md","operation":"write","success":true}' | bun run .prometheus/scripts/log_file_operation.ts && tail -1 .prometheus/logs/file_operations.jsonl | jq '.'`

---

- [ ] 5. Create requirements authoring toolkit

  **What to do**:
  - Create `.prometheus/scripts/create_requirement.ts`:
    - Takes requirement metadata as input: ID, category, priority, title, description, acceptance criteria
    - Uses requirement template from Task 3
    - Validates requirement format (all required fields present)
    - Outputs filled requirement markdown
    - Does NOT write file directly (returns content for Prometheus to write)
  - Create `.prometheus/scripts/validate_requirement.ts`:
    - Reads requirement markdown file
    - Validates: ID format, required sections present, acceptance criteria are testable, traceability links exist
    - Returns validation report with errors/warnings
  - Create `.prometheus/scripts/link_requirement.ts`:
    - Takes requirement ID + source document (session summary, ADR, etc.)
    - Updates "Traceability" section in requirement file
    - Bidirectional linking: requirement → source, source → requirement
  - Make runnable:
    - `bun run .prometheus/scripts/create_requirement.ts --id=REQ-CORE-040 --category=Artifacts --priority=High --title="Session persistence" --description="..." --criteria="..."`
    - `bun run .prometheus/scripts/validate_requirement.ts --file=docs/requirements/official/REQ-CORE-modalities.md`

  **Must NOT do**:
  - Do NOT write files directly (toolkit generates content, Prometheus writes it)
  - Do NOT skip validation (always validate before writing)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex validation logic, template integration, traceability management
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - All skills lack domain overlap

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 4)
  - **Blocks**: Task 11, 12 (first use case and tests)
  - **Blocked By**: Tasks 1, 2, 3 (needs permissions, directory, templates)

  **References**:
  - **Template**: `.prometheus/templates/requirement-template.md` (Task 3)
  - **Requirement Format**: `docs/requirements/official/REQ-CORE-001-through-039.md` - validation rules derived from this
  - **Traceability Example**: `docs/requirements/official/REQ-CORE-001-through-039.md` line 8 - shows traceability format

  **Acceptance Criteria**:

  ```
  Scenario: Create requirement from metadata
    Tool: Bash
    Preconditions: Task 3 completed (template exists)
    Steps:
      1. bun run .prometheus/scripts/create_requirement.ts --id=REQ-TEST-001 --category=Test --priority=High --title="Test Requirement" --description="This is a test"
      2. Assert: Exit code 0
      3. bun run .prometheus/scripts/create_requirement.ts --id=REQ-TEST-001 --category=Test --priority=High --title="Test Requirement" --description="This is a test" | grep "REQ-TEST-001"
      4. Assert: Output contains requirement ID
      5. bun run .prometheus/scripts/create_requirement.ts --id=REQ-TEST-001 --category=Test --priority=High --title="Test Requirement" --description="This is a test" | grep "## Acceptance Criteria"
      6. Assert: Output includes acceptance criteria section
    Expected Result: Valid requirement markdown generated
    Evidence: Output contains all required sections

  Scenario: Validate well-formed requirement
    Tool: Bash
    Preconditions: Valid requirement file exists
    Steps:
      1. bun run .prometheus/scripts/create_requirement.ts --id=REQ-TEST-002 --category=Test --priority=Medium --title="Valid Req" --description="Test" > /tmp/test-req.md
      2. bun run .prometheus/scripts/validate_requirement.ts --file=/tmp/test-req.md
      3. Assert: Exit code 0 (validation passed)
      4. bun run .prometheus/scripts/validate_requirement.ts --file=/tmp/test-req.md | grep "Validation: PASS"
      5. Assert: Pass message present
    Expected Result: Valid requirement passes validation
    Evidence: Exit code 0, pass message

  Scenario: Detect missing required sections
    Tool: Bash
    Preconditions: Validator exists
    Steps:
      1. echo "# REQ-TEST-003
## Description
Missing acceptance criteria" > /tmp/invalid-req.md
      2. bun run .prometheus/scripts/validate_requirement.ts --file=/tmp/invalid-req.md
      3. Assert: Exit code 1 (validation failed)
      4. bun run .prometheus/scripts/validate_requirement.ts --file=/tmp/invalid-req.md 2>&1 | grep "Missing section: Acceptance Criteria"
      5. Assert: Error identifies missing section
    Expected Result: Validation fails with specific error
    Evidence: Exit code 1, error message
  ```

  **Commit**: YES
  - Message: `feat(prometheus): add requirements authoring toolkit with validation`
  - Files: `.prometheus/scripts/create_requirement.ts`, `.prometheus/scripts/validate_requirement.ts`, `.prometheus/scripts/link_requirement.ts`
  - Pre-commit: `bun run .prometheus/scripts/create_requirement.ts --id=TEST --category=Test --priority=High --title="Test" --description="Test" | bun run .prometheus/scripts/validate_requirement.ts --stdin`

---

- [ ] 6. Build plan quality metrics collector

  **What to do**:
  - Create `.prometheus/schemas/plan_quality.schema.json` with fields:
    - timestamp, plan_file, session_id, metrics (completeness_score, clarity_score, testability_score, metis_score, momus_score), issues_found, resolution_time_minutes
  - Create `.prometheus/scripts/collect_quality_metrics.ts`:
    - Reads completed work plan from `.sisyphus/plans/*.md`
    - Calculates metrics:
      - Completeness: % of TODOs with all required sections (references, acceptance criteria, commit info)
      - Clarity: % of TODOs with concrete, non-vague language
      - Testability: % of acceptance criteria that are executable commands (no "user confirms")
    - Appends to `.prometheus/logs/plan_quality.jsonl`
  - Make runnable: `bun run .prometheus/scripts/collect_quality_metrics.ts --plan=.sisyphus/plans/librarian-self-improvement.md`

  **Must NOT do**:
  - Do NOT modify plan files (read-only analysis)
  - Do NOT skip any plans (analyze all completed plans for trend analysis)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Plan parsing, metric calculation, quality scoring logic
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - All skills lack domain overlap

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7, 8, 9)
  - **Blocks**: Task 7, 12 (Momus integration and tests depend on metrics)
  - **Blocked By**: Task 2 (needs directory structure)

  **References**:
  - **Plan Example**: `.sisyphus/plans/librarian-self-improvement.md` - analyze this structure to define metrics
  - **Quality Criteria**: Prometheus system prompt (search for "acceptance criteria", "references", "concrete")

  **Acceptance Criteria**:

  ```
  Scenario: Collect metrics from well-formed plan
    Tool: Bash
    Preconditions: Task 2 completed, sample plan exists
    Steps:
      1. bun run .prometheus/scripts/collect_quality_metrics.ts --plan=.sisyphus/plans/librarian-self-improvement.md
      2. Assert: Exit code 0
      3. tail -1 .prometheus/logs/plan_quality.jsonl | jq '.plan_file'
      4. Assert: Output is ".sisyphus/plans/librarian-self-improvement.md"
      5. tail -1 .prometheus/logs/plan_quality.jsonl | jq '.metrics.completeness_score'
      6. Assert: Score is between 0 and 100
      7. tail -1 .prometheus/logs/plan_quality.jsonl | jq '.metrics.testability_score'
      8. Assert: Score is between 0 and 100
    Expected Result: Quality metrics calculated and logged
    Evidence: plan_quality.jsonl entry with scores

  Scenario: Detect plan with missing sections (low completeness)
    Tool: Bash
    Preconditions: Collector exists
    Steps:
      1. echo "# Test Plan
## TODOs
- [ ] Task without references or acceptance criteria" > /tmp/incomplete-plan.md
      2. bun run .prometheus/scripts/collect_quality_metrics.ts --plan=/tmp/incomplete-plan.md
      3. Assert: Exit code 0 (analysis succeeds even for bad plan)
      4. tail -1 .prometheus/logs/plan_quality.jsonl | jq '.metrics.completeness_score'
      5. Assert: Score < 50 (low completeness for missing sections)
    Expected Result: Low completeness score for incomplete plan
    Evidence: completeness_score < 50
  ```

  **Commit**: YES
  - Message: `feat(prometheus): implement plan quality metrics collector`
  - Files: `.prometheus/schemas/plan_quality.schema.json`, `.prometheus/scripts/collect_quality_metrics.ts`
  - Pre-commit: `bun run .prometheus/scripts/collect_quality_metrics.ts --plan=.sisyphus/plans/librarian-self-improvement.md && tail -1 .prometheus/logs/plan_quality.jsonl | jq '.'`

---

- [ ] 7. Integrate Momus scoring for plan audits

  **What to do**:
  - Create `.prometheus/schemas/momus_scores.schema.json` with fields:
    - timestamp, plan_file, verdict (OKAY | NEEDS_WORK | CRITICAL_ISSUES), issues (array of issue objects), file_verification_rate, acceptance_criteria_quality_rate, iterations_to_okay
  - Create `.prometheus/scripts/request_momus_audit.ts`:
    - Takes plan file path as input
    - Invokes Momus agent: `delegate_task(subagent_type="momus", prompt=plan_file_path, run_in_background=false)`
    - Parses Momus response (verdict, issues found)
    - Appends to `.prometheus/logs/momus_scores.jsonl`
    - Returns verdict to caller
  - Create `.prometheus/scripts/analyze_momus_trends.ts`:
    - Reads `.prometheus/logs/momus_scores.jsonl`
    - Calculates:
      - Average iterations to OKAY (measures improvement over time)
      - Most common issue categories
      - File verification rate trend
    - Outputs trend report to `.prometheus/audits/momus-trends-YYYY-MM-DD.md`
  - Make runnable:
    - `bun run .prometheus/scripts/request_momus_audit.ts --plan=.sisyphus/plans/test-plan.md`
    - `bun run .prometheus/scripts/analyze_momus_trends.ts`

  **Must NOT do**:
  - Do NOT skip Momus invocation (real agent call required, no mocking)
  - Do NOT modify plans based on Momus feedback automatically (user approval required)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Agent orchestration, response parsing, trend analysis
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - All skills lack domain overlap

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 6, 8, 9)
  - **Blocks**: Task 12 (integration tests)
  - **Blocked By**: Tasks 2, 6 (needs directory and metrics system)

  **References**:
  - **Momus Invocation**: Prometheus system prompt (search for "delegate_task.*momus")
  - **Momus Response Format**: Documented in Momus agent guidelines (grep for momus verdict)

  **Acceptance Criteria**:

  ```
  Scenario: Request Momus audit for plan
    Tool: Bash
    Preconditions: Valid plan file exists, Task 6 completed
    Steps:
      1. bun run .prometheus/scripts/request_momus_audit.ts --plan=.sisyphus/plans/librarian-self-improvement.md
      2. Assert: Exit code 0 (Momus call succeeded)
      3. tail -1 .prometheus/logs/momus_scores.jsonl | jq '.plan_file'
      4. Assert: Output is ".sisyphus/plans/librarian-self-improvement.md"
      5. tail -1 .prometheus/logs/momus_scores.jsonl | jq '.verdict'
      6. Assert: Verdict is one of "OKAY" or "NEEDS_WORK" or "CRITICAL_ISSUES"
    Expected Result: Momus audit completed and logged
    Evidence: momus_scores.jsonl entry with verdict

  Scenario: Analyze Momus trends over time
    Tool: Bash
    Preconditions: Multiple Momus scores exist in log
    Steps:
      1. for i in {1..3}; do echo "{\"timestamp\":\"2026-02-0${i}T00:00:00Z\",\"plan_file\":\"test-$i.md\",\"verdict\":\"OKAY\",\"iterations_to_okay\":$i}" >> .prometheus/logs/momus_scores.jsonl; done
      2. bun run .prometheus/scripts/analyze_momus_trends.ts
      3. Assert: Exit code 0
      4. cat .prometheus/audits/momus-trends-*.md | grep "Average iterations to OKAY"
      5. Assert: Report shows average (should be 2.0 from test data)
    Expected Result: Trend analysis report generated
    Evidence: Report file with average iterations calculated
  ```

  **Commit**: YES
  - Message: `feat(prometheus): integrate Momus scoring with trend analysis`
  - Files: `.prometheus/schemas/momus_scores.schema.json`, `.prometheus/scripts/request_momus_audit.ts`, `.prometheus/scripts/analyze_momus_trends.ts`
  - Pre-commit: `echo '{"verdict":"OKAY","iterations_to_okay":1}' | jq '.' && echo "Momus integration test (manual verification required)"`

---

- [ ] 8. Create anti-pattern detection system

  **What to do**:
  - Create `.prometheus/anti-patterns/` directory with markdown files documenting common planning mistakes:
    - `vague-acceptance-criteria.md` - "User confirms", "verify it works" patterns
    - `missing-references.md` - TODOs without file/API/documentation references
    - `non-executable-qa.md` - QA scenarios requiring human intervention
    - `scope-creep.md` - Plans that expand beyond original request
    - `over-abstraction.md` - Premature abstraction, unnecessary complexity
    - `ai-slop.md` - Overly verbose, generic language, unnecessary error handling
  - Each anti-pattern file includes:
    - Description of the pattern
    - Why it's problematic
    - Examples (bad vs good)
    - Detection heuristics (regex or keyword patterns)
  - Create `.prometheus/scripts/detect_anti_patterns.ts`:
    - Reads plan file
    - Checks for each anti-pattern using detection heuristics
    - Returns list of detected anti-patterns with line numbers
    - Appends to `.prometheus/logs/plan_quality.jsonl` (adds anti_patterns field)
  - Make runnable: `bun run .prometheus/scripts/detect_anti_patterns.ts --plan=.sisyphus/plans/test-plan.md`

  **Must NOT do**:
  - Do NOT modify plans automatically (detection only, no fixes)
  - Do NOT flag false positives excessively (tune heuristics to be specific)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Pattern documentation, regex design, multi-file analysis
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - All skills lack domain overlap

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 6, 7, 9)
  - **Blocks**: Task 12 (integration tests)
  - **Blocked By**: Task 2 (needs directory structure)

  **References**:
  - **AI Slop Patterns**: Prometheus system prompt (search for "AI-Slop Patterns to Surface")
  - **Acceptance Criteria**: Prometheus system prompt (search for "Agent-Executed QA Scenarios")
  - **Past Plans**: Analyze `.sisyphus/plans/*.md` to find examples of these anti-patterns

  **Acceptance Criteria**:

  ```
  Scenario: Detect vague acceptance criteria
    Tool: Bash
    Preconditions: Task 2 completed, anti-patterns documented
    Steps:
      1. echo "# Test Plan
## TODOs
- [ ] Task 1
  Acceptance Criteria:
  - User confirms it works" > /tmp/vague-plan.md
      2. bun run .prometheus/scripts/detect_anti_patterns.ts --plan=/tmp/vague-plan.md
      3. Assert: Exit code 0
      4. bun run .prometheus/scripts/detect_anti_patterns.ts --plan=/tmp/vague-plan.md | jq '.anti_patterns | length'
      5. Assert: Output > 0 (at least one anti-pattern detected)
      6. bun run .prometheus/scripts/detect_anti_patterns.ts --plan=/tmp/vague-plan.md | jq '.anti_patterns[0].pattern'
      7. Assert: Output is "vague-acceptance-criteria"
    Expected Result: Vague criteria detected
    Evidence: Anti-pattern flagged with line number

  Scenario: No false positives on well-formed plan
    Tool: Bash
    Preconditions: Detector exists
    Steps:
      1. bun run .prometheus/scripts/detect_anti_patterns.ts --plan=.sisyphus/plans/librarian-self-improvement.md
      2. Assert: Exit code 0
      3. bun run .prometheus/scripts/detect_anti_patterns.ts --plan=.sisyphus/plans/librarian-self-improvement.md | jq '.anti_patterns | length'
      4. Assert: Output is 0 or very low (well-formed plan should have minimal issues)
    Expected Result: Well-formed plan passes cleanly
    Evidence: Zero or minimal anti-patterns flagged
  ```

  **Commit**: YES
  - Message: `feat(prometheus): add anti-pattern detection system with common planning mistakes`
  - Files: `.prometheus/anti-patterns/*.md`, `.prometheus/scripts/detect_anti_patterns.ts`
  - Pre-commit: `bun run .prometheus/scripts/detect_anti_patterns.ts --plan=.sisyphus/plans/librarian-self-improvement.md && echo "Anti-pattern detection test complete"`

---

- [ ] 9. Build gap detection for missing capabilities

  **What to do**:
  - Create `.prometheus/schemas/gap_requests.schema.json` with fields:
    - timestamp, capability_name, justification, frequency (how often needed), impact (high | medium | low), proposed_solution (new tool, new skill, expanded permissions, etc.)
  - Create `.prometheus/scripts/detect_capability_gaps.ts`:
    - Analyzes `.prometheus/logs/file_operations.jsonl` for failed operations (blocked writes)
    - Analyzes `.prometheus/logs/plan_quality.jsonl` for recurring low scores in specific areas
    - Identifies capability gaps:
      - Frequent blocks on specific file types → "Need permission for X"
      - Low testability scores → "Need better QA templating"
      - Low clarity scores → "Need anti-pattern linting during draft"
    - Appends to `.prometheus/logs/gap_requests.jsonl`
    - Does NOT request changes automatically (gap identification only)
  - Create `.prometheus/scripts/prioritize_gaps.ts`:
    - Reads `.prometheus/logs/gap_requests.jsonl`
    - Scores gaps: (frequency × impact) / difficulty
    - Outputs prioritized list to `.prometheus/audits/capability-gaps-YYYY-MM-DD.md`
  - Make runnable:
    - `bun run .prometheus/scripts/detect_capability_gaps.ts`
    - `bun run .prometheus/scripts/prioritize_gaps.ts`

  **Must NOT do**:
  - Do NOT auto-request permission changes (detection only)
  - Do NOT flag low-frequency gaps (require N occurrences threshold)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Log analysis, pattern recognition, gap scoring logic
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - All skills lack domain overlap

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 6, 7, 8)
  - **Blocks**: Task 12 (integration tests)
  - **Blocked By**: Task 2 (needs directory structure)

  **References**:
  - **Librarian Gap Detection**: `.sisyphus/plans/librarian-self-improvement.md` Task 5 - similar gap detection logic
  - **Log Schemas**: `.prometheus/schemas/*.schema.json` from previous tasks

  **Acceptance Criteria**:

  ```
  Scenario: Detect capability gap from blocked operations
    Tool: Bash
    Preconditions: Task 4 completed (file operations logged)
    Steps:
      1. for i in {1..5}; do echo "{\"timestamp\":\"2026-02-05T0$i:00:00Z\",\"path\":\"package.json\",\"operation\":\"write\",\"success\":false,\"error\":\"blocked\"}" >> .prometheus/logs/file_operations.jsonl; done
      2. bun run .prometheus/scripts/detect_capability_gaps.ts
      3. Assert: Exit code 0
      4. tail -1 .prometheus/logs/gap_requests.jsonl | jq '.capability_name'
      5. Assert: Output mentions "package.json" or "config file" (gap detected from repeated blocks)
      6. tail -1 .prometheus/logs/gap_requests.jsonl | jq '.frequency'
      7. Assert: Output >= 5 (recorded all 5 blocked attempts)
    Expected Result: Gap detected from repeated blocked writes
    Evidence: gap_requests.jsonl entry with frequency=5

  Scenario: Prioritize gaps by impact score
    Tool: Bash
    Preconditions: Multiple gaps logged
    Steps:
      1. echo '{"capability_name":"test-high","frequency":10,"impact":"high"}' >> .prometheus/logs/gap_requests.jsonl
      2. echo '{"capability_name":"test-low","frequency":2,"impact":"low"}' >> .prometheus/logs/gap_requests.jsonl
      3. bun run .prometheus/scripts/prioritize_gaps.ts
      4. Assert: Exit code 0
      5. cat .prometheus/audits/capability-gaps-*.md | grep -A 1 "## Top Priority Gaps" | grep "test-high"
      6. Assert: High-impact gap appears in top priority section
    Expected Result: Gaps prioritized correctly in report
    Evidence: Report shows high-frequency, high-impact gap first
  ```

  **Commit**: YES
  - Message: `feat(prometheus): add capability gap detection and prioritization`
  - Files: `.prometheus/schemas/gap_requests.schema.json`, `.prometheus/scripts/detect_capability_gaps.ts`, `.prometheus/scripts/prioritize_gaps.ts`
  - Pre-commit: `echo '{"capability_name":"test","frequency":1,"impact":"low"}' >> .prometheus/logs/gap_requests.jsonl && bun run .prometheus/scripts/prioritize_gaps.ts`

---

- [ ] 10. Document self-improvement protocol

  **What to do**:
  - Create `.prometheus/docs/SELF_IMPROVEMENT_PROTOCOL.md`:
    - Overview of Prometheus capabilities (what it CAN and CANNOT do)
    - Autonomy boundaries (authoring vs approval gates)
    - How to use templates for requirements/guidelines
    - Plan quality feedback loop (Metis → Momus → metrics)
    - Gap detection and capability request process
    - Rollback procedure for guideline changes
    - Troubleshooting guide
  - Create `.prometheus/docs/ARCHITECTURE.md`:
    - Directory structure explanation
    - File schemas (link to `.prometheus/schemas/`)
    - Component descriptions (logger, metrics collector, anti-pattern detector, etc.)
    - Data flow diagrams (planning session → draft → plan → quality audit → lessons learned)
  - Create `.prometheus/docs/QUICKSTART.md`:
    - How to author a requirement directly (step-by-step)
    - How to update a guideline
    - How to check plan quality scores
    - How to view capability gaps
  - Create `.prometheus/docs/FILE_PERMISSIONS.md`:
    - Detailed list of ALLOWED paths (docs/requirements/, .agent/, docs/)
    - Detailed list of FORBIDDEN paths (src/, app/, package.json, etc.)
    - Why each restriction exists (security, safety)
    - How to request permission expansion (gap detection process)

  **Must NOT do**:
  - Do NOT skip autonomy boundaries documentation (critical for safety)
  - Do NOT omit rollback procedures (required for guideline changes)

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Documentation-heavy task with technical detail
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - All skills lack domain overlap

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 11, 12)
  - **Blocks**: None (documentation)
  - **Blocked By**: All (Tasks 1-9) - documents the completed system

  **References**:
  - **All Previous Tasks**: Documentation describes system built in Tasks 1-9
  - **Librarian Protocol**: `.librarian/docs/SELF_IMPROVEMENT_PROTOCOL.md` (similar structure)
  - **Current Constraint**: Prometheus system prompt (for autonomy boundaries)

  **Acceptance Criteria**:

  ```
  Scenario: Documentation files created and well-structured
    Tool: Bash
    Preconditions: All previous tasks completed
    Steps:
      1. ls .prometheus/docs/ | grep ".md"
      2. Assert: At least 4 .md files exist
      3. cat .prometheus/docs/SELF_IMPROVEMENT_PROTOCOL.md | grep "## Autonomy Boundaries"
      4. Assert: Autonomy section exists
      5. cat .prometheus/docs/FILE_PERMISSIONS.md | grep "## ALLOWED Paths"
      6. Assert: Permissions documented
      7. cat .prometheus/docs/QUICKSTART.md | grep "# Quickstart"
      8. Assert: Quickstart guide exists
    Expected Result: Complete documentation set
    Evidence: 4+ doc files with expected sections

  Scenario: Autonomy boundaries clearly explained
    Tool: Bash
    Preconditions: Protocol doc created
    Steps:
      1. cat .prometheus/docs/SELF_IMPROVEMENT_PROTOCOL.md | grep -i "prometheus can author" | wc -l
      2. Assert: Output > 0 (mentions what Prometheus CAN do)
      3. cat .prometheus/docs/SELF_IMPROVEMENT_PROTOCOL.md | grep -i "prometheus cannot" | wc -l
      4. Assert: Output > 0 (mentions what Prometheus CANNOT do)
      5. cat .prometheus/docs/SELF_IMPROVEMENT_PROTOCOL.md | grep -i "approval required"
      6. Assert: Exit code 0 (mentions approval gates)
    Expected Result: Boundaries clearly documented
    Evidence: Protocol mentions CAN, CANNOT, and approval requirements
  ```

  **Commit**: YES
  - Message: `docs(prometheus): add self-improvement protocol and architecture documentation`
  - Files: `.prometheus/docs/*.md`
  - Pre-commit: `cat .prometheus/docs/SELF_IMPROVEMENT_PROTOCOL.md | grep "Autonomy Boundaries"`

---

- [ ] 11. Update file naming guideline (first real use case)

  **What to do**:
  - Use expanded permissions from Task 1 to update `docs/requirements/DOCUMENTATION_PROCESS.md`:
    - Change line 36 from `REQ-[PREFIX]-001-through-NNN.md` to `REQ-[PREFIX]-[SEMANTIC-NAME].md`
    - Add explanation: "Use semantic names that describe the requirement category. Avoid encoding requirement numbers in filenames as this requires renaming when requirements are added."
    - Add examples: `REQ-CORE-modalities.md`, `REQ-DEPLOY-platform-matrix.md`, `REQ-ARCH-interfaces.md`
  - Verify change:
    - Read back the file to confirm edit succeeded
    - Grep for "semantic" in the updated file
  - This demonstrates Prometheus can now author guideline updates directly

  **Must NOT do**:
  - Do NOT change any other part of the file (surgical edit only)
  - Do NOT skip verification (read-back required)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple file edit with verification
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - All skills lack domain overlap

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 10, 12)
  - **Blocks**: None (demonstrates capability)
  - **Blocked By**: Tasks 1, 3 (needs permissions and possibly template guidance)

  **References**:
  - **File to Edit**: `docs/requirements/DOCUMENTATION_PROCESS.md` line 36
  - **Desired Change**: Documented in `.sisyphus/drafts/openspace-requirements-expansion.md` lines 462-492

  **Acceptance Criteria**:

  ```
  Scenario: Guideline updated with semantic naming rule
    Tool: Bash
    Preconditions: Task 1 completed (permissions granted)
    Steps:
      1. cat docs/requirements/DOCUMENTATION_PROCESS.md | grep "REQ-\[PREFIX\]-\[SEMANTIC-NAME\].md"
      2. Assert: Exit code 0 (new format present)
      3. cat docs/requirements/DOCUMENTATION_PROCESS.md | grep "semantic names"
      4. Assert: Explanation exists
      5. cat docs/requirements/DOCUMENTATION_PROCESS.md | grep "REQ-CORE-modalities.md"
      6. Assert: Example present
      7. cat .prometheus/logs/file_operations.jsonl | tail -1 | jq '.path'
      8. Assert: Output is "docs/requirements/DOCUMENTATION_PROCESS.md" (edit logged)
    Expected Result: Guideline updated correctly and logged
    Evidence: File contains new format, examples, audit log entry

  Scenario: Old format removed from guideline
    Tool: Bash
    Preconditions: Guideline updated
    Steps:
      1. cat docs/requirements/DOCUMENTATION_PROCESS.md | grep "001-through-NNN"
      2. Assert: Exit code 1 (old format NOT present)
    Expected Result: Old numbered format no longer mentioned
    Evidence: grep fails to find old pattern
  ```

  **Commit**: YES
  - Message: `docs(requirements): update naming convention to semantic names`
  - Files: `docs/requirements/DOCUMENTATION_PROCESS.md`
  - Pre-commit: `cat docs/requirements/DOCUMENTATION_PROCESS.md | grep "SEMANTIC-NAME"`

---

- [ ] 12. Create integration test suite

  **What to do**:
  - Create `.prometheus/tests/integration.test.ts` using bun:test:
    - Test 1: Prometheus can write to allowed paths (requirements, guidelines, docs)
    - Test 2: Prometheus blocked from forbidden paths (source code, configs)
    - Test 3: File operations logged correctly
    - Test 4: Requirement creation toolkit produces valid output
    - Test 5: Plan quality metrics calculate correctly
    - Test 6: Anti-pattern detection identifies known bad patterns
    - Test 7: Gap detection flags repeated capability needs
    - Test 8: Momus audit integration works end-to-end
  - Use test fixtures in `.prometheus/tests/fixtures/` (sample plans, requirements)
  - Make runnable: `bun test .prometheus/tests/integration.test.ts`
  - All tests must pass for task completion

  **Must NOT do**:
  - Do NOT use real file writes in tests (use temp directories)
  - Do NOT leave failing tests (all must pass)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Complex integration testing across multiple components
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - `playwright`: Not needed - backend testing

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 10, 11)
  - **Blocks**: None (final validation)
  - **Blocked By**: Tasks 1, 4, 5, 6, 7, 8, 9 (all core functionality must exist)

  **References**:
  - **Test Framework**: bun:test documentation
  - **All Previous Scripts**: Tasks 1-9 created the components being tested

  **Acceptance Criteria**:

  ```
  Scenario: All integration tests pass
    Tool: Bash
    Preconditions: All previous tasks completed
    Steps:
      1. bun test .prometheus/tests/integration.test.ts
      2. Assert: Exit code 0 (all tests pass)
      3. bun test .prometheus/tests/integration.test.ts 2>&1 | grep "8 passed"
      4. Assert: Output shows "8 passed" (all 8 tests succeeded)
    Expected Result: Complete integration test suite passes
    Evidence: Exit code 0, "8 passed" message

  Scenario: Permission tests validate file access correctly
    Tool: Bash
    Preconditions: Test suite exists
    Steps:
      1. bun test .prometheus/tests/integration.test.ts --test-name-pattern="permission"
      2. Assert: Exit code 0
    Expected Result: Permission tests pass
    Evidence: Test passes

  Scenario: Quality metrics tests validate scoring logic
    Tool: Bash
    Preconditions: Test suite exists
    Steps:
      1. bun test .prometheus/tests/integration.test.ts --test-name-pattern="quality"
      2. Assert: Exit code 0
    Expected Result: Quality metric tests pass
    Evidence: Test passes
  ```

  **Commit**: YES
  - Message: `test(prometheus): add integration test suite for self-improvement system`
  - Files: `.prometheus/tests/integration.test.ts`, `.prometheus/tests/fixtures/*`
  - Pre-commit: `bun test .prometheus/tests/integration.test.ts`

---

- [ ] 13. Integrate Prometheus with universal profiling (delegate_task hooks)

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
  - Create `.agents/scripts/log_challenge.ts` (helper used by Task 1 hook):
    - Takes input: agent, timestamp, event_type, details, desired_capability
    - Validates against `.agents/schemas/challenge.schema.json`
    - Redacts sensitive paths (containing "secret", "token", "key", ".env")
    - Appends to `.agents/logs/{agent}_challenges.jsonl`
  - Update Prometheus system prompt (or delegation wrapper) to:
    - Call `log_delegation_request.ts` BEFORE each `delegate_task`
    - Call `log_delegation_result.ts` AFTER `background_output` completes
    - Make logging transparent (zero user-visible impact)
  - Make runnable:
    - `echo '{"parent_agent":"prometheus","subagent_type":"explore","prompt":"Find patterns..."}' | bun run .agents/scripts/log_delegation_request.ts`
    - `echo '{"request_id":"test-123","duration_ms":5000,"status":"success"}' | bun run .agents/scripts/log_delegation_result.ts`
    - `echo '{"agent":"prometheus","event_type":"tool_failure","tool":"write","details":"blocked"}' | bun run .agents/scripts/log_challenge.ts`

  **Must NOT do**:
  - Do NOT log full prompts (only first 200 chars for privacy)
  - Do NOT block agent execution on logging failures (fail silently, log error)
  - Do NOT skip redaction for sensitive paths

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: System integration, async logging, schema validation across multiple components
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - All skills lack domain overlap

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 10, 11, 12)
  - **Blocks**: Task 14 (review automation needs profiling data)
  - **Blocked By**: Task 0 (needs schemas and log directories), Task 1 (log_challenge.ts used by hook), Task 2 (directory structure)

  **References**:
  - **Schema**: `.agents/schemas/*.json` (Task 0)
  - **delegate_task Pattern**: Prometheus system prompt (search for "delegate_task" examples)
  - **Logging Pattern**: `.prometheus/scripts/log_file_operation.ts` (Task 4 - similar JSONL logging)

  **Acceptance Criteria**:

  ```
  Scenario: Log delegation request with schema validation
    Tool: Bash
    Preconditions: Task 0 completed (schemas exist)
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
    Preconditions: Task 0 completed
    Steps:
      1. echo '{"agent":"prometheus","event_type":"tool_failure","tool":"write","details":"Attempted write to .env.secret blocked"}' | bun run .agents/scripts/log_challenge.ts
      2. Assert: Exit code 0
      3. tail -1 .agents/logs/prometheus_challenges.jsonl | jq '.details'
      4. Assert: Does NOT contain ".env.secret" (redacted)
    Expected Result: Sensitive paths redacted in challenge log
    Evidence: Redaction applied

  Scenario: Logging failures do not crash agent
    Tool: Bash
    Preconditions: Scripts exist
    Steps:
      1. echo 'INVALID JSON' | bun run .agents/scripts/log_delegation_request.ts
      2. Assert: Exit code 0 (fail silently, don't crash)
    Expected Result: Invalid input handled gracefully
    Evidence: Script exits cleanly despite bad input
  ```

  **Commit**: YES
  - Message: `feat(agents): add delegation profiling hooks for universal agent tracking`
  - Files: `.agents/scripts/log_delegation_request.ts`, `.agents/scripts/log_delegation_result.ts`, `.agents/scripts/log_challenge.ts`
  - Pre-commit: `echo '{"parent_agent":"test","subagent_type":"explore","prompt":"test"}' | bun run .agents/scripts/log_delegation_request.ts && tail -1 .agents/logs/delegation_requests.jsonl | jq '.'`

---

- [ ] 14. Create weekly review automation and user guide

  **What to do**:
  - Create `.agents/scripts/aggregate_performance.ts`:
    - Reads all logs: delegation_requests.jsonl, delegation_results.jsonl, *_challenges.jsonl
    - Calculates metrics:
      - Per-agent delegation success rate
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
      - **Action Items**: Specific next steps (e.g., "Execute prometheus-self-improvement.md Task 1")
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
  - **Parallel Group**: Wave 5 (final task)
  - **Blocks**: None (final deliverable)
  - **Blocked By**: Task 0 (needs logs), Task 13 (needs delegation data)

  **References**:
  - **Log Data**: `.agents/logs/*.jsonl` (Task 0 schemas, Task 13 data)
  - **Prometheus Metrics**: `.prometheus/logs/plan_quality.jsonl` (Task 6) - include in review
  - **Librarian Review**: `.librarian/scripts/analyze_failures.ts` (similar pattern detection)

  **Acceptance Criteria**:

  ```
  Scenario: Aggregate performance from logs
    Tool: Bash
    Preconditions: Task 13 completed, logs have data (seed test data if needed)
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
  - Message: `feat(agents): add weekly review automation with performance analysis`
  - Files: `.agents/scripts/aggregate_performance.ts`, `.agents/scripts/detect_patterns.ts`, `.agents/scripts/generate_review.ts`, `.agents/docs/*.md`
  - Pre-commit: `echo '{"parent_agent":"test","subagent_type":"explore","request_id":"test"}' >> .agents/logs/delegation_requests.jsonl && bun run .agents/scripts/aggregate_performance.ts`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 0 | `feat(agents): create universal profiling infrastructure for all agents` | `.agents/`, `.gitignore`, schemas, config | Directory structure exists |
| 1 | `feat(prometheus): expand file permissions for requirements/guidelines authoring` | `.opencode/hooks/prometheus-md-only/main.ts` | Hook allows docs/requirements/*.md |
| 2 | `feat(prometheus): initialize self-improvement directory structure` | `.prometheus/`, `.gitignore` | Directory structure exists |
| 3 | `feat(prometheus): add template library for requirements, guidelines, ADRs, plans` | `.prometheus/templates/*.md`, scripts | Template instantiation works |
| 4 | `feat(prometheus): implement file operation audit logger with redaction` | schemas, scripts | Log entry created |
| 5 | `feat(prometheus): add requirements authoring toolkit with validation` | scripts | Requirement generated and validated |
| 6 | `feat(prometheus): implement plan quality metrics collector` | schemas, scripts | Metrics calculated |
| 7 | `feat(prometheus): integrate Momus scoring with trend analysis` | schemas, scripts | Momus called and logged |
| 8 | `feat(prometheus): add anti-pattern detection system with common planning mistakes` | anti-patterns/*.md, scripts | Anti-pattern detected |
| 9 | `feat(prometheus): add capability gap detection and prioritization` | schemas, scripts | Gap prioritized |
| 10 | `docs(prometheus): add self-improvement protocol and architecture documentation` | `.prometheus/docs/*.md` | Autonomy boundaries documented |
| 11 | `docs(requirements): update naming convention to semantic names` | `docs/requirements/DOCUMENTATION_PROCESS.md` | Semantic naming rule present |
| 12 | `test(prometheus): add integration test suite for self-improvement system` | tests | All tests pass |
| 13 | `feat(agents): add delegation profiling hooks for universal agent tracking` | `.agents/scripts/*.ts` | Delegation logging works |
| 14 | `feat(agents): add weekly review automation with performance analysis` | `.agents/scripts/*.ts`, `.agents/docs/*.md` | Review report generated |

---

## Success Criteria

### Verification Commands
```bash
# Verify universal profiling infrastructure
ls -la .agents/config/ .agents/schemas/ .agents/logs/
cat .agents/config/profiling_directive.md | grep "log_challenge"

# Verify expanded permissions
bun run .opencode/hooks/prometheus-md-only/main.ts --path="docs/requirements/test.md" --operation="write"  # Should ALLOW
bun run .opencode/hooks/prometheus-md-only/main.ts --path="src/test.ts" --operation="write"  # Should BLOCK

# Verify template system
bun run .prometheus/scripts/instantiate_template.ts --template=requirement --id=REQ-TEST-001 --title="Test"

# Verify quality metrics
bun run .prometheus/scripts/collect_quality_metrics.ts --plan=.sisyphus/plans/librarian-self-improvement.md
tail -1 .prometheus/logs/plan_quality.jsonl | jq '.metrics'

# Verify anti-pattern detection
bun run .prometheus/scripts/detect_anti_patterns.ts --plan=.sisyphus/plans/test-plan.md

# Verify gap detection
bun run .prometheus/scripts/detect_capability_gaps.ts && bun run .prometheus/scripts/prioritize_gaps.ts

# Verify delegation profiling
echo '{"parent_agent":"test","subagent_type":"explore","prompt":"test"}' | bun run .agents/scripts/log_delegation_request.ts
tail -1 .agents/logs/delegation_requests.jsonl | jq '.request_id'

# Verify weekly review
bun run .agents/scripts/generate_review.ts
cat .agents/audits/review-*.md | grep "## Top Failure Patterns"

# Verify integration tests
bun test .prometheus/tests/integration.test.ts
```

### Final Checklist
- [ ] Universal profiling infrastructure operational (verified by .agents/ directory structure)
- [ ] Delegation tracking captures requests and results (verified by delegation_requests.jsonl entries)
- [ ] Challenge logging works across agents (verified by prometheus_challenges.jsonl)
- [ ] Weekly review automation generates reports (verified by review-{date}.md)
- [ ] Prometheus can create requirement files in `docs/requirements/` (verified by successful write)
- [ ] Prometheus can update guidelines in `.agent/` (verified by DOCUMENTATION_PROCESS.md edit)
- [ ] File naming guideline updated (verified by grep for "SEMANTIC-NAME")
- [ ] All file operations logged to audit trail (verified by file_operations.jsonl)
- [ ] Plan quality feedback loop operational (verified by Momus score in log)
- [ ] Anti-pattern library created (verified by anti-patterns/*.md files)
- [ ] Integration tests pass (verified by bun test exit code 0)
- [ ] Documentation complete (verified by 4+ docs in .prometheus/docs/ + 2+ docs in .agents/docs/)
