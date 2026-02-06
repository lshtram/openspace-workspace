# AI Agent Manual: Fermata

Welcome to the Fermata project. This document serves as your operational manual.

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

- **[Session Start](.agent/SESSION_START.md)**: Current project state snapshot - **read this first in new conversations**
- **[Codebase Map](.agent/CODEBASE_MAP.md)**: Quick file navigation reference
- **[E2E Testing](../docs/E2E_TESTING.md)**: Comprehensive guide to our Playwright test suite with user pool architecture
- **[Project Context](../docs/PROJECT_CONTEXT.md)**: High-level project overview and architecture
- **[Status](../docs/STATUS.md)**: Current project status, code quality, blockers, priorities

## 🚀 Context Tiering

1. **Tier 0 (Session Start)**: `.agent/SESSION_START.md`, `.agent/CODEBASE_MAP.md` - Quick orientation for new conversations.
2. **Tier 1 (Always Read)**: `.agent/AGENTS.md`, `.agent/PROCESS.md`, `docs/PROJECT_CONTEXT.md`.
3. **Tier 2 (As Needed)**: `.agent/GUIDELINES.md`, `.agent/CODING_STYLE.md`, `docs/prd/PRD_CORE.md`.
4. **Tier 3 (Specifics)**: Database schemas, module-specific PRDs, legacy guidelines in `archive/`.
5. **Handoff Context**: `HANDOFF.md`, `compact.md` (if continuing from previous session with full context).

## 📦 App Location (Important)

- The application lives in `app/`.
- All `npm` commands must be run from `app/` (e.g., `npm test`, `npm run lint`, `npm run dev`).
- E2E tests use Playwright with a **6-user pool** for fast parallel execution (see [E2E Testing Guide](../docs/E2E_TESTING.md)).
- **Testing Protocol**: Always follow `.agent/workflows/test-project.md` for the complete test execution sequence.

## 🛠 Integrated Skills

We use specialized skills to ensure high-integrity development. See `.agent/skills/` for details.

1. **PRD-Architect**: For designing modular, testable requirements.
2. **Start-Task / Finish-Task**: For managing the task lifecycle on `main`.
3. **Pattern-Enforcement**: For auditing code against our standards.
4. **Test-Architect**: For planning verification before implementation.
5. **Research-Mastery**: For validating external APIs and libraries.
6. **Handoff**: For compacting context (`HANDOFF.md`) to restart cleanly.
7. **New-Feature-Interviewer**: For structured requirements gathering via `/new-feature`.

## 🏗️ API & Serverless Architecture

**Fermata uses a hybrid approach**:

1. **Primary Pattern**: Direct Supabase calls via `src/data` provider pattern for CRUD operations.
2. **Serverless Functions**: Vercel functions in `app/api/` for complex operations (PDF processing, LLM calls, etc.).
3. **Local Development**: Express server in `tools/local-server/` mimics Vercel endpoints during development.

### Development vs. Production Flow

**Development (localhost)**:
```
Vite (:5173) → Proxy `/api/*` → Express Server (:3001)
                                 └─ tools/local-server/index.ts
```

**Production (Vercel)**:
- The Book-to-Collection endpoint is currently **disabled** in production.
- Use the local server for this workflow until the feature is productized.

### **CRITICAL**: When Adding/Modifying API Endpoints

1. **Local server only (current policy)**: `tools/local-server/index.ts` (TypeScript, Express format)
2. **Production endpoints**: add `app/api/{endpoint}/index.ts` only when a feature is approved for the site
3. **Keep both in sync once production is enabled**

Example: `POST /api/book-to-collection` exists only in the local server for now.

## 🔄 Common Task Patterns

### 1. Feature Implementation (Isolated)

- Create `src/modules/feature-name/` (Component, Hook, CSS Module, Test).
- Use TypeScript for all prop types.
- Export via `index.ts`.

### 2. View-Model Decomposition

- When a Hook > 200 lines, extract sub-hooks for distinct logic.
- Orchestrate sub-hooks in the main View-Model.

### 3. CSS Migration

- Move styles from `app.css` to `ComponentName.module.css`.
- Convert BEM to camelCase.

### 4. API Endpoint Implementation

- **Local Server**: Add Express route to `tools/local-server/index.ts` (TypeScript, Express format)
- **Production (when enabled)**: Create `app/api/{endpoint}/index.ts` (TypeScript, Vercel format)
- **Strict TypeScript**: Use strict typing in all API code
- **Keep in sync**: Only required once production endpoint is enabled
- **Vite Proxy**: Add route to `app/vite.config.js` if needed

### 5. New Feature Requirements Gathering

- Use `/new-feature [brief_description]` to initiate structured requirements gathering.
- Follow the interview protocol to extract complete requirements.
- Present proposal before formalizing into PRD.
- May replace `/start-task` after validation.

## ⚠️ Critical Rules (NEVER VIOLATE)

1. **No Direct Supabase Calls**: Use `src/data` or module hooks.
2. **Regression Tests Required**: For every bug fix.
3. **Stop After Planning**: Never write code without user approval of the plan.
4. **Pages are Orchestrators**: Move logic to hooks (ViewModels).
5. **Strict TypeScript**: No `any` usage.
6. **Efficiency First**: Browser usage is a LAST RESORT.

## 📊 Project Status

For the current project status (code quality, blockers, priorities), see **[STATUS.md](../docs/STATUS.md)**.

## 🔄 Session Management

### Starting a New Conversation

1. Load **Tier 0** documents first: `SESSION_START.md`, `CODEBASE_MAP.md`
2. Check for handoff files: `HANDOFF.md` or `compact.md` (if continuing work)
3. Load **Tier 1** documents: `AGENTS.md`, `PROCESS.md`, `PROJECT_CONTEXT.md`
4. Load **Tier 2+** as needed for the specific task

### Ending a Conversation

After completing significant work or before a break:

1. **Always update** `docs/STATUS.md` and `docs/TODO.md` with recent changes
2. **Run end-session workflow**: See `.agent/workflows/end-session.md` for complete checklist
3. **Create handoff** (if context is full): Invoke `handoff` skill to generate `HANDOFF.md` and `compact.md`
4. **Update SESSION_START.md** (if major milestone): Refresh the session start snapshot

**Quick command** for automated steps:
```bash
git log --since='7 days ago' --name-only --pretty=format: | sort | uniq -c | sort -rn | head -20 > .agent/hot-files.txt && \
find app/src -maxdepth 2 -type d | sort > .agent/structure-snapshot.txt
```

See **[End Session Workflow](.agent/workflows/end-session.md)** for full details.
