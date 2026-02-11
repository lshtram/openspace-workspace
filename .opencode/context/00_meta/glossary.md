---
id: META-GLOSSARY-OPENSPACE
author: oracle_9d3a
status: FINAL
date: 2026-02-11
task_id: meta-context
---

# Glossary

## Project-Specific Terms

### OpenSpace
**OpenSpace Client** - The React-based frontend application for AI-assisted development. Provides a chat interface, terminal integration, and session management for OpenCode AI interactions.

### NSO (Neuro-Symbolic Orchestrator)
The AI agent framework used for development tasks. Consists of multiple specialized agents:
- **Oracle** - System architect, requirements gathering, workflow orchestration
- **Builder** - Code implementation, TDD, feature development
- **Janitor** - Quality assurance, debugging, code review
- **Librarian** - Memory management, documentation, workflow closure
- **Designer** - UI/UX implementation
- **Scout** - Research and technology evaluation

### Workflows
Standardized development processes:
- **BUILD** - New feature development (Discovery → Architecture → Implementation → Validation)
- **DEBUG** - Bug fixing (Investigation → Fix → Validation)
- **REVIEW** - Code review (Scope → Analysis → Report)
- **PLAN** - Architecture planning and design

---

## Technical Terms

### XTerm.js
Terminal emulator library used for integrated terminal functionality in the client.

### React Query (TanStack Query)
Data fetching and server state management library. Used for caching API responses and managing loading states.

### Virtual Scrolling
Performance optimization technique using `react-virtuoso` to render only visible list items.

### MSW (Mock Service Worker)
API mocking library used in tests to intercept and mock HTTP requests.

### Radix UI
Headless UI component library providing accessible primitives (dialogs, popovers, etc.).

### Vite
Next-generation frontend build tool providing fast HMR (Hot Module Replacement) and optimized builds.

---

## NSO Terms

### Router
Intent detection system that classifies user requests into workflows (BUILD/DEBUG/REVIEW/PLAN).

### Router Monitor
Automatic monitoring system that checks every user message for workflow intent before responding.

### Memory Files
Persistent project state stored in `.opencode/context/01_memory/`:
- **active_context.md** - Current session state and focus
- **patterns.md** - Discovered patterns and conventions
- **progress.md** - Completed milestones and deliverables

### Meta Files
Project context stored in `.opencode/context/00_meta/`:
- **tech-stack.md** - Technology definitions and dependencies
- **patterns.md** - Coding standards and conventions
- **glossary.md** - This file - terminology definitions

### Two-Tier Architecture
- **Tier 1** (System-Wide): `~/.config/opencode/nso/` - Global NSO system
- **Tier 2** (Project-Specific): `./.opencode/` - Project context and memory

### Gate
Checkpoint between workflow phases requiring specific criteria to be met before proceeding.

### Contract
YAML structure defining workflow state, tasks, and completion criteria.

### Skill
Reusable capability or algorithm for agents (e.g., `requirement-elicitation`, `bug-investigator`).

### Traceability Matrix
Table mapping requirements (REQ-XXX) to verification methods (tests, commands).

---

## Development Terms

### TDD (Test-Driven Development)
Development approach: Write failing test (RED) → Implement code (GREEN) → Refactor

### E2E (End-to-End)
Testing approach simulating real user interactions with Playwright.

### HMR (Hot Module Replacement)
Vite feature allowing code changes without full page reload.

### CSR (Client-Side Rendering)
React application runs in browser, API calls made from client.

### Hydration
Process where React attaches event listeners to server-rendered HTML.

---

## Session Terms

### Context Loading
Reading project context files at session start to understand tech stack, patterns, and current state.

### Memory Protocol
Required procedure: LOAD at start → UPDATE at end of every session.

### Workflow Phase
Specific stage within a workflow (e.g., Discovery, Architecture, Implementation in BUILD workflow).

### Agent Delegation
When Oracle assigns a task to another agent (Builder, Janitor, etc.) using the Task tool.

---

## File Naming

### REQ-*.md
Requirements document (e.g., `REQ-User-Auth-001.md`)

### TECHSPEC-*.md
Technical specification document (e.g., `TECHSPEC-Auth-System.md`)

### ADR-*.md
Architecture Decision Record documenting important decisions.

### session-*.md
Archived conversation session transcript.
