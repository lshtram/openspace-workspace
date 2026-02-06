# OpenSpace Requirements Documentation Process

## 1. Purpose

This system preserves **full traceability** from raw conversation to formal requirements. It implements a six-phase workflow that captures, summarizes, and verifies all planning decisions.

**Core Principle**: If it is not written down, it did not happen.

The documentation system serves these critical functions:

- **Conversation Preservation**: Maintain exact, verbatim records of all planning sessions
- **Summary Extraction**: Extract key decisions, features, insights, and action items
- **Requirements Generation**: Convert summaries to formal, traceable requirements
- **Verification**: Ensure summaries are complete and requirements match summaries
- **Traceability**: Link every requirement back to its original discussion
- **Future Reference**: Enable quick lookup and cross-session analysis

---

## 2. How to Use `/document` Command

### Basic Usage

```bash
/document [optional-topic]
```

### Examples

```bash
# Automatic topic inference
/document

# Explicit topic
/document voice-flows-and-interactions

# With spaces (topic will be converted to kebab-case)
/document "Canvas Design Architecture"
```

### What Happens When You Run `/document`

The system automatically executes a **6-phase workflow**:

**Phase 1: Capture**
- Reads entire conversation history from current session
- Determines next session number (auto-increment from existing sessions)
- Generates session filename: `session-NNN-YYYY-MM-DD-topic.md`
- Creates verbatim transcript (exact conversation, no paraphrasing)

**Phase 2: Summarize**
- Analyzes conversation to extract key points
- Categorizes into: Key Decisions, Features Discussed, Technical Insights, Open Questions, Action Items, Next Topics
- Creates summary file: `session-NNN-summary.md`

**Phase 3: Verify Summary**
- Cross-references summary against verbatim transcript
- Checks completeness (all key points captured)
- Checks accuracy (no misinterpretations)
- Creates verification report: `session-NNN-verification.md`
- Flags any discrepancies for user review

**Phase 4: Generate Requirements**
- Converts summary key points to formal, numbered requirements
- Assigns module prefix (e.g., REQ-CORE, REQ-VOICE, REQ-CANVAS)
- Uses single-prefix rule (all requirements in a module share same prefix)
- Includes traceability links back to session summary
- Creates requirements file: `REQ-[PREFIX]-001-through-NNN.md`

**Phase 5: Verify Requirements**
- Cross-checks requirements against summary
- Ensures all summary points have corresponding requirements
- Validates no scope creep (no additions beyond discussion)
- Verifies traceability links
- Creates verification report: `REQ-[PREFIX]-verification.md`

**Phase 6: Finalize**
- Updates `docs/requirements/INDEX.md` with new entries
- Reports success with all file paths created
- Returns confirmation message with summary of generated files

---

## 3. File Structure and Organization

### Directory Layout

```
docs/requirements/
├── conversations/
│   ├── session-001-2025-02-04-initial-planning.md
│   ├── session-002-YYYY-MM-DD-topic.md
│   └── session-NNN-YYYY-MM-DD-topic.md
├── summaries/
│   ├── session-001-summary.md
│   ├── session-001-verification.md
│   ├── session-002-summary.md
│   ├── session-002-verification.md
│   └── session-NNN-[summary|verification].md
├── official/
│   ├── REQ-CORE-001-through-NNN.md
│   ├── REQ-CORE-verification.md
│   ├── REQ-VOICE-001-through-NNN.md
│   ├── REQ-VOICE-verification.md
│   └── REQ-[PREFIX]-[files].md
├── INDEX.md
└── DOCUMENTATION_PROCESS.md
```

### File Naming Conventions

#### Sessions

**Transcript Format**: `session-NNN-YYYY-MM-DD-topic.md`
- `NNN` = Zero-padded session number (001, 002, 003, etc.)
- `YYYY-MM-DD` = Date of session
- `topic` = Short kebab-case description (e.g., `initial-planning`, `voice-flows`, `canvas-design`)

**Example**: `session-001-2025-02-04-initial-planning.md`

**Summary Format**: `session-NNN-summary.md`
- Contains extracted key points from transcript
- Used as source for requirement generation

**Verification Format**: `session-NNN-verification.md`
- Documents completeness and accuracy check
- Lists any discrepancies or gaps found
- Signed by verification agent with timestamp

#### Requirements

**Format**: `REQ-[PREFIX]-NNN.md` (individual requirements compiled into single document)
- `PREFIX` = Module identifier (uppercase, single per module: CORE, VOICE, CANVAS, etc.)
- `NNN` = Sequential requirement number within module (001, 002, 003, etc.)

**Example**: `REQ-VOICE-001-through-042.md` (all VOICE requirements in one file)

**Verification Format**: `REQ-[PREFIX]-verification.md`
- Cross-reference matrix linking requirements to source sessions
- Verification checklist
- Discrepancies and review notes

---

## 4. Traceability Flow

### Complete Traceability Chain

The documentation system maintains a **complete chain of traceability** from initial conversation to formal requirements:

```
Conversation Message
    ↓
Verbatim Transcript (session-NNN-YYYY-MM-DD-topic.md)
    ↓
Summary Extract (session-NNN-summary.md)
    ↓
Summary Verification (session-NNN-verification.md)
    ↓
Formal Requirement (REQ-PREFIX-NNN in requirements file)
    ↓
Requirements Verification (REQ-PREFIX-verification.md)
    ↓
Cross-Reference in INDEX.md
```

### How Traceability Works

1. **Transcript → Summary**: Each summary section references the specific conversation segment it captures
2. **Summary → Requirements**: Each requirement includes `Source: Session NNN, Section: [Key Decisions #X]`
3. **Requirements → Tests**: Each requirement links to testable acceptance criteria
4. **Verification Chain**: Both summary and requirements verification reports create cross-reference matrices

### Example Traceability Link

**Conversation** (Session 001):
> "We should use a message queue for async processing to handle high load."

**Summary** (session-001-summary.md):
```
## Technical Insights
- Insight: Message queue needed for async processing to handle high load
```

**Requirement** (REQ-CORE-001-through-NNN.md):
```
### REQ-CORE-042: Async Message Queue
**Source**: Session 001, Technical Insights
**Description**: System must use a message queue for asynchronous task processing...
```

**Verification** (REQ-CORE-verification.md):
```
| REQ-CORE-042 | Session 001 | Technical Insights | ✅ |
```

---

## 5. Quality Standards

### Transcript Quality Standards

**Verbatim Requirement**
- Transcripts must capture exact words spoken or typed
- No paraphrasing, cleanup, or interpretation
- Preserve original formatting and emphasis
- Include timestamps if available

**Completeness**
- All conversation turns (user and agent) included
- No segments omitted or condensed
- Session metadata recorded (participants, date, duration, status)

**Formatting**
- Clear speaker labels: `**User:**` and `**Agent:**`
- Organized into logical conversation sections
- Session metadata at top, summary at bottom

### Summary Quality Standards

**Extraction Accuracy**
- Summary points must be extractable from transcript
- No invented or assumed information
- All dates, names, and specific details accurate
- Multiple distinct points grouped under appropriate category

**Completeness**
- All key decisions captured
- All features discussed documented
- All technical insights recorded
- All open questions listed
- All action items tracked
- Next topics identified

**Categorization**
- Key Decisions: High-level choices and agreements
- Features Discussed: Product capabilities and scope
- Technical Insights: Architecture, constraints, learnings
- Open Questions: Unresolved issues requiring follow-up
- Action Items: Specific tasks with owners and deadlines
- Next Topics: Planned subjects for future sessions

### Requirement Quality Standards

**Single Prefix Rule** ⭐
- All requirements in a module MUST use same prefix (REQ-VOICE, REQ-CORE, etc.)
- Do NOT mix prefixes within a module
- One prefix per module ensures global uniqueness

**Traceability**
- Every requirement linked back to source session and specific section
- Source format: `Session NNN, Section: [category] #[number]`
- No orphaned requirements (all have documented source)

**Specificity**
- Each requirement is specific and measurable
- Acceptance criteria are testable and verifiable
- Dependencies clearly documented
- Priority levels consistent with discussion emphasis

**Consistency**
- Priority levels: P0 (Critical), P1 (High), P2 (Medium), P3 (Low)
- Status tracking: Draft, Under Review, Approved
- Category tags: Functional, Non-Functional, Architectural, etc.

### Verification Standards

**Summary Verification Checklist**
- [ ] All key decisions captured from transcript
- [ ] All features discussed documented
- [ ] All technical insights recorded
- [ ] All open questions listed
- [ ] All action items tracked
- [ ] Summary accurately reflects conversation (no misinterpretations)
- [ ] No critical information omitted
- [ ] Traceability links are correct

**Requirements Verification Checklist**
- [ ] All requirements linked back to session summaries
- [ ] All summary key points converted to requirements
- [ ] No orphaned requirements (all have source)
- [ ] No missed topics from summary
- [ ] Requirements accurately reflect summary intent
- [ ] No scope creep (no additions beyond discussion)
- [ ] Priority levels match discussion emphasis
- [ ] Categorization is consistent and logical
- [ ] Acceptance criteria are testable
- [ ] Dependencies identified correctly

---

## 6. Special Cases and Guidelines

### Idempotency

**If documentation for a session already exists:**

- **Option A (Recommended)**: Update in place, appending only new content
- **Option B**: Rewrite transcript from current session log if significant new messages added
- **Option C**: Create new session if continuing work in different direction

**If user runs `/document` multiple times in same session:**
- First execution: Creates all files
- Second execution: Offers choice - update existing or create new session
- Recommendation: Update existing session to maintain single source of truth

### Topic Inference

**If user doesn't provide explicit topic:**

1. System analyzes conversation content
2. Extracts main themes and focus areas
3. Generates short kebab-case topic
4. Presents to user for confirmation before finalizing filename

**Examples**:
- Meeting focused on authentication → `voice-authentication-flows`
- Discussion of whiteboard design → `canvas-architecture-design`
- Initial project planning → `initial-planning`

### Large Conversations

**If conversation is very long (1000+ messages):**

- Transcript is still created as single complete file
- Consider breaking summary into subsections
- Ensure both remain readable and searchable
- Verification process may take longer

### Conflict Resolution

**If summary verification finds discrepancies:**

1. List all gaps and conflicts in verification report
2. Flag with status `⚠️ Needs Review`
3. Do NOT proceed to requirements generation until resolved
4. Ask user for clarification on disputed points
5. Update summary, re-run verification, confirm status changes to `✅ Complete`

---

## 7. Verification Loop Requirements

### Do Not Skip Verification

**Critical Rule**: Do not generate requirements until summary verification passes.

### Verification Process

1. **After Summary Created**: Run verification immediately
2. **Check Completeness**: Ensure all transcript key points captured
3. **Check Accuracy**: Confirm summary reflects conversation without misinterpretation
4. **Document Status**: Mark as `✅ Complete` or `⚠️ Needs Review`
5. **If Gaps Found**:
   - Revise summary to include missing points
   - Re-run verification
   - Confirm status before proceeding

6. **After Requirements Created**: Run second verification immediately
7. **Cross-Check**: Ensure requirements match summary intent
8. **Validate Traceability**: Confirm all links are correct
9. **Document Status**: Mark requirements verification status

---

## 8. Master Index File (INDEX.md)

The `docs/requirements/INDEX.md` file serves as master cross-reference:

**Contains**:
- List of all sessions with dates and topics
- List of all requirement modules with counts
- Quick links to each major document
- Summary of recent additions

**Updated**: Automatically by `/document` command at Phase 6

**Format**:
```markdown
# Requirements Documentation Index

## Sessions

| Session | Date | Topic | Files |
|---------|------|-------|-------|
| 001 | 2025-02-04 | Initial Planning | [transcript](conversations/session-001-...) |

## Requirements Modules

| Module | Count | Status | Verification |
|--------|-------|--------|--------------|
| REQ-CORE | 42 | Draft | ✅ |
```

---

## 9. Implementation Status

- [x] Directory structure created
- [x] DOCUMENTATION_PROCESS.md (this file) - explains complete system
- [ ] `/document` command - slash command skill definition
- [ ] Documentation workflow - 6-phase execution (in development)
- [ ] Initial session documentation - first verbatim transcript and summary
- [ ] Verification reports - summary and requirements verification

See `.sisyphus/plans/plan-002-create-documentation-command.md` for detailed implementation roadmap.

---

## 10. Future Enhancements

- **Cross-Session Analysis**: `/summarize-all` command to aggregate multiple sessions
- **Visualization**: Conversation flow diagrams and decision trees
- **AI-Assisted Prioritization**: Automatic priority assignment based on discussion emphasis
- **Requirements Linking**: Cross-requirement dependencies and impact analysis
- **Export Formats**: Generate PDFs, presentations, or other output formats

---

**Last Updated**: 2025-02-05  
**Maintained By**: OpenSpace Documentation System  
**Status**: Active & Evolving
