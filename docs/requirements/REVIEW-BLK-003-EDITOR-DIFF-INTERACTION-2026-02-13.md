---
id: REVIEW-BLK-003-EDITOR-DIFF-INTERACTION-2026-02-13
author: oracle_9f2b
status: APPROVED
date: 2026-02-13
task_id: BLK-003-editor-viewer-mvp
---

# Editor/Viewer Requirement Clarification and Diff Interaction Review

## 1. Confirmed Product Decisions

Captured from user guidance:

| Topic | Decision |
|---|---|
| Agent navigation default | `auto-focus` by default; user can change in settings |
| Highlight persistence | Ephemeral only; cleared when agent moves to next prompt/explanation step |
| Pane behavior on agent reveal | Open side-by-side by default |
| Dirty file + agent edit | Preview-first flow |
| Location model | Line/column baseline; support section/range highlighting |
| User control override | `Escape` immediately returns control to user |
| Highlight granularity MVP | Line range is sufficient; keep API extensible for token/range variants |
| Diff -> Editor integration | Auto-highlight handoff range is desired |

## 2. Recommendation on Preview-First (Item 4)

Preview-first is the right default for safety and trust.

Recommended policy:
- If tab is clean: allow direct apply through validated mutation pipeline.
- If tab is dirty: open a non-destructive preview panel with options:
  - `Apply to editor buffer`
  - `Apply to disk via patch`
  - `Reject`
- Never silently overwrite user edits.

## 3. Are Editor and Diff the Same or Different?

### 3.1 Architectural Position

They should be **separate modalities** with a **shared navigation substrate**.

- **Editor/Viewer modality**: canonical file interaction surface (open/edit/save/view).
- **Diff Review modality**: review projection over before/after content, comments, and ranges.

They are not the same mode because their canonical artifacts and user intents differ.

### 3.2 Shared Components/Contracts (to avoid duplication)

Use shared primitives across both modalities:
- `Location` contract (`path`, `startLine`, `startColumn`, `endLine`, `endColumn`).
- `Reveal` action contract (`openFileAt(path, selection, options)`).
- `Highlight` contract with lifecycle (`apply`, `update`, `clear`).
- Unified event envelope (`modality`, `artifact`, `actor`, `timestamp`).

### 3.3 Interaction Contract (Diff <-> Editor)

Required interactions:
- Diff selection -> open editor at target location.
- Diff selection -> apply transient editor highlight automatically.
- Editor jump-back -> return to originating diff file/range.
- Comment anchors remain stable via normalized range metadata.

## 4. Additional User Stories (Beyond Current REQ Baseline)

- `US-EDT-007` As a user, I can let the agent open a file at exact location while explaining code.
- `US-EDT-008` As a user, I can see transient highlights for the exact range the agent references.
- `US-EDT-009` As a user, I can instantly reclaim control (Escape) from agent-driven focus.
- `US-EDT-010` As a user, I can jump back to my prior position after an agent reveal.
- `US-EDT-011` As a user, I can review proposed agent edits safely before applying them to a dirty file.
- `US-EDT-012` As a user, diff-to-editor handoff preserves and shows selected range context.

## 5. Additional Functional Requirements Proposal

For BLK-003 (Editor/Viewer):
- `REQ-EDT-007` Support deterministic reveal command `openFileAt(path, selection?, options?)` with line/column range.
- `REQ-EDT-008` Support transient highlight overlays (`apply/update/clear`) scoped to agent walkthrough session.
- `REQ-EDT-009` Default focus mode is `auto-focus`, configurable in settings (`auto-focus | suggest-only | disabled`).
- `REQ-EDT-010` `Escape` immediately cancels active agent focus/guide mode and returns manual user control.
- `REQ-EDT-011` Dirty-tab conflict policy is preview-first; no silent overwrite path is allowed.
- `REQ-EDT-012` Side-by-side open is default for agent reveal actions.
- `REQ-EDT-013` Highlight API supports line range now and is extensible to token/range-keyed highlights later.

For BLK-004 (Diff Review) integration edge:
- `REQ-DFR-008` Diff selection handoff to editor must include normalized range metadata and target side.
- `REQ-DFR-009` Handoff action auto-applies transient highlight in editor for selected range.
- `REQ-DFR-010` Editor jump-back from handoff context must restore prior diff focus anchor.

## 6. Decision Closure

Final decision confirmed:

- Preview-first flow default action is `Apply to buffer`.
- `Apply to disk via patch` remains an explicit secondary action.
