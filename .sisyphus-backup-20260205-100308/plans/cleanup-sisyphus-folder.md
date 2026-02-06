# Cleanup .sisyphus Folder and Prepare for Fresh Work

## TL;DR

> **Quick Summary**: Clean up confused .sisyphus state (multi-session conflicts, missing directories, non-existent plan references) and establish proper structure for executing prometheus-surgical-improvements plan.
> 
> **Deliverables**:
> - Backed up and cleared .sisyphus folder
> - Proper directory structure created (plans/, boulders/, drafts/, evidence/, logs/)
> - prometheus-surgical-improvements.md moved to correct location
> - Single clean boulder ready for /start-work
> - Extracted valuable learnings from blocked plan-002
> 
> **Estimated Effort**: Quick (15 minutes)
> **Parallel Execution**: NO - Sequential cleanup required
> **Critical Path**: Backup → Clear → Recreate Structure → Move Plan → Verify

---

## Context

### Original Request
User reported:
1. Multiple plans running in different sessions (confused boulder system)
2. Missing tools problems
3. Conflicting plans
4. Wants to start fresh with `prometheus-surgical-improvements.md` plan

### Explore Agent Findings

**Current State Issues**:
- `.sisyphus/` folder in confused, non-standard state
- `boulder.json` at root (should be in `boulders/` subdirectory)
- Boulder references NON-EXISTENT path: `/Users/Shared/dev/openspace/.sisyphus/plans/prometheus-surgical-improvements.md`
- 4 session IDs in boulder (multi-session confusion)
- NO `plans/` directory exists (standard location for plan files)
- NO `boulders/`, `drafts/`, `logs/`, `evidence/` directories
- Two active notepads (plan-002 AND prometheus-surgical-improvements)
- Only notepads exist, NO actual plan files

**Root Cause**: User's system wasn't using Sisyphus plan workflow correctly. Work was happening in notepads only, not in the standard plans/ → boulders/ → /start-work flow.

---

## Work Objectives

### Core Objective
Reset .sisyphus folder to clean, standard state ready for `/start-work` execution of prometheus-surgical-improvements plan.

### Concrete Deliverables
- Backup: `.sisyphus-backup-YYYYMMDD/` with all current state preserved
- Clean structure: `.sisyphus/plans/`, `.sisyphus/boulders/`, `.sisyphus/drafts/`, `.sisyphus/evidence/`, `.sisyphus/logs/`
- Plan file: `.sisyphus/plans/prometheus-surgical-improvements.md` (copied from user's existing location)
- Archived learnings: `docs/archived-learnings/plan-002-create-documentation-command.md` (if valuable content exists)
- NO boulder.json initially (will be created by /start-work)

### Definition of Done
- [ ] Old .sisyphus backed up to timestamped directory
- [ ] New .sisyphus structure created with all standard subdirectories
- [ ] prometheus-surgical-improvements.md in correct location (.sisyphus/plans/)
- [ ] NO boulder.json exists (clean slate for /start-work)
- [ ] User can run `/start-work` without conflicts

### Must Have
- **Complete backup**: No data loss from cleanup
- **Proper directory structure**: All standard subdirectories present
- **Single plan ready**: prometheus-surgical-improvements.md in correct location
- **No active boulder**: Clean slate for orchestrator

### Must NOT Have (Guardrails)
- **NO data loss**: Everything must be backed up before deletion
- **NO half-cleaned state**: Either fully cleaned or not touched
- **NO lingering boulders**: Boulder must be completely removed (not just reset)
- **NO plan-002 artifacts**: Blocked work should be archived, not left in .sisyphus

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure exists**: NO (cleanup operation)
- **Automated tests**: Agent-Executed QA Scenarios (bash verification)
- **Framework**: Bash commands (directory checks, file verification)

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

Each task includes specific QA scenarios executed by the agent using:
- **Bash**: Directory structure verification, file existence checks, content validation

---

## Execution Strategy

### Parallel Execution Waves

```
Sequential Execution (NO parallelization - must be done in order):

Step 1: Backup current state
  └── Task 1: Create timestamped backup of .sisyphus

Step 2: Archive valuable content
  └── Task 2: Extract plan-002 learnings (if valuable)

Step 3: Delete confused state
  └── Task 3: Remove .sisyphus entirely

Step 4: Create clean structure
  └── Task 4: Build proper .sisyphus directory hierarchy

Step 5: Place plan in correct location
  └── Task 5: Copy prometheus-surgical-improvements.md to .sisyphus/plans/

Step 6: Verify readiness
  └── Task 6: Confirm structure ready for /start-work

Critical Path: All tasks sequential (1 → 2 → 3 → 4 → 5 → 6)
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 3 | None (must complete first) |
| 2 | 1 | 3 | None (must finish before delete) |
| 3 | 1, 2 | 4 | None (must clear before rebuild) |
| 4 | 3 | 5 | None (structure needed for plans/) |
| 5 | 4 | 6 | None (plan needed for verification) |
| 6 | 5 | None | None (final check) |

### Agent Dispatch Summary

| Task | Recommended Agent |
|------|-------------------|
| All tasks | category="quick" (simple file operations, no complex logic) |

---

## TODOs

- [ ] 1. Create timestamped backup of .sisyphus

  **What to do**:
  - Create backup directory: `.sisyphus-backup-$(date +%Y%m%d-%H%M%S)/`
  - Copy ENTIRE `.sisyphus/` contents to backup (recursive)
  - Verify backup integrity (all files copied)
  - Report backup location to user

  **Must NOT do**:
  - Do NOT modify original .sisyphus during backup
  - Do NOT skip any files or directories
  - Do NOT proceed if backup fails

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple directory copy operation
  - **Skills**: None required
  - **Skills Evaluated but Omitted**: All skills lack domain overlap

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Step 1)
  - **Blocks**: Tasks 2, 3 (must backup before any changes)
  - **Blocked By**: None (first step)

  **References**:
  - **Current State**: `/Users/Shared/dev/.sisyphus/` (explore agent findings)

  **Acceptance Criteria**:

  ```
  Scenario: Backup directory created with all content
    Tool: Bash
    Preconditions: .sisyphus exists at /Users/Shared/dev/
    Steps:
      1. BACKUP_DIR=".sisyphus-backup-$(date +%Y%m%d-%H%M%S)"
      2. cp -r /Users/Shared/dev/.sisyphus "$BACKUP_DIR"
      3. Assert: Exit code 0 (copy succeeded)
      4. ls "$BACKUP_DIR"
      5. Assert: Directory exists with content
      6. ls "$BACKUP_DIR/boulder.json"
      7. Assert: boulder.json backed up
      8. ls "$BACKUP_DIR/notepads"
      9. Assert: notepads directory backed up
      10. diff -r /Users/Shared/dev/.sisyphus "$BACKUP_DIR"
      11. Assert: Exit code 0 (identical contents)
    Expected Result: Complete backup with verified integrity
    Evidence: Backup directory exists, diff shows no differences

  Scenario: Backup location reported to user
    Tool: Bash
    Preconditions: Backup created
    Steps:
      1. echo "Backup created at: $BACKUP_DIR"
      2. Assert: Path displayed to user
    Expected Result: User knows where backup is stored
    Evidence: Path output
  ```

  **Commit**: NO (backup operation, not code change)

---

- [ ] 2. Extract plan-002 learnings to docs (if valuable)

  **What to do**:
  - Check if `/Users/Shared/dev/.sisyphus/notepads/plan-002-create-documentation-command/` contains valuable content
  - If learnings.md has substantial research (422 lines found), create archive document:
    - Create `docs/archived-learnings/` directory if doesn't exist
    - Copy content to `docs/archived-learnings/plan-002-create-documentation-command.md`
    - Add header explaining this was blocked work, archived for reference
    - Include issues.md and decisions.md content as appendices
  - If content is not valuable (just logs/noise), skip archival

  **Must NOT do**:
  - Do NOT spend time analyzing content deeply (quick judgment call)
  - Do NOT restructure content (just copy with context header)
  - Do NOT archive prometheus-surgical-improvements notepad (that work is complete/superseded by real plan)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple file copy with minimal formatting
  - **Skills**: None required
  - **Skills Evaluated but Omitted**: All skills lack domain overlap

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Step 2)
  - **Blocks**: Task 3 (must extract before delete)
  - **Blocked By**: Task 1 (backup first)

  **References**:
  - **Notepad Content**: `/Users/Shared/dev/.sisyphus/notepads/plan-002-create-documentation-command/learnings.md` (422 lines)
  - **Issues**: `/Users/Shared/dev/.sisyphus/notepads/plan-002-create-documentation-command/issues.md` (229 lines)
  - **Decisions**: `/Users/Shared/dev/.sisyphus/notepads/plan-002-create-documentation-command/decisions.md` (41 lines)

  **Acceptance Criteria**:

  ```
  Scenario: Check if content is valuable
    Tool: Bash
    Preconditions: Backup completed
    Steps:
      1. wc -l /Users/Shared/dev/.sisyphus/notepads/plan-002-create-documentation-command/learnings.md
      2. Assert: File has >100 lines (substantial content)
    Expected Result: Content threshold met for archival
    Evidence: Line count output

  Scenario: Archive created if content valuable
    Tool: Bash
    Preconditions: Content deemed valuable
    Steps:
      1. mkdir -p docs/archived-learnings/
      2. Assert: Directory created (exit code 0)
      3. cat > docs/archived-learnings/plan-002-create-documentation-command.md <<'EOF'
# Archived: plan-002-create-documentation-command

**Status**: BLOCKED - Archived for reference
**Date**: $(date +%Y-%m-%d)

This work was blocked due to infrastructure issues. Content preserved for future reference.

## Original Learnings
[content from learnings.md]

## Issues Encountered
[content from issues.md]

## Decisions Made
[content from decisions.md]
EOF
      4. Assert: File created
      5. cat docs/archived-learnings/plan-002-create-documentation-command.md | grep "BLOCKED"
      6. Assert: Archive header present
    Expected Result: Valuable content preserved with context
    Evidence: Archive file exists with proper header

  Scenario: Skip archival if content not valuable
    Tool: Bash
    Preconditions: Content <100 lines or just noise
    Steps:
      1. echo "Skipping plan-002 archival - content not substantial"
    Expected Result: No archive created
    Evidence: Message logged
  ```

  **Commit**: NO (documentation archival, not main work)

---

- [ ] 3. Remove .sisyphus entirely

  **What to do**:
  - Delete `/Users/Shared/dev/.sisyphus/` directory completely (recursive)
  - Verify directory no longer exists
  - Note: This is safe because Task 1 created backup

  **Must NOT do**:
  - Do NOT proceed if backup verification failed in Task 1
  - Do NOT leave partial deletions

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple recursive delete
  - **Skills**: None required
  - **Skills Evaluated but Omitted**: All skills lack domain overlap

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Step 3)
  - **Blocks**: Task 4 (must clear before rebuild)
  - **Blocked By**: Tasks 1, 2 (backup and extract first)

  **References**:
  - **Backup Location**: Output from Task 1 (safety check)

  **Acceptance Criteria**:

  ```
  Scenario: .sisyphus deleted completely
    Tool: Bash
    Preconditions: Backup verified, plan-002 extracted (if valuable)
    Steps:
      1. rm -rf /Users/Shared/dev/.sisyphus
      2. Assert: Exit code 0 (delete succeeded)
      3. ls /Users/Shared/dev/.sisyphus
      4. Assert: Exit code 2 (directory does not exist)
    Expected Result: .sisyphus completely removed
    Evidence: ls fails with "No such file or directory"

  Scenario: Clean slate verified
    Tool: Bash
    Preconditions: Deletion completed
    Steps:
      1. find /Users/Shared/dev -name ".sisyphus" -type d
      2. Assert: No output (no .sisyphus directories remain)
    Expected Result: No remnants of old structure
    Evidence: find returns empty
  ```

  **Commit**: NO (cleanup operation)

---

- [ ] 4. Build proper .sisyphus directory hierarchy

  **What to do**:
  - Create `.sisyphus/` at `/Users/Shared/dev/openspace/.sisyphus/` (CORRECT working directory)
  - Create standard subdirectories:
    - `.sisyphus/plans/` - Work plan files
    - `.sisyphus/boulders/` - Active boulder tracking
    - `.sisyphus/drafts/` - Planning draft files
    - `.sisyphus/evidence/` - QA scenario evidence (screenshots, logs)
    - `.sisyphus/logs/` - Execution logs
    - `.sisyphus/notepads/` - Session notepads (if needed)
  - Create `.sisyphus/README.md` explaining structure
  - Verify all directories created

  **Must NOT do**:
  - Do NOT create any files yet (just directory structure)
  - Do NOT create boulder.json (that's for /start-work to create)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple directory creation
  - **Skills**: None required
  - **Skills Evaluated but Omitted**: All skills lack domain overlap

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Step 4)
  - **Blocks**: Task 5 (plans/ directory needed)
  - **Blocked By**: Task 3 (must clear old structure first)

  **References**:
  - **Working Directory**: `/Users/Shared/dev/openspace/` (CRITICAL - use this, not /Users/Shared/dev/)

  **Acceptance Criteria**:

  ```
  Scenario: Standard directory structure created
    Tool: Bash
    Preconditions: Old .sisyphus removed
    Steps:
      1. mkdir -p /Users/Shared/dev/openspace/.sisyphus/{plans,boulders,drafts,evidence,logs,notepads}
      2. Assert: Exit code 0 (directories created)
      3. ls -la /Users/Shared/dev/openspace/.sisyphus/
      4. Assert: 6 subdirectories exist (plans, boulders, drafts, evidence, logs, notepads)
    Expected Result: Complete standard structure
    Evidence: All 6 subdirectories listed

  Scenario: README explains structure
    Tool: Bash
    Preconditions: Directories created
    Steps:
      1. cat > /Users/Shared/dev/openspace/.sisyphus/README.md <<'EOF'
# .sisyphus Directory Structure

Standard directory layout for Sisyphus work orchestration:

- **plans/** - Work plan markdown files (input for /start-work)
- **boulders/** - Active work tracking (boulder.json created by /start-work)
- **drafts/** - Planning session draft files (Prometheus working memory)
- **evidence/** - QA scenario evidence (screenshots, logs, outputs)
- **logs/** - Execution logs from work sessions
- **notepads/** - Session notepad files (issues, learnings, decisions)

## Usage

1. Plan created by Prometheus → saved to plans/
2. Run `/start-work` → creates boulder in boulders/
3. Work executes → logs to logs/, evidence to evidence/
4. Session notes → automatically tracked in notepads/
EOF
      2. Assert: File created
      3. cat /Users/Shared/dev/openspace/.sisyphus/README.md | grep "plans/"
      4. Assert: README explains plans directory
    Expected Result: README documents structure
    Evidence: README exists with directory explanations
  ```

  **Commit**: NO (directory structure, minimal commit value)

---

- [ ] 5. Copy prometheus-surgical-improvements.md to .sisyphus/plans/

  **What to do**:
  - Copy plan file from original location to `.sisyphus/plans/prometheus-surgical-improvements.md`
  - Original location: `/Users/Shared/dev/openspace/.sisyphus/plans/prometheus-surgical-improvements.md` (user already has it)
  - Target: `/Users/Shared/dev/openspace/.sisyphus/plans/prometheus-surgical-improvements.md`
  - Verify file integrity after copy
  - Confirm plan has 536 lines (as per explore agent findings)

  **Must NOT do**:
  - Do NOT modify plan content
  - Do NOT delete original (leave it as backup)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple file copy
  - **Skills**: None required
  - **Skills Evaluated but Omitted**: All skills lack domain overlap

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Step 5)
  - **Blocks**: Task 6 (verification needs plan in place)
  - **Blocked By**: Task 4 (plans/ directory must exist)

  **References**:
  - **Plan Location**: User provided path - `.sisyphus/plans/prometheus-surgical-improvements.md` (already exists)

  **Acceptance Criteria**:

  ```
  Scenario: Plan file in correct location
    Tool: Bash
    Preconditions: .sisyphus/plans/ directory exists
    Steps:
      1. ls /Users/Shared/dev/openspace/.sisyphus/plans/prometheus-surgical-improvements.md
      2. Assert: File exists (exit code 0)
      3. wc -l /Users/Shared/dev/openspace/.sisyphus/plans/prometheus-surgical-improvements.md
      4. Assert: File has 536 lines (integrity check)
      5. head -1 /Users/Shared/dev/openspace/.sisyphus/plans/prometheus-surgical-improvements.md
      6. Assert: First line is "# Prometheus Surgical Improvements"
    Expected Result: Plan file in correct location with verified content
    Evidence: File exists, line count matches, header correct

  Scenario: Plan is valid markdown
    Tool: Bash
    Preconditions: Plan copied
    Steps:
      1. cat /Users/Shared/dev/openspace/.sisyphus/plans/prometheus-surgical-improvements.md | grep "## TL;DR"
      2. Assert: TL;DR section present
      3. cat /Users/Shared/dev/openspace/.sisyphus/plans/prometheus-surgical-improvements.md | grep "## TODOs"
      4. Assert: TODOs section present
      5. cat /Users/Shared/dev/openspace/.sisyphus/plans/prometheus-surgical-improvements.md | grep "## Success Criteria"
      6. Assert: Success criteria section present
    Expected Result: Plan has all required sections
    Evidence: All mandatory sections found
  ```

  **Commit**: NO (file organization, not code change)

---

- [ ] 6. Confirm structure ready for /start-work

  **What to do**:
  - Verify complete directory structure exists
  - Verify plan file is in place and readable
  - Verify NO boulder.json exists (clean slate)
  - Verify NO stale session artifacts
  - Report readiness to user with instructions

  **Must NOT do**:
  - Do NOT create boulder.json (that's /start-work's job)
  - Do NOT modify the plan
  - Do NOT run /start-work (just verify readiness)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple verification checks
  - **Skills**: None required
  - **Skills Evaluated but Omitted**: All skills lack domain overlap

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Step 6 - final)
  - **Blocks**: None (final verification)
  - **Blocked By**: Task 5 (plan must be in place)

  **References**:
  - **Expected Structure**: Task 4 (directory hierarchy)
  - **Expected Plan**: Task 5 (plan file location)

  **Acceptance Criteria**:

  ```
  Scenario: All directories present and empty (except plans/)
    Tool: Bash
    Preconditions: Setup complete
    Steps:
      1. ls -la /Users/Shared/dev/openspace/.sisyphus/{plans,boulders,drafts,evidence,logs,notepads}
      2. Assert: All directories exist (exit code 0)
      3. ls /Users/Shared/dev/openspace/.sisyphus/boulders/
      4. Assert: Empty (no boulder.json yet)
      5. ls /Users/Shared/dev/openspace/.sisyphus/drafts/
      6. Assert: Empty
      7. ls /Users/Shared/dev/openspace/.sisyphus/plans/
      8. Assert: Contains prometheus-surgical-improvements.md
    Expected Result: Clean structure with plan ready
    Evidence: Directories exist, only plan file present

  Scenario: No stale session artifacts
    Tool: Bash
    Preconditions: Verification in progress
    Steps:
      1. find /Users/Shared/dev/openspace/.sisyphus -name "boulder.json"
      2. Assert: No output (no boulder exists)
      3. find /Users/Shared/dev/openspace/.sisyphus -name "*.log"
      4. Assert: No output (no stale logs)
    Expected Result: Completely clean state
    Evidence: No boulder, no logs

  Scenario: User guidance provided
    Tool: Bash
    Preconditions: All checks passed
    Steps:
      1. echo "✅ .sisyphus structure ready for work!"
      2. echo "📁 Plan location: .sisyphus/plans/prometheus-surgical-improvements.md"
      3. echo "🚀 To begin execution, run: /start-work"
      4. echo "📦 Old state backed up to: [backup location from Task 1]"
    Expected Result: Clear next steps communicated
    Evidence: User sees success message and instructions
  ```

  **Commit**: NO (verification step only)

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| None | No commits needed | N/A | This is a cleanup/organization operation |

**Note**: This is infrastructure cleanup, not code changes. No git commits required.

---

## Success Criteria

### Verification Commands
```bash
# Verify backup exists
ls -la .sisyphus-backup-*/

# Verify clean structure
ls -la /Users/Shared/dev/openspace/.sisyphus/{plans,boulders,drafts,evidence,logs,notepads}

# Verify plan in place
cat /Users/Shared/dev/openspace/.sisyphus/plans/prometheus-surgical-improvements.md | head -20

# Verify no active boulder
ls /Users/Shared/dev/openspace/.sisyphus/boulders/

# Verify archived learnings (if applicable)
ls docs/archived-learnings/
```

### Final Checklist
- [ ] Old .sisyphus backed up with timestamp
- [ ] New .sisyphus structure created with all 6 subdirectories
- [ ] prometheus-surgical-improvements.md in .sisyphus/plans/
- [ ] NO boulder.json exists (clean slate)
- [ ] NO stale session artifacts remain
- [ ] User can successfully run `/start-work`
