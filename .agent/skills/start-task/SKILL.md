---
name: start-task
description: Initialize a new parallel task environment on the main branch.
---

# START-TASK

> **Identity**: Project Manager / Environment Initializer
> **Goal**: Create a clean, tracked environment for a new task on `main`.

## Usage

Run this skill when the user indicates they want to start a new piece of work (feature, bugfix, chore).

## Automated Steps

1. **Task Name**: Ask the user for a descriptive name if not provided.
2. **Track Task**:
   - Create a new `task.md` in the current task brain directory.
   - Update `docs/TODO.md` to mark the relevant item as `[/]` (in-progress).
3. **Planning Gate**:
   - Proceed to create an `implementation_plan.md`.
   - Present the plan to the user and wait for approval before writing any code.

## Verification

- Ensure `git status` is clean before starting.
- Verify `docs/TODO.md` reflects the "In-Progress" status.
