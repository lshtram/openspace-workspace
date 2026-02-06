# Requirements Proposal: [Feature Name]

**Date**: [YYYY-MM-DD]
**Status**: Pending Approval

---

## 1. Problem & Goal

**Problem**: [What user pain point does this solve?]

**Goal**: [What does success look like?]

**Why Now**: [What's the context or urgency?]

---

## 2. User Stories

| Actor | Action | Outcome | Priority |
| :---- | :----- | :------ | :------- |
| **User** | [Action] | [Outcome] | P0 |
| **User** | [Action] | [Outcome] | P1 |

---

## 3. Proposed Requirements

> **IMPORTANT**: All requirements in this module MUST use a single prefix (e.g., `REQ-[MODULE]-001`). Do NOT use multiple prefixes. See `.agent/skills/prd-architect/SKILL.md` for details.

### Functional Requirements

| ID | Requirement | Priority | Notes |
| :-- | :---------- | :------: | :---- |
| REQ-[MODULE]-001 | **[Title]**: Description | P0 | |
| REQ-[MODULE]-002 | **[Title]**: Description | P0/P1 | |
| REQ-[MODULE]-003 | **[Title]**: Description | P1 | |
| ... | ... | ... | ... |

### Non-Functional Requirements

| ID | Requirement | Priority | Notes |
| :-- | :---------- | :------: | :---- |
| REQ-[MODULE]-NFR-001 | **[Performance]**: Description | P1 | |
| REQ-[MODULE]-NFR-002 | **[Security]**: Description | P0 | |

---

## 4. Integration Points

| Component | Relationship | Impact |
| :-------- | :----------- | :----- |
| [Existing Module] | Depends on / Extends / New | High/Med/Low |

---

## 5. Out of Scope

- [Item 1 - reason for exclusion]
- [Item 2 - reason for exclusion]

---

## 6. Suggested Test Coverage

| Test Type | Coverage Target |
| :-------- | :-------------- |
| Unit Tests | [X]% coverage for new logic |
| E2E Tests | Critical user flows |
| Integration | API/data layer tests |

---

## 7. Documentation Updates Required

- [ ] Create `docs/prd/PRD_[FEATURE].md`
- [ ] Update `docs/prd/PRD_INDEX.md`
- [ ] Add to `docs/TODO.md`
- [ ] Update `docs/ARCHITECTURE.md` if structural changes

---

## Approval

[ ] **Approved** - Proceed to Tech Spec
[ ] **Approved with Changes** - See notes below
[ ] **Rejected** - Needs revision

**Notes**:
_______________________________________________

---

## How This Maps to Existing Documentation

### PRD Structure Alignment
This proposal follows the template at `.agent/templates/PRD.md` and would integrate into the modular PRD system in `docs/prd/`.

### Cross-Reference with PRD_CORE.md
- Core data models: [referenced/modified/new]
- Shared workflows: [referenced/modified/new]
- Cross-cutting concerns: [addressed]

### Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
| :--- | :--------: | :----: | :--------- |
| [Risk] | Low/Med/High | Low/Med/High | [Plan] |
