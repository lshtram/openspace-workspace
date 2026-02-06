# New Feature Requirements Gathering System

## Overview

A structured approach to gathering high-quality requirements before development begins, ensuring complete understanding and reducing rework.

## Components

### 1. Command: `/new-feature`

**Usage**: `/new-feature [brief description]`

**Workflow Phases**:
1. Capture initial description
2. Structured interview (using `new-feature-interviewer` skill)
3. Apply supplementary skills as needed (research, perspective, etc.)
4. Synthesize and present proposal
5. Formalize into PRD after approval

### 2. Skill: `new-feature-interviewer`

**Location**: `.agent/skills/new-feature-interviewer/SKILL.md`

**Purpose**: Structured interview protocol with categories:
- Goals & Value
- Users & Scope
- User Flow
- Edge Cases
- Constraints & Dependencies
- Success Criteria

### 3. Template: `REQUIREMENTS_PROPOSAL.md`

**Location**: `.agent/templates/REQUIREMENTS_PROPOSAL.md`

**Purpose**: Standard format for presenting requirements to user for approval before formalizing into PRD.

### 4. Workflow: `new-feature.md`

**Location**: `.agent/workflows/new-feature.md`

**Purpose**: Detailed step-by-step guide for executing the requirements gathering process.

## Documentation Integration

| Document | Update |
| :------- | :----- |
| `.agent/AGENTS.md` | Added `/new-feature` to skills list and common patterns |
| `.agent/PROCESS.md` | Updated Step 1 to reference `/new-feature` as Option A |
| `.agent/workflows/new-feature.md` | NEW - Main workflow |
| `.agent/skills/new-feature-interviewer/SKILL.md` | NEW - Interview protocol |
| `.agent/templates/REQUIREMENTS_PROPOSAL.md` | NEW - Proposal template |

## How It Works

### Example Flow

```
User: /new-feature I want to add a practice streak counter

Agent:
1. Reads new-feature-interviewer skill
2. Identifies supplementary skills needed (none for simple feature)
3. Begins interview:
   - "What problem does this solve for the user?"
   - "How will the user know they've succeeded?"
   - (continues with structured questions)
4. Synthesizes into requirements proposal
5. Presents proposal using REQUIREMENTS_PROPOSAL template
6. User approves
7. Agent creates formal PRD using prd-architect skill
8. Updates docs/TODO.md
```

### Decision Tree for Supplementary Skills

| Situation | Skill to Apply |
| :-------- | :------------- |
| Technical uncertainty (APIs, libraries) | `research-mastery` |
| Complex UX/security/performance trade-offs | `perspective` |
| Pattern consistency unclear | `pattern-enforcement` |
| Test coverage planning needed | `test-architect` |

## Comparison with `/start-task`

| Aspect | `/start-task` | `/new-feature` |
| :----- | :------------ | :------------- |
| Focus | Task initialization | Requirements quality |
| Interview | None | Structured 6-category interview |
| User Stories | User provides | Co-created through questioning |
| Documentation | Creates task.md | Creates requirements proposal first |
| Approval | On plan | On requirements (before plan) |
| Status | Production ready | Pilot phase (may replace start-task) |

## Next Steps

1. **Pilot**: Use `/new-feature` for 3-5 features to validate
2. **Evaluate**: Assess if requirements quality improves
3. **Decide**: Consider replacing `/start-task` based on results
4. **Document**: Update PROCESS.md if replacement occurs
