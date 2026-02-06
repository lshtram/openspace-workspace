---
description: Structured requirements gathering for new features with mandatory multi-perspective audit. Usage: /new-feature [brief_description]
---

# NEW-FEATURE WORKFLOW

## Phase 1: Capture Initial Description

1. **Parse Arguments**:
   - Extract the initial feature description from the argument.
   - If empty or too brief, prompt: "Please describe the feature you'd like to work on."

2. **Load Required Skills**:
   ```bash
   skill prd-architect
   skill new-feature-interviewer
   skill perspective
   skill pattern-enforcement
   ```
   - **MANDATORY**: Load `prd-architect` first - it orchestrates all other skills for the audit
   - `new-feature-interviewer` for structured requirements gathering
   - `perspective` for UX/backend/frontend/security/performance analysis
   - `pattern-enforcement` for consistency with existing code patterns

3. **Initial Assessment**:
   - Review existing PRDs in `docs/prd/` to understand related modules
   - Identify which perspectives need deep analysis (see `prd-architect` skill)

## Phase 2: Structured Interview

4. **Follow the Interview Protocol** (from `new-feature-interviewer` skill):
   - Ask about User Goals & Value
   - Ask about User Flow & Experience
   - Ask about Edge Cases & Constraints
   - Ask about Integration Points
   - Ask about Success Criteria

5. **Multi-Perspective Audit** (orchestrated by `prd-architect`):
   - **User Perspective**: Does this solve a real user problem?
   - **Backend Perspective**: What data models, APIs, or services are needed?
   - **Frontend Perspective**: What UI components, state management, interactions?
   - **Quality Perspective**: What error states, validation, accessibility needs?
   - **Testing Perspective**: What test cases, coverage targets, test types?
   - **Security Perspective**: What authentication, authorization, data protection needs?
   - **Performance Perspective**: What latency, scale, resource constraints?

## Phase 3: Synthesis & Proposal

6. **Create Requirements Proposal**:
   - Draft user stories (from interview)
   - Draft functional requirements (grouped by feature area)
   - Draft non-functional requirements (performance, security, etc.)
   - Assign priority (P0/P1/P2)
   - **All requirements MUST use single prefix** (e.g., `REQ-[MODULE]-001`)

7. **Multi-Perspective Review** (via `perspective` skill):
   - Present requirements from each perspective
   - Identify gaps or conflicts
   - Validate against existing patterns (via `pattern-enforcement`)

8. **Show Documentation Integration**:
   - Show how requirements map to existing PRD structure
   - Show traceability to existing modules (via `docs/prd/PRD_CORE.md`)
   - Show estimated test coverage needs
   - Show security and performance considerations

9. **Present to User for Approval**:
   - "Here are the proposed requirements for [Feature]. Please review:"
   - Present multi-perspective summary
   - Ask: "Does this capture the feature correctly from user, technical, and quality perspectives?"

## Phase 4: Formalize PRD (After Approval)

10. **Load `prd-architect` Skill**:
    ```bash
    skill prd-architect
    ```
    - `prd-architect` creates the formal `docs/prd/PRD_<FEATURE>.md`
    - `prd-architect` ensures all perspectives are documented
    - `prd-architect` enforces single-prefix rule and traceability

11. **Update PRD Index**:
    - Update `docs/prd/PRD_INDEX.md`

12. **Update TODO**:
    - Add task to `docs/TODO.md` with priority

13. **Transition to Development**:
    - Offer to proceed with Tech Spec (Step 2 of SDLC in `PROCESS.md`)
    - Or wait for user to initiate `/finish-task` later

## Multi-Perspective Audit Checklist (Required Before Phase 3)

Before presenting requirements, verify:

- [ ] **User**: Real pain point addressed? Clear value proposition?
- [ ] **Backend**: Data models defined? APIs specified? Services needed?
- [ ] **Frontend**: UI components identified? State management clear? Interactions defined?
- [ ] **Quality**: Error states handled? Validation rules? Accessibility (a11y)?
- [ ] **Testing**: Critical test cases identified? Coverage target set? Test types defined?
- [ ] **Security**: Auth requirements? Data protection? Privacy considerations?
- [ ] **Performance**: Latency requirements? Scale expectations? Resource constraints?
- [ ] **Pattern Consistency**: Follows existing conventions? Uses established patterns?

## Notes

- This workflow REPLACES `/start-task` for new feature definition.
- `prd-architect` is MANDATORY for Phase 4 - do not create PRDs without it.
- Multi-perspective audit is REQUIRED - do not skip Phase 2.5.
- Interview questions should be concise - 1-2 questions at a time.
- All requirements in a single PRD module MUST use one prefix (see `prd-architect` skill).
