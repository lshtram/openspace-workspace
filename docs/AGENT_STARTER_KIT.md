# 🚀 Agent-First Project Starter Kit (OpenSpace Edition)

This guide summarizes the essential file structures, workflows, and procedures used in OpenSpace to ensure AI agents are efficient, aligned, and follow strict coding standards from the very first message.

## 1. The Mandatory File Structure

Copy these files to every new project to establish the "Agent Sandbox":

### 📁 Root Configuration
*   **`.agent/workflows/`**: (Folder) Contains standard procedural prompt files.
    *   `boot.md`: The onboarding sequence (Reads all Tier 1/2 docs).
    *   `distill.md`: End-of-task knowledge extraction.
    *   `stabilize.md`: Mid-task checkpointing if context gets cluttered.

### 📁 Documentation (`docs/`)
*   **`AGENTS.md`**: Tier 1 Rules. Contains task patterns (e.g., "Feature Implementation Pattern"), coding principles, and the "Verification Handshake".
*   **`GUIDELINES.md`**: The Single Source of Truth for coding standards, styling, and design tokens.
*   **`PROJECT_CONTEXT.md`**: Project overview, stack, and current status (create if missing).
*   **`TODO.md`**: The backlog with clear priority levels (🔴 Critical, 📋 Next Up).
*   **`ARCHITECTURE.md`**: High-level diagrams and layer definitions (e.g., UI → State → Domain → Data).

---

## 2. Standard Procedures (Workflows)

### The "Boot" Sequence
Always start a new agent session with `/boot`. This forces the agent to:
1.  Read `AGENTS.md` and `GUIDELINES.md`.
2.  Review `PROJECT_CONTEXT.md` and `TODO.md`.
3.  Declare alignment with the stack (e.g., "I am ready to use Strict TypeScript and CSS Modules").

### The "Planning" Phase
1.  Agent creates an `implementation_plan.md` artifact.
2.  **STOP**: Agent must get user approval before writing a single line of code.
3.  This prevents "hallucination drift" and ensures architectural alignment.

### Reflection & Distillation
After every major feature or fix, run `/distill`.
*   Extracts learnings into `docs/archive/` or updates `AGENTS.md`.
*   Prevents repeating the same mistakes (e.g., "Don't use X library because of Y bug").

---

## 3. Technical Best Practices for Agent Collaboration

### 🛠️ Architecture for Agents
*   **Layered Separation**: UI is purely presentational. Logic lives in Hooks/View-Models. Data storage is abstracted behind Providers. This makes it easy for agents to find where to make changes.
*   **Pure Domain Logic**: Keep core logic in pure functions inside `domain/`. These are easy for agents to test and verify without complicated mocks.
*   **Provider Pattern**: Never let agents call the backend SDK (Supabase, Firebase, etc.) directly in components. Standardize an interface in `src/data/index.js`.

### 🧪 Quality Enforcement
*   **Regression Tests**: Every bug fix requires a failing test first.
*   **TypeScript Strict**: No `any`. Forces the agent to understand the data structures accurately.
*   **CSS Modules**: Prevents agents from accidentally breaking global styles via side effects.

---

## 4. How to Bootstrap a New Project

1.  **Repo Setup**: Create the `.agent/workflows/` and `docs/` folders.
2.  **Seed Documents**: Copy the templates for `AGENTS.md`, `GUIDELINES.md`, and `PROJECT_CONTEXT.md`.
3.  **The First Prompt**: Your very first message should be:
    > "Read `.agent/AGENTS.md` and run `/boot`. Confirm when you are ready to plan the first feature."

---
*Note: This structure turns the AI agent from a "code autocomplete" into a "collaborative engineer" that respects your architecture and project history.*
