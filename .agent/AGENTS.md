# AI Agent Manual: OpenSpace

Welcome to the OpenSpace project. This document serves as your operational manual.

## 📁 Agent Directory Structure (.agent/)

- **[PROCESS.md](PROCESS.md)**: The SDLC (Development Cycle) you must follow.
- **[GUIDELINES.md](GUIDELINES.md)**: Behavioral rules and project-specific discipline.
- **[CODING_STYLE.md](CODING_STYLE.md)**: Technical standards and "Gold Standard" patterns.
- **[REQUIREMENTS_MCP.md](REQUIREMENTS_MCP.md)**: Rules for using external MCP tools.
- **[skills/](skills/)**: Specialized instruction sets for specific roles (PRD Architect, etc.).
- **[workflows/](workflows/)**: Step-by-step guides for common tasks.
  - **`/new-feature`**: Structured requirements gathering (may replace `/start-task`)
- **[templates/](templates/)**: Standard formats for PRDs, Tech Specs, and ADRs.

## 📚 Key Documentation

- **[Session Start](.agent/SESSION_START.md)**: Current project state snapshot - **read this first in new conversations** (create if missing)
- **[Codebase Map](.agent/CODEBASE_MAP.md)**: Quick file navigation reference (create if missing)
- **[Project Context](../docs/PROJECT_CONTEXT.md)**: High-level project overview and architecture (create if missing)
- **[OpenSpace PRD](../docs/OpenSpace-PRD.md)**: Product requirements and scope

## 🚀 Context Tiering

1. **Tier 0 (Session Start)**: `.agent/SESSION_START.md`, `.agent/CODEBASE_MAP.md` - Quick orientation for new conversations.
2. **Tier 1 (Always Read)**: `.agent/AGENTS.md`, `.agent/PROCESS.md`, `docs/PROJECT_CONTEXT.md` (if present).
3. **Tier 2 (As Needed)**: `.agent/GUIDELINES.md`, `.agent/CODING_STYLE.md`, `docs/prd/PRD_CORE.md`.
4. **Tier 3 (Specifics)**: Database schemas, module-specific PRDs, legacy guidelines in `archive/`.
5. **Handoff Context**: `HANDOFF.md`, `compact.md` (if continuing from previous session with full context).

## 📦 App Location (Important)

- The application lives in `openspace-client/`.
- All `npm` commands must be run from `openspace-client/` (e.g., `npm run test`, `npm run lint`, `npm run dev`).
- E2E tests are Playwright-based; see `openspace-client/README.md` for the current scripts.

## 🛠 Integrated Skills

We use specialized skills to ensure high-integrity development. See `.agent/skills/` for details.

1. **PRD-Architect**: For designing modular, testable requirements.
2. **Start-Task / Finish-Task**: For managing the task lifecycle on `main`.
3. **Pattern-Enforcement**: For auditing code against our standards.
4. **Test-Architect**: For planning verification before implementation.
5. **Research-Mastery**: For validating external APIs and libraries.
6. **Handoff**: For compacting context (`HANDOFF.md`) to restart cleanly.
7. **New-Feature-Interviewer**: For structured requirements gathering via `/new-feature`.

## 🏗️ Client / Server Architecture

**OpenSpace is a frontend client for OpenCode**:

1. **API Access**: Use `openspace-client/src/services/OpenCodeClient.ts` + hooks in `openspace-client/src/hooks/`.
2. **Directory Scope**: The default directory is provided by the OpenCode server (unless explicitly overridden).
3. **No Serverless Code Here**: This repo is frontend-only; backend endpoints live with the OpenCode server.

## 🔄 Common Task Patterns

### 1. Feature Implementation (Isolated)

- Prefer colocated modules in `openspace-client/src/components`, `openspace-client/src/hooks`, and `openspace-client/src/services`.
- Use TypeScript for all prop types and data models.

### 2. View-Model Decomposition

- When a Hook > 200 lines, extract sub-hooks for distinct logic.
- Orchestrate sub-hooks in the main View-Model.

### 3. Styling

- Prefer Tailwind utility classes; use `openspace-client/src/index.css` and `openspace-client/src/App.css` as the global baselines.

### 5. New Feature Requirements Gathering

- Use `/new-feature [brief_description]` to initiate structured requirements gathering.
- Follow the interview protocol to extract complete requirements.
- Present proposal before formalizing into PRD.
- May replace `/start-task` after validation.

## ⚠️ Critical Rules (NEVER VIOLATE)

1. **No Direct OpenCode Calls in Components**: Use `openspace-client/src/services` and hooks.
2. **Regression Tests Required**: For every bug fix.
3. **Stop After Planning**: Never write code without user approval of the plan.
4. **Pages are Orchestrators**: Move logic to hooks (ViewModels).
5. **Strict TypeScript**: No `any` usage.
6. **Efficiency First**: Browser usage is a LAST RESORT.
7. **Arm64 Only**: All builds/tests must run under arm64 (use `/opt/homebrew/bin/node`). If `node -p process.arch` reports `x64`, stop, notify the user, and fix PATH immediately.

## 📊 Project Status

For the current project status (code quality, blockers, priorities), use `docs/OpenSpace-PRD.md` and any active plan in `docs/plans/`.

## 🔄 Session Management

### Starting a New Conversation

1. Load **Tier 0** documents first: `SESSION_START.md`, `CODEBASE_MAP.md` (if present)
2. Check for handoff files: `HANDOFF.md` or `compact.md` (if continuing work)
3. Load **Tier 1** documents: `AGENTS.md`, `PROCESS.md`, `PROJECT_CONTEXT.md` (if present)
4. Load **Tier 2+** as needed for the specific task

### Ending a Conversation

After completing significant work or before a break:

1. **Always update** `docs/prd/` and `docs/plans/` as needed with recent changes
2. **Run end-session workflow**: See `.agent/workflows/end-session.md` for complete checklist
3. **Create handoff** (if context is full): Invoke `handoff` skill to generate `HANDOFF.md` and `compact.md`
4. **Update SESSION_START.md** (if major milestone): Refresh the session start snapshot

**Quick command** for automated steps:
```bash
git log --since='7 days ago' --name-only --pretty=format: | sort | uniq -c | sort -rn | head -20 > .agent/hot-files.txt && \
find openspace-client/src -maxdepth 2 -type d | sort > .agent/structure-snapshot.txt
```

See **[End Session Workflow](.agent/workflows/end-session.md)** for full details.
