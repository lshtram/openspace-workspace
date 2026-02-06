# Prometheus Surgical Improvements

## TL;DR

> **Quick Summary**: Expand Prometheus file permissions to author requirements and guidelines directly, eliminating handoff overhead while maintaining strict safety boundaries.
> 
> **Deliverables**:
> - Expanded file permissions: `docs/requirements/`, `.agent/`, `docs/` (markdown only)
> - `.prometheus/` directory for planning templates and basic tooling
> - Requirements authoring toolkit with validation
> - Template library for common planning tasks
> - Updated file naming guideline (first real use case)
> 
> **Estimated Effort**: Short (1-2 weeks)
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 (permissions) → Task 2 (templates) → Task 5 (first use case)

---

## Context

### Original Request
User identified two critical issues:
1. **File naming problem**: Requirements files use numbered names (e.g., `REQ-CORE-001-through-039.md`) requiring renaming when requirements expand
2. **Capability gap**: Prometheus cannot write requirements or guidelines directly, creating handoff overhead

### Interview Summary
**Key Discussions**:
- **Current constraint**: Prometheus restricted to `.sisyphus/*.md` only (enforced by `prometheus-md-only` hook)
- **Failure mode**: Requirements documentation requires Sisyphus handoff instead of direct authoring
- **User insight**: Requirements/guidelines ARE planning artifacts (logical fit for Prometheus to author)

**Identified Gaps**:
- Prometheus cannot update guidelines when patterns are discovered
- Prometheus cannot create requirements files directly during planning sessions
- No template library for common planning scenarios

---

## Work Objectives

### Core Objective
Expand Prometheus capabilities to author requirements and guidelines directly while maintaining strict safety boundaries (NO code execution).

### Concrete Deliverables
- Updated `.opencode/hooks/prometheus-md-only/main.ts` with expanded permissions
- `.prometheus/` directory for planning artifacts and templates
- `.prometheus/templates/` - requirement, guideline, ADR, work plan templates
- `.prometheus/scripts/` - requirement creation and validation toolkit
- Updated file naming guideline in `docs/requirements/DOCUMENTATION_PROCESS.md`

### Definition of Done
- [ ] Prometheus can create/edit files in `docs/requirements/`, `.agent/`, `docs/` (markdown only)
- [ ] File naming guideline updated to semantic names (verified by reading guideline file)
- [ ] Template library covers 4+ common planning scenarios
- [ ] Requirements toolkit can generate and validate requirement files

### Must Have
- **Surgical permission expansion**: Only markdown files in specific directories (requirements, guidelines, docs)
- **Code execution forbidden**: Prometheus CANNOT write TypeScript, JavaScript, Python, config files
- **Template-driven authoring**: Common planning tasks use vetted templates
- **Validation before write**: Requirements must pass validation checks

### Must NOT Have (Guardrails)
- **NO source code access** - TypeScript, JavaScript, Python, Go, any programming language
- **NO config file modification** - package.json, tsconfig.json, .gitignore (except specific cases)
- **NO execution permission** - Prometheus NEVER runs code, only writes markdown
- **NO unbounded permission creep** - Explicit whitelist of allowed paths, explicit blacklist of forbidden paths
- **NO self-modifying hooks** - Prometheus cannot edit the `prometheus-md-only` hook itself

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure exists**: NO (building from scratch)
- **Automated tests**: Tests-after (verification scenarios per task)
- **Framework**: Bash commands (file checks, grep, hook simulation)

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

Each task includes specific QA scenarios executed by the agent using:
- **Bash**: File permission checks, grep verification, hook simulation

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately - Permission Expansion):
├── Task 1: Update prometheus-md-only hook with expanded permissions
└── Task 2: Create .prometheus/ directory structure

Wave 2 (After Wave 1 - Tooling):
├── Task 3: Build template library for common planning tasks
└── Task 4: Create requirements authoring toolkit

Wave 3 (After Wave 2 - First Use Case):
└── Task 5: Update file naming guideline (demonstrates new capability)

Critical Path: Task 1 → Task 3 → Task 4 → Task 5
Parallel Speedup: ~30% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 3, 4, 5 | 2 |
| 2 | None | 3, 4 | 1 |
| 3 | 1, 2 | 4, 5 | 4 |
| 4 | 1, 2, 3 | 5 | 3 (partially) |
| 5 | 1, 3, 4 | None | None |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 2 | category="deep" (hook) + category="quick" (directory) |
| 2 | 3, 4 | category="deep" (templates, toolkit) |
| 3 | 5 | category="quick" (guideline edit) |

---

## TODOs

- [ ] 1. Update prometheus-md-only hook with expanded permissions

  **What to do**:
  - Edit `.opencode/hooks/prometheus-md-only/main.ts`:
    - Add ALLOWED_PATHS array: `docs/requirements/`, `.agent/`, `docs/`, `.prometheus/`
    - Add FORBIDDEN_PATHS array: `src/`, `app/`, `api/`, any TypeScript/JavaScript/Python files
    - Update validation logic to check file extension (must be `.md`) AND path whitelist
    - Add basic audit logging: console.log operations with timestamp, path, operation type
  - Test hook with sample Write attempts:
    - `docs/requirements/test.md` → ALLOW
    - `src/test.ts` → BLOCK
    - `.agent/GUIDELINES.md` → ALLOW
    - `package.json` → BLOCK

  **Must NOT do**:
  - Do NOT allow ANY non-markdown files (strict `.md` extension check)
  - Do NOT allow modification of the hook itself (self-modification prevention)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: TypeScript hook modification with security implications, validation logic
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - `git-master`: Not needed for single file edit

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Tasks 3, 4, 5 (all require new permissions)
  - **Blocked By**: None (can start immediately)

  **References**:
  - **Current Hook**: `.opencode/hooks/prometheus-md-only/main.ts` (read this first to understand current logic)
  - **Pattern Reference**: Other hooks in `.opencode/hooks/` for error message patterns

  **Acceptance Criteria**:

  ```
  Scenario: Prometheus can write to allowed paths (requirements)
    Tool: Bash
    Preconditions: Hook updated and active
    Steps:
      1. Simulate hook check: bun run .opencode/hooks/prometheus-md-only/main.ts --path="docs/requirements/test.md" --operation="write"
      2. Assert: Exit code 0 (allowed)
    Expected Result: Requirements path allowed
    Evidence: Hook allows operation

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
  ```

  **Commit**: YES
  - Message: `feat(prometheus): expand file permissions for requirements/guidelines authoring`
  - Files: `.opencode/hooks/prometheus-md-only/main.ts`
  - Pre-commit: `bun run .opencode/hooks/prometheus-md-only/main.ts --path="docs/requirements/test.md" --operation="write"`

---

- [ ] 2. Create .prometheus/ directory structure

  **What to do**:
  - Create directory hierarchy:
    - `.prometheus/templates/` - requirement.md, guideline.md, adr.md, work-plan.md templates
    - `.prometheus/scripts/` - toolkit scripts (TypeScript)
    - `.prometheus/docs/` - usage documentation
  - Add `.gitignore` entry: `.prometheus/logs/` (if logs added later)
  - Create `.prometheus/README.md` explaining purpose and structure

  **Must NOT do**:
  - Do NOT create log files yet (keeping it simple)
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
  - **Blocks**: Tasks 3, 4 (require directory structure)
  - **Blocked By**: None (can start immediately)

  **References**:
  - **Pattern Reference**: `.librarian/` directory structure (similar organization)

  **Acceptance Criteria**:

  ```
  Scenario: Directory structure created correctly
    Tool: Bash
    Preconditions: None
    Steps:
      1. ls -la .prometheus/
      2. Assert: Directory exists (exit code 0)
      3. ls -la .prometheus/templates/ .prometheus/scripts/ .prometheus/docs/
      4. Assert: All 3 subdirectories exist (exit code 0)
      5. cat .prometheus/README.md
      6. Assert: File exists and contains "planning" (non-empty)
    Expected Result: Complete directory hierarchy with README
    Evidence: All directories exist, README created
  ```

  **Commit**: YES
  - Message: `feat(prometheus): initialize planning toolkit directory structure`
  - Files: `.prometheus/`, `.prometheus/README.md`
  - Pre-commit: `ls -la .prometheus/`

---

- [ ] 3. Build template library for common planning tasks

  **What to do**:
  - Create template files in `.prometheus/templates/`:
    - `requirement-template.md` - Standard requirement format (ID, category, priority, description, acceptance criteria)
    - `guideline-template.md` - Behavioral guideline format (rule, rationale, examples)
    - `adr-template.md` - Architecture Decision Record format (context, decision, consequences)
    - `work-plan-template.md` - Standard work plan structure (TL;DR, context, objectives, TODOs, verification, commit strategy)
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
  - **Parallel Group**: Wave 2 (with Task 4)
  - **Blocks**: Task 4, 5 (requirements toolkit uses templates; guideline update uses template)
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
      2. Assert: At least 4 .md files exist
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

- [ ] 4. Create requirements authoring toolkit

  **What to do**:
  - Create `.prometheus/scripts/create_requirement.ts`:
    - Takes requirement metadata as input: ID, category, priority, title, description, acceptance criteria
    - Uses requirement template from Task 3
    - Validates requirement format (all required fields present)
    - Outputs filled requirement markdown
    - Does NOT write file directly (returns content for Prometheus to write)
  - Create `.prometheus/scripts/validate_requirement.ts`:
    - Reads requirement markdown file
    - Validates: ID format, required sections present, acceptance criteria are testable
    - Returns validation report with errors/warnings
  - Make runnable:
    - `bun run .prometheus/scripts/create_requirement.ts --id=REQ-CORE-040 --category=Artifacts --priority=High --title="Session persistence" --description="..." --criteria="..."`
    - `bun run .prometheus/scripts/validate_requirement.ts --file=docs/requirements/official/REQ-CORE-modalities.md`

  **Must NOT do**:
  - Do NOT write files directly (toolkit generates content, Prometheus writes it)
  - Do NOT skip validation (always validate before writing)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex validation logic, template integration
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - All skills lack domain overlap

  **Parallelization**:
  - **Can Run In Parallel**: YES (partially - depends on Task 3)
  - **Parallel Group**: Wave 2 (with Task 3)
  - **Blocks**: Task 5 (first use case)
  - **Blocked By**: Tasks 1, 2, 3 (needs permissions, directory, templates)

  **References**:
  - **Template**: `.prometheus/templates/requirement-template.md` (Task 3)
  - **Requirement Format**: `docs/requirements/official/REQ-CORE-001-through-039.md` - validation rules derived from this

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
  - Files: `.prometheus/scripts/create_requirement.ts`, `.prometheus/scripts/validate_requirement.ts`
  - Pre-commit: `bun run .prometheus/scripts/create_requirement.ts --id=TEST --category=Test --priority=High --title="Test" --description="Test" | bun run .prometheus/scripts/validate_requirement.ts --stdin`

---

- [ ] 5. Update file naming guideline (first real use case)

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
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (final task)
  - **Blocks**: None (demonstrates capability)
  - **Blocked By**: Tasks 1, 3, 4 (needs permissions and toolkit)

  **References**:
  - **File to Edit**: `docs/requirements/DOCUMENTATION_PROCESS.md` line 36

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
    Expected Result: Guideline updated correctly
    Evidence: File contains new format, examples

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

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(prometheus): expand file permissions for requirements/guidelines authoring` | `.opencode/hooks/prometheus-md-only/main.ts` | Hook allows docs/requirements/*.md |
| 2 | `feat(prometheus): initialize planning toolkit directory structure` | `.prometheus/`, README | Directory structure exists |
| 3 | `feat(prometheus): add template library for requirements, guidelines, ADRs, plans` | `.prometheus/templates/*.md`, scripts | Template instantiation works |
| 4 | `feat(prometheus): add requirements authoring toolkit with validation` | scripts | Requirement generated and validated |
| 5 | `docs(requirements): update naming convention to semantic names` | `docs/requirements/DOCUMENTATION_PROCESS.md` | Semantic naming rule present |

---

## Success Criteria

### Verification Commands
```bash
# Verify expanded permissions
bun run .opencode/hooks/prometheus-md-only/main.ts --path="docs/requirements/test.md" --operation="write"  # Should ALLOW
bun run .opencode/hooks/prometheus-md-only/main.ts --path="src/test.ts" --operation="write"  # Should BLOCK

# Verify template system
bun run .prometheus/scripts/instantiate_template.ts --template=requirement --id=REQ-TEST-001 --title="Test"

# Verify requirements toolkit
bun run .prometheus/scripts/create_requirement.ts --id=REQ-TEST-001 --category=Test --priority=High --title="Test" --description="Test"
echo "# REQ-TEST\n## Description\nTest" | bun run .prometheus/scripts/validate_requirement.ts --stdin

# Verify guideline update
cat docs/requirements/DOCUMENTATION_PROCESS.md | grep "SEMANTIC-NAME"
```

### Final Checklist
- [ ] Prometheus can create requirement files in `docs/requirements/` (verified by successful write)
- [ ] Prometheus can update guidelines in `.agent/` (verified by DOCUMENTATION_PROCESS.md edit)
- [ ] File naming guideline updated (verified by grep for "SEMANTIC-NAME")
- [ ] Template library created (verified by 4+ templates in .prometheus/templates/)
- [ ] Requirements toolkit functional (verified by create + validate commands)
