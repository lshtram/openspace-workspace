---
description: Generate complete session documentation. Usage: /document [topic]
---

# Documentation Workflow - Full 6-Phase Process

This workflow executes the complete documentation pipeline from conversation capture through requirements generation and verification.

## Phase 1: Capture Conversation

### Step 1: Access Session History
- Use `session_read` tool to retrieve full conversation from current session
- Note session ID and timestamp
- Identify all participants (User + Agent types)

### Step 2: Determine Session Number
- Scan `docs/requirements/conversations/` directory
- Find highest existing session number (e.g., session-003)
- Increment by 1 for new session
- Format: `session-NNN` (zero-padded to 3 digits)

### Step 3: Infer or Confirm Topic
- If `[topic]` parameter not provided:
  - Analyze conversation content for main themes
  - Generate short kebab-case topic (e.g., `voice-flows`, `canvas-design`)
  - Present to user for confirmation
- If provided, use as-is

### Step 4: Generate Date String
- Use current date in format: `YYYY-MM-DD`

### Step 5: Check for Existing Session File
- Look for existing file with same session number
- **Idempotency Rule**: If same session being re-documented, update existing file
- If new session, create new file

### Step 6: Create Verbatim Transcript
- Create/update file: `docs/requirements/conversations/session-NNN-YYYY-MM-DD-topic.md`
- Use format from REQ-DOC-005 (plan):
  ```markdown
  # Session NNN: [Topic] - YYYY-MM-DD
  
  ## Participants
  - User: [Name]
  - Agent: [Agent Name/Type]
  
  ## Conversation
  
  ### [Timestamp or Sequential Order]
  
  **User:**
  [Exact words spoken/typed]
  
  **Agent:**
  [Exact response]
  
  [Continue for full conversation...]
  
  ## Session End
  - Duration: [if available]
  - Status: [Complete / In Progress / Paused]
  - Next Topics: [if identified]
  ```
- Keep transcript VERBATIM (exact words, no paraphrasing)
- Preserve tool-call markers and full context

## Phase 2: Summarize

### Step 7: Analyze Conversation
- Review verbatim transcript
- Identify key themes, decisions, features, insights

### Step 8: Categorize Key Points
- Extract into categories:
  - **Key Decisions Made**: Critical choices and rationale
  - **Features Discussed**: Capabilities, scope, status
  - **Technical Insights**: Architecture, constraints, patterns
  - **Open Questions**: Unresolved items requiring follow-up
  - **Action Items**: Tasks, owners, due dates
  - **Next Topics**: Items for future sessions

### Step 9: Create Summary File
- Save to: `docs/requirements/summaries/session-NNN-summary.md`
- Use format from REQ-DOC-006 (plan):
  ```markdown
  # Session NNN Summary - [Topic]
  
  **Date**: YYYY-MM-DD  
  **Duration**: [if available]  
  **Status**: [Complete / In Progress]
  
  ## Key Decisions Made
  - Decision 1
  - Decision 2
  
  ## Features Discussed
  - Feature 1: Description
  - Feature 2: Description
  
  ## Technical Insights
  - Insight 1
  - Insight 2
  
  ## Open Questions
  1. Question 1?
  2. Question 2?
  
  ## Action Items
  - [ ] Action 1
  - [ ] Action 2
  
  ## Next Topics to Cover
  - Topic 1
  - Topic 2
  
  ## Traceability
  - Links to: [Related sessions]
  - Referenced by: [Future requirements]
  ```

## Phase 3: Verify Summary

### Step 10: Cross-Reference Against Transcript
- Compare summary content line-by-line with verbatim transcript
- Check that all major discussion points are captured

### Step 11: Check Completeness
- Verify checklist:
  - [ ] All key decisions captured
  - [ ] All features discussed documented
  - [ ] All technical insights recorded
  - [ ] All open questions listed
  - [ ] All action items tracked

### Step 12: Check Accuracy
- Verify checklist:
  - [ ] Summary accurately reflects conversation
  - [ ] No misinterpretations or incorrect statements
  - [ ] No critical information omitted
  - [ ] Traceability links are correct

### Step 13: Create Verification Report
- Save to: `docs/requirements/summaries/session-NNN-verification.md`
- Use format from REQ-DOC-008 (plan):
  ```markdown
  # Session NNN Summary Verification
  
  **Date**: YYYY-MM-DD  
  **Verification Status**: ✅ Complete / ⚠️ Needs Review / ❌ Failed
  
  ## Verification Checklist
  
  ### Completeness Check
  - [ ] All key decisions captured
  - [ ] All features discussed documented
  - [ ] All technical insights recorded
  - [ ] All open questions listed
  - [ ] All action items tracked
  
  ### Accuracy Check
  - [ ] Summary accurately reflects conversation
  - [ ] No misinterpretations or incorrect statements
  - [ ] No critical information omitted
  - [ ] Traceability links are correct
  
  ## Discrepancies Found
  [List any gaps or issues, or write "None"]
  
  ## Reviewer Notes
  [Any additional context or clarifications]
  
  ## Verification Signature
  - Verified by: [Agent name/type]
  - Date: YYYY-MM-DD HH:MM:SS
  ```

### Step 14: Flag Discrepancies for User Review
- If ⚠️ or ❌ status, present findings to user
- Request clarification or confirmation before proceeding to Phase 4
- Update summary if needed and re-verify (loop back to Step 10)

## Phase 4: Generate Requirements

### Step 15: Identify Module/Prefix
- Determine appropriate module name for requirements
- Examples: VOICE, CANVAS, CORE, AUTH, NOTIFY
- **Single Prefix Rule**: All requirements in this session use ONE prefix
- Confirm prefix with user if ambiguous

### Step 16: Convert Summary to Requirements
- Transform key points from verified summary into formal requirements
- Each requirement must be:
  - **Unique**: Has stable ID (REQ-[PREFIX]-NNN)
  - **Verifiable**: Testable/provable
  - **Necessary**: Supports user need or business goal

### Step 17: Use Single Prefix Sequential Numbering
- Format: `REQ-[PREFIX]-001`, `REQ-[PREFIX]-002`, etc.
- If requirements file already exists for this prefix:
  - Find highest existing number
  - Continue sequence (don't restart from 001)

### Step 18: Include Traceability Links
- Link each requirement back to:
  - Source session number
  - Specific summary section (e.g., "Key Decisions #2")

### Step 19: Create Requirements File
- Save to: `docs/requirements/official/REQ-[PREFIX]-001-through-NNN.md`
- Use format from REQ-DOC-009 (plan):
  ```markdown
  # Requirements: [Module Name] (REQ-[PREFIX]-XXX)
  
  **Source**: Session NNN ([Topic])  
  **Date**: YYYY-MM-DD  
  **Status**: Draft / Under Review / Approved
  
  ## Traceability
  - **Derived from**: `session-NNN-summary.md`
  - **Links to**: [Related requirements]
  
  ## Requirements Table
  
  | ID | Category | Requirement | Priority | Status |
  |----|----------|-------------|----------|--------|
  | REQ-[PREFIX]-001 | [Category] | [Requirement text] | High/Med/Low | Draft |
  | REQ-[PREFIX]-002 | [Category] | [Requirement text] | High/Med/Low | Draft |
  
  ## Detailed Requirements
  
  ### REQ-[PREFIX]-001: [Short Title]
  **Category**: [Input/Output/Architecture/etc.]  
  **Priority**: High / Medium / Low  
  **Source**: Session NNN, Topic: [specific discussion point]
  
  **Description**:
  [Detailed requirement description]
  
  **Acceptance Criteria**:
  - Criterion 1
  - Criterion 2
  
  **Dependencies**:
  - [Other requirements or technical dependencies]
  
  **Notes**:
  [Any additional context]
  
  ---
  
  [Repeat for each requirement]
  ```

## Phase 5: Verify Requirements

### Step 20: Cross-Check Requirements Against Summaries
- Compare requirements document to verified summary
- Ensure all summary key points have corresponding requirements

### Step 21: Ensure All Summary Points Have Requirements
- Check traceability:
  - [ ] Every decision in summary → requirement(s)
  - [ ] Every feature in summary → requirement(s)
  - [ ] Every technical constraint → requirement(s)

### Step 22: Validate No Scope Creep
- Verify checklist:
  - [ ] No additions beyond discussion
  - [ ] Priority levels match discussion emphasis
  - [ ] Categorization is consistent and logical

### Step 23: Check Traceability Links
- Verify all requirements link back to:
  - Correct session number
  - Correct summary section
- Ensure no orphaned requirements (missing source)

### Step 24: Create Requirements Verification Report
- Save to: `docs/requirements/official/REQ-[PREFIX]-verification.md`
- Use format from REQ-DOC-010 (plan):
  ```markdown
  # Requirements Verification: [Module Name]
  
  **Date**: YYYY-MM-DD  
  **Requirements Count**: NNN  
  **Verification Status**: ✅ Complete / ⚠️ Needs Review / ❌ Failed
  
  ## Verification Checklist
  
  ### Traceability Check
  - [ ] All requirements link back to session summaries
  - [ ] All summary key points converted to requirements
  - [ ] No orphaned requirements (no source)
  - [ ] No missed topics from summaries
  
  ### Accuracy Check
  - [ ] Requirements accurately reflect summary intent
  - [ ] No scope creep or additions beyond discussion
  - [ ] Priority levels match discussion emphasis
  - [ ] Categorization is consistent and logical
  
  ### Completeness Check
  - [ ] All discussed features have requirements
  - [ ] All open questions captured appropriately
  - [ ] Dependencies identified correctly
  - [ ] Acceptance criteria are testable
  
  ## Cross-Reference Matrix
  
  | Requirement ID | Source Session | Source Section | Verified |
  |----------------|----------------|----------------|----------|
  | REQ-[PREFIX]-001 | Session NNN | Key Decisions #X | ✅ |
  | REQ-[PREFIX]-002 | Session NNN | Features #Y | ✅ |
  
  ## Discrepancies Found
  [List any gaps, mismatches, or issues, or write "None"]
  
  ## Reviewer Notes
  [Any additional context or clarifications]
  
  ## Verification Signature
  - Verified by: [Agent name/type]
  - Date: YYYY-MM-DD HH:MM:SS
  ```

## Phase 6: Finalize

### Step 25: Update Master Index
- Open/create: `docs/requirements/INDEX.md`
- Add new session entry with links to all generated files:
  - Conversation transcript
  - Summary + verification
  - Requirements + verification
- Maintain chronological order

### Step 26: Ensure DOCUMENTATION_PROCESS.md Exists
- Check for: `docs/requirements/DOCUMENTATION_PROCESS.md`
- If missing, create using content from plan REQ-DOC-011
- Should explain:
  - Purpose of documentation system
  - How to use `/document` command
  - File structure and organization
  - Traceability flow (conversation → summary → requirements → verification)
  - Quality standards

### Step 27: Report Success
- Return confirmation message with all file paths created:
  - ✅ Conversation: `docs/requirements/conversations/session-NNN-YYYY-MM-DD-topic.md`
  - ✅ Summary: `docs/requirements/summaries/session-NNN-summary.md`
  - ✅ Summary Verification: `docs/requirements/summaries/session-NNN-verification.md`
  - ✅ Requirements: `docs/requirements/official/REQ-[PREFIX]-NNN.md`
  - ✅ Requirements Verification: `docs/requirements/official/REQ-[PREFIX]-verification.md`
  - ✅ Index Updated: `docs/requirements/INDEX.md`

---

## Notes on Execution

**Idempotency**: If documenting same session multiple times, update existing files in place rather than creating duplicates. Use session number as unique identifier.

**Topic Inference**: When topic not provided, analyze conversation for main themes and suggest kebab-case topic. Present to user: "Suggested topic: `[topic]`. Proceed? (y/n)"

**Verification Loops**: If summary or requirements verification fails (⚠️ or ❌), must fix issues and re-verify before proceeding to next phase.

**Delegation Option**: When possible, consider delegating verification steps (Phase 3 and Phase 5) to separate agent for independent review.

**Session Context Access**: This workflow requires `session_read` tool access to retrieve conversation history.

**Directory Creation**: Ensure all required directories exist before writing files:
```bash
mkdir -p docs/requirements/conversations
mkdir -p docs/requirements/summaries
mkdir -p docs/requirements/official
```
