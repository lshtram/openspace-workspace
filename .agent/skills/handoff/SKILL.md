---
name: handoff
description: Compact the current context window into a single file for clean conversation handover.
---

# HANDOFF: The Relay Runner

> **Identity**: Context Compressor
> **Goal**: Summarize the current state into a high-density, portable artifact (`HANDOFF.md`) to enable a "fresh start" without context loss.

## Usage

Run this skill when:

- The context window is full or "muddy".
- You are switching to a new Agent or Chat Interface.
- You want to "checkpoint" your work before a break.

## Algorithm

1. **Auto-Discovery**: Run `.agent/scripts/context_dump.py` to get the objective system state.
2. **Analysis**: Review the current conversation and the script output.
3. **Synthesis**: Create (or overwrite) both:
   - `HANDOFF.md` in the root directory (full format, see template below).
   - `compact.md` in the root directory (one-liner summary for quick reference).
4. **Structure**: The file MUST follow the "Mid-Task Stabilization" format:
   - **1. Context**: 1-sentence goal.
   - **2. Completed**: What was _actually_ done (files types, tests passed).
   - **3. In-Flight**: What is broken or half-finished right now.
   - **4. Next Actions**: The immediate next 3 commands/edits for the next agent.
   - **5. Critical Memories**: "Gotchas" discovered during this session (e.g., "The API token implies X").
5. **Notify**: Tell the user both files are ready (`HANDOFF.md` for full context, `compact.md` for quick reference).

## Output Templates

### `HANDOFF.md` (Full Format)

```markdown
# 🤝 Handoff: [Goal Name]

> **Date**: [YYYY-MM-DD]
> **Status**: [Stable / Broken / Testing]

## 🎯 Current Objective

[Concise description of what we are trying to achieve]

## ✅ Accomplished

- [x] Refactored `UseUser.ts`
- [x] Added Unit Tests (Pass: 12, Fail: 0)

## 🚧 Work in Progress

- `UseAuth.ts` is throwing a 403 error. The mock is likely incorrect.

## ⏭️ Next Steps

1. Fix the mock in `UseAuth.test.ts`.
2. Run `npm test` from `openspace-client/`.
3. Commit.

## 🧠 Operational Context

- **Guideline Update**: We decided to use `zod` for all new validation.
- **Gotcha**: The test database resets every 60s.
```

### `compact.md` (Quick Reference)

```markdown
# [Goal Name] - Quick Handoff

## Status
[One-line status summary]

## What We Did
- Key accomplishment 1
- Key accomplishment 2

## What We're Working On
- Current focus / blocker

## Next Step
The immediate next action

## Key Files Modified
| File | Change |
|------|--------|
| `path/to/file` | What changed |

## Critical Context
[Any "gotchas" or important notes]
```
