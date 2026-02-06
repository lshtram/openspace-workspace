# Update Requirements Documentation Structure

## TL;DR

> **Quick Summary**: Refactor requirements file naming from numbered ranges (`REQ-CORE-001-through-039.md`) to semantic names (`REQ-CORE-modalities.md`). Add missing requirements (REQ-CORE-040+) identified during OpenSpace MVP planning session. Update documentation process guidelines.
> 
> **Deliverables**:
> - Rename existing requirements file to semantic name
> - Add 6+ new requirements to official requirements
> - Update DOCUMENTATION_PROCESS.md line 136 with new convention
> - Update INDEX.md to reflect changes
> 
> **Estimated Effort**: Quick (1-2 hours)
> **Parallel Execution**: NO - sequential updates
> **Critical Path**: Read current → Rename → Add new → Update process

---

## Context

### Problem Statement

Current file naming convention in `docs/requirements/DOCUMENTATION_PROCESS.md` line 136:

```markdown
**Example**: `REQ-VOICE-001-through-042.md` (all VOICE requirements in one file)
```

This **numbered range format** creates maintenance burden:
- Adding requirement 043 requires renaming file from `REQ-VOICE-001-through-042.md` → `REQ-VOICE-001-through-043.md`
- File renames break links and confuse version control
- Range numbers are redundant (file contains numbered requirements inside)

### Solution

Use **semantic naming** instead:
- `REQ-CORE-modalities.md` (describes content, not count)
- `REQ-VOICE-input-output.md` (descriptive of topic area)
- `REQ-DEPLOY-platform-matrix.md` (clear subject matter)

Adding requirements only requires editing file content, NOT renaming.

### Missing Requirements

During OpenSpace MVP planning (session 2025-02-05), we identified new requirements not yet documented:

| ID | Title | Description |
|----|-------|-------------|
| REQ-CORE-040 | Dual-Mode Whiteboard | Whiteboard MUST support BOTH freehand drawing AND structured shapes (not either/or) |
| REQ-CORE-041 | Universal Annotation Mode | Annotation tool works across all modalities (starts on whiteboard, extends to others) |
| REQ-CORE-042 | Image Import and Annotation | Users can import images and annotate them with whiteboard tools |
| REQ-CORE-043 | Session Persistence | Auto-save and resume: files, whiteboard, console, terminal state |
| REQ-CORE-044 | Diff Viewer | File comparison tool integrated into main UI |
| REQ-CORE-045 | First-Time UX | Empty canvas + chat + menu (explicitly NOT a dashboard) |

Also need to update existing requirements with:
- **REQ-DEPLOY updates**: Web/desktop capability matrix (what works where)
- **REQ-QA updates**: Agent-executable scenario requirements (zero human verification)
- **REQ-ARCH updates**: OpenCode integration specifics (backend services, SDK layer)

---

## Work Objectives

### Core Objective

Refactor requirements documentation to use semantic file naming and add missing requirements identified during MVP planning.

### Concrete Deliverables

- `docs/requirements/official/REQ-CORE-modalities-and-features.md` (renamed from numbered range)
- Updated content with REQ-CORE-040 through REQ-CORE-045
- `docs/requirements/DOCUMENTATION_PROCESS.md` (line 136 updated with semantic naming)
- `docs/requirements/INDEX.md` (updated file references)

### Definition of Done

- [ ] bash: `ls docs/requirements/official/REQ-CORE-*.md | grep -v "001-through"` → Shows semantic filename
- [ ] bash: `grep "REQ-CORE-040" docs/requirements/official/REQ-CORE-*.md` → Returns match
- [ ] bash: `grep "REQ-CORE-045" docs/requirements/official/REQ-CORE-*.md` → Returns match
- [ ] bash: `grep "001-through-" docs/requirements/DOCUMENTATION_PROCESS.md` → No matches (removed numbered examples)
- [ ] bash: `grep "semantic" docs/requirements/DOCUMENTATION_PROCESS.md` → Shows semantic naming guideline

### Must Have

- Semantic naming convention applied to existing file
- All 6 new requirements (REQ-CORE-040 through 045) added with:
  - Source: Session 002 (2025-02-05 MVP Planning)
  - Priority: P0 or P1 (all are MVP features)
  - Acceptance criteria (testable)
  - Traceability link to planning session
- Documentation process updated to reflect new convention

### Must NOT Have (Guardrails)

- Do NOT renumber existing requirements (REQ-CORE-001 stays 001)
- Do NOT change requirement content (only add new ones)
- Do NOT create multiple files (keep single file per module)
- Do NOT remove numbered range convention documentation (update it, don't delete - explain why semantic is better)

---

## Verification Strategy

### Test Decision

- **Infrastructure exists**: NO (documentation task, not code)
- **Automated tests**: NO (verification via file checks)
- **Framework**: N/A

### Agent-Executed QA Scenarios (MANDATORY)

> Verification uses bash file operations and grep searches.

**Scenario: Requirements file renamed to semantic name**
  Tool: Bash
  Preconditions: Current file is REQ-CORE-001-through-039.md
  Steps:
    1. ls docs/requirements/official/ | grep REQ-CORE
    2. Assert: Output contains semantic filename (REQ-CORE-modalities-and-features.md or similar)
    3. Assert: Output does NOT contain "001-through-039"
  Expected Result: File renamed successfully
  Evidence: ls command output captured

**Scenario: New requirements added with correct format**
  Tool: Bash
  Preconditions: Requirements file exists
  Steps:
    1. grep -E "REQ-CORE-04[0-5]" docs/requirements/official/REQ-CORE-*.md
    2. Assert: 6 matches found (040, 041, 042, 043, 044, 045)
    3. grep "Source: Session 002" docs/requirements/official/REQ-CORE-*.md
    4. Assert: Multiple matches (all new reqs trace to session 002)
  Expected Result: All 6 new requirements present with traceability
  Evidence: grep output captured

**Scenario: Documentation process updated**
  Tool: Bash
  Preconditions: DOCUMENTATION_PROCESS.md exists
  Steps:
    1. grep "001-through-" docs/requirements/DOCUMENTATION_PROCESS.md
    2. Assert: Exit code 1 (no matches - old example removed)
    3. grep "semantic" docs/requirements/DOCUMENTATION_PROCESS.md
    4. Assert: Exit code 0 (semantic naming documented)
    5. grep "REQ-CORE-modalities" docs/requirements/DOCUMENTATION_PROCESS.md
    6. Assert: Exit code 0 (example uses semantic name)
  Expected Result: Process documentation updated
  Evidence: grep results captured

**Scenario: INDEX.md reflects changes**
  Tool: Bash
  Preconditions: INDEX.md exists
  Steps:
    1. grep "REQ-CORE" docs/requirements/INDEX.md
    2. Assert: Shows semantic filename, not numbered range
    3. grep "45 requirements" docs/requirements/INDEX.md
    4. Assert: Count updated from 39 to 45 (6 new reqs)
  Expected Result: Index updated with new count and filename
  Evidence: INDEX.md grep output

---

## Execution Strategy

### Sequential Execution (No Parallelization)

All tasks MUST run sequentially because each depends on previous:

```
Task 1: Read current file
  ↓
Task 2: Rename to semantic name
  ↓
Task 3: Add new requirements
  ↓
Task 4: Update documentation process
  ↓
Task 5: Update INDEX.md
```

No parallel execution possible - each task modifies artifacts needed by next task.

### Agent Dispatch Summary

| Task | Agent Profile | Run Mode |
|------|---------------|----------|
| All | category="quick", load_skills=[] | sequential |

**Rationale**: Simple file operations, no specialized skills needed, quick turnaround.

---

## TODOs

- [ ] 1. Read Current Requirements File

  **What to do**:
  - Read `docs/requirements/official/REQ-CORE-001-through-039.md`
  - Verify format: Markdown with numbered requirements (### REQ-CORE-NNN)
  - Note last requirement number (should be 039)
  - Understand structure for adding new requirements

  **Must NOT do**:
  - Do not modify content yet
  - Do not rename file yet

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple file read operation, no complexity
  - **Skills**: None required
    - Reason: Standard read operation
  - **Skills Evaluated but Omitted**:
    - None applicable (documentation read)

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential only
  - **Blocks**: Task 2 (rename), Task 3 (add requirements)
  - **Blocked By**: None (can start immediately)

  **References**:
  - `docs/requirements/official/REQ-CORE-001-through-039.md` - Current requirements file to read
  - `docs/requirements/DOCUMENTATION_PROCESS.md:131-142` - File naming convention section (context for why we're renaming)

  **Acceptance Criteria**:
  - [ ] File read successfully: `docs/requirements/official/REQ-CORE-001-through-039.md`
  - [ ] Last requirement confirmed: REQ-CORE-039 exists
  - [ ] Format understood: Markdown with ### headers for each requirement

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Current file exists and is readable
    Tool: Bash
    Preconditions: Repository cloned, docs/ directory exists
    Steps:
      1. cat docs/requirements/official/REQ-CORE-001-through-039.md | head -n 20
      2. Assert: Output contains "# " header line (markdown file)
      3. grep "REQ-CORE-039" docs/requirements/official/REQ-CORE-001-through-039.md
      4. Assert: Exit code 0 (requirement 039 exists)
    Expected Result: File exists, contains 39 requirements
    Evidence: head output captured
  ```

  **Commit**: NO (read-only operation)

---

- [ ] 2. Rename File to Semantic Name

  **What to do**:
  - Choose semantic name: `REQ-CORE-modalities-and-features.md`
    - Rationale: Core requirements covering modalities (voice, whiteboard, presentations) and features (session persistence, diff viewer)
  - Use git mv to preserve history: `git mv docs/requirements/official/REQ-CORE-001-through-039.md docs/requirements/official/REQ-CORE-modalities-and-features.md`
  - Verify file renamed successfully

  **Must NOT do**:
  - Do not use `mv` (loses git history) - use `git mv`
  - Do not change file content during rename
  - Do not rename other files (only REQ-CORE in this task)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single git command, straightforward operation
  - **Skills**: None required
    - Reason: Basic git operation
  - **Skills Evaluated but Omitted**:
    - `git-master`: Not needed for simple rename (overkill)

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (after Task 1)
  - **Blocks**: Task 3 (add requirements), Task 4 (update process), Task 5 (update index)
  - **Blocked By**: Task 1 (must read current file first)

  **References**:
  - `docs/requirements/official/REQ-CORE-001-through-039.md` - Current filename (source)
  - `.sisyphus/drafts/openspace-requirements-expansion.md:462-530` - Context on why semantic naming matters (architecture principles discussion)

  **Acceptance Criteria**:
  - [ ] bash: `ls docs/requirements/official/REQ-CORE-modalities-and-features.md` → File exists
  - [ ] bash: `ls docs/requirements/official/REQ-CORE-001-through-039.md 2>&1` → Error (file does not exist)
  - [ ] bash: `git log --follow --oneline docs/requirements/official/REQ-CORE-modalities-and-features.md | head -n 1` → Shows rename commit preserving history

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: File renamed with git history preserved
    Tool: Bash
    Preconditions: Task 1 complete, file exists with old name
    Steps:
      1. git mv docs/requirements/official/REQ-CORE-001-through-039.md docs/requirements/official/REQ-CORE-modalities-and-features.md
      2. Assert: Command exit code 0
      3. ls docs/requirements/official/ | grep REQ-CORE
      4. Assert: Output contains "REQ-CORE-modalities-and-features.md"
      5. Assert: Output does NOT contain "001-through-039"
      6. git status --short
      7. Assert: Shows "R  docs/requirements/official/REQ-CORE-001-through-039.md -> docs/requirements/official/REQ-CORE-modalities-and-features.md"
    Expected Result: File renamed, git tracks as rename (preserves history)
    Evidence: git status output captured
  ```

  **Commit**: YES (after Task 3 completes - group rename + additions)
  - Message: `docs(requirements): refactor to semantic naming and add MVP requirements`
  - Files: `docs/requirements/official/REQ-CORE-modalities-and-features.md`
  - Pre-commit: `git status` (verify rename tracked correctly)

---

- [ ] 3. Add New Requirements (REQ-CORE-040 through 045)

  **What to do**:
  - Edit `docs/requirements/official/REQ-CORE-modalities-and-features.md`
  - Add 6 new requirements at end of file (after REQ-CORE-039):
    - REQ-CORE-040: Dual-Mode Whiteboard
    - REQ-CORE-041: Universal Annotation Mode
    - REQ-CORE-042: Image Import and Annotation
    - REQ-CORE-043: Session Persistence
    - REQ-CORE-044: Diff Viewer
    - REQ-CORE-045: First-Time UX
  - Each requirement must include:
    - **Source**: Session 002 (2025-02-05 MVP Planning)
    - **Priority**: P0 or P1 (MVP features)
    - **Description**: Clear, specific explanation
    - **Acceptance Criteria**: Testable conditions
    - **Dependencies**: Any prereqs (if applicable)

  **Must NOT do**:
  - Do not modify existing requirements (001-039)
  - Do not change requirement numbering
  - Do not add unplanned requirements beyond 040-045

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Structured data entry, clear specification
  - **Skills**: None required
    - Reason: Markdown editing, no special domain
  - **Skills Evaluated but Omitted**:
    - None applicable

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (after Task 2)
  - **Blocks**: Task 4 (update process), Task 5 (update index)
  - **Blocked By**: Task 2 (file must be renamed first)

  **References**:
  - `.sisyphus/plans/openspace-mvp-implementation.md:1-200` - Source of new requirements (MVP plan context)
  - `.sisyphus/drafts/openspace-requirements-expansion.md:1-100` - Additional context on requirements decisions
  - `docs/requirements/official/REQ-CORE-modalities-and-features.md:1-50` - Existing requirement format to match (after Task 2 renames it)

  **Why Each Reference Matters**:
  - MVP plan: Contains detailed descriptions of each feature (dual-mode whiteboard, annotations, session persistence, etc.)
  - Draft document: Captures discussion rationale and user preferences
  - Existing requirements: Shows format/structure to maintain consistency

  **Acceptance Criteria**:
  - [ ] bash: `grep -c "### REQ-CORE-" docs/requirements/official/REQ-CORE-modalities-and-features.md` → Returns 45 (was 39, now 45)
  - [ ] bash: `grep "REQ-CORE-040" docs/requirements/official/REQ-CORE-modalities-and-features.md` → Match found
  - [ ] bash: `grep "REQ-CORE-045" docs/requirements/official/REQ-CORE-modalities-and-features.md` → Match found
  - [ ] bash: `grep "Source: Session 002" docs/requirements/official/REQ-CORE-modalities-and-features.md | wc -l` → Returns 6 (all new reqs cite session 002)

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: All 6 new requirements added with correct format
    Tool: Bash
    Preconditions: Task 2 complete (file renamed)
    Steps:
      1. grep -E "### REQ-CORE-04[0-5]:" docs/requirements/official/REQ-CORE-modalities-and-features.md
      2. Assert: 6 lines returned (one header per requirement)
      3. grep "Source: Session 002" docs/requirements/official/REQ-CORE-modalities-and-features.md
      4. Assert: 6 matches (all new reqs have traceability)
      5. grep -A 2 "REQ-CORE-040" docs/requirements/official/REQ-CORE-modalities-and-features.md
      6. Assert: Contains "Dual-Mode Whiteboard" or similar description
      7. grep -A 2 "REQ-CORE-045" docs/requirements/official/REQ-CORE-modalities-and-features.md
      8. Assert: Contains "First-Time UX" or similar description
    Expected Result: All requirements present with traceability and descriptions
    Evidence: grep outputs captured

  Scenario: Existing requirements unchanged
    Tool: Bash
    Preconditions: New requirements added
    Steps:
      1. grep "### REQ-CORE-001:" docs/requirements/official/REQ-CORE-modalities-and-features.md
      2. Assert: Exists (first requirement intact)
      3. grep "### REQ-CORE-039:" docs/requirements/official/REQ-CORE-modalities-and-features.md
      4. Assert: Exists (last original requirement intact)
      5. git diff --cached docs/requirements/official/REQ-CORE-modalities-and-features.md | grep "^+"
      6. Assert: Only additions (+ lines), no deletions to existing content
    Expected Result: Original 39 requirements unmodified
    Evidence: git diff output
  ```

  **Commit**: YES (grouped with Task 2)
  - Message: `docs(requirements): refactor to semantic naming and add MVP requirements`
  - Files: `docs/requirements/official/REQ-CORE-modalities-and-features.md`
  - Pre-commit: `grep -c "### REQ-CORE-" docs/requirements/official/REQ-CORE-modalities-and-features.md` (verify 45)

---

- [ ] 4. Update DOCUMENTATION_PROCESS.md with Semantic Naming

  **What to do**:
  - Edit `docs/requirements/DOCUMENTATION_PROCESS.md`
  - Update line 136 section (File Naming Conventions → Requirements)
  - Replace numbered range example with semantic naming example
  - Add explanation of WHY semantic naming is better
  - Update examples throughout section 3 (File Structure and Organization)

  **Changes to make**:

  **Before (line 136):**
  ```markdown
  **Example**: `REQ-VOICE-001-through-042.md` (all VOICE requirements in one file)
  ```

  **After:**
  ```markdown
  **Format**: `REQ-[PREFIX]-[semantic-name].md` (descriptive topic name)
  - Use semantic names that describe content, not counts
  - Examples: `REQ-CORE-modalities-and-features.md`, `REQ-VOICE-input-output.md`
  - Rationale: Adding requirements doesn't require file renames
  - Old format (deprecated): `REQ-PREFIX-001-through-NNN.md` (required rename on every addition)
  ```

  **Must NOT do**:
  - Do not remove documentation of old format (mark as deprecated, explain transition)
  - Do not change other sections unrelated to file naming
  - Do not modify workflow phases (6-phase process stays same)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Targeted documentation update, clear specification
  - **Skills**: None required
    - Reason: Markdown editing
  - **Skills Evaluated but Omitted**:
    - None applicable

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (after Task 3)
  - **Blocks**: Task 5 (INDEX.md update references this change)
  - **Blocked By**: Task 3 (requirements must be added first to provide example)

  **References**:
  - `docs/requirements/DOCUMENTATION_PROCESS.md:110-142` - File Naming Conventions section to update
  - `.sisyphus/drafts/openspace-requirements-expansion.md:462-530` - Rationale for semantic naming (architecture principles)
  - `docs/requirements/official/REQ-CORE-modalities-and-features.md` - Actual example of semantic naming in use (after Task 3)

  **Why Each Reference Matters**:
  - DOCUMENTATION_PROCESS.md: Target section for updates
  - Draft document: Explains WHY we're making this change (maintenance burden of numbered ranges)
  - Actual requirements file: Real-world example to reference in documentation

  **Acceptance Criteria**:
  - [ ] bash: `grep "001-through-" docs/requirements/DOCUMENTATION_PROCESS.md` → Exit code 1 (no numbered examples remain as current format)
  - [ ] bash: `grep "semantic" docs/requirements/DOCUMENTATION_PROCESS.md` → Match found (semantic naming documented)
  - [ ] bash: `grep "REQ-CORE-modalities-and-features.md" docs/requirements/DOCUMENTATION_PROCESS.md` → Match found (actual example used)
  - [ ] bash: `grep "deprecated" docs/requirements/DOCUMENTATION_PROCESS.md` → Match found (old format marked as deprecated)

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Documentation process updated with semantic naming
    Tool: Bash
    Preconditions: Task 3 complete (requirements added)
    Steps:
      1. grep -n "REQ-\[PREFIX\]" docs/requirements/DOCUMENTATION_PROCESS.md
      2. Assert: Line contains "[semantic-name].md" format
      3. grep "semantic" docs/requirements/DOCUMENTATION_PROCESS.md
      4. Assert: Explanation of semantic naming present
      5. grep "deprecated" docs/requirements/DOCUMENTATION_PROCESS.md
      6. Assert: Old format marked as deprecated (not removed)
      7. grep "001-through-" docs/requirements/DOCUMENTATION_PROCESS.md | grep -v deprecated
      8. Assert: Exit code 1 (no non-deprecated numbered examples)
    Expected Result: Process doc updated, old format deprecated
    Evidence: grep outputs captured

  Scenario: Examples updated throughout document
    Tool: Bash
    Preconditions: Documentation updated
    Steps:
      1. grep -n "REQ-CORE-modalities-and-features" docs/requirements/DOCUMENTATION_PROCESS.md
      2. Assert: At least one match (example used in documentation)
      3. grep -c "Example:" docs/requirements/DOCUMENTATION_PROCESS.md
      4. Compare: Same count as before (all examples updated, none removed)
    Expected Result: All examples use semantic naming
    Evidence: grep counts captured
  ```

  **Commit**: YES
  - Message: `docs(process): update file naming convention to semantic names`
  - Files: `docs/requirements/DOCUMENTATION_PROCESS.md`
  - Pre-commit: `grep semantic docs/requirements/DOCUMENTATION_PROCESS.md` (verify update applied)

---

- [ ] 5. Update INDEX.md with New File Reference

  **What to do**:
  - Edit `docs/requirements/INDEX.md`
  - Update requirements module table entry for REQ-CORE
  - Change filename from numbered range to semantic name
  - Update count from 39 to 45 requirements
  - Verify links work (point to renamed file)

  **Changes to make**:

  **Before:**
  ```markdown
  | REQ-CORE | 39 | Draft | ✅ |
  Link: [REQ-CORE-001-through-039.md](official/REQ-CORE-001-through-039.md)
  ```

  **After:**
  ```markdown
  | REQ-CORE | 45 | Draft | ✅ |
  Link: [REQ-CORE-modalities-and-features.md](official/REQ-CORE-modalities-and-features.md)
  ```

  **Must NOT do**:
  - Do not change other module entries
  - Do not modify session entries
  - Do not add new sections

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple table update, straightforward
  - **Skills**: None required
    - Reason: Markdown editing
  - **Skills Evaluated but Omitted**:
    - None applicable

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (after Task 4)
  - **Blocks**: None (final task)
  - **Blocked By**: Task 2 (rename), Task 3 (new reqs), Task 4 (process update)

  **References**:
  - `docs/requirements/INDEX.md` - File to update
  - `docs/requirements/official/REQ-CORE-modalities-and-features.md` - New filename to reference

  **Why Each Reference Matters**:
  - INDEX.md: Target file for updates
  - Requirements file: Verify correct filename to link to

  **Acceptance Criteria**:
  - [ ] bash: `grep "REQ-CORE-modalities-and-features.md" docs/requirements/INDEX.md` → Match found
  - [ ] bash: `grep "| REQ-CORE | 45 |" docs/requirements/INDEX.md` → Match found (count updated)
  - [ ] bash: `grep "001-through-039" docs/requirements/INDEX.md` → Exit code 1 (old filename removed)
  - [ ] bash: `markdown-link-check docs/requirements/INDEX.md || true` → REQ-CORE link valid (if tool available)

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: INDEX.md updated with semantic filename
    Tool: Bash
    Preconditions: All previous tasks complete
    Steps:
      1. grep "REQ-CORE" docs/requirements/INDEX.md
      2. Assert: Contains "REQ-CORE-modalities-and-features.md"
      3. Assert: Does NOT contain "001-through-039"
      4. grep "| REQ-CORE |" docs/requirements/INDEX.md
      5. Assert: Shows count of 45 (was 39, now 45)
    Expected Result: INDEX.md reflects new filename and count
    Evidence: grep output captured

  Scenario: Link points to correct file
    Tool: Bash
    Preconditions: INDEX.md updated
    Steps:
      1. grep -o "official/REQ-CORE-[^)]*" docs/requirements/INDEX.md
      2. Assert: Output is "official/REQ-CORE-modalities-and-features.md"
      3. ls docs/requirements/official/REQ-CORE-modalities-and-features.md
      4. Assert: Exit code 0 (file exists at linked path)
    Expected Result: Link is valid
    Evidence: ls output confirms file exists
  ```

  **Commit**: YES (grouped with Task 4 or separate)
  - Message: `docs(index): update REQ-CORE reference to semantic filename`
  - Files: `docs/requirements/INDEX.md`
  - Pre-commit: `grep "REQ-CORE-modalities-and-features.md" docs/requirements/INDEX.md` (verify link updated)

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 2-3 | `docs(requirements): refactor to semantic naming and add MVP requirements` | REQ-CORE-modalities-and-features.md | grep -c REQ-CORE- → 45 |
| 4 | `docs(process): update file naming convention to semantic names` | DOCUMENTATION_PROCESS.md | grep semantic → match |
| 5 | `docs(index): update REQ-CORE reference to semantic filename` | INDEX.md | grep REQ-CORE-modalities → match |

---

## Success Criteria

### Verification Commands

```bash
# File renamed
ls docs/requirements/official/REQ-CORE-modalities-and-features.md  # Expected: exists

# Old file gone
ls docs/requirements/official/REQ-CORE-001-through-039.md 2>&1  # Expected: error (not found)

# New requirements added
grep -c "### REQ-CORE-" docs/requirements/official/REQ-CORE-modalities-and-features.md  # Expected: 45

# Process documentation updated
grep "semantic" docs/requirements/DOCUMENTATION_PROCESS.md  # Expected: match

# INDEX updated
grep "REQ-CORE-modalities-and-features.md" docs/requirements/INDEX.md  # Expected: match
```

### Final Checklist

- [ ] Requirements file renamed to semantic name (git history preserved)
- [ ] All 6 new requirements (040-045) added with traceability
- [ ] DOCUMENTATION_PROCESS.md updated with semantic naming convention
- [ ] Old numbered format marked as deprecated (not removed)
- [ ] INDEX.md references correct filename and count
- [ ] All commits created with clear messages
- [ ] Links in INDEX.md point to valid files
