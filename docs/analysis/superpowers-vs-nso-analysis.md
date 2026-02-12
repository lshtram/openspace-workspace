---
id: ANALYSIS-SUPERPOWERS-VS-NSO
author: oracle_7f3a
status: FINAL
date: 2026-02-12
task_id: superpowers-analysis
---

# Superpowers vs NSO: Complete Feature Analysis & Comparison

## Part 1: Superpowers Feature Inventory & Philosophy

### 1.1 Project Overview

**Superpowers** (by Jesse Vincent / `obra`) is a skill-injection framework for AI coding agents (Claude Code, Codex, OpenCode). It provides a library of **14 skills** that are injected into an agent's system prompt at session start, governing how the agent approaches tasks. Version: **v4.2.0** (latest), MIT License.

**Core philosophy:** AI agents naturally take shortcuts, rationalize skipping process, and make unverified claims. Superpowers counter this by injecting mandatory process skills with explicit rationalization tables, red flags, and iron laws that the agent must follow.

---

### 1.2 Complete Feature Inventory

#### A. Skill Discovery & Injection Engine

| Feature | Description |
|---------|-------------|
| **Auto-discovery** | `lib/skills-core.js` scans directories for `SKILL.md` files with YAML frontmatter |
| **Frontmatter parsing** | Extracts `name` and `description` fields (max 1024 chars total) |
| **Priority/shadowing** | Project-local skills override global skills with same name |
| **Session hook injection** | `hooks/session-start.sh` injects `using-superpowers` content as JSON on every session start/resume/clear/compact |
| **OpenCode plugin** | `.opencode/plugins/superpowers.js` uses `experimental.chat.system.transform` to inject skills into system prompt |
| **Update checking** | `checkForUpdates()` compares installed vs latest via git |
| **Cross-platform** | Polyglot `.cmd` wrapper technique for Windows support |

#### B. Meta-Skill: Using Superpowers (The Bootstrap)

| Feature | Description |
|---------|-------------|
| **Mandatory invocation** | "If 1% chance a skill applies, you MUST invoke it" — non-negotiable |
| **Rationalization table** | 11 specific rationalizations agents use to skip skills, each with a reality counter |
| **Skill priority ordering** | Process skills (brainstorming, debugging) BEFORE implementation skills |
| **Skill type classification** | **Rigid** (TDD, debugging) = follow exactly; **Flexible** (patterns) = adapt |
| **DOT flowchart** | Visual decision graph for skill invocation flow |
| **User instruction separation** | "Instructions say WHAT, not HOW" — skills still apply even with direct orders |

#### C. Brainstorming Skill

| Feature | Description |
|---------|-------------|
| **Socratic refinement** | One question at a time, multiple choice preferred |
| **200-300 word sections** | Present design incrementally, validate each section |
| **2-3 approaches** | Always propose alternatives with trade-offs before settling |
| **YAGNI enforcement** | "Remove unnecessary features from all designs" |
| **Documentation output** | Write validated design to `docs/plans/YYYY-MM-DD-<topic>-design.md` |
| **Implementation handoff** | Explicitly offers worktree setup + plan writing as next step |

#### D. Writing Plans Skill

| Feature | Description |
|---------|-------------|
| **Bite-sized tasks** | Each step is one action (2-5 minutes) |
| **Zero-context assumption** | Plans written assuming engineer has no codebase knowledge |
| **Exact file paths** | Every task specifies exact create/modify/test file paths |
| **Complete code in plan** | Not "add validation" but the actual code to write |
| **TDD steps embedded** | Write test → Verify fails → Write code → Verify passes → Commit |
| **Execution handoff** | Offers choice: Subagent-Driven (same session) or Parallel Session |
| **Plan document header** | Standard header with goal, architecture, tech stack |

#### E. Executing Plans Skill

| Feature | Description |
|---------|-------------|
| **Batch execution** | Default first 3 tasks, then checkpoint |
| **Critical review first** | Review plan critically before starting, raise concerns |
| **Report-and-wait** | Between batches: show results + "Ready for feedback" |
| **Blocker handling** | STOP immediately on unclear instructions, failing verifications |
| **Integration** | Pairs with `using-git-worktrees` (before) and `finishing-a-development-branch` (after) |

#### F. Subagent-Driven Development Skill

| Feature | Description |
|---------|-------------|
| **Fresh subagent per task** | Prevents context pollution between tasks |
| **Two-stage review** | Stage 1: Spec compliance reviewer → Stage 2: Code quality reviewer |
| **Review loops** | If reviewer finds issues → implementer fixes → re-review until approved |
| **Spec compliance first** | Code quality review only begins AFTER spec compliance is ✅ |
| **Controller provides full text** | No file reading overhead — controller curates context |
| **Question protocol** | Implementer can ask questions BEFORE starting work |
| **Self-review + external review** | Both required — self-review doesn't replace actual review |
| **Three prompt templates** | `implementer-prompt.md`, `spec-reviewer-prompt.md`, `code-quality-reviewer-prompt.md` |
| **DOT flowchart** | Complete process visualization with decision points and loops |
| **Red flags list** | 12 specific anti-patterns including "start quality review before spec ✅" |

#### G. Test-Driven Development Skill

| Feature | Description |
|---------|-------------|
| **Iron Law** | "NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST" |
| **Delete-and-restart** | Write code before test? Delete it. No keeping as "reference" |
| **Red-Green-Refactor cycle** | With DOT flowchart visualization |
| **Good/Bad examples** | Side-by-side TypeScript examples showing correct vs incorrect tests |
| **Verify RED mandatory** | Must watch test fail AND confirm it fails for the right reason |
| **Verify GREEN mandatory** | Must confirm test passes AND no other tests broken |
| **11 rationalization counters** | Including "Tests after achieve same goals", "Deleting X hours is wasteful", "TDD is dogmatic" |
| **7 red flags** | Including "Test passes immediately", "I already manually tested it" |
| **Debugging integration** | Bug found → write failing test → TDD cycle |
| **Verification checklist** | 8-point checklist before marking work complete |
| **Anti-patterns reference** | Links to `testing-anti-patterns.md` |

#### H. Systematic Debugging Skill

| Feature | Description |
|---------|-------------|
| **Iron Law** | "NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST" |
| **Four phases** | 1. Root Cause → 2. Pattern Analysis → 3. Hypothesis & Testing → 4. Implementation |
| **Phase gates** | Must complete each phase before proceeding |
| **Multi-component diagnostics** | Explicit instrumentation pattern for tracing across component boundaries |
| **3-fix architectural escalation** | After 3 failed fixes: STOP, question the architecture, discuss with human |
| **Data flow tracing** | Backward tracing technique to find root cause |
| **Scientific method** | Single hypothesis, minimal change, one variable at a time |
| **Human signal detection** | Recognizes "Stop guessing", "Is that not happening?" as signals to return to Phase 1 |
| **8 rationalization counters** | Including "One more fix attempt" (after 2+ failures) |
| **Supporting techniques** | Links to `root-cause-tracing.md`, `defense-in-depth.md`, `condition-based-waiting.md` |

#### I. Verification Before Completion Skill

| Feature | Description |
|---------|-------------|
| **Iron Law** | "NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE" |
| **The Gate Function** | 5-step process: IDENTIFY → RUN → READ → VERIFY → CLAIM |
| **Language policing** | Forbids "should", "probably", "seems to", "Great!", "Perfect!", "Done!" |
| **8 rationalization counters** | Including "Confidence ≠ evidence", "Linter ≠ compiler" |
| **Real failure citations** | "From 24 failure memories" — trust broken, undefined functions shipped |
| **Scope** | Applies to exact phrases, paraphrases, synonyms, implications |
| **Regression test pattern** | Run → Revert fix → Run (MUST FAIL) → Restore → Run (pass) |

#### J. Receiving Code Review Skill

| Feature | Description |
|---------|-------------|
| **Anti-performative agreement** | NEVER say "You're absolutely right!", "Great point!", ANY gratitude expression |
| **Technical response pattern** | READ → UNDERSTAND → VERIFY → EVALUATE → RESPOND → IMPLEMENT |
| **Source-specific handling** | Human partner = trusted but still ask if unclear; External = skeptical, verify |
| **YAGNI check** | If reviewer suggests "implementing properly" → grep for actual usage first |
| **Pushback guidance** | When to push back, how to push back, safe word: "Strange things are afoot at the Circle K" |
| **Partial understanding block** | If ANY items unclear, STOP all implementation until clarified |
| **Implementation order** | Blocking → Simple → Complex, test each individually |
| **Graceful correction** | Pattern for admitting pushback was wrong: factual statement, move on |

#### K. Requesting Code Review Skill

| Feature | Description |
|---------|-------------|
| **SHA-based tracking** | Get BASE_SHA and HEAD_SHA for precise diff |
| **Code-reviewer subagent** | Dispatch dedicated reviewer with template |
| **Severity classification** | Critical (fix immediately) → Important (fix before proceeding) → Minor (note for later) |
| **Mandatory timing** | After each task in subagent-driven dev, after major features, before merge |

#### L. Git Worktrees Skill

| Feature | Description |
|---------|-------------|
| **Directory selection priority** | Check existing → Check CLAUDE.md → Ask user |
| **Safety verification** | MUST verify worktree directory is in .gitignore before creating |
| **Auto-fix broken state** | If not ignored: add to .gitignore, commit, proceed |
| **Auto-detect project setup** | Detect package.json/Cargo.toml/requirements.txt → run appropriate install |
| **Baseline test verification** | Run tests in clean worktree, report if failing |
| **Two location options** | `.worktrees/` (project-local, hidden) or `~/.config/superpowers/worktrees/` (global) |

#### M. Finishing a Development Branch Skill

| Feature | Description |
|---------|-------------|
| **4 structured options** | Merge locally / Push+PR / Keep as-is / Discard |
| **Test verification gate** | Cannot present options until tests pass |
| **Typed confirmation for discard** | Must type "discard" — prevents accidental deletion |
| **Worktree cleanup rules** | Clean up for Options 1 & 4 only |
| **Base branch detection** | Auto-detect via `git merge-base` |

#### N. Dispatching Parallel Agents Skill

| Feature | Description |
|---------|-------------|
| **Independence check** | DOT flowchart for deciding parallel vs sequential |
| **Focused agent prompts** | One problem domain per agent with clear scope + constraints + expected output |
| **Integration verification** | After agents return: check for conflicts, run full suite |
| **Constraint enforcement** | "Don't change other code" — agents scoped to their domain |

#### O. Writing Skills Skill (Meta-Skill for Documentation)

| Feature | Description |
|---------|-------------|
| **TDD for documentation** | RED: baseline without skill → GREEN: write skill → REFACTOR: close loopholes |
| **CSO (Claude Search Optimization)** | Description = ONLY triggering conditions, NEVER workflow summary |
| **Rationalization bulletproofing** | Close every loophole explicitly, "spirit vs letter" cut-off, build rationalization table |
| **Skill types** | Technique, Pattern, Reference — each with different test approaches |
| **Token efficiency targets** | Getting-started: <150 words, Frequently-loaded: <200 words, Other: <500 words |
| **Flowchart guidelines** | ONLY for non-obvious decisions, never for reference material |
| **Anti-patterns** | No narrative examples, no multi-language dilution, no code in flowcharts |
| **Deployment checklist** | RED-GREEN-REFACTOR adapted with TodoWrite items |

---

### 1.3 Philosophy Guidelines Extracted

#### P1: Rationalization Prevention as First-Class Concern
Every discipline-enforcing skill includes:
- An **Iron Law** (one-line absolute rule)
- A **rationalization table** (specific excuses mapped to reality)
- A **red flags list** (thoughts that mean STOP)
- Explicit loophole closures ("Don't keep as reference", "Delete means delete")
- "Violating the letter of the rules is violating the spirit of the rules"

#### P2: Evidence Over Claims
No completion claims without fresh verification evidence. Language policing forbids "should", "probably", confidence-based assertions. The Gate Function (IDENTIFY → RUN → READ → VERIFY → CLAIM) must be followed before ANY positive statement.

#### P3: Process Skills Before Implementation Skills
When multiple skills apply, process skills (brainstorming, debugging) determine HOW to approach the task. Implementation skills guide execution. Never jump to implementation.

#### P4: Fresh Context Per Task
Subagent-driven development uses a fresh subagent for each task to prevent context pollution. This ensures each task gets clean, unbiased attention.

#### P5: Two-Stage Review (Spec Then Quality)
Spec compliance review MUST pass before code quality review begins. This prevents optimizing code that doesn't meet requirements.

#### P6: 3-Fix Architectural Escalation
After 3 failed fix attempts, STOP fixing symptoms and question the architecture. This prevents infinite fix-test-break cycles.

#### P7: Anti-Performative Agreement
Never use gratitude expressions, never agree performatively. Technical acknowledgment or reasoned pushback only. Actions speak louder than words.

#### P8: Bite-Sized Task Granularity
Plans broken into 2-5 minute steps. Each step is one atomic action. Zero-context assumption — plans contain complete code and exact file paths.

#### P9: YAGNI Ruthlessly
Remove unnecessary features from designs. When reviewer suggests "implementing properly" → check if feature is actually used first.

#### P10: DOT Flowcharts as Executable Specifications
Decision processes visualized as Graphviz DOT flowcharts within SKILL.md files. Used ONLY for non-obvious decisions and process loops, never for reference material.

#### P11: Skills Are Living Documents (TDD for Docs)
Skills follow the same RED-GREEN-REFACTOR cycle as code. Baseline test without skill → write skill → close loopholes through iterative testing.

#### P12: User Instructions Say WHAT Not HOW
"Add X" or "Fix Y" doesn't mean skip workflows. Skills still apply. The human says what to build; the skills say how to build it.

---

## Part 2: Feature-by-Feature Comparison Against NSO

### Legend
- ✅ NSO has equivalent or better
- ⚠️ NSO has partial coverage
- ❌ NSO is missing this entirely
- 🔄 NSO has something Superpowers doesn't

---

### 2.1 Skill Discovery & Injection

| Superpowers Feature | NSO Status | Assessment |
|---------------------|------------|------------|
| Auto-discovery via filesystem scan | ⚠️ | NSO has patterns.md and memory files, but no automatic skill discovery engine. Skills/prompts are loaded by role (Oracle.md, etc.), not dynamically discovered. |
| Frontmatter-based metadata | ⚠️ | NSO uses artifact metadata headers (`id`, `author`, `status`, `date`, `task_id`) but only for documents, not for discoverable skills. |
| Project-local skill shadowing | ❌ | NSO has global (`~/.config/opencode/nso/`) vs project (`.opencode/context/`) split, but no shadowing/override mechanism. |
| Session hook injection | ⚠️ | NSO relies on Oracle reading memory files at session start, not automatic injection hooks. |
| Update checking | ❌ | No mechanism for checking if NSO components are outdated. |

**Recommendation:** NSO doesn't need Superpowers' filesystem-scanning discovery engine because NSO uses a different architecture (role-based prompts vs. skill library). However, the **session hook injection** concept is powerful — NSO could benefit from a formalized "session bootstrap" that automatically loads active context rather than relying on Oracle remembering to read memory files.

---

### 2.2 Mandatory Skill Invocation (using-superpowers)

| Superpowers Feature | NSO Status | Assessment |
|---------------------|------------|------------|
| "1% chance = must invoke" rule | ⚠️ | NSO has role boundaries (Oracle MUST delegate to Builder) but no equivalent "check for applicable skill before ANY response" rule. |
| 11-item rationalization table | ❌ | NSO has no rationalization tables for its own processes. |
| Skill priority ordering (process → implementation) | ⚠️ | NSO has Router Priority (DEBUG > REVIEW > PLAN > BUILD) in patterns.md but it's less detailed. |
| Skill type classification (rigid vs flexible) | ❌ | NSO doesn't classify its own workflows/patterns by rigidity level. |
| "Instructions say WHAT not HOW" | ⚠️ | NSO's Oracle.md says "If a user asks Oracle to implement directly, Oracle must still follow delegation protocol" — similar concept but narrower scope. |

**Recommendation:** The rationalization prevention pattern is Superpowers' most distinctive innovation. NSO should adopt **rationalization tables** for its critical workflows (TDD mandate, delegation protocol, verification requirements). The "1% chance" threshold is extreme but the concept of mandatory skill checking is valuable.

---

### 2.3 Brainstorming / Discovery

| Superpowers Feature | NSO Status | Assessment |
|---------------------|------------|------------|
| One question at a time | ❌ | NSO Phase 1 (Discovery) doesn't specify interaction cadence. |
| Multiple choice preferred | ❌ | Not specified. |
| 200-300 word sections | ❌ | Not specified. |
| 2-3 approaches with trade-offs | ⚠️ | NSO Phase 1 mentions "Draft REQ" but doesn't mandate exploring alternatives. |
| YAGNI enforcement in design | ❌ | Not explicitly part of discovery phase. |
| Design document output | ✅ | NSO Phase 1 produces REQ docs in `docs/requirements/`. |
| Implementation handoff | ✅ | NSO Phase 1 → Phase 2 → Phase 3 flow handles this. |

**Recommendation:** NSO's Phase 1 (Discovery) is structurally sound but **lacks interaction design guidelines**. Adopting the "one question at a time", "200-300 word sections", and "2-3 approaches" patterns would improve the quality of requirement elicitation. These should be added to Oracle.md Phase 1 guidance.

---

### 2.4 Writing Plans

| Superpowers Feature | NSO Status | Assessment |
|---------------------|------------|------------|
| Bite-sized 2-5 min tasks | ⚠️ | NSO contract.md for Builder is less prescriptive about task granularity. |
| Zero-context assumption | ⚠️ | NSO contracts provide context but don't assume zero knowledge. |
| Exact file paths in plan | ⚠️ | NSO contracts list scope but aren't as prescriptive. |
| Complete code in plan | ❌ | NSO contracts describe what to build, not provide complete code. |
| TDD steps embedded | ⚠️ | NSO patterns.md says "TDD Mandatory" but doesn't embed TDD steps in contracts. |
| Execution choice (subagent vs parallel) | 🔄 | NSO always delegates to Builder; doesn't offer execution strategy choice. |

**Recommendation:** The bite-sized task granularity (2-5 min steps) is excellent for subagent execution. NSO's contract.md should adopt more granular task specification. However, including complete code in plans may be over-prescriptive for an architect role — NSO's approach of defining WHAT (requirements + architecture) while letting Builder decide HOW is architecturally cleaner.

---

### 2.5 Executing Plans / Batch Execution

| Superpowers Feature | NSO Status | Assessment |
|---------------------|------------|------------|
| Batch execution with checkpoints | ⚠️ | NSO Phase 4 has human gates but doesn't batch implementation tasks. |
| Critical review before starting | ✅ | NSO Phase 1-2 review requirements and architecture before implementation. |
| Report-and-wait between batches | ⚠️ | NSO has mandatory "STOP FOR USER APPROVAL" gates but only between phases, not within implementation. |
| Blocker handling | ⚠️ | NSO doesn't have explicit "STOP immediately on unclear instructions" during Builder execution. |

**Recommendation:** NSO's phase-based approach is higher-level but misses the within-implementation checkpoint pattern. For complex implementations, Builder should report progress after groups of related changes rather than only at phase boundaries.

---

### 2.6 Subagent-Driven Development

| Superpowers Feature | NSO Status | Assessment |
|---------------------|------------|------------|
| Fresh subagent per task | 🔄 | NSO delegates to Builder (one subagent for the whole implementation phase). Different model. |
| Two-stage review (spec → quality) | ⚠️ | NSO has Janitor for validation but it's a single-stage review (Phase 4). |
| Review loops until approved | ⚠️ | NSO Janitor validates and reports; Oracle presents to user. No explicit re-review loop. |
| Spec compliance as separate gate | ❌ | NSO doesn't separate spec compliance from code quality in validation. |
| Controller provides full text | 🔄 | NSO uses contract.md files; Superpowers inlines task text into subagent prompt. |
| Question protocol before work | ❌ | NSO contracts don't have an explicit "ask questions before starting" protocol. |
| Three prompt templates | 🔄 | NSO has contract.md and validation_contract.md templates; Superpowers has implementer, spec-reviewer, code-quality-reviewer templates. |

**Recommendation:** The **two-stage review** (spec compliance THEN code quality) is a standout pattern. NSO should split Phase 4 validation into two stages:
1. **Spec compliance check** — does the implementation match the contract?
2. **Code quality check** — is the implementation well-built?

The **question protocol** (implementer asks questions before starting) should be added to Builder's expected behavior.

---

### 2.7 Test-Driven Development

| Superpowers Feature | NSO Status | Assessment |
|---------------------|------------|------------|
| Iron Law (no code without failing test) | ✅ | NSO patterns.md: "TDD Mandatory (RED -> GREEN -> REFACTOR)" |
| Delete-and-restart if code before test | ❌ | NSO doesn't specify this consequence. |
| Rationalization table (11 items) | ❌ | NSO has no TDD rationalization prevention. |
| Red flags list (7 items) | ❌ | NSO has no TDD red flags. |
| DOT flowchart of cycle | ❌ | NSO states TDD in 5 words, doesn't visualize the cycle. |
| Good/Bad code examples | ❌ | NSO doesn't provide TDD examples. |
| Verification checklist (8 items) | ❌ | NSO doesn't provide TDD completion checklist. |
| Debugging integration | ⚠️ | NSO doesn't explicitly connect debugging to TDD. |

**Recommendation:** This is the **biggest gap in NSO**. NSO states "TDD Mandatory" as a 5-word pattern but provides zero enforcement, zero rationalization prevention, zero examples, and zero verification checklists. Superpowers' TDD skill is 372 lines of detailed, rationalization-proof process documentation. NSO should either:
1. Create a dedicated TDD skill document (recommended), or
2. Significantly expand the TDD section in patterns.md with rationalization counters and verification checklists.

---

### 2.8 Systematic Debugging

| Superpowers Feature | NSO Status | Assessment |
|---------------------|------------|------------|
| 4-phase process | ❌ | NSO has no debugging process. Instructions.md has no debugging guidance. |
| Phase gates | ❌ | No debugging gates. |
| Multi-component diagnostics | ❌ | No instrumentation patterns for debugging. |
| 3-fix architectural escalation | ❌ | No escalation rule. |
| Scientific method (one hypothesis) | ❌ | No debugging methodology. |
| Human signal detection | ❌ | No "you're doing it wrong" signal patterns. |
| Rationalization counters (8 items) | ❌ | No debugging rationalizations. |

**Recommendation:** NSO has **zero debugging guidance**. The Router Priority has DEBUG as highest priority but there's no actual debugging process. Superpowers' systematic debugging skill (especially the 3-fix architectural escalation rule) should be adopted wholesale. This is a critical gap.

---

### 2.9 Verification Before Completion

| Superpowers Feature | NSO Status | Assessment |
|---------------------|------------|------------|
| Iron Law (no claims without evidence) | ⚠️ | NSO Phase 4 has "Present account of achievements and Janitor results" but no explicit evidence-first gate. |
| The Gate Function (5 steps) | ❌ | NSO doesn't have this structured verification process. |
| Language policing ("should", "probably") | ❌ | NSO doesn't police verification language. |
| Rationalization counters (8 items) | ❌ | No verification rationalizations. |
| Real failure citations | ❌ | NSO doesn't cite past failures as motivation. |
| Scope (all positive statements) | ❌ | NSO only gates at phase boundaries, not at every positive claim. |

**Recommendation:** NSO's Phase 4 human gate is structurally similar but far less rigorous. The Gate Function (IDENTIFY → RUN → READ → VERIFY → CLAIM) should be incorporated into both Builder completion reporting and Janitor validation. Language policing ("should", "probably" are red flags) is an excellent practice.

---

### 2.10 Code Review (Requesting & Receiving)

| Superpowers Feature | NSO Status | Assessment |
|---------------------|------------|------------|
| SHA-based review tracking | ❌ | NSO Janitor doesn't use git SHAs for review scope. |
| Anti-performative agreement | ❌ | NSO has no guidance on how agents should receive feedback. |
| Source-specific handling (human vs external) | ❌ | Not specified in NSO. |
| YAGNI check on review feedback | ❌ | Not specified. |
| Pushback guidance | ❌ | NSO agents don't have pushback protocols. |
| Partial understanding block | ❌ | Not specified. |
| Implementation order (blocking → simple → complex) | ❌ | Not specified. |

**Recommendation:** The anti-performative agreement protocol is culturally significant — it prevents agents from wasting tokens on social niceties while potentially masking incomplete understanding. NSO should adopt the core principle: "Technical acknowledgment or reasoned pushback only. Actions > words." The YAGNI check on review feedback is also valuable.

---

### 2.11 Git Worktrees

| Superpowers Feature | NSO Status | Assessment |
|---------------------|------------|------------|
| Directory selection priority | ⚠️ | NSO specifies `git worktree add -b [branch] .worktrees/[branch] [base]` but doesn't check for existing directories first. |
| Safety verification (.gitignore) | ❌ | NSO doesn't verify worktree directory is ignored. |
| Auto-fix broken state | ❌ | NSO doesn't auto-fix missing .gitignore entries. |
| Auto-detect project setup | ❌ | NSO doesn't specify running npm install etc. in new worktree. |
| Baseline test verification | ❌ | NSO doesn't verify clean test baseline in new worktree. |
| Two location options | ⚠️ | NSO only uses `.worktrees/[branch]`. |

**Recommendation:** NSO's worktree protocol is barebones compared to Superpowers. The **safety verification** (checking .gitignore), **auto-detect project setup**, and **baseline test verification** should all be added to NSO's GIT WORKTREE PROTOCOL in instructions.md.

---

### 2.12 Finishing a Development Branch

| Superpowers Feature | NSO Status | Assessment |
|---------------------|------------|------------|
| 4 structured options | ⚠️ | NSO Phase 5 assumes merge+push; doesn't offer PR, keep, or discard options. |
| Test verification gate before options | ⚠️ | NSO has Phase 4 validation but doesn't re-verify before merge specifically. |
| Typed confirmation for discard | ❌ | NSO doesn't have discard protection. |
| Worktree cleanup rules | ✅ | NSO Phase 5 includes worktree removal and branch deletion. |

**Recommendation:** NSO should adopt the **4 structured options** pattern instead of assuming merge+push. This gives the user explicit control over integration strategy.

---

### 2.13 Parallel Agent Dispatch

| Superpowers Feature | NSO Status | Assessment |
|---------------------|------------|------------|
| Independence check | ❌ | NSO doesn't have a protocol for dispatching parallel agents. |
| Focused agent prompts | ⚠️ | NSO delegates to single Builder, not multiple focused agents. |
| Integration verification | ❌ | No multi-agent integration protocol. |
| Constraint enforcement | ⚠️ | NSO contracts scope work but don't use explicit "don't change other code" constraints. |

**Recommendation:** NSO currently uses single-agent delegation (one Builder per phase). For complex multi-subsystem work, the parallel agent dispatch pattern could be adopted as an optional acceleration technique, but it's not critical since NSO's architecture already sequences work through phases.

---

### 2.14 Writing Skills / Meta-Documentation

| Superpowers Feature | NSO Status | Assessment |
|---------------------|------------|------------|
| TDD for documentation | ❌ | NSO has no process for creating/testing its own documentation. |
| CSO (Claude Search Optimization) | ❌ | NSO doesn't optimize for agent discoverability. |
| Rationalization bulletproofing | ❌ | NSO has no technique for making rules rationalization-proof. |
| Token efficiency targets | ❌ | NSO doesn't set word count targets for its prompts. |
| Skill types classification | ❌ | NSO doesn't classify its own patterns by type (technique vs pattern vs reference). |

**Recommendation:** The Writing Skills meta-skill is unique to Superpowers and deeply relevant to NSO's self-improvement protocol. NSO should adopt the **rationalization bulletproofing** technique (rationalization tables, red flags lists, explicit loophole closures) for all mandatory processes. CSO is less relevant since NSO uses direct role-based prompt loading rather than search-based discovery.

---

### 2.15 What NSO Has That Superpowers Doesn't

| NSO Feature | Description | Superpowers Equivalent |
|-------------|-------------|------------------------|
| **Role-based agent architecture** | 6 specialized roles (Oracle, Builder, Designer, Janitor, Librarian, Scout) with explicit boundaries | Superpowers has no role separation — single agent does everything |
| **Formal delegation protocol** | contract.md → Builder → result.md → validation_contract.md → Janitor | Superpowers uses inline subagent prompts without formal contracts |
| **5-phase BUILD workflow** | Discovery → Architecture → Implementation → Validation → Closure | Superpowers has brainstorm → plan → execute but no architecture phase or closure phase |
| **Architecture phase** | TECHSPEC documents in `docs/architecture/` | Superpowers goes directly from design to implementation plan |
| **Task workspace** | `.opencode/context/active_tasks/[FeatureName]/` with status tracking | Superpowers uses `docs/plans/` but no task workspace |
| **Self-improvement protocol** | Librarian runs post-mortem, proposes NSO improvements | Superpowers has no self-improvement loop |
| **Knowledge graph memory** | Active context, patterns, progress, improvements backlog | Superpowers is stateless (skills are static documents) |
| **Artifact metadata headers** | Every document has `id`, `author`, `status`, `date`, `task_id` | Superpowers has minimal frontmatter (name, description only) |
| **UI/UX delegation** | Designer agent for mockups with "UI GATE" in Phase 1 | Superpowers has no UI design process |
| **Observability requirement** | "Any service performing external I/O MUST include explicit start/success/failure logging" | Not addressed |
| **Loop safety** | "All polling/retry logic MUST respect MIN_INTERVAL" | Not addressed |
| **Interface-first design** | "Define types/interfaces before implementations" | Not addressed |
| **Defensive programming** | "Public functions must begin with assertions. Fail fast." | Not addressed |
| **Worktree context propagation** | "ALL delegations MUST be explicitly instructed to work within the worktree directory" | Superpowers handles worktrees but doesn't propagate to subagents explicitly |
| **Improvement backlog** | `nso-improvements.md` with structured entries (source, proposal, status, approval) | No equivalent |
| **Design lock** | Obsidian Hybrid visual reference with style guide | No visual design system |

---

## Part 3: Prioritized Recommendations

### Tier 1: Critical Gaps (Adopt Immediately)

1. **TDD Enforcement Document** — NSO says "TDD Mandatory" in 5 words but provides zero enforcement. Create a dedicated TDD process document with Superpowers' rationalization table, red flags, verification checklist, delete-and-restart rule, and Good/Bad examples. This is the single biggest gap.

2. **Systematic Debugging Process** — NSO has zero debugging methodology despite DEBUG being the highest Router Priority. Adopt Superpowers' 4-phase process, especially the 3-fix architectural escalation rule.

3. **Verification Gate Function** — NSO's Phase 4 human gate is structurally sound but lacks the rigor of the IDENTIFY → RUN → READ → VERIFY → CLAIM process. Add language policing ("should", "probably" = red flags) and evidence-first rule to Builder/Janitor protocols.

### Tier 2: High Value (Adopt Soon)

4. **Two-Stage Validation** — Split NSO Phase 4 into spec compliance check THEN code quality check. This prevents optimizing code that doesn't meet requirements.

5. **Rationalization Prevention Pattern** — Adopt the meta-pattern: for every mandatory process, create a rationalization table + red flags list + explicit loophole closures. Apply to: TDD, delegation protocol, verification, worktree protocol.

6. **Brainstorming Interaction Design** — Add to Oracle Phase 1: one question at a time, 200-300 word design sections, always propose 2-3 approaches, YAGNI check on all designs.

7. **Worktree Protocol Enhancement** — Add safety verification (.gitignore check), auto-detect project setup, and baseline test verification to NSO's GIT WORKTREE PROTOCOL.

### Tier 3: Valuable (Adopt When Convenient)

8. **Anti-Performative Agreement** — Add to all agent prompts: "Technical acknowledgment or reasoned pushback only. No gratitude expressions. Actions > words."

9. **Question Protocol for Builder** — Before starting implementation, Builder should be able to ask clarifying questions about the contract. Add explicit provision for this.

10. **Branch Finishing Options** — Replace NSO Phase 5's assumption of merge+push with 4 structured options (merge/PR/keep/discard).

11. **YAGNI Check on Review Feedback** — When Janitor suggests changes, verify the feature is actually used before implementing.

### Tier 4: Consider (Different Design Philosophy)

12. **Fresh Subagent Per Task** — Superpowers' context pollution prevention is valuable but conflicts with NSO's single-Builder-per-phase model. Consider as optional optimization for complex multi-task implementations.

13. **Skill Discovery Engine** — NSO's role-based architecture doesn't need dynamic skill discovery, but the concept of auto-loading context at session start could improve Oracle's reliability.

14. **DOT Flowcharts in Process Docs** — Superpowers uses Graphviz DOT for decision flows. NSO could adopt Mermaid (since we already have whiteboard support) for the same purpose.

---

## Part 4: Summary Matrix

| Area | Superpowers Strength | NSO Strength | Winner |
|------|---------------------|--------------|--------|
| **Architecture** | N/A | Role separation, 5-phase workflow, formal contracts | NSO |
| **TDD Enforcement** | 372-line skill with rationalization prevention | 5-word mention in patterns.md | Superpowers |
| **Debugging** | 4-phase process, 3-fix escalation | Nothing | Superpowers |
| **Verification** | Gate Function, language policing | Phase 4 human gate | Superpowers |
| **Brainstorming** | Interaction design (1 question, 200-300 words) | REQ document output | Superpowers |
| **Plan Writing** | Bite-sized tasks, complete code | TECHSPEC + contract.md | Draw |
| **Code Review** | Two-stage (spec + quality), anti-performative | Single-stage Janitor | Superpowers |
| **Git Worktrees** | Safety verification, auto-setup, baseline tests | Basic worktree creation | Superpowers |
| **Self-Improvement** | Writing-skills TDD for docs | Librarian post-mortem, improvement backlog | NSO |
| **Memory/State** | Stateless (skills are static) | Active context, patterns, progress tracking | NSO |
| **Delegation** | Inline subagent prompts | Formal contract.md protocol | NSO |
| **UI/Design** | None | Designer agent, style guide, design lock | NSO |
| **Observability** | None | Logging standards, loop safety, defensive programming | NSO |
| **Rationalization Prevention** | Comprehensive (tables, red flags, loophole closures) | None | Superpowers |

**Overall Assessment:** NSO has superior architecture (role separation, formal contracts, memory, self-improvement) but Superpowers has superior process enforcement (rationalization prevention, verification rigor, TDD depth, debugging methodology). The ideal system combines NSO's architectural strengths with Superpowers' enforcement techniques.

---

## Part 5: Proposed NSO Improvement Entries

Based on this analysis, the following should be added to `nso-improvements.md`:

### NSO-2026-02-12-008
- source_task: superpowers-analysis
- proposal: Create dedicated TDD enforcement document with rationalization tables, red flags, verification checklist, delete-and-restart rule
- priority: CRITICAL
- status: proposed

### NSO-2026-02-12-009
- source_task: superpowers-analysis
- proposal: Create systematic debugging process (4-phase, 3-fix architectural escalation)
- priority: CRITICAL
- status: proposed

### NSO-2026-02-12-010
- source_task: superpowers-analysis
- proposal: Add Verification Gate Function (IDENTIFY→RUN→READ→VERIFY→CLAIM) to Builder and Janitor protocols
- priority: CRITICAL
- status: proposed

### NSO-2026-02-12-011
- source_task: superpowers-analysis
- proposal: Split Phase 4 validation into two stages: spec compliance THEN code quality
- priority: HIGH
- status: proposed

### NSO-2026-02-12-012
- source_task: superpowers-analysis
- proposal: Add rationalization prevention meta-pattern to all mandatory processes
- priority: HIGH
- status: proposed

### NSO-2026-02-12-013
- source_task: superpowers-analysis
- proposal: Add brainstorming interaction design to Oracle Phase 1 (one question, 200-300 word sections, 2-3 approaches)
- priority: HIGH
- status: proposed

### NSO-2026-02-12-014
- source_task: superpowers-analysis
- proposal: Enhance worktree protocol with safety verification, auto-setup, baseline tests
- priority: HIGH
- status: proposed

### NSO-2026-02-12-015
- source_task: superpowers-analysis
- proposal: Add anti-performative agreement to all agent prompts
- priority: MEDIUM
- status: proposed

### NSO-2026-02-12-016
- source_task: superpowers-analysis
- proposal: Add question protocol for Builder before starting implementation
- priority: MEDIUM
- status: proposed
