---
name: document-session
description: Generate end-to-end session documentation. Usage: /document [topic]
---

# DOCUMENT-SESSION: The Conversation Archivist

## Slash Command Definition

### Command: `/document`

**Purpose**: Trigger comprehensive documentation of the current session conversation.

**Usage**:
```
/document [optional-topic]
```

**Parameters**:
- `topic` (optional): Override the auto-detected topic name
  - Format: kebab-case (e.g., `voice-flows`, `initial-planning`)
  - If omitted, topic will be inferred from conversation content and confirmed

**Trigger Conditions**:
- Can be invoked at any time during a session
- Captures the current conversation history from start of session
- If a session-NNN already exists for this conversation, updates in place
- Does not create duplicate session files

**Expected Behavior**:
1. Reads current session conversation (all messages since session start)
2. Determines session number (auto-incremented from existing sessions)
3. Initiates 6-phase documentation workflow:
   - Phase 1: Capture verbatim transcript
   - Phase 2: Summarize key points
   - Phase 3: Verify summary accuracy
   - Phase 4: Generate formal requirements
   - Phase 5: Verify requirements traceability
   - Phase 6: Finalize and update index

**Output Files Created**:
- `docs/requirements/conversations/session-NNN-YYYY-MM-DD-topic.md` - Verbatim transcript
- `docs/requirements/summaries/session-NNN-summary.md` - Summary of key points
- `docs/requirements/summaries/session-NNN-verification.md` - Verification report
- `docs/requirements/official/REQ-[PREFIX]-NNN.md` - Formal requirements (if applicable)
- `docs/requirements/official/REQ-[PREFIX]-verification.md` - Requirements verification
- `docs/requirements/INDEX.md` - Updated master index

**Workflow Reference**:
Points to complete workflow: `.agent/workflows/document.md`

---

> **Identity**: You are the Documentation Archivist.
> **Goal**: Produce complete, traceable documentation from a live session.

## Context & Constraints
- **Scope**: Current session only unless explicitly asked to backfill.
- **Verbatim Transcript**: Must preserve exact user/agent wording; keep raw (no cleanup).
- **Single Prefix Rule**: All requirements within a module use one prefix (e.g., REQ-CORE-001).
- **Traceability**: Each requirement must link back to the session summary.
- **Verification**: Create verification reports for summary and requirements (delegate if possible).
- **Location**: Use `docs/requirements/` structure only.
- **Idempotency**: If session already exists, update in place (do not create duplicates).
- **Raw Preservation**: Do not filter tool markers or metadata from transcripts.
- **Verification Loop**: Do not proceed to requirements until summary verification passes.
- **Requirements Check**: Requirements must be verified against the summary (not transcript).

## Inputs
- **Optional Topic**: `/document [topic]`
  - If absent, infer from conversation content and confirm.

## Algorithm (6 Phases)

1. **Capture**
   - Read session history (full conversation).
   - Determine session number (increment highest existing).
   - Create transcript file in `docs/requirements/conversations/`.

2. **Summarize**
   - Extract key decisions, features, insights, questions, actions.
   - Create summary in `docs/requirements/summaries/`.

3. **Verify Summary (Loop)**
   - Cross-check summary vs transcript.
   - If gaps/conflicts, update summary and re-verify.
   - Ask user for clarification if ambiguity remains.
   - Create verification report in `docs/requirements/summaries/`.

4. **Generate Requirements (Only After Summary Verified)**
   - Convert verified summary into formal requirements.
   - Use single prefix rule and sequential numbering.
   - Create requirements file in `docs/requirements/official/`.

5. **Verify Requirements (Against Summary Only)**
   - Cross-check requirements vs summary.
   - Ensure no omissions or scope creep.
   - Create verification report in `docs/requirements/official/`.

6. **Finalize**
   - Update `docs/requirements/INDEX.md`.
   - Create `docs/requirements/DOCUMENTATION_PROCESS.md` if missing.
   - Report created files.

## Output Format
```markdown
### 📄 Documentation Complete
- Transcript: docs/requirements/conversations/session-NNN-YYYY-MM-DD-topic.md
- Summary: docs/requirements/summaries/session-NNN-summary.md
- Summary Verification: docs/requirements/summaries/session-NNN-verification.md
- Requirements: docs/requirements/official/REQ-[PREFIX]-001-through-NNN.md
- Requirements Verification: docs/requirements/official/REQ-[PREFIX]-verification.md
- Index Updated: docs/requirements/INDEX.md
```
