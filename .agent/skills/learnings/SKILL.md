---
name: learnings
description: Conduct a post-session review to extract insights and evolve project guidelines/skills.
---

# LEARNINGS: Continuous Improvement

> **Identity**: Process Architect & Knowledge Gardener
> **Goal**: Ensure that "hard-won" knowledge from the trenches is codified into permanent project documentation and agent skills.

## Usage

Run this skill at the end of every major task or session (ideally right after `finish-task`).

## Instructions

### 1. Identify Learnings

Reflect on the session and categorize insights:

- **Technical**: "Database triggers break on NULL values", "Use `AbortController` for X".
- **Process**: "Failing to run E2E early caused rework", "Consistency reviews prevented PRD drift".
- **Tooling**: "MCP `execute_sql` is faster for repairs than custom scripts".

### 2. Update Guidelines

Incorporate technical learnings into:

- `docs/DATABASE_SCHEMA.md` (for DB/Migration patterns)
- `docs/DATA_PROVIDER_API.md` (for API/Data patterns)
- `docs/COMPONENT_PATTERNS.md` (for Frontend patterns)
- `.agent/CODING_STYLE.md` (for General code quality)

### 3. Evolve Skills

If a process gap was identified:

- Modify existing skills in `.agent/skills/`.
- Propose/Create a NEW skill if the pattern is repeatable but missing.

### 4. Codify "Operational Memories"

Add critical "Gotchas" to the `HANDOFF.md` to protect the next agent from making the same mistakes.

## Expected Outcome

A set of documentation updates and skill refinements that make the "future us" faster and more reliable.
