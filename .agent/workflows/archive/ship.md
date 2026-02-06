---
description: Complete a feature/task with quality gates, commit, and push. Usage: /ship
---

# Ship Feature (Finish Task)

Complete development, verify quality, commit, and push to main.

## Prerequisites

- Implementation is complete
- Code is ready for quality verification

## Step 1: Run Quality Verification

Execute `/verify` workflow:
- Lint + TypeCheck
- Unit tests
- E2E tests

⚠️ **[BLOCKER]**: All gates must pass before proceeding

## Step 2: Documentation Sync

Update project documentation:

1. **PRD Status**: Mark requirements as ✅ in `docs/prd/PRD_<FeatureName>.md`
2. **TODO**: Mark item as `[x]` in `docs/TODO.md`
3. **STATUS**: Add to "Recent Updates" section in `docs/STATUS.md`

## Step 3: Learning Loop (Optional)

**If** session revealed new patterns or insights:

1. Propose updates to `.agent/GUIDELINES.md` or `.agent/CODING_STYLE.md`
2. Use `learnings` skill to formalize

🚪 **[GATE]**: User must approve agent memory updates

## Step 4: Git Commit & Push

Review changes:
```bash
git status
```

Stage all changes:
```bash
git add .
```

Commit with conventional message:
```bash
git commit -m "<type>: <description>"
```

**Commit Types**:
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code restructuring
- `docs:` - Documentation only
- `test:` - Test additions/fixes
- `chore:` - Maintenance tasks

Push to main:
```bash
git push origin main
```

**Git Safety**:
- NEVER use `--no-verify` (skip hooks)
- NEVER use `--force` (force push)
- NEVER use `--amend` (unless explicitly requested)

## Step 5: Verify Push

Confirm:
```bash
git log -1
git status
```

Should show:
- Latest commit with your message
- "Your branch is up to date with 'origin/main'"
- Clean working tree

## Final Report

Summarize what shipped:
- **Feature**: [Name]
- **Files Changed**: [Count]
- **Tests**: [Passing counts]
- **Commit**: [SHA + message]
- **Status**: ✅ Shipped to main

---

**See also**: `.agent/workflows/end-session.md` for session cleanup
