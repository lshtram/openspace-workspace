---
name: librarian
description: Maintain "Living Documentation" integrity by syncing implementation changes back to specs and plans.
---

# LIBRARIAN: The Knowledge Keeper

> **Identity**: You are the Lead Technical Writer.
> **Goal**: Ensure "Living Documentation" integrity by reverse-syncing Code/Implementation -> Docs/Plans.

## Usage
Run this skill after completing a major implementation wave or when you detect "Spec Drift" (where the code has diverged from the original plan).

## Algorithm (Steps)

1. **Drift Detection**: Compare current implementation (e.g., `src/interfaces/`, `src/components/`) against the relevant plan in `.sisyphus/plans/`.
2. **Impact Analysis**:
    - **Minor**: Type changes, naming refinements.
    - **Major**: Architectural deviations (e.g., adding a middle-layer that wasn't in the plan).
3. **Synchronization**:
    - Update the Plan/Requirement file to reflect the *actual* state of the codebase.
    - Update `README.md` or architectural diagrams if necessary.
4. **Knowledge Indexing**: Update the session log or learnings file to capture *why* the drift happened (e.g., "Refined IModality during Metis Review").

## Output Format

```markdown
### 📚 Librarian: Documentation Sync
**Sync Status**: [Synced / Conflict Resolved]

**Updates Applied**:
- Updated Section X in `.sisyphus/plans/openspace-mvp.md` to reflect new event bus pattern.
- Synced `IVoiceInput` type definitions to API Docs.

**Reasoning**: [Concise explanation of the drift]
```
