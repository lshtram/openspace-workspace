# Active Context

## Current Focus
- OpenSpace Client E2E Test Fixes - COMPLETED (2026-02-08)

## Session State
- Session started: 2026-02-08
- Status: CLOSED
- Last Update: 2026-02-08
- Session Duration: Extended session with E2E test fixes and documentation
- Commits Pushed: f627d99, 4126712
- Repository: https://github.com/lshtram/openspace-workspace

## Decisions
1. **Fixed OpenSpace Client E2E Tests (2026-02-08):**
   - Fixed linting/type errors in ServerContext.tsx and useWorkspaces.ts
   - Resolved E2E test infrastructure issue (missing playwright config flag)
   - Fixed UI overlap: Implemented two-zone scrollable layout in SessionSidebar
   - Updated test configuration to use dream-news project
   - Cleaned up git worktree tracking (7 branches removed)

2. **E2E Testing Architecture Decision:**
   - E2E tests use REAL servers (Vite dev server + OpenCode API), not mocks
   - Must run with `-c e2e/playwright.config.ts` flag
   - Use `npm run test:e2e:existing` command (includes proper config)
   - Tests default to real project path (/Users/Shared/dev/dream-news)

3. **UI Component Architecture Decision:**
   - Adopted two-zone scrollable layout for sidebars with fixed headers/footers
   - Pattern: Header (fixed) → Content (flex-1 min-h-0) → Footer (max-h-[Npx])
   - Prevents UI overlap when bottom components block interactive elements
   - Applied to SessionSidebar/WorkspaceManager components

4. **Previous: Integrated Prometheus requirements elicitation into NSO:**
   - Replaced `rm-intent-clarifier` with enhanced `requirement-elicitation`
   - Added structured interview process (scope, user stories, constraints)
   - Added PRD template with traceability matrix (REQ-ID → verification method)
   - Updated BUILD workflow to reference new skill name

5. **Previous: Enhanced architectural-review with multi-expert pattern:**
   - Added 3-expert debate (Proponent, Skeptic, Alternative)
   - Kept existing simplicity/modularity/YAGNI checklist
   - Added risk assessment and mitigation section
   - Clear guidance on when to use multi-expert vs. simple checklist

6. **Previous: Created archive-conversation skill:**
   - User-initiated only (not automatic)
   - 6-phase workflow: Capture → Summarize → Verify → Requirements → Verify → Finalize
   - Triggered by: "archive this", "document this session", "/archive [topic]"
   - Added to Librarian skills in AGENTS.md

7. **Previous: Removed 3 skills from project:**
   - prometheus/ → integrated into requirement-elicitation
   - technical-analysis/ → integrated into architectural-review
   - document-session/ → replaced by archive-conversation

## Open Questions
- ⚠️ Manual cleanup required: Git worktree directories and E2E workspace artifacts have permission issues

## Next Steps
- Optional: Manual cleanup of test artifacts (see progress.md for commands)
- Optional: Delete temporary debugging test files
- NSO system is fully integrated and operational

## NEW: Automatic Router Monitoring (Just Implemented)

**Feature**: Router now automatically monitors every user message

**How it works**:
1. Before responding to ANY user message, Oracle checks:
   - Am I the Oracle? (not Builder/Janitor/Librarian)
   - Are we currently in an active workflow? (check active_context.md Status)
   - Is this a user message (not internal agent communication)?
2. If all checks pass, run: `python3 ~/.config/opencode/nso/scripts/router_monitor.py "user message"`
3. If confidence ≥ 20% → Activate workflow (BUILD/DEBUG/REVIEW/PLAN)
4. If confidence < 20% → Normal chat response

**SAFETY CHECKS** (CRITICAL):
- ✅ Only Oracle can route (not Builder/Janitor/Librarian)
- ✅ Only when NOT in active workflow (Status: COMPLETE or no workflow)
- ✅ Skip routing during workflow phases (Discovery, Implementation, etc.)

**Examples**:
- "build a new feature" → BUILD workflow (80% confidence)
- "fix the login bug" → DEBUG workflow (80% confidence)  
- "what do you think about this code?" → REVIEW workflow (40% confidence)
- "hello, how are you?" → Chat mode (0% confidence)
- "yes, that looks good" (during BUILD workflow) → Continue workflow, don't route

**Priority**: DEBUG > REVIEW > PLAN > BUILD

**Files Updated**:
- `~/.config/opencode/nso/scripts/router_monitor.py` (new script with safety checks)
- `~/.config/opencode/nso/instructions.md` (added auto-router section with safety protocol)
- `~/.config/opencode/nso/AGENTS.md` (updated Oracle responsibilities)
