---
description: Start a new conversation with updated context loading. Usage: /start-session
---

# Start New Session

Load essential context for starting a new development conversation with the updated Tier 0 system.

## Step 1: Load Tier 0 (Quick Orientation)

Read these files first for immediate context:

1. **`.agent/SESSION_START.md`**:
   - Current project phase
   - Recent work (last 7 days)
   - Code quality status
   - Active blockers
   - Current focus areas

2. **`.agent/CODEBASE_MAP.md`**:
   - Directory structure
   - Module index
   - Common task → file location mapping
   - Quick file finder

## Step 2: Check for Handoff Context

Look for continuation files in project root:

- **`HANDOFF.md`** - Full context from previous session (~230 lines)
- **`compact.md`** - Quick reference from previous session (~80 lines)

If found, read the appropriate file based on depth needed.

## Step 3: Load Tier 1 (Framework)

Read core framework documentation:

1. **`.agent/AGENTS.md`** - AI operational manual
   - Directory structure
   - Context tiering
   - Integrated skills
   - Session management

2. **`.agent/PROCESS.md`** - SDLC workflow
   - 6-phase development process
   - Quality gates
   - Commands and skills reference

3. **`docs/PROJECT_CONTEXT.md`** - Project overview
   - What is Fermata
   - Tech stack
   - Current phase
   - Architecture summary

## Step 4: Check Recent Activity

Read auto-generated context:

1. **`.agent/hot-files.txt`** (if exists):
   - Recently modified files (last 7 days)
   - Indicates active development areas

2. **`.agent/structure-snapshot.txt`** (if exists):
   - Current directory structure
   - Quick reference for navigation

## Step 5: Context Summary

Summarize loaded context:

- **Project Phase**: [From SESSION_START]
- **Recent Work**: [Last 3-5 items]
- **Code Quality**: [Lint/Test status]
- **Active Blockers**: [List]
- **Continuing Work**: [Yes/No - from HANDOFF.md]
- **Hot Areas**: [From hot-files.txt]

## Step 6: Ready State

Confirm ready for work:

✅ **Context Loaded**:
- Tier 0: Session Start + Codebase Map
- Tier 1: Agents + Process + Project Context
- Handoff: [Present/Not Present]
- Recent Activity: [Available/Not Available]

**Ready to**:
- Start new feature: Use `/new-feature [description]`
- Start task: Use `/start-task [name]`
- Continue work: [Based on HANDOFF.md if present]
- Run tests: Use `/verify`
- Ship work: Use `/ship`

---

## Context Loading Summary

| Tier | Files | Token Cost | Load Condition |
|------|-------|------------|----------------|
| **Tier 0** | SESSION_START, CODEBASE_MAP | ~1,300 | Always |
| **Handoff** | HANDOFF.md or compact.md | ~1,000-3,000 | If continuing work |
| **Tier 1** | AGENTS, PROCESS, PROJECT_CONTEXT | ~1,250 | Always |
| **Activity** | hot-files, structure-snapshot | ~200 | If available |

**Total baseline**: ~2,750 tokens (without handoff)  
**With handoff**: ~4,750-5,750 tokens

---

**Run this at the start of every new conversation to load the updated Tier 0 context system.**
