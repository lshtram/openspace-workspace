# Librarian Agent Self-Improvement System

## TL;DR

> **Quick Summary**: Build infrastructure enabling the librarian agent to audit its own capabilities, detect gaps, request new tools (MCPs), and continuously evolve through feedback loops. Includes critical MCP installations (Context7 for versioned docs, Package Registry for npm/PyPI).
> 
> **Deliverables**:
> - `.librarian/` directory with config files, JSONL logs, audit scripts
> - Tool router with config-driven routing policy
> - Gap detection system with external validation
> - Context7 MCP + Package Registry MCP integration
> - Rollback mechanism for safe self-modifications
> 
> **Estimated Effort**: Large (5+ weeks for full system)
> **Parallel Execution**: YES - 5 waves (infrastructure → core logic → MCPs → integration → enablement)
> **Critical Path**: Phase 1a (audit infra) → Phase 1b (gap detection) → Phase 1c (routing) → Phase 2 (MCPs)

---

## Context

### Original Request
User asked whether the librarian agent had conducted self-improvement research previously, and suggested exploring better technologies (like Parallel.ai vs Tavily, plus MCP servers and skills).

### Interview Summary
**Key Discussions**:
- **Past attempts**: Previous session (2026-02-04) launched self-improvement research task (`bg_eb5008d0`) but results were never captured
- **Current research**: Conducted comprehensive parallel investigation (6 agents + 8 web searches) on search APIs, MCP servers, and skill frameworks
- **Librarian self-diagnosis**: Librarian identified critical gaps (version-specific docs, package registry, semantic search) and proposed self-improvement protocol
- **Architecture design**: Librarian designed complete system (JSONL logs, config-driven routing, MCP discovery, quarterly audits)
- **User decision**: Build the full self-improvement SYSTEM, not just add individual tools

**Research Findings**:
- **Search APIs**: Parallel.ai (92% accuracy, multi-hop), Exa.ai (semantic), Perplexity (real-time), Context7 (version-specific docs + MCP ready)
- **MCP Servers**: Context7 MCP (`@upstash/context7`), Package Registry MCP (`Artmann/package-registry-mcp`), official registry at `registry.modelcontextprotocol.io`
- **Skill frameworks**: MCP servers effectively ARE the skill mechanism - no separate system needed
- **Librarian's #1 pain point**: Version confusion ("wrong version errors, the most common failure class")

### Metis Review
**Identified Gaps** (addressed in plan):
- **CRITICAL**: Autonomy boundaries undefined (can librarian self-modify? Needs approval gates)
- **CRITICAL**: Failure attribution unclear (who/what labels failures? Risk of self-reporting bias)
- **HIGH**: Recursive self-modification risk (agent modifying itself → new failures → loop)
- **HIGH**: MCP installation without validation (security, conflicts, rollback needed)
- **MEDIUM**: Overfitting to recent failures (need time-windowed analysis)
- **MEDIUM**: False positive gap detection (need evidence thresholds)

**Metis Recommendation**: **Incremental rollout** with mandatory soak periods. Phase 1 split into 1a (read-only audits), 1b (gap detection), 1c (routing). Phase 2 for MCPs. Full autonomy ONLY after Phases 1-4 proven stable.

---

## Work Objectives

### Core Objective
Build self-improvement infrastructure enabling the librarian agent to continuously evolve through: audit generation, failure tracking, capability gap detection, tool routing optimization, MCP discovery/request, and A/B testing — with explicit autonomy boundaries and external validation to prevent recursive self-modification risks.

### Concrete Deliverables
- `.librarian/config/` - routing.json, capabilities.json, audit_policy.json
- `.librarian/logs/` - failures.jsonl, gaps.jsonl, tool_metrics.jsonl, capability_requests.jsonl
- `.librarian/audits/` - timestamped audit reports (MD + JSON)
- `.librarian/scripts/` - audit generator, gap detector, tool router, MCP discovery client, rollback utility
- Context7 MCP integration for version-specific library documentation
- Package Registry MCP integration for npm/PyPI/crates.io search

### Definition of Done
- [ ] Audit system generates valid reports analyzing last 30 days of librarian activity
- [ ] Gap detection identifies missing capabilities with evidence (N failures → flag gap)
- [ ] Tool routing policy successfully redirects version queries to Context7 MCP
- [ ] Rollback mechanism can restore previous config within 1 command
- [ ] All self-modifications require explicit human approval (no autonomous config changes)
- [ ] Integration tests pass for audit cycle, MCP calls, routing decisions

### Must Have
- **Autonomy boundaries**: Librarian can RECOMMEND but NOT execute config changes without human approval
- **External validation**: Failure detection includes non-self-reported signals (Prometheus ratings, user feedback)
- **Rollback mechanism**: All config changes are versioned with single-command rollback
- **Security review**: MCP installations vetted before integration (supply chain, rate limits, deprecation handling)
- **Incremental delivery**: Phase 1a (read-only audits) → 1b (gap detection) → 1c (routing) → Phase 2 (MCPs)
- **Soak periods**: Minimum 1 week between enabling each phase
- **Evidence thresholds**: Gap detection requires N failures before flagging (prevent false positives)
- **Time-windowed analysis**: Audits analyze 30-day windows to prevent recency bias

### Must NOT Have (Guardrails)
- **NO autonomous MCP installation** - librarian can REQUEST, not install
- **NO self-modifying routing config** - librarian can PROPOSE, not execute
- **NO unbounded log growth** - implement rotation policy (archive after 90 days, sample high-volume)
- **NO sensitive data in logs** - hash/redact credentials, tokens, secrets in failure logs
- **NO cascading failures** - max 1 MCP addition per audit cycle with mandatory soak
- **NO vague acceptance criteria** - all tests MUST be executable commands with assertions
- **NO manual verification steps** - all QA is agent-executed (no "user confirms it works")

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
- **Bash**: File system validation, JSON parsing, command execution
- **Bun**: Script execution, test running, TypeScript validation

**Evidence Requirements**:
- Command outputs captured
- File existence/contents verified
- Schema validation results
- All evidence referenced by specific assertions

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately - Infrastructure Setup):
├── Task 1: Create .librarian/ directory structure
└── Task 2: Define JSONL schemas for logs

Wave 2 (After Wave 1 - Core Logic):
├── Task 3: Implement audit report generator (Phase 1a)
├── Task 4: Implement failure classifier
└── Task 5: Implement gap detector (Phase 1b)

Wave 3 (After Wave 2 - Routing & Config):
├── Task 6: Implement tool router (Phase 1c)
├── Task 7: Build rollback mechanism
└── Task 8: Create config validation scripts

Wave 4 (After Wave 3 - MCP Integration):
├── Task 9: Integrate Context7 MCP
└── Task 10: Integrate Package Registry MCP

Wave 5 (After Wave 4 - Testing & Enablement):
├── Task 11: Build integration test suite
├── Task 12: Create MCP discovery client
└── Task 13: Document self-improvement protocol

Critical Path: Task 1 → Task 3 → Task 5 → Task 6 → Task 9 → Task 11
Parallel Speedup: ~40% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 3, 4, 5, 6, 7, 8 | 2 |
| 2 | None | 3, 4, 5 | 1 |
| 3 | 1, 2 | 11 | 4, 5 |
| 4 | 1, 2 | 5, 11 | 3, 5 |
| 5 | 1, 2 | 6, 11 | 3, 4 |
| 6 | 1, 5 | 9, 11 | 7, 8 |
| 7 | 1 | 11 | 6, 8 |
| 8 | 1 | 11 | 6, 7 |
| 9 | 6 | 11 | 10 |
| 10 | 6 | 11 | 9 |
| 11 | 3, 4, 5, 6, 7, 8, 9, 10 | None | 12, 13 |
| 12 | None | None | 11, 13 |
| 13 | None | None | 11, 12 |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 2 | category="quick" (simple file/schema creation) |
| 2 | 3, 4, 5 | category="deep" (core logic with error handling) |
| 3 | 6, 7, 8 | category="deep" (routing policy + safety mechanisms) |
| 4 | 9, 10 | category="unspecified-high" (external integration) |
| 5 | 11, 12, 13 | category="unspecified-high" (testing + documentation) |

---

## TODOs

- [ ] 1. Create .librarian/ directory structure

  **What to do**:
  - Create directory hierarchy: `.librarian/config/`, `.librarian/logs/`, `.librarian/audits/`, `.librarian/scripts/`, `.librarian/backups/`
  - Create `.gitignore` entry for `.librarian/logs/` and `.librarian/backups/` (privacy - logs may contain query data)
  - Add `.librarian/README.md` explaining directory purpose
  - Verify directory structure with `tree .librarian/` or `find .librarian/ -type d`

  **Must NOT do**:
  - Do NOT create any log files yet (schema definition comes in Task 2)
  - Do NOT add config files yet (those are created in later tasks)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple file system operations, no complex logic
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - `git-master`: Not needed - simple mkdir operations

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Tasks 3, 4, 5, 6, 7, 8 (all require directory structure)
  - **Blocked By**: None (can start immediately)

  **References**:
  - **Documentation Reference**: Librarian's architecture design (from consultation session `ses_3d3db365affeMFlITazSNQSOrC`) - specified `.librarian/` directory structure with config/, logs/, audits/ subdirectories

  **Acceptance Criteria**:

  \`\`\`
  Scenario: Directory structure is created correctly
    Tool: Bash
    Preconditions: None (starting from scratch)
    Steps:
      1. ls -la .librarian/
      2. Assert: Directory exists (exit code 0)
      3. ls -la .librarian/config/ .librarian/logs/ .librarian/audits/ .librarian/scripts/ .librarian/backups/
      4. Assert: All 5 subdirectories exist (exit code 0)
      5. cat .gitignore | grep ".librarian/logs/"
      6. Assert: Contains ".librarian/logs/" entry
      7. cat .gitignore | grep ".librarian/backups/"
      8. Assert: Contains ".librarian/backups/" entry
      9. cat .librarian/README.md
      10. Assert: File exists and contains "self-improvement" (exit code 0, non-empty)
    Expected Result: Complete directory hierarchy with gitignore entries
    Evidence: Command outputs captured
  \`\`\`

  **Commit**: YES
  - Message: `feat(librarian): initialize self-improvement directory structure`
  - Files: `.librarian/`, `.gitignore`, `.librarian/README.md`
  - Pre-commit: `ls -la .librarian/`

---

- [ ] 2. Define JSONL schemas for logs

  **What to do**:
  - Create `.librarian/schemas/failures.schema.json` with TypeScript interface definition for failure log entries
  - Create `.librarian/schemas/gaps.schema.json` for capability gap entries
  - Create `.librarian/schemas/tool_metrics.schema.json` for tool usage metrics
  - Create `.librarian/schemas/capability_requests.schema.json` for MCP requests
  - Each schema must include: timestamp, session_id, query intent, severity, metadata fields
  - Add JSON Schema validation (using Zod or similar) for each

  **Must NOT do**:
  - Do NOT create actual log files yet (those are generated by Task 3/4/5)
  - Do NOT write complex validation logic (simple schema definitions only)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Schema definition without complex logic
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Not relevant - backend schemas

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Tasks 3, 4, 5 (log generation needs schemas)
  - **Blocked By**: None (can start immediately)

  **References**:
  - **Documentation Reference**: Librarian's JSONL schema proposal (from session `ses_3d3db365affeMFlITazSNQSOrC`) - specified fields like timestamp, session_id, query, intent, tools_used, failure_type, severity, expected, actual, resolution, notes, artifacts

  **Acceptance Criteria**:

  \`\`\`
  Scenario: Failure schema is valid and parseable
    Tool: Bash
    Preconditions: Task 1 completed (directory exists)
    Steps:
      1. cat .librarian/schemas/failures.schema.json | jq '.'
      2. Assert: Valid JSON (exit code 0)
      3. cat .librarian/schemas/failures.schema.json | jq '.properties | keys'
      4. Assert: Contains "timestamp", "session_id", "query", "failure_type", "severity"
    Expected Result: Valid JSON Schema with required fields
    Evidence: jq output captured

  Scenario: All 4 schemas exist and validate
    Tool: Bash
    Preconditions: Task 1 completed
    Steps:
      1. for schema in failures gaps tool_metrics capability_requests; do cat .librarian/schemas/$schema.schema.json | jq '.' || exit 1; done
      2. Assert: All schemas parse successfully (exit code 0)
    Expected Result: 4 valid schema files
    Evidence: Loop execution output
  \`\`\`

  **Commit**: YES
  - Message: `feat(librarian): define JSONL schemas for self-improvement logs`
  - Files: `.librarian/schemas/*.schema.json`
  - Pre-commit: `cat .librarian/schemas/*.schema.json | jq '.'`

---

- [ ] 3. Implement audit report generator (Phase 1a)

  **What to do**:
  - Create `.librarian/scripts/generate_audit.ts` that:
    - Reads `.librarian/logs/failures.jsonl`, `gaps.jsonl`, `tool_metrics.jsonl` (create empty files if they don't exist for first run)
    - Analyzes data from last 30 days (time-windowed to prevent recency bias per Metis)
    - Generates `.librarian/audits/audit-YYYY-MM-DD.md` (human-readable markdown)
    - Generates `.librarian/audits/audit-YYYY-MM-DD.json` (machine-readable structured data)
  - Report sections: Usage Stats, Failure Analysis, Top Gaps, Tool Performance, Recommendations
  - Handle edge case: empty logs (first run) → generate "baseline audit" with zero failures
  - Make runnable: `bun run .librarian/scripts/generate_audit.ts`

  **Must NOT do**:
  - Do NOT implement gap detection logic yet (that's Task 5)
  - Do NOT modify any config files (read-only audit generation)
  - Do NOT make any decisions or recommendations beyond reporting data

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Core logic with JSONL parsing, date filtering, markdown generation, error handling
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - `git-master`: Not needed for script implementation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5)
  - **Blocks**: Task 11 (integration tests need working audit)
  - **Blocked By**: Tasks 1, 2 (needs directory structure and schemas)

  **References**:
  - **Pattern Reference**: JSONL parsing - check existing OpenSpace codebase for JSONL handling patterns (glob `**/*.ts` for JSONL/ndjson usage)
  - **Schema Reference**: `.librarian/schemas/*.schema.json` (created in Task 2) - use these to validate log entries
  - **Librarian Design**: Audit report format from session `ses_3d3db365affeMFlITazSNQSOrC` - specified sections like Usage Stats, Failure Analysis, Top Gaps, Recommendations

  **Acceptance Criteria**:

  \`\`\`
  Scenario: Audit generation with empty logs (first run)
    Tool: Bash
    Preconditions: Tasks 1, 2 completed; no log files exist
    Steps:
      1. bun run .librarian/scripts/generate_audit.ts
      2. Assert: Exit code 0 (script succeeds)
      3. ls -la .librarian/audits/ | grep "audit-$(date +%Y-%m-%d).md"
      4. Assert: Audit markdown file exists
      5. cat .librarian/audits/audit-$(date +%Y-%m-%d).md | grep "Baseline Audit"
      6. Assert: Contains "Baseline Audit" or "No failures recorded"
      7. cat .librarian/audits/audit-$(date +%Y-%m-%d).json | jq '.gaps | length'
      8. Assert: Output is 0 (no gaps on first run)
    Expected Result: Valid baseline audit generated with zero failures
    Evidence: Audit files created, JSON parseable

  Scenario: Audit generation with sample failure log
    Tool: Bash
    Preconditions: Task 2 completed (schemas exist)
    Steps:
      1. echo '{"timestamp":"2026-02-05T00:00:00Z","session_id":"test","query":"React 17 hooks","intent":"docs","tools_used":[{"name":"websearch","latency_ms":500,"status":"ok"}],"failure_type":"wrong_version","expected":"v17","actual":"v18","severity":"high","resolution":"user_fix","notes":"User corrected"}' > .librarian/logs/failures.jsonl
      2. bun run .librarian/scripts/generate_audit.ts
      3. Assert: Exit code 0
      4. cat .librarian/audits/audit-$(date +%Y-%m-%d).json | jq '.failures | length'
      5. Assert: Output is 1 (detected sample failure)
      6. cat .librarian/audits/audit-$(date +%Y-%m-%d).json | jq '.failures[0].failure_type'
      7. Assert: Output is "wrong_version"
    Expected Result: Audit correctly parses and reports sample failure
    Evidence: JSON output shows failure_type="wrong_version"
  \`\`\`

  **Commit**: YES
  - Message: `feat(librarian): implement audit report generator (Phase 1a)`
  - Files: `.librarian/scripts/generate_audit.ts`
  - Pre-commit: `bun run .librarian/scripts/generate_audit.ts && cat .librarian/audits/audit-*.json | jq '.'`

---

- [ ] 4. Implement failure classifier

  **What to do**:
  - Create `.librarian/scripts/classify_failure.ts` that:
    - Takes failure data (query, tools_used, outcome, user_feedback) as input
    - Classifies failure_type: wrong_version | timeout | no_results | user_correction | bad_citation | stale_info
    - Assigns severity: high (task blocked) | medium (answer degraded) | low (workaround exists)
    - Determines resolution: fallback_tool | user_fix | abandoned
  - Include external validation hooks (placeholder for future Prometheus rating integration)
  - Append classified failure to `.librarian/logs/failures.jsonl`
  - Make runnable: `echo '...' | bun run .librarian/scripts/classify_failure.ts`

  **Must NOT do**:
  - Do NOT implement complex ML classification (simple rule-based heuristics)
  - Do NOT modify existing log entries (append-only)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Classification logic with multiple decision branches and severity scoring
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - `sequential-thinking`: Not needed - straightforward rule-based logic

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 5)
  - **Blocks**: Task 11 (integration tests need failure classification)
  - **Blocked By**: Tasks 1, 2 (needs directory and schemas)

  **References**:
  - **Schema Reference**: `.librarian/schemas/failures.schema.json` (Task 2) - use this schema for validation
  - **Librarian Design**: Failure classification logic from session `ses_3d3db365affeMFlITazSNQSOrC` - specified failure types and severity levels

  **Acceptance Criteria**:

  \`\`\`
  Scenario: Classify wrong_version failure with high severity
    Tool: Bash
    Preconditions: Tasks 1, 2 completed
    Steps:
      1. echo '{"query":"React 17 hooks","tools_used":[{"name":"websearch"}],"user_feedback":"This is React 18, I need React 17","outcome":"wrong_result"}' | bun run .librarian/scripts/classify_failure.ts
      2. Assert: Exit code 0
      3. tail -1 .librarian/logs/failures.jsonl | jq '.failure_type'
      4. Assert: Output is "wrong_version"
      5. tail -1 .librarian/logs/failures.jsonl | jq '.severity'
      6. Assert: Output is "high"
    Expected Result: Correct classification appended to log
    Evidence: JSONL entry with failure_type="wrong_version", severity="high"

  Scenario: Classify timeout failure with medium severity
    Tool: Bash
    Preconditions: Task 2 completed
    Steps:
      1. echo '{"query":"npm package search","tools_used":[{"name":"websearch","status":"timeout"}],"outcome":"timeout"}' | bun run .librarian/scripts/classify_failure.ts
      2. Assert: Exit code 0
      3. tail -1 .librarian/logs/failures.jsonl | jq '.failure_type'
      4. Assert: Output is "timeout"
    Expected Result: Timeout classified correctly
    Evidence: failure_type="timeout"
  \`\`\`

  **Commit**: YES
  - Message: `feat(librarian): implement failure classifier with severity scoring`
  - Files: `.librarian/scripts/classify_failure.ts`
  - Pre-commit: `echo '{"query":"test","outcome":"timeout"}' | bun run .librarian/scripts/classify_failure.ts && tail -1 .librarian/logs/failures.jsonl | jq '.'`

---

- [ ] 5. Implement gap detector (Phase 1b)

  **What to do**:
  - Create `.librarian/scripts/detect_gaps.ts` that:
    - Reads `.librarian/logs/failures.jsonl` from last 30 days
    - Identifies capability gaps (e.g., repeated "wrong_version" failures → "need versioned docs capability")
    - Maps intents to required capabilities using `.librarian/config/capabilities.json` (create this file with initial mappings)
    - Applies evidence threshold (per Metis: N failures before flagging - default N=3)
    - Scores gaps: (frequency × severity × blocker_weight) / effort_to_fill
    - Appends gaps to `.librarian/logs/gaps.jsonl`
  - Create `.librarian/config/capabilities.json` with intent → capability mappings:
    ```json
    {
      "package_query": ["package_registry"],
      "versioned_docs": ["context7"],
      "code_history": ["github_enhanced"],
      "semantic_search": ["exa", "embedding_search"]
    }
    ```
  - Make runnable: `bun run .librarian/scripts/detect_gaps.ts` (or with `--dry-run` flag for testing)

  **Must NOT do**:
  - Do NOT automatically install MCPs (gap detection only, no action)
  - Do NOT flag gaps without evidence threshold (prevents false positives)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex logic with frequency analysis, scoring, intent mapping, time-window filtering
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - All skills lack domain overlap with gap detection logic

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 4)
  - **Blocks**: Tasks 6, 11 (routing needs gap data; tests validate gap detection)
  - **Blocked By**: Tasks 1, 2 (needs directory and schemas)

  **References**:
  - **Schema Reference**: `.librarian/schemas/gaps.schema.json` (Task 2)
  - **Librarian Design**: Gap detection algorithm from session `ses_3d3db365affeMFlITazSNQSOrC` - specified scoring formula and evidence thresholds
  - **Metis Directive**: Evidence threshold requirement to prevent false positives (Metis session `ses_3d3d37e6cffebw4QpZUNx2Kw1i`)

  **Acceptance Criteria**:

  \`\`\`
  Scenario: Gap detection with threshold not met (no gap flagged)
    Tool: Bash
    Preconditions: Task 4 completed (classifier exists)
    Steps:
      1. echo '{"timestamp":"2026-02-05T00:00:00Z","failure_type":"wrong_version","severity":"high","intent":"docs"}' > .librarian/logs/failures.jsonl
      2. bun run .librarian/scripts/detect_gaps.ts
      3. Assert: Exit code 0
      4. cat .librarian/logs/gaps.jsonl | wc -l
      5. Assert: Output is 0 (threshold N=3 not met with 1 failure)
    Expected Result: No gap flagged (below threshold)
    Evidence: gaps.jsonl is empty

  Scenario: Gap detection with threshold met (gap flagged)
    Tool: Bash
    Preconditions: Task 4 completed
    Steps:
      1. for i in {1..3}; do echo "{\"timestamp\":\"2026-02-05T0$i:00:00Z\",\"failure_type\":\"wrong_version\",\"severity\":\"high\",\"intent\":\"docs\"}" >> .librarian/logs/failures.jsonl; done
      2. bun run .librarian/scripts/detect_gaps.ts
      3. Assert: Exit code 0
      4. tail -1 .librarian/logs/gaps.jsonl | jq '.gap_type'
      5. Assert: Output is "versioned_docs" (mapped from repeated wrong_version failures)
      6. tail -1 .librarian/logs/gaps.jsonl | jq '.frequency'
      7. Assert: Output is 3
    Expected Result: Versioned docs gap flagged with frequency=3
    Evidence: gaps.jsonl contains versioned_docs gap
  \`\`\`

  **Commit**: YES
  - Message: `feat(librarian): implement gap detector with evidence thresholds (Phase 1b)`
  - Files: `.librarian/scripts/detect_gaps.ts`, `.librarian/config/capabilities.json`
  - Pre-commit: `bun run .librarian/scripts/detect_gaps.ts --dry-run && cat .librarian/config/capabilities.json | jq '.'`

---

- [ ] 6. Implement tool router (Phase 1c)

  **What to do**:
  - Create `.librarian/scripts/route_query.ts` that:
    - Takes query as input: `echo '{"query":"..."}' | bun run .librarian/scripts/route_query.ts`
    - Classifies query intent (docs | code | history | package | mixed)
    - Reads routing rules from `.librarian/config/routing.json`
    - Selects appropriate tool(s) based on intent + routing policy
    - Returns tool selection decision (does NOT execute tools - routing logic only)
  - Create `.librarian/config/routing.json` with initial rules:
    ```json
    {
      "schema_version": "v1.0.0",
      "routes": [
        {"intent": "versioned_docs", "tool": "context7", "fallback": "websearch", "confidence_threshold": 0.8},
        {"intent": "package_query", "tool": "package_registry", "fallback": "websearch", "confidence_threshold": 0.7},
        {"intent": "code_search", "tool": "grep_app", "fallback": "github_clone", "confidence_threshold": 0.6}
      ],
      "default": {"tool": "websearch"}
    }
    ```
  - Handle conflicting routes (Metis concern): use confidence scoring + first-match wins
  - Implement fallback logic if primary tool unavailable

  **Must NOT do**:
  - Do NOT execute actual tool calls (routing decision only)
  - Do NOT self-modify routing config (read-only for now)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Intent classification, rule matching, fallback logic, config parsing
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - All skills lack domain overlap with routing logic

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7, 8)
  - **Blocks**: Tasks 9, 11 (MCP integration needs router; tests validate routing)
  - **Blocked By**: Tasks 1, 5 (needs directory and gap detection for intent mapping)

  **References**:
  - **Config Reference**: `.librarian/config/capabilities.json` (Task 5) - use intent mappings from this
  - **Librarian Design**: Routing policy structure from session `ses_3d3db365affeMFlITazSNQSOrC`
  - **Metis Concern**: Conflicting routes handling (session `ses_3d3d37e6cffebw4QpZUNx2Kw1i`) - use confidence threshold + first-match

  **Acceptance Criteria**:

  \`\`\`
  Scenario: Route version query to Context7
    Tool: Bash
    Preconditions: Task 5 completed (capabilities.json exists)
    Steps:
      1. echo '{"query":"How to use useState in React 17?"}' | bun run .librarian/scripts/route_query.ts
      2. Assert: Exit code 0
      3. echo '{"query":"How to use useState in React 17?"}' | bun run .librarian/scripts/route_query.ts | jq '.tool'
      4. Assert: Output is "context7"
    Expected Result: Version query routed to context7 tool
    Evidence: Routing decision contains tool="context7"

  Scenario: Route package query to Package Registry
    Tool: Bash
    Preconditions: Task 5 completed
    Steps:
      1. echo '{"query":"npm packages for authentication"}' | bun run .librarian/scripts/route_query.ts | jq '.tool'
      2. Assert: Output is "package_registry"
    Expected Result: Package query routed correctly
    Evidence: tool="package_registry"

  Scenario: Fallback to websearch for unknown intent
    Tool: Bash
    Preconditions: Task 5 completed
    Steps:
      1. echo '{"query":"random nonsense xyz123"}' | bun run .librarian/scripts/route_query.ts | jq '.tool'
      2. Assert: Output is "websearch" (default fallback)
    Expected Result: Unknown query falls back to default
    Evidence: tool="websearch"
  \`\`\`

  **Commit**: YES
  - Message: `feat(librarian): implement tool router with fallback logic (Phase 1c)`
  - Files: `.librarian/scripts/route_query.ts`, `.librarian/config/routing.json`
  - Pre-commit: `echo '{"query":"test"}' | bun run .librarian/scripts/route_query.ts && cat .librarian/config/routing.json | jq '.'`

---

- [ ] 7. Build rollback mechanism

  **What to do**:
  - Create `.librarian/scripts/rollback.ts` that:
    - Takes target file as input: `bun run .librarian/scripts/rollback.ts --target=routing.json`
    - Restores from `.librarian/backups/{filename}.{timestamp}.bak`
    - Lists available backups: `bun run .librarian/scripts/rollback.ts --list`
    - Validates restored config before applying
  - Create backup hook: `.librarian/scripts/backup_config.ts` that:
    - Copies config file to `.librarian/backups/{filename}.{ISO_timestamp}.bak`
    - Called automatically before any config modification
  - Keep last 10 backups per file (auto-cleanup old backups)

  **Must NOT do**:
  - Do NOT modify source config without creating backup first
  - Do NOT allow rollback of log files (only config files)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: File operations, timestamp handling, validation, cleanup logic
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - All skills lack domain overlap with file backup/restore

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 6, 8)
  - **Blocks**: Task 11 (integration tests validate rollback)
  - **Blocked By**: Task 1 (needs directory structure)

  **References**:
  - **Metis Directive**: Rollback mechanism mandatory (session `ses_3d3d37e6cffebw4QpZUNx2Kw1i`)
  - **Pattern Reference**: Check OpenSpace codebase for backup patterns (glob `**/*.ts` for backup/restore utilities)

  **Acceptance Criteria**:

  \`\`\`
  Scenario: Backup config before modification
    Tool: Bash
    Preconditions: Task 1 completed, routing.json exists
    Steps:
      1. echo '{"test":"original"}' > .librarian/config/routing.json
      2. bun run .librarian/scripts/backup_config.ts --file=routing.json
      3. Assert: Exit code 0
      4. ls -la .librarian/backups/ | grep "routing.json"
      5. Assert: Backup file exists (exit code 0)
      6. cat .librarian/backups/routing.json.*.bak | jq '.test'
      7. Assert: Output is "original"
    Expected Result: Backup created with original content
    Evidence: Backup file in .librarian/backups/

  Scenario: Rollback config to previous version
    Tool: Bash
    Preconditions: Backup exists from previous scenario
    Steps:
      1. echo '{"test":"modified"}' > .librarian/config/routing.json
      2. bun run .librarian/scripts/rollback.ts --target=routing.json
      3. Assert: Exit code 0
      4. cat .librarian/config/routing.json | jq '.test'
      5. Assert: Output is "original" (restored from backup)
    Expected Result: Config restored to backup version
    Evidence: routing.json contains original content

  Scenario: List available backups
    Tool: Bash
    Preconditions: Backups exist
    Steps:
      1. bun run .librarian/scripts/rollback.ts --list
      2. Assert: Exit code 0, output contains "routing.json"
    Expected Result: Backup list shows available files
    Evidence: List output captured
  \`\`\`

  **Commit**: YES
  - Message: `feat(librarian): implement config rollback mechanism with auto-backup`
  - Files: `.librarian/scripts/rollback.ts`, `.librarian/scripts/backup_config.ts`
  - Pre-commit: `bun run .librarian/scripts/rollback.ts --list`

---

- [ ] 8. Create config validation scripts

  **What to do**:
  - Create `.librarian/scripts/validate_config.ts` that:
    - Validates `.librarian/config/routing.json` against schema
    - Validates `.librarian/config/capabilities.json` against schema
    - Validates `.librarian/config/audit_policy.json` (created in this task) against schema
    - Checks for: valid JSON, required fields present, no conflicting routes, schema version compatibility
    - Returns exit code 0 if valid, 1 with error message if invalid
  - Create `.librarian/config/audit_policy.json`:
    ```json
    {
      "schedule": "quarterly",
      "frequency_days": 90,
      "thresholds": {
        "min_failures_for_gap": 3,
        "min_confidence_for_routing": 0.7,
        "max_mcp_additions_per_cycle": 1
      },
      "analysis_window_days": 30,
      "reporting_verbosity": "detailed"
    }
    ```
  - Make runnable: `bun run .librarian/scripts/validate_config.ts` (checks all configs)

  **Must NOT do**:
  - Do NOT modify configs during validation (read-only checks)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Schema validation, conflict detection, version checking
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - All skills lack domain overlap with validation logic

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 6, 7)
  - **Blocks**: Task 11 (integration tests use validation)
  - **Blocked By**: Task 1 (needs directory structure)

  **References**:
  - **Schema Reference**: `.librarian/schemas/*.schema.json` (Task 2)
  - **Config Files**: routing.json (Task 6), capabilities.json (Task 5)
  - **Librarian Design**: Audit policy structure from session `ses_3d3db365affeMFlITazSNQSOrC`

  **Acceptance Criteria**:

  \`\`\`
  Scenario: Validate valid config files
    Tool: Bash
    Preconditions: Tasks 5, 6 completed (config files exist)
    Steps:
      1. bun run .librarian/scripts/validate_config.ts
      2. Assert: Exit code 0
      3. bun run .librarian/scripts/validate_config.ts 2>&1 | grep "All configs valid"
      4. Assert: Success message present
    Expected Result: All configs pass validation
    Evidence: Exit code 0, success message

  Scenario: Detect invalid config (malformed JSON)
    Tool: Bash
    Preconditions: Task 1 completed
    Steps:
      1. echo '{invalid json' > .librarian/config/routing.json
      2. bun run .librarian/scripts/validate_config.ts
      3. Assert: Exit code 1 (validation failed)
      4. bun run .librarian/scripts/validate_config.ts 2>&1 | grep "routing.json: Invalid JSON"
      5. Assert: Error message identifies the problem
    Expected Result: Validation fails with clear error
    Evidence: Exit code 1, error message

  Scenario: Detect conflicting routes
    Tool: Bash
    Preconditions: Task 6 completed
    Steps:
      1. echo '{"schema_version":"v1.0.0","routes":[{"intent":"docs","tool":"context7"},{"intent":"docs","tool":"websearch"}]}' > .librarian/config/routing.json
      2. bun run .librarian/scripts/validate_config.ts
      3. Assert: Exit code 1 (conflict detected)
      4. bun run .librarian/scripts/validate_config.ts 2>&1 | grep "Conflicting routes for intent 'docs'"
      5. Assert: Conflict error message present
    Expected Result: Conflict detected and reported
    Evidence: Exit code 1, conflict error message
  \`\`\`

  **Commit**: YES
  - Message: `feat(librarian): add config validation with conflict detection`
  - Files: `.librarian/scripts/validate_config.ts`, `.librarian/config/audit_policy.json`
  - Pre-commit: `bun run .librarian/scripts/validate_config.ts`

---

- [ ] 9. Integrate Context7 MCP

  **What to do**:
  - Install Context7 MCP: `npm install @upstash/context7-mcp` (or appropriate package manager)
  - Create `.librarian/scripts/context7_client.ts`:
    - Wrapper for Context7 MCP calls
    - Takes query + libraryId as input
    - Returns versioned documentation snippets
    - Handles errors (rate limits, timeouts, API failures) with fallback to websearch
    - Logs calls to `.librarian/logs/tool_metrics.jsonl` (tool name, latency, status)
  - Update `.librarian/config/routing.json` to route versioned doc queries to context7
  - Test with real query: `echo '{"query":"React 18 hooks","libraryId":"/facebook/react@18"}' | bun run .librarian/scripts/context7_client.ts`

  **Must NOT do**:
  - Do NOT hardcode API keys (use environment variables: `CONTEXT7_API_KEY`)
  - Do NOT skip error handling (rate limits, timeouts)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: External API integration with auth, error handling, logging
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - `playwright`: Not needed - API integration, not browser
    - `dev-browser`: Not needed - API calls, not web automation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Task 10)
  - **Blocks**: Task 11 (integration tests validate MCP calls)
  - **Blocked By**: Task 6 (needs routing config)

  **References**:
  - **External Documentation**: Context7 API docs at `https://context7.com/docs/api-guide` (from web research)
  - **Schema Reference**: `.librarian/schemas/tool_metrics.schema.json` (Task 2) for logging calls
  - **Config Reference**: `.librarian/config/routing.json` (Task 6) to add context7 route

  **Acceptance Criteria**:

  \`\`\`
  Scenario: Context7 MCP returns documentation for valid query
    Tool: Bash
    Preconditions: CONTEXT7_API_KEY environment variable set
    Steps:
      1. echo '{"query":"useState hook","libraryId":"/facebook/react@18"}' | bun run .librarian/scripts/context7_client.ts
      2. Assert: Exit code 0
      3. echo '{"query":"useState hook","libraryId":"/facebook/react@18"}' | bun run .librarian/scripts/context7_client.ts | jq '.results | length'
      4. Assert: Output > 0 (results array non-empty)
      5. tail -1 .librarian/logs/tool_metrics.jsonl | jq '.tool'
      6. Assert: Output is "context7"
    Expected Result: Valid documentation snippets returned and logged
    Evidence: Non-empty results, tool_metrics.jsonl entry

  Scenario: Context7 MCP handles missing API key gracefully
    Tool: Bash
    Preconditions: CONTEXT7_API_KEY unset
    Steps:
      1. unset CONTEXT7_API_KEY
      2. echo '{"query":"test"}' | bun run .librarian/scripts/context7_client.ts
      3. Assert: Exit code 1 (error)
      4. echo '{"query":"test"}' | bun run .librarian/scripts/context7_client.ts 2>&1 | grep "CONTEXT7_API_KEY"
      5. Assert: Error message mentions missing API key
    Expected Result: Clear error message for missing credentials
    Evidence: Exit code 1, error message

  Scenario: Routing redirects version queries to Context7
    Tool: Bash
    Preconditions: Task 6 completed, routing.json updated
    Steps:
      1. echo '{"query":"How to use useState in React 18?"}' | bun run .librarian/scripts/route_query.ts | jq '.tool'
      2. Assert: Output is "context7"
    Expected Result: Version query routed to Context7
    Evidence: Routing decision shows tool="context7"
  \`\`\`

  **Commit**: YES
  - Message: `feat(librarian): integrate Context7 MCP for versioned documentation`
  - Files: `.librarian/scripts/context7_client.ts`, `package.json` (dependencies), `.librarian/config/routing.json` (updated)
  - Pre-commit: `echo '{"query":"test"}' | bun run .librarian/scripts/context7_client.ts || echo "API key not set (expected in CI)"`

---

- [ ] 10. Integrate Package Registry MCP

  **What to do**:
  - Install Package Registry MCP: `npm install package-registry-mcp` or clone from `Artmann/package-registry-mcp`
  - Create `.librarian/scripts/package_registry_client.ts`:
    - Wrapper for Package Registry MCP calls
    - Takes query + ecosystem (npm | PyPI | crates.io) as input
    - Returns package search results with metadata (name, description, latest version, deprecated status)
    - Handles errors with fallback
    - Logs calls to `.librarian/logs/tool_metrics.jsonl`
  - Update `.librarian/config/routing.json` to route package queries to package_registry
  - Test with real query: `echo '{"query":"authentication","ecosystem":"npm"}' | bun run .librarian/scripts/package_registry_client.ts`

  **Must NOT do**:
  - Do NOT hardcode ecosystem (support npm, PyPI, crates.io dynamically)
  - Do NOT skip deprecation checks (important metadata)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: External MCP integration with multi-ecosystem support
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - All skills lack domain overlap with package registry integration

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Task 9)
  - **Blocks**: Task 11 (integration tests validate MCP calls)
  - **Blocked By**: Task 6 (needs routing config)

  **References**:
  - **External Repository**: `Artmann/package-registry-mcp` on GitHub (from research findings)
  - **Schema Reference**: `.librarian/schemas/tool_metrics.schema.json` (Task 2)
  - **Config Reference**: `.librarian/config/routing.json` (Task 6)

  **Acceptance Criteria**:

  \`\`\`
  Scenario: Package Registry MCP returns npm packages
    Tool: Bash
    Preconditions: Package Registry MCP installed
    Steps:
      1. echo '{"query":"express","ecosystem":"npm"}' | bun run .librarian/scripts/package_registry_client.ts
      2. Assert: Exit code 0
      3. echo '{"query":"express","ecosystem":"npm"}' | bun run .librarian/scripts/package_registry_client.ts | jq '.results[0].name'
      4. Assert: Output contains "express"
      5. tail -1 .librarian/logs/tool_metrics.jsonl | jq '.tool'
      6. Assert: Output is "package_registry"
    Expected Result: Express package found and logged
    Evidence: results[0].name="express", tool_metrics.jsonl entry

  Scenario: Package Registry MCP searches PyPI
    Tool: Bash
    Preconditions: MCP installed
    Steps:
      1. echo '{"query":"flask","ecosystem":"PyPI"}' | bun run .librarian/scripts/package_registry_client.ts | jq '.results[0].name'
      2. Assert: Output contains "flask"
    Expected Result: Flask package found in PyPI
    Evidence: results contain flask

  Scenario: Routing redirects package queries to Package Registry
    Tool: Bash
    Preconditions: Task 6 completed, routing.json updated
    Steps:
      1. echo '{"query":"npm packages for authentication"}' | bun run .librarian/scripts/route_query.ts | jq '.tool'
      2. Assert: Output is "package_registry"
    Expected Result: Package query routed correctly
    Evidence: tool="package_registry"
  \`\`\`

  **Commit**: YES
  - Message: `feat(librarian): integrate Package Registry MCP for npm/PyPI search`
  - Files: `.librarian/scripts/package_registry_client.ts`, `package.json`, `.librarian/config/routing.json` (updated)
  - Pre-commit: `echo '{"query":"test","ecosystem":"npm"}' | bun run .librarian/scripts/package_registry_client.ts || echo "MCP not configured (expected in CI)"`

---

- [ ] 11. Build integration test suite

  **What to do**:
  - Create `.librarian/tests/integration.test.ts` using bun:test:
    - Test 1: Full audit cycle (simulate failure → detect gap → generate audit)
    - Test 2: Routing redirects queries correctly (version → context7, package → package_registry)
    - Test 3: Rollback restores previous config
    - Test 4: Gap detection respects evidence threshold (1 failure = no gap, 3 failures = gap flagged)
    - Test 5: Config validation catches conflicts and invalid JSON
    - Test 6: MCP calls log to tool_metrics.jsonl correctly
  - Use test fixtures in `.librarian/tests/fixtures/` (sample JSONL logs, configs)
  - Make runnable: `bun test .librarian/tests/integration.test.ts`
  - All tests must pass for task completion

  **Must NOT do**:
  - Do NOT use real API keys in tests (mock MCP calls or use test mode)
  - Do NOT leave failing tests (all must pass)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Complex integration testing across multiple components
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - `playwright`: Not needed - backend testing, not UI
    - `git-master`: Not relevant to testing logic

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 12, 13)
  - **Blocks**: None (final validation)
  - **Blocked By**: Tasks 3, 4, 5, 6, 7, 8, 9, 10 (all core functionality must exist)

  **References**:
  - **Test Framework**: bun:test documentation
  - **All Previous Scripts**: Tasks 3-10 created the scripts being tested

  **Acceptance Criteria**:

  \`\`\`
  Scenario: All integration tests pass
    Tool: Bash
    Preconditions: All previous tasks completed
    Steps:
      1. bun test .librarian/tests/integration.test.ts
      2. Assert: Exit code 0 (all tests pass)
      3. bun test .librarian/tests/integration.test.ts 2>&1 | grep "6 passed"
      4. Assert: Output shows "6 passed" (all 6 tests succeeded)
    Expected Result: Complete integration test suite passes
    Evidence: Exit code 0, "6 passed" message

  Scenario: Audit cycle test validates full workflow
    Tool: Bash
    Preconditions: Test suite exists
    Steps:
      1. bun test .librarian/tests/integration.test.ts --test-name-pattern="audit cycle"
      2. Assert: Exit code 0
    Expected Result: Audit cycle test passes
    Evidence: Test passes

  Scenario: Routing test validates query redirection
    Tool: Bash
    Preconditions: Test suite exists
    Steps:
      1. bun test .librarian/tests/integration.test.ts --test-name-pattern="routing"
      2. Assert: Exit code 0
    Expected Result: Routing test passes
    Evidence: Test passes
  \`\`\`

  **Commit**: YES
  - Message: `test(librarian): add integration test suite for self-improvement system`
  - Files: `.librarian/tests/integration.test.ts`, `.librarian/tests/fixtures/*`
  - Pre-commit: `bun test .librarian/tests/integration.test.ts`

---

- [ ] 12. Create MCP discovery client

  **What to do**:
  - Create `.librarian/scripts/discover_mcps.ts` that:
    - Queries `https://registry.modelcontextprotocol.io/` (or local MCP registry API)
    - Searches MCPs by capability tags (e.g., "versioned-docs", "package-registry", "semantic-search")
    - Filters results by: active maintenance, security review status, compatibility
    - Outputs list of candidate MCPs to `.librarian/logs/capability_requests.jsonl`
    - Does NOT install MCPs automatically (recommendation only)
  - Make runnable: `bun run .librarian/scripts/discover_mcps.ts --capability="semantic-search"`
  - Handles API failures gracefully (offline mode: use cached registry data)

  **Must NOT do**:
  - Do NOT install MCPs (discovery only)
  - Do NOT require internet connectivity (support offline mode)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: External API integration with caching, filtering, error handling
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - All skills lack domain overlap

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 11, 13)
  - **Blocks**: None (optional enhancement)
  - **Blocked By**: None (independent utility)

  **References**:
  - **External API**: MCP registry at `https://registry.modelcontextprotocol.io/` (from research)
  - **Schema Reference**: `.librarian/schemas/capability_requests.schema.json` (Task 2)

  **Acceptance Criteria**:

  \`\`\`
  Scenario: Discover MCPs by capability tag
    Tool: Bash
    Preconditions: Internet connectivity available
    Steps:
      1. bun run .librarian/scripts/discover_mcps.ts --capability="versioned-docs"
      2. Assert: Exit code 0
      3. bun run .librarian/scripts/discover_mcps.ts --capability="versioned-docs" | jq '.candidates | length'
      4. Assert: Output > 0 (found at least one candidate)
      5. tail -1 .librarian/logs/capability_requests.jsonl | jq '.capability'
      6. Assert: Output is "versioned-docs"
    Expected Result: MCP candidates discovered and logged
    Evidence: capability_requests.jsonl entry

  Scenario: Handle offline mode gracefully
    Tool: Bash
    Preconditions: No internet connectivity (simulated)
    Steps:
      1. bun run .librarian/scripts/discover_mcps.ts --capability="test" --offline
      2. Assert: Exit code 0 (graceful degradation)
      3. bun run .librarian/scripts/discover_mcps.ts --capability="test" --offline 2>&1 | grep "Using cached registry"
      4. Assert: Offline mode message present
    Expected Result: Offline mode uses cached data
    Evidence: Cached registry message
  \`\`\`

  **Commit**: YES
  - Message: `feat(librarian): add MCP discovery client with registry search`
  - Files: `.librarian/scripts/discover_mcps.ts`
  - Pre-commit: `bun run .librarian/scripts/discover_mcps.ts --capability="test" --offline || echo "Offline mode (expected)"`

---

- [ ] 13. Document self-improvement protocol

  **What to do**:
  - Create `.librarian/docs/SELF_IMPROVEMENT_PROTOCOL.md`:
    - Overview of system architecture
    - How to trigger audits (manual vs scheduled)
    - How to interpret audit reports
    - How to approve capability requests (MCP installation process)
    - Rollback procedure
    - Autonomy boundaries (what librarian can/cannot do without approval)
    - Troubleshooting guide
  - Create `.librarian/docs/ARCHITECTURE.md`:
    - Directory structure explanation
    - File schemas (link to `.librarian/schemas/`)
    - Component descriptions (audit generator, gap detector, router, etc.)
    - Data flow diagrams (failure → classification → gap detection → audit → recommendations)
  - Create `.librarian/docs/QUICKSTART.md`:
    - Enable self-improvement: `export LIBRARIAN_SELF_IMPROVE=1`
    - Run first audit: `bun run .librarian/scripts/generate_audit.ts`
    - Review audit: `cat .librarian/audits/audit-latest.md`
    - Approve MCP: step-by-step guide

  **Must NOT do**:
  - Do NOT skip autonomy boundary documentation (critical for safety)
  - Do NOT omit rollback procedure (required per Metis)

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Documentation task, prose-heavy with technical detail
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - All skills lack domain overlap with documentation writing

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 11, 12)
  - **Blocks**: None (documentation)
  - **Blocked By**: None (can reference completed tasks)

  **References**:
  - **All Previous Tasks**: Documentation describes the system built in Tasks 1-12
  - **Librarian Design**: Protocol details from session `ses_3d3db365affeMFlITazSNQSOrC`
  - **Metis Directives**: Autonomy boundaries, rollback requirements from session `ses_3d3d37e6cffebw4QpZUNx2Kw1i`

  **Acceptance Criteria**:

  \`\`\`
  Scenario: Documentation exists and is readable
    Tool: Bash
    Preconditions: None
    Steps:
      1. cat .librarian/docs/SELF_IMPROVEMENT_PROTOCOL.md | wc -l
      2. Assert: Output > 50 (substantial documentation)
      3. cat .librarian/docs/ARCHITECTURE.md | grep "directory structure"
      4. Assert: Contains architecture explanation
      5. cat .librarian/docs/QUICKSTART.md | grep "bun run"
      6. Assert: Contains executable commands
    Expected Result: Complete documentation with commands and explanations
    Evidence: 3 doc files exist, non-trivial content

  Scenario: Documentation mentions autonomy boundaries
    Tool: Bash
    Preconditions: Task 13 in progress
    Steps:
      1. cat .librarian/docs/SELF_IMPROVEMENT_PROTOCOL.md | grep -i "autonomy"
      2. Assert: Contains "autonomy" keyword (exit code 0)
      3. cat .librarian/docs/SELF_IMPROVEMENT_PROTOCOL.md | grep "human approval"
      4. Assert: Mentions approval requirement
    Expected Result: Autonomy boundaries clearly documented
    Evidence: Keywords present

  Scenario: Documentation includes rollback procedure
    Tool: Bash
    Preconditions: Task 13 in progress
    Steps:
      1. cat .librarian/docs/SELF_IMPROVEMENT_PROTOCOL.md | grep -i "rollback"
      2. Assert: Contains "rollback" section
      3. cat .librarian/docs/SELF_IMPROVEMENT_PROTOCOL.md | grep "bun run .librarian/scripts/rollback.ts"
      4. Assert: Includes rollback command
    Expected Result: Rollback procedure documented with command
    Evidence: Rollback section exists
  \`\`\`

  **Commit**: YES
  - Message: `docs(librarian): add self-improvement protocol documentation`
  - Files: `.librarian/docs/SELF_IMPROVEMENT_PROTOCOL.md`, `.librarian/docs/ARCHITECTURE.md`, `.librarian/docs/QUICKSTART.md`
  - Pre-commit: `cat .librarian/docs/*.md | wc -l`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(librarian): initialize self-improvement directory structure` | `.librarian/`, `.gitignore` | `ls -la .librarian/` |
| 2 | `feat(librarian): define JSONL schemas for self-improvement logs` | `.librarian/schemas/*.schema.json` | `cat .librarian/schemas/*.schema.json \| jq '.'` |
| 3 | `feat(librarian): implement audit report generator (Phase 1a)` | `.librarian/scripts/generate_audit.ts` | `bun run .librarian/scripts/generate_audit.ts` |
| 4 | `feat(librarian): implement failure classifier with severity scoring` | `.librarian/scripts/classify_failure.ts` | `echo '{}' \| bun run .librarian/scripts/classify_failure.ts` |
| 5 | `feat(librarian): implement gap detector with evidence thresholds (Phase 1b)` | `.librarian/scripts/detect_gaps.ts`, `.librarian/config/capabilities.json` | `bun run .librarian/scripts/detect_gaps.ts --dry-run` |
| 6 | `feat(librarian): implement tool router with fallback logic (Phase 1c)` | `.librarian/scripts/route_query.ts`, `.librarian/config/routing.json` | `echo '{}' \| bun run .librarian/scripts/route_query.ts` |
| 7 | `feat(librarian): implement config rollback mechanism with auto-backup` | `.librarian/scripts/rollback.ts`, `.librarian/scripts/backup_config.ts` | `bun run .librarian/scripts/rollback.ts --list` |
| 8 | `feat(librarian): add config validation with conflict detection` | `.librarian/scripts/validate_config.ts`, `.librarian/config/audit_policy.json` | `bun run .librarian/scripts/validate_config.ts` |
| 9 | `feat(librarian): integrate Context7 MCP for versioned documentation` | `.librarian/scripts/context7_client.ts`, `package.json`, routing.json | `echo '{}' \| bun run .librarian/scripts/context7_client.ts` |
| 10 | `feat(librarian): integrate Package Registry MCP for npm/PyPI search` | `.librarian/scripts/package_registry_client.ts`, `package.json`, routing.json | `echo '{}' \| bun run .librarian/scripts/package_registry_client.ts` |
| 11 | `test(librarian): add integration test suite for self-improvement system` | `.librarian/tests/integration.test.ts` | `bun test .librarian/tests/integration.test.ts` |
| 12 | `feat(librarian): add MCP discovery client with registry search` | `.librarian/scripts/discover_mcps.ts` | `bun run .librarian/scripts/discover_mcps.ts --offline` |
| 13 | `docs(librarian): add self-improvement protocol documentation` | `.librarian/docs/*.md` | `cat .librarian/docs/*.md \| wc -l` |

---

## Success Criteria

### Verification Commands
```bash
# Phase 1a: Audit generation works
bun run .librarian/scripts/generate_audit.ts
cat .librarian/audits/audit-$(date +%Y-%m-%d).json | jq '.gaps | length'
# Expected: Valid JSON, gaps array exists

# Phase 1b: Gap detection identifies missing capabilities
echo '{"timestamp":"2026-02-05T01:00:00Z","failure_type":"wrong_version","severity":"high","intent":"docs"}' > .librarian/logs/failures.jsonl
echo '{"timestamp":"2026-02-05T02:00:00Z","failure_type":"wrong_version","severity":"high","intent":"docs"}' >> .librarian/logs/failures.jsonl
echo '{"timestamp":"2026-02-05T03:00:00Z","failure_type":"wrong_version","severity":"high","intent":"docs"}' >> .librarian/logs/failures.jsonl
bun run .librarian/scripts/detect_gaps.ts
tail -1 .librarian/logs/gaps.jsonl | jq '.gap_type'
# Expected: "versioned_docs" (threshold N=3 met)

# Phase 1c: Routing redirects queries correctly
echo '{"query":"How to use useState in React 18?"}' | bun run .librarian/scripts/route_query.ts | jq '.tool'
# Expected: "context7"

# Phase 2: MCPs integrated
echo '{"query":"useState hook","libraryId":"/facebook/react@18"}' | bun run .librarian/scripts/context7_client.ts | jq '.results | length'
# Expected: > 0 (results returned)

echo '{"query":"express","ecosystem":"npm"}' | bun run .librarian/scripts/package_registry_client.ts | jq '.results[0].name'
# Expected: "express"

# Rollback mechanism works
cp .librarian/config/routing.json .librarian/config/routing.backup.json
echo '{"invalid":"config"}' > .librarian/config/routing.json
bun run .librarian/scripts/rollback.ts --target=routing.json
diff .librarian/config/routing.json .librarian/config/routing.backup.json
# Expected: exit code 0 (files identical)

# Integration tests pass
bun test .librarian/tests/integration.test.ts
# Expected: "6 passed"
```

### Final Checklist
- [ ] `.librarian/` directory structure complete with all subdirectories
- [ ] All JSONL schemas defined and validate correctly
- [ ] Audit generator produces valid reports for empty and populated logs
- [ ] Failure classifier assigns correct types and severity
- [ ] Gap detector respects evidence threshold (N=3)
- [ ] Tool router selects correct tools based on query intent
- [ ] Rollback mechanism restores previous configs
- [ ] Config validation catches conflicts and invalid JSON
- [ ] Context7 MCP returns versioned documentation
- [ ] Package Registry MCP searches npm/PyPI successfully
- [ ] All integration tests pass (6/6)
- [ ] Documentation complete (protocol, architecture, quickstart)
- [ ] Autonomy boundaries clearly documented (librarian can RECOMMEND, not EXECUTE)
- [ ] No manual verification steps (all QA is agent-executed)
