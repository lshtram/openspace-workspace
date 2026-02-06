# PRD: [Feature Name]

## 1. Goal & Context

**Problem**: [What problem are we solving?]
**Goal**: [What does success look like?]
**Context**: [Why now? Any dependencies?]

## 1.5 Traceability

**ID**: [FEAT-ID]
**Tech Spec**: [docs/TECH_SPEC.md]

## 2. User Stories

| Actor    | Action   | Outcome            | Priority |
| :------- | :------- | :----------------- | :------- |
| **User** | [Action] | [Expected Outcome] | P0       |

## 3. Requirements

- **Functional**:
  - [High Level Item]
- **Non-Functional**:
  - [High Level Item]

### 3.1 Detailed Requirements & Test Traceability

> **IMPORTANT - Prefix Rule**: All requirements in a single PRD module MUST use a single prefix (e.g., `REQ-[MODULE]-001`). Do NOT use multiple prefixes like `REQ-SESS-`, `REQ-ITEM-`, `REQ-TIME-` within the same PRD. This ensures:
> - Global uniqueness across the codebase
> - Easier traceability and cross-referencing
> - Consistent naming convention
>
> **Naming Convention**: Use the module's short ID (e.g., TIMERS → REQ-TIME, CORE → REQ-CORE, METRONOME → REQ-MET)
>
> **Legend**: ✅ = Pass, ❌ = Fail, 🚧 = In Progress
> **Traceability**: Must link to specific test files.

#### REQ-[MODULE]: [Group Name]

| ID | Requirement | Priority | Status | Verified By (File > Test) | Notes |
| :----------- | :----------------------------------------- | :------: | :----: | :------------------------ | :----- |
| REQ-[MODULE]-001 | **[Title]**: Description | P0 | ❌ | `tests/path/to.test.ts` | [Note] |
| REQ-[MODULE]-002 | **[Title]**: Description | P0 | ❌ | `tests/path/to.test.ts` | [Note] |
| ... | ... | ... | ... | ... | ... |

> **For numbered subsections** (e.g., 3.1 Session Timer, 3.2 Item Timer), continue the same prefix sequence:
> - Session requirements: REQ-[MODULE]-001, REQ-[MODULE]-002, ...
> - Item requirements: REQ-[MODULE]-011, REQ-[MODULE]-012, ...
> - Do NOT restart numbering for each subsection

## 4. Success Metrics

- **Metric**: [Target]

## 5. Competitive Comparison (Optional)

| Feature | Competitor | Our Solution |
| :------ | :--------- | :----------- |

## 6. Intentional Omissions (Optional)

- **[Feature]**: [Reason for exclusion]
