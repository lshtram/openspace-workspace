# Plan 002: Create /document Command System

## Objective
Create a reusable `/document` command that the user can invoke at any time to trigger comprehensive documentation of conversation history.

## Context
User wants a simple workflow:
1. User types `/document` (or similar command)
2. System automatically invokes appropriate agent (Sisyphus/Build)
3. Agent documents everything in `docs/requirements/` with proper structure:
   - `docs/requirements/conversations/` - Verbatim transcripts
   - `docs/requirements/summaries/` - Key points per session
   - `docs/requirements/official/` - Formal numbered requirements (later)

This should be a **repeatable process** that can be invoked multiple times as conversations progress.

## Requirements

### REQ-DOC-001: Slash Command Definition
Create a slash command `/document` that:
- Can be invoked by user at any time
- Triggers documentation agent workflow
- Captures conversation from current session
- Appends to existing documentation (doesn't overwrite)

### REQ-DOC-002: Documentation Agent Workflow (COMPLETE FLOW)
The workflow should execute the FULL documentation pipeline:

**Phase 1: Capture**
1. Read current conversation history from session
2. Identify session number (auto-increment from previous sessions)
3. Create verbatim transcript in `docs/requirements/conversations/session-NNN-YYYY-MM-DD-topic.md`

**Phase 2: Summarize**
4. Extract key points into `docs/requirements/summaries/session-NNN-summary.md`

**Phase 3: Verify Summary**
5. Cross-reference summary against verbatim transcript
6. Ensure no critical information was lost
7. Flag any discrepancies for review
8. Create verification report in `docs/requirements/summaries/session-NNN-verification.md`

**Phase 4: Generate Requirements**
9. Convert summary key points to formal numbered requirements
10. Use single prefix rule (e.g., REQ-VOICE-001, REQ-CANVAS-001)
11. Create requirements in `docs/requirements/official/REQ-[MODULE]-NNN.md`
12. Include traceability links back to session number

**Phase 5: Verify Requirements**
13. Cross-check requirements against summaries
14. Ensure requirements accurately reflect discussion
15. Validate traceability links
16. Create verification report in `docs/requirements/official/REQ-[MODULE]-verification.md`

**Phase 6: Finalize**
17. Update master index if needed
18. Return success confirmation with all file paths

### REQ-DOC-003: Directory Structure
Ensure these directories exist and are properly organized:
```
docs/
└── requirements/
    ├── conversations/
    │   ├── session-001-2025-02-04-initial-planning.md
    │   ├── session-002-YYYY-MM-DD-topic.md
    │   └── ...
    ├── summaries/
    │   ├── session-001-summary.md
    │   ├── session-001-verification.md  (verification report)
    │   ├── session-002-summary.md
    │   ├── session-002-verification.md
    │   └── ...
    ├── official/
    │   ├── REQ-VOICE-001-through-NNN.md
    │   ├── REQ-VOICE-verification.md
    │   ├── REQ-CANVAS-001-through-NNN.md
    │   ├── REQ-CANVAS-verification.md
    │   └── ...
    ├── INDEX.md  (master cross-reference)
    └── DOCUMENTATION_PROCESS.md  (explains the system)
```

### REQ-DOC-004: Session Numbering
- Auto-detect highest existing session number
- Increment by 1 for new session
- Format: `session-NNN` (zero-padded to 3 digits)
- Date format: `YYYY-MM-DD`
- Topic: Short kebab-case description (e.g., `initial-planning`, `voice-flows`, `canvas-design`)

### REQ-DOC-005: Verbatim Transcript Format
```markdown
# Session NNN: [Topic] - YYYY-MM-DD

## Participants
- User: Lior Shtram
- Agent: [Agent Name/Type]

## Conversation

### [Timestamp or Sequential Order]

**User:**
[Exact words spoken/typed]

**Agent:**
[Exact response]

**User:**
[Next input]

...

## Session End
- Duration: [if available]
- Status: [Complete / In Progress / Paused]
- Next Topics: [if identified]
```

### REQ-DOC-006: Summary Format
```markdown
# Session NNN Summary - [Topic]

**Date**: YYYY-MM-DD  
**Duration**: [if available]  
**Status**: [Complete / In Progress]

## Key Decisions Made
- Decision 1
- Decision 2
- ...

## Features Discussed
- Feature 1: Description
- Feature 2: Description
- ...

## Technical Insights
- Insight 1
- Insight 2
- ...

## Open Questions
1. Question 1?
2. Question 2?
- ...

## Action Items
- [ ] Action 1
- [ ] Action 2
- ...

## Next Topics to Cover
- Topic 1
- Topic 2
- ...

## Traceability
- Links to: [Related sessions]
- Referenced by: [Future requirements]
```

### REQ-DOC-008: Summary Verification Format
After creating summary, verify against transcript:
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

### REQ-DOC-009: Requirements Format
Generated from summaries, using Fermata single-prefix convention:
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
| ... | ... | ... | ... | ... |

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
- ...

**Dependencies**:
- [Other requirements or technical dependencies]

**Notes**:
[Any additional context]

---

[Repeat for each requirement]
```

### REQ-DOC-010: Requirements Verification Format
Cross-check requirements against summaries:
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
| ... | ... | ... | ... |

## Discrepancies Found
[List any gaps, mismatches, or issues, or write "None"]

## Reviewer Notes
[Any additional context or clarifications]

## Verification Signature
- Verified by: [Agent name/type]
- Date: YYYY-MM-DD HH:MM:SS
```
Create `docs/requirements/DOCUMENTATION_PROCESS.md` explaining:
- Purpose of documentation system
- How to use `/document` command
- File structure and organization
- Traceability flow (conversation → summary → requirements → verification)
- Quality standards

## Implementation Steps

## Execution Checklist
- [x] Step 1: Create Slash Command Integration
- [x] Step 2: Create Documentation Workflow
- [x] Step 3: Create Directory Structure
- [x] Step 4: Create Initial Documentation Process Guide
- [ ] Step 5: Test the Command

### Step 1: Create Slash Command Integration
**File to Create/Modify**: `.opencode/skills/document-session/SKILL.md`

Create a new skill that:
- Defines the `/document` command
- Specifies trigger conditions
- Documents input parameters (optional topic override)
- Defines expected behavior

### Step 2: Create Documentation Workflow
**File to Create**: `.agent/workflows/document.md`

Create workflow that executes ALL 6 phases:

**Phase 1: Capture (Conversation)**
1. Check for session history access (use session_read tool)
2. Read complete conversation from current session
3. Determine session number (scan `docs/requirements/conversations/`, find highest, increment)
4. Generate date string (YYYY-MM-DD)
5. Prompt user for topic or infer from conversation content
6. Create verbatim transcript file with proper formatting

**Phase 2: Summarize**
7. Analyze conversation and extract key points
8. Categorize into: Decisions, Features, Insights, Questions, Actions, Next Topics
9. Create summary file following REQ-DOC-006 format

**Phase 3: Verify Summary**
10. Cross-reference summary against verbatim transcript
11. Check completeness (all key points captured)
12. Check accuracy (no misinterpretations)
13. Create verification report following REQ-DOC-008 format
14. Flag any discrepancies for user review

**Phase 4: Generate Requirements**
15. Identify module/prefix for requirements (e.g., VOICE, CANVAS, CORE)
16. Convert summary key points to formal numbered requirements
17. Use single prefix rule with sequential numbering
18. Include traceability links back to session
19. Create requirements file following REQ-DOC-009 format

**Phase 5: Verify Requirements**
20. Cross-check requirements against summaries
21. Ensure all summary points have corresponding requirements
22. Validate no scope creep (no additions beyond discussion)
23. Check traceability links are correct
24. Create requirements verification report following REQ-DOC-010 format

**Phase 6: Finalize**
25. Update `docs/requirements/INDEX.md` with new session/requirements
26. Create DOCUMENTATION_PROCESS.md if it doesn't exist
27. Report success with all file paths created

### Step 3: Create Directory Structure
Ensure directories exist:
```bash
mkdir -p docs/requirements/conversations
mkdir -p docs/requirements/summaries
mkdir -p docs/requirements/official
```

Create `docs/requirements/INDEX.md` master file if it doesn't exist.

### Step 4: Create Initial Documentation Process Guide
**File to Create**: `docs/requirements/DOCUMENTATION_PROCESS.md`

Content should explain:
- What this documentation system is for
- How to invoke `/document`
- What gets created
- How to use the documentation
- Traceability process

### Step 5: Test the Command
- Run `/document` with a test session
- Verify files are created in correct locations
- Verify content is accurate
- Verify session numbering works
- Test multiple invocations (incremental sessions)

## Technical Considerations

### Session History Access
The agent needs access to:
- Current conversation history
- Message timestamps (if available)
- Speaker identification (User vs Agent)

**Investigation needed**: How does OpenCode expose session history?
- Via `session_read` tool?
- Via context memory?
- Via API?

### Idempotency
If user runs `/document` multiple times in same session:
- **Option A**: Overwrite existing session file (update in place)
- **Option B**: Create new session each time (not recommended)
- **Option C**: Ask user: "Session NNN already exists. Update or create new?"

**Recommendation**: Option A for same session, auto-increment for new sessions.

### Topic Inference
If user doesn't provide topic:
- Analyze conversation content
- Extract main themes
- Generate short kebab-case topic (e.g., `voice-flows`, `canvas-design`)
- Present to user for confirmation

### Large Conversations
If conversation is very long:
- Consider paginating transcript
- Or: Create summary sections within transcript
- Ensure markdown files remain readable

## Success Criteria

- [ ] User can type `/document` and get COMPLETE documentation created
- [x] Files appear in all required directories (conversations, summaries, official)
- [ ] Session numbering increments correctly
- [ ] Verbatim transcripts are accurate and complete
- [x] Summaries capture key points without missing important details
- [x] **Summary verification reports confirm completeness and accuracy**
- [x] **Formal requirements generated from summaries with proper traceability**
- [x] **Requirements verification reports confirm compliance with summaries**
- [ ] Process can be repeated multiple times
- [x] Documentation is well-formatted and readable
- [x] DOCUMENTATION_PROCESS.md explains the complete system
- [x] INDEX.md updated with new entries

## Files to Create

1. `.opencode/skills/document-session/SKILL.md` - Slash command skill definition
2. `.agent/workflows/document.md` - Complete 6-phase documentation workflow
3. `docs/requirements/DOCUMENTATION_PROCESS.md` - Process guide explaining complete flow
4. `docs/requirements/INDEX.md` - Master cross-reference of all sessions and requirements
5. `docs/requirements/conversations/session-001-2025-02-04-initial-planning.md` - First session verbatim transcript
6. `docs/requirements/summaries/session-001-summary.md` - First session key points
7. `docs/requirements/summaries/session-001-verification.md` - Verification that summary captures conversation
8. `docs/requirements/official/REQ-[MODULE]-001-through-NNN.md` - Formal requirements from session 001
9. `docs/requirements/official/REQ-[MODULE]-verification.md` - Verification that requirements match summaries

## Agent to Use
**Sisyphus-Junior (category: quick)** or **Build agent**
- Needs write permissions to `docs/requirements/`
- Should be able to read session history
- Comfortable with file operations and text processing

## Estimated Effort
- Skill definition: 30 minutes
- Workflow creation: 2-3 hours (expanded to include all 6 phases)
- Initial documentation: 2-3 hours (capturing Session 001 + verification + requirements)
- Testing: 1 hour

**Total**: 6-8 hours

## Priority
**High** - This is foundational infrastructure that enables all future planning conversations.

## Notes
- This system should work for ALL future planning sessions, not just OpenSpace
- Consider making this a reusable pattern for other projects
- Documentation quality is critical - verbatim means VERBATIM (no paraphrasing)
- Summaries should be comprehensive but not redundant with transcript

## Future Enhancements
- Create `/summarize-all` command to aggregate all session summaries into one master document
- Add visualization of conversation flow and decision trees
- Implement cross-session traceability (requirements spanning multiple sessions)
- Add AI-assisted requirement prioritization based on conversation emphasis

---

**Plan Status**: Ready for execution  
**Blocked By**: None  
**Dependencies**: Session history access (investigate)
