# AGENTIC SDLC (Branchless / Main-Only)

You MUST follow these gates in sequence on the `main` branch.

---

## 🚀 Phase 1: Requirements & Planning

### Step 1: Requirements Gathering

**User initiates** (choose one path):

**Path A (Recommended for Features)**:
```bash
/new-feature [brief description]
```
- Agent uses `new-feature-interviewer` skill
- Structured requirements interview
- Creates requirements proposal
- **Artifact**: `docs/prd/PRD_<FeatureName>.md` created or updated

**Path B (Quick Tasks/Bug Fixes)**:
```bash
/start-task [task-name]
```
- Agent uses `start-task` skill
- Creates implementation plan
- Updates `docs/TODO.md` to mark item as `[/]` (in-progress)

**Verification**:
- Check consistency against `docs/prd/PRD_CORE.md` (Master PRD)
- Feature PRDs must be strict subset or extension, not contradiction

---

### Step 2: Tech Spec & Architecture

**Agent**: Generate Technical Specification
- Define data models, interfaces, architecture
- Document in task scratchpad or `docs/tech/`

🚪 **[GATE]**: **User must approve Tech Spec before proceeding**

---

### Step 3: UI Prototyping (Optional)

**If complex UI**:
- Create mockups or use image generation
- Show layout and user flow

🚪 **[GATE]**: **User approves layout/flow**

---

## 🔨 Phase 2: Implementation

### Step 4: Build Implementation

**Agent**: Write code in modular chunks
- Maximum 200 lines per chunk
- Follow `.agent/CODING_STYLE.md` patterns
- **Optional**: Use `pattern-enforcement` skill to verify compliance

**User**: Review each chunk before proceeding

---

## ✅ Phase 3: Verification (Quality Gates)

### Steps 5-7: Run Quality Verification

⚠️ **[BLOCKER: Must pass before proceeding]**

**Recommended: Use Slash Command**:
```bash
/verify
```
- Runs all quality gates in sequence (lint, typecheck, unit, E2E)
- Each step is a blocker (must pass)
- Reports results with clear pass/fail status
- See `.agent/workflows/verify.md` for details

**Or run manually**:

**Step 5 - Static Analysis**:
```bash
cd openspace-client && npm run lint && npm run typecheck && cd ..
```
- **0 TypeScript errors** (strict mode)
- **0 ESLint errors** (warnings OK if pre-existing)

**Step 6 - Unit Testing**:
```bash
cd openspace-client && npm run test:run && cd ..
```
- All tests passing
- TDD loop complete
- 🚪 **[GATE]**: **Functional Check** - Verify implementation matches PRD

**Step 7 - E2E Testing**:
```bash
cd openspace-client && npm run test:e2e && cd ..
```
- Chromium only (38 tests, ~3 minutes)
- 2 tests may skip gracefully on rate limits (expected behavior)

**Full browser coverage** (only on user request):
```bash
cd openspace-client && npm run test:e2e:all && cd ..
```
- All browsers: Chromium, Firefox, WebKit (114 tests, ~10 minutes)

**Quick Command** (all gates):
```bash
cd openspace-client && npm run lint && npm run typecheck && npm run test:run && npm run test:e2e && cd ..
```

---

## 📝 Phase 4: Documentation & Learning

### Step 8: Documentation Sync

**Agent updates**:
1. Mark requirements as ✅ complete in `docs/prd/PRD_<FeatureName>.md`
2. Mark TODO item as `[x]` in `docs/TODO.md`
3. Add "Recent Updates" to `docs/STATUS.md`

---

### Step 9: Learning Loop

**Agent**: Propose improvements based on session insights
- Updates to `.agent/GUIDELINES.md` (new behavioral patterns)
- Updates to `.agent/CODING_STYLE.md` (new technical standards)
- Use `learnings` skill to formalize

🚪 **[GATE]**: **User signs off on agent memory updates**

---

## 🎯 Phase 5: Finalize & Commit

### Steps 8-10: Ship Feature

**Recommended: Use Slash Command**:
```bash
/ship
```
- Runs `/verify` first (all quality gates)
- Updates documentation (PRD, TODO, STATUS)
- Optional learning loop (propose framework updates)
- Git commit with conventional message
- Push to main
- Verify push success
- See `.agent/workflows/ship.md` for details

**Or run manually**:

**Step 8 - Documentation** (covered above in Phase 4)

**Step 9 - Learning Loop** (covered above in Phase 4)

**Step 10 - Git Commit & Push**:
```bash
git status
git add .
git commit -m "feat: <feature-name>"
git push origin main
```

**Commit Message Conventions**:
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code restructuring
- `docs:` - Documentation only
- `test:` - Test additions/fixes
- `chore:` - Maintenance tasks

**Git Safety Protocol**:
- NEVER skip hooks (`--no-verify`)
- NEVER force push to main (`--force`)
- NEVER update git config
- Verify all quality gates passed before commit

---

## 🔄 Phase 6: Session End

### Step 11: End Session Gracefully

**Recommended: Use Slash Command**:
```bash
/end-session
```
- Runs auto-generation scripts (hot-files, structure snapshot)
- Prompts for manual doc updates (STATUS, TODO)
- Creates handoff if context full
- Updates SESSION_START if major milestone
- Provides next-session prep checklist
- See `.agent/workflows/end-session.md` for details

**Or run manually**:

**Auto-generation**:
```bash
git log --since='7 days ago' --name-only --pretty=format: | sort | uniq -c | sort -rn | head -20 > .agent/hot-files.txt && \
find openspace-client/src -maxdepth 2 -type d | sort > .agent/structure-snapshot.txt
```

**Manual Updates**:
1. Verify `docs/STATUS.md` is current
2. Verify `docs/TODO.md` reflects actual state

**Context Management** (if context > 150K tokens):
```bash
# Invoke handoff skill (agent action)
handoff
```
- Generates `HANDOFF.md` (full context, ~230 lines)
- Generates `compact.md` (quick reference, ~80 lines)
- Archive old handoffs: `mv HANDOFF.md .agent/archive/handoffs/HANDOFF_$(date +%Y%m%d).md`

**Update Session Start** (if major milestone):
- Manually update `.agent/SESSION_START.md` with new phase/status

---

## 📋 Quick Reference: Slash Commands & Skills

### Slash Commands (Recommended)

| Phase | Command | Purpose | Maps to Steps |
|-------|---------|---------|---------------|
| **Session Start** | `/start-session` | Load context (Tier 0 + 1) | Pre-work |
| **Planning** | `/new-feature [desc]` | Structured requirements gathering | Step 1 |
| **Planning** | `/start-task [name]` | Quick task initialization | Step 1 |
| **Verification** | `/verify` | Run all quality gates (lint, test, E2E) | Steps 5-7 |
| **Finalize** | `/ship` | Complete, document, commit, push | Steps 8-10 |
| **Session End** | `/end-session` | Close session gracefully | Step 11 |

### Manual Commands (Alternative)

| Phase | Who Runs | Command | Purpose |
|-------|----------|---------|---------|
| **Verification** | Agent | `cd openspace-client && npm run lint && npm run typecheck` | Static analysis |
| **Verification** | Agent | `cd openspace-client && npm run test:run` | Unit tests |
| **Verification** | Agent | `cd openspace-client && npm run test:e2e` | E2E tests (Chromium) |
| **All Gates** | Agent | `cd openspace-client && npm run lint && npm run typecheck && npm run test:run && npm run test:e2e` | Full verification suite |
| **Learning** | Agent | `learnings` skill | Capture session insights |
| **Context** | Agent | `handoff` skill | Compress context when full |

### Why Use Slash Commands?

- **Single command** replaces multiple manual steps
- **Built-in quality gates** prevent skipping verification
- **Automatic documentation** prompts ensure consistency
- **Error handling** provides clear guidance on failures
- **Project-specific** workflows tailored to OpenSpace

---

## 🎓 Example: Full Feature Flow

```
User: /new-feature Add tempo visualization to metronome
Agent: [Interviews, creates PRD, presents tech spec]
User: Approved, proceed

Agent: [Implements feature in chunks]
Agent: Running static analysis...
       cd openspace-client && npm run lint && npm run typecheck && cd ..
       ✅ 0 errors

Agent: Running unit tests...
       cd openspace-client && npm run test:run && cd ..
       ✅ 241 tests passing

Agent: Running E2E tests...
       cd openspace-client && npm run test:e2e && cd ..
       ✅ 36/38 tests passing (2 skipped on rate limits - expected)

Agent: Documentation updated:
       - PRD marked complete
       - TODO.md updated
       - STATUS.md updated with recent work

Agent: Learned: Controlled components pattern used for media tools
       Propose: Update CODING_STYLE.md with this pattern?
User: Approved

Agent: Committing changes...
       git add . && git commit -m "feat: add tempo visualization" && git push
       ✅ Pushed to main

Agent: Running end-session tasks...
       ✅ Hot files generated
       ✅ Structure snapshot generated
       Context: 95K tokens (no handoff needed)
       
User: Great work!
```

---

## ⚠️ Critical Rules (NEVER VIOLATE)

1. **No Code Without Approval**: Stop after planning, get user sign-off
2. **Quality Gates are Blockers**: Cannot proceed if lint/tests fail
3. **No Direct Supabase**: Use `src/data` provider pattern only
4. **Pages are Orchestrators**: Move logic to hooks (ViewModels)
5. **Strict TypeScript**: No `any` usage
6. **Test Coverage**: Every bug fix requires regression test
