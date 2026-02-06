---
description: End development session and prepare for next conversation. Usage: /end-session
---

# End Development Session

Gracefully close a development session and prepare context for the next conversation.

## When to Run

- After completing significant feature or bug fix
- Before taking a break of 1+ days
- When context window is approaching limits (>150K tokens)
- After making architectural changes

## Step 1: Quick Auto-Generation

Run automated context generation:

```bash
git log --since='7 days ago' --name-only --pretty=format: | sort | uniq -c | sort -rn | head -20 > .agent/hot-files.txt && \
find openspace-client/src -maxdepth 2 -type d | sort > .agent/structure-snapshot.txt
```

**Generates**:
- `.agent/hot-files.txt` - Recently modified files (last 7 days)
- `.agent/structure-snapshot.txt` - Current directory structure

## Step 2: Manual Documentation Updates

Verify these files are current:

1. **`docs/STATUS.md`**:
   - Update "Recent Updates" section
   - Update code quality status if changed
   - Update active blockers if resolved/added

2. **`docs/TODO.md`**:
   - Mark completed items as `[x]`
   - Add new tasks discovered during session
   - Update priorities if changed

## Step 3: Context Management (If Needed)

**If context window > 150K tokens** or conversation is unwieldy:

Invoke the `handoff` skill to create compressed context:
- Generates `HANDOFF.md` (full context, ~230 lines)
- Generates `compact.md` (quick reference, ~80 lines)

Archive old handoff files:
```bash
mkdir -p .agent/archive/handoffs
mv HANDOFF.md .agent/archive/handoffs/HANDOFF_$(date +%Y%m%d).md
mv compact.md .agent/archive/handoffs/compact_$(date +%Y%m%d).md
```

## Step 4: Update Session Start (Major Milestones Only)

**Only if** you reached a major milestone (new phase, significant change):

Manually update `.agent/SESSION_START.md`:
- Current phase and milestone
- Recent work section
- Code quality status
- Active blockers
- Current focus

**Do NOT update SESSION_START.md** for routine work - only significant state changes.

## Step 5: Verify Code Quality (Optional)

If you haven't already run `/verify` or `/ship`:

```bash
cd openspace-client && npm run lint && npm run typecheck && npm test && cd ..
```

Leave codebase in clean state for next session.

## Step 6: Final Checklist

Verify all completed:

- [ ] `.agent/hot-files.txt` generated (auto)
- [ ] `.agent/structure-snapshot.txt` generated (auto)
- [ ] `docs/STATUS.md` is current (manual)
- [ ] `docs/TODO.md` reflects actual state (manual)
- [ ] If context full: `HANDOFF.md` and `compact.md` created
- [ ] If major milestone: `SESSION_START.md` updated
- [ ] Code quality verified (if work was done)
- [ ] Uncommitted work is either committed or intentionally WIP

## Next Session Startup

The next AI agent should load:

1. **Tier 0**: `.agent/SESSION_START.md`, `.agent/CODEBASE_MAP.md`
2. **Handoff**: `HANDOFF.md` or `compact.md` (if they exist)
3. **Tier 1**: `.agent/AGENTS.md`, `.agent/PROCESS.md`, `docs/PROJECT_CONTEXT.md`
4. **Context**: `.agent/hot-files.txt` (recently modified files)

## Summary Report

Provide session summary:
- **Session Duration**: [Estimate based on conversation]
- **Work Completed**: [Brief list]
- **Context Size**: [Token count]
- **Handoff Created**: [Yes/No]
- **Status Updated**: [Yes/No]
- **Next Steps**: [What to do in next session]

---

**See also**:
- `.agent/workflows/ship.md` - Complete and commit work
- `.agent/skills/handoff/SKILL.md` - Context compression
