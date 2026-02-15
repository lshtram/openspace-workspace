---
id: REQ-MODALITY-PLATFORM-V2
author: oracle_7c4a
status: APPROVED
date: 2026-02-12
---

# Requirements: Modality Platform V2

## 1. Purpose

Define a single active requirements baseline for all supported modalities, aligned to:
- `openspace-client/docs/architecture/drawing-modality-implementation-guide-v2.md`
- `docs/architecture/TECHSPEC-MODALITY-PLATFORM-V2.md`

This document consolidates requirements previously spread across legacy modality guides.

## 2. Active Modality Set

1. Drawing
2. Presentation
3. Editor/Viewer
4. Diff Review
5. Comments
6. Annotation
7. Voice
8. Browser Snapshot Preview

## 3. Platform-Wide User Stories

- `US-PLT-001` As a user, I can open each artifact in exactly one canonical modality surface.
- `US-PLT-002` As a user, I can co-edit with the agent without data corruption.
- `US-PLT-003` As a user, I receive explicit validation failures, not silent degradation.
- `US-PLT-004` As a user, unchanged content/layout/style stays stable after incremental updates.
- `US-PLT-005` As a user, cross-modality handoffs are predictable and deterministic.
- `US-PLT-006` As a user, active context and key view state can be restored across sessions.
- `US-PLT-007` As a user, the agent can open, close, and navigate modalities on my behalf — showing me files, drawings, presentations, and highlighting relevant content without me needing to manually navigate.
- `US-PLT-008` As a user, I can see what panes are open and the agent can describe the current layout to me.
- `US-PLT-009` As a user, the agent can open a file in a new pane (side-by-side) or in the current pane, matching my workflow preference.

## 4. Platform Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| REQ-PLT-001 | Every modality defines a canonical artifact model; projections/adapters are derived outputs. | Must |
| REQ-PLT-002 | Agent mutations are patch/operation based; blind full-document agent rewrites are disallowed. | Must |
| REQ-PLT-003 | Mutations pass schema + semantic + policy validation before apply. | Must |
| REQ-PLT-004 | Apply operations are atomic and versioned. | Must |
| REQ-PLT-005 | Runtime emits update/apply/failure events with modality, artifact, actor, timestamp. | Must |
| REQ-PLT-006 | Active context uses one unified context contract for all modalities. | Must |
| REQ-PLT-007 | Cross-modality handoff payloads include source modality, target path/id, and optional location metadata. | Must |
| REQ-PLT-008 | All file paths are normalized and constrained to workspace root. | Must |
| REQ-PLT-009 | External I/O paths emit start/success/failure logs with ISO timestamps. | Must |
| REQ-PLT-010 | Poll/retry loops apply a shared `MIN_INTERVAL` in success and failure paths. | Must |
| REQ-PLT-011 | Agent can command the client UI to open/close/focus panes and modalities via a server-sent command channel. | Must |
| REQ-PLT-012 | Agent pane/modality commands are relayed through the Hub as SSE events with type `PANE_COMMAND`. | Must |
| REQ-PLT-013 | The client listens for `PANE_COMMAND` SSE events and executes them against the PaneContext. | Must |
| REQ-PLT-014 | MCP tools exist for pane management: `pane.open`, `pane.close`, `pane.list`, `pane.focus`. | Must |
| REQ-PLT-015 | MCP tools exist for editor control: `editor.open` (with path, line, highlight), `editor.read_file`, `editor.close`. | Must |
| REQ-PLT-016 | MCP tools exist for presentation navigation: `presentation.open`, `presentation.navigate` (go to slide). | Must |
| REQ-PLT-017 | The `ACTIVE_MODALITIES` allowlist in the Hub includes all implemented modalities (drawing, editor, whiteboard, presentation). | Must |

## 5. Modality Requirements

### 5.1 Presentation

#### User Stories
- `US-PRES-001` Generate deck from project artifacts.
- `US-PRES-002` User and agent co-edit same deck.
- `US-PRES-003` Agent updates a single slide without changing other slides.
- `US-PRES-004` Playback with pace and transport controls.
- `US-PRES-005` Export deck for sharing.
- `US-PRES-006` Future-ready narration integration without changing deck format.

#### Functional Requirements
- `REQ-PRES-001` Canonical artifact: `docs/deck/<name>.deck.md`.
- `REQ-PRES-002` Deck supports YAML frontmatter + `---` slide delimiter.
- `REQ-PRES-003` MCP tools: list/read/update deck, read/update slide.
- `REQ-PRES-004` Slide updates validate index and preserve untouched slides exactly.
- `REQ-PRES-005` Realtime refresh on external deck updates.
- `REQ-PRES-006` Playback states: `stopped | running | paused`.
- `REQ-PRES-007` PDF export path with actionable error handling.
- `REQ-PRES-008` Deferred hooks for edit/comment/annotate entry points.

### 5.2 Editor/Viewer

#### User Stories
- `US-EDT-001` Open file in editor surface.
- `US-EDT-002` Edit/save with clear dirty state.
- `US-EDT-003` Multi-tab editing with preserved cursor/scroll.
- `US-EDT-004` External change handling for clean vs dirty tabs.
- `US-EDT-005` Markdown edit/view toggle with Mermaid rendering.
- `US-EDT-006` Stable navigation and session restore.
- `US-EDT-007` Follow agent-guided reveal to a specific file and exact location during explanation.
- `US-EDT-008` See a transient visual highlight for the exact range the agent references.
- `US-EDT-009` Reclaim manual control immediately from agent-guided focus via Escape.
- `US-EDT-010` Return to prior location after agent-guided jumps.
- `US-EDT-011` Review agent-proposed edits safely before applying when local file state is dirty.
- `US-EDT-012` Preserve selected diff context when opening the same file in editor.

#### Functional Requirements
- `REQ-EDT-001` Text/code/markdown/config files supported for MVP.
- `REQ-EDT-002` Deterministic tab identity via normalized path.
- `REQ-EDT-003` Save path goes through validated mutation pipeline.
- `REQ-EDT-004` Viewer registry supports extensible viewer adapters.
- `REQ-EDT-005` External open hook: `openFileAt(path, selection?)`.
- `REQ-EDT-006` Keyboard save/close/switch shortcuts.
- `REQ-EDT-007` `openFileAt(path, selection?, options?)` accepts normalized line/column range (`startLine`, `startColumn`, `endLine`, `endColumn`) and resolves deterministically.
- `REQ-EDT-008` Agent walkthrough highlights support explicit lifecycle actions (`apply`, `update`, `clear`) with stable highlight IDs.
- `REQ-EDT-009` Agent reveal default is `auto-focus`; user can change policy in settings to `suggest-only` or `disabled`.
- `REQ-EDT-010` Escape immediately exits active agent-guided focus/highlight mode and returns control to user navigation.
- `REQ-EDT-011` Agent reveal opens side-by-side editor pane by default.
- `REQ-EDT-012` Dirty-tab agent edit flow is preview-first and non-destructive; default action applies to buffer, with optional explicit apply-to-disk path.
- `REQ-EDT-013` Line-range highlight is required for MVP; highlight API remains extensible for token/text-range targeting without breaking contract.
- `REQ-EDT-014` Agent-driven editor file writes use validated patch/operation pipeline; blind full-document rewrite is disallowed.
- `REQ-EDT-015` Navigation history supports deterministic jump-back after any agent-guided reveal.
- `REQ-EDT-016` Clickable file/location links from agent conversation and other modality surfaces (including presentation) resolve through `openFileAt` and open editor at target range deterministically.
- `REQ-EDT-017` MVP editor command surface includes open/save/save-as, undo/redo, cut/copy/paste, find/replace (single-file), toggle line comment, and deterministic go-to-location reveal.
- `REQ-EDT-018` Deferred editor commands outside MVP scope (including workspace-wide find and advanced IDE refactors) are explicitly unavailable; no silent no-op command paths.
- `REQ-EDT-019` Multi-tab editor runtime preserves per-tab model + view state (cursor/scroll/selection) keyed by normalized path without cross-tab state leakage.
- `REQ-EDT-020` Editor/viewer appearance controls include zoom in/out/reset and font size increase/decrease/reset, with keyboard shortcuts and settings persistence.

### 5.3 Diff Review

#### User Stories
- `US-DFR-001` Open session review with changed files.
- `US-DFR-002` Toggle unified/split view.
- `US-DFR-003` Select line ranges and create comments.
- `US-DFR-004` Open reviewed file in editor at target location.
- `US-DFR-005` Restore review state when navigating away and back.
- `US-DFR-006` Handle binary diffs safely with previews/placeholders.
- `US-DFR-007` Handoff to editor preserves selected diff context and allows return to diff anchor.

#### Functional Requirements
- `REQ-DFR-001` Diff source contract includes status/additions/deletions and before/after content references.
- `REQ-DFR-002` File accordion model with expand/collapse all.
- `REQ-DFR-003` Renderer abstraction supports selection and comment highlighting.
- `REQ-DFR-004` Range model supports normalized start/end and side metadata.
- `REQ-DFR-005` Comment handoff payload includes deterministic range metadata.
- `REQ-DFR-006` Focus/scroll contract opens collapsed target and scrolls to anchor.
- `REQ-DFR-007` Review state persistence for style/open-files/scroll/focus.
- `REQ-DFR-008` Diff-to-editor handoff payload includes normalized target path, start/end line-column metadata, and side context.
- `REQ-DFR-009` Diff-to-editor handoff auto-applies transient editor highlight for selected range.
- `REQ-DFR-010` Editor jump-back action restores originating diff file/anchor deterministically.

### 5.4 Comments

#### User Stories
- `US-CMT-001` Create persistent comment threads.
- `US-CMT-002` Reply with user and agent participation.
- `US-CMT-003` Resolve/reopen/delete thread lifecycle.
- `US-CMT-004` Attach comments across modalities.
- `US-CMT-005` Convert annotation context into comment thread.
- `US-CMT-006` Send thread context to agent.

#### Functional Requirements
- `REQ-CMT-001` Durable thread/message/status model on disk.
- `REQ-CMT-002` Roles: `user | agent | system` in one timeline.
- `REQ-CMT-003` Core operations: create/reply/resolve/reopen/delete/list/read.
- `REQ-CMT-004` Real-time refresh for active comment views.
- `REQ-CMT-005` Target mapping uses deterministic artifact/location metadata.
- `REQ-CMT-006` Source-open interop actions map to source modality open hooks.

### 5.5 Annotation

#### User Stories
- `US-ANN-001` Annotate image/PDF surfaces quickly.
- `US-ANN-002` Save flattened annotation snapshot.
- `US-ANN-003` Send annotated snapshot to agent.
- `US-ANN-004` Keep MVP disposable (no required persistent editable annotation file).

#### Functional Requirements
- `REQ-ANN-001` MVP targets: image and PDF page surfaces.
- `REQ-ANN-002` Source artifact must never be mutated.
- `REQ-ANN-003` Export flattened PNG with source context metadata.
- `REQ-ANN-004` Snapshot output is consumable by comment workflow.
- `REQ-ANN-005` Future expansion supports persistent editable annotation artifacts and robust anchoring/versioning.

### 5.6 Voice

#### User Stories
- `US-VOI-001` Start/stop/interruption lifecycle with clear status.
- `US-VOI-002` Review/edit transcript before submit.
- `US-VOI-003` Persist audio/transcript artifacts by policy.
- `US-VOI-004` Policy-driven TTS output modes.
- `US-VOI-005` Barge-in and interruption for conversational flow.
- `US-VOI-006` Streaming-first voice interaction (input/output).

#### Functional Requirements
- `REQ-VOI-001` Input lifecycle: start/stop/interrupt + status model.
- `REQ-VOI-002` Transcript lifecycle: interim/final/edit-before-send.
- `REQ-VOI-003` Output lifecycle: speak/enqueue/pause/resume/interrupt.
- `REQ-VOI-004` Configurable output policy: off/on-demand/on-completion/on-error/always.
- `REQ-VOI-005` Device/language configuration with fallback behavior.
- `REQ-VOI-006` Optional user barge-in and agent interruption with timeline segmentation metadata.
- `REQ-VOI-007` Streaming transport for input chunks and incremental TTS playback.

### 5.7 Browser Snapshot Preview

#### User Stories
- `US-BRP-001` Paste screenshot and start review immediately.
- `US-BRP-002` Use same flow for external webpage screenshots.
- `US-BRP-003` Preserve snapshot context in comments.

#### Functional Requirements
- `REQ-BRP-001` Clipboard image intake with MIME validation.
- `REQ-BRP-002` Deterministic snapshot persistence path.
- `REQ-BRP-003` Immediate launch into annotation and comment workflows.
- `REQ-BRP-004` Optional source URL metadata.
- `REQ-BRP-005` No dependency on browser page injection permissions for MVP.

### 5.8 Drawing

The drawing modality requirements are defined in:
- `openspace-client/docs/architecture/drawing-modality-implementation-guide-v2.md`

This requirements set inherits drawing V2 constraints as mandatory for platform coherence.

### 5.9 Agent-Modality Control (Tier 1)

#### User Stories
- `US-AMC-001` Agent opens a file in the editor pane at a specific line and optionally highlights a range.
- `US-AMC-002` Agent opens a whiteboard/drawing in a pane (existing or new).
- `US-AMC-003` Agent opens a presentation and navigates to a specific slide.
- `US-AMC-004` Agent closes a pane or tab it previously opened.
- `US-AMC-005` Agent lists currently open panes and their content to understand the user's workspace.
- `US-AMC-006` Agent opens content in a new split pane (side-by-side) when requested.
- `US-AMC-007` Agent focuses (brings to front) an already-open pane/tab.
- `US-AMC-008` Agent reads file content through the Hub for any workspace file (read-only).

#### Functional Requirements
- `REQ-AMC-001` `pane.open` MCP tool accepts `{ type: SpaceType, title: string, contentId?: string, targetPaneId?: string, newPane?: boolean, splitDirection?: 'horizontal' | 'vertical' }` and opens content in the client UI.
- `REQ-AMC-002` `pane.close` MCP tool accepts `{ paneId?: string, contentId?: string }` and closes the specified pane or tab.
- `REQ-AMC-003` `pane.list` MCP tool returns the current pane layout tree with pane IDs, active tabs, and content descriptions.
- `REQ-AMC-004` `pane.focus` MCP tool accepts `{ paneId?: string, contentId?: string }` and activates the target pane/tab.
- `REQ-AMC-005` `editor.open` MCP tool accepts `{ path: string, line?: number, endLine?: number, highlight?: boolean, mode?: 'edit' | 'view', newPane?: boolean }` and opens the file in the editor.
- `REQ-AMC-006` `editor.read_file` MCP tool accepts `{ path: string, startLine?: number, endLine?: number }` and returns file content (full or range).
- `REQ-AMC-007` `editor.close` MCP tool accepts `{ path: string }` and closes the editor tab for that file.
- `REQ-AMC-008` `presentation.open` MCP tool accepts `{ name?: string, path?: string, newPane?: boolean }` and opens a presentation deck in a pane.
- `REQ-AMC-009` `presentation.navigate` MCP tool accepts `{ name?: string, slideIndex: number }` and navigates the active presentation to the specified slide.
- `REQ-AMC-010` Hub exposes `POST /commands` endpoint that accepts `{ type: string, payload: object }` and broadcasts via SSE as `PANE_COMMAND` events.
- `REQ-AMC-011` Client subscribes to Hub SSE `PANE_COMMAND` events and dispatches them to PaneContext actions.
- `REQ-AMC-012` The Hub `ACTIVE_MODALITIES` array is updated to include `'presentation'`.
- `REQ-AMC-013` All agent-modality MCP tools return structured success/error responses with actionable messages.
- `REQ-AMC-014` Pane commands that reference non-existent pane IDs return clear error messages rather than silent no-ops.

## 6. Non-Functional Requirements

| ID | Requirement | Target |
|---|---|---|
| NFR-PLT-001 | Deterministic behavior for same base version + same operations. | Stable replay outcomes |
| NFR-PLT-002 | Failure transparency with actionable errors. | No silent failure paths |
| NFR-PLT-003 | Security and path safety for all artifact operations. | No traversal escapes |
| NFR-PLT-004 | Bounded memory/cache strategy in each modality. | Documented limits |
| NFR-PLT-005 | Test coverage at unit, integration, and e2e levels per modality critical path. | Required for release |
| NFR-PLT-006 | Cross-modality payload determinism for repeated actions. | Stable payload identity |

## 7. Scope

### In Scope
- Consolidated active requirements for all modality tracks.
- Shared contracts for mutation, validation, events, context, and handoff.
- Modality MVP behavior and defined deferred expansion points.

### Out of Scope
- Reinstating legacy per-modality architecture docs.
- Canonical reliance on deprecated endpoint or process patterns.

## 8. Traceability Matrix

| Requirement Group | Verification Method |
|---|---|
| Platform mutation/validation/version contracts | Unit + integration contract tests |
| Context/event/handoff contracts | Integration tests + protocol assertions |
| Presentation/Editor/Diff/Comment/Annotation/Voice/Browser requirements | Modality unit/component tests + e2e workflows |
| Observability/loop safety/security requirements | Log assertions + resilience/safety tests |

## 9. Consolidation Note

All requirements from legacy modality guides were reviewed and merged into this baseline. Legacy docs are removed from active documentation to avoid conflicting guidance.

## 10. Legacy Coverage Checklist

This baseline explicitly covers requirement families from removed guides:

| Legacy Guide Family | Covered In |
|---|---|
| Presentation (`US/FR/NFR-PRES-*`) | Section 5.1 + Platform sections 3/4/6 |
| Editor (`US/FR/NFR-EDT-*`) | Section 5.2 + Platform sections 3/4/6 |
| Diff Review (`US/FR/NFR-DFR-*`) | Section 5.3 + Platform sections 3/4/6 |
| Comments (`US/FR/NFR-CMT-*`) | Section 5.4 + Platform sections 3/4/6 |
| Annotation (`US/FR/NFR-ANN-*`) | Section 5.5 + Platform sections 3/4/6 |
| Voice (`US/FR/NFR-VOI-*`) | Section 5.6 + Platform sections 3/4/6 |
| Browser Snapshot (`US/FR/NFR-BRP-*`) | Section 5.7 + Platform sections 3/4/6 |
| Multi-modality shared contracts | Platform sections 3/4/6 |

## 11. Implementation Backlog (Authoritative)

This is the active delivery backlog and tracking source. Work proceeds in this order.

Status values:
- `not_started`
- `in_progress`
- `blocked`
- `done`

| Backlog ID | Scope | Requirement IDs | Status | Exit Criteria |
|---|---|---|---|---|
| BLK-001 | Platform foundations | REQ-PLT-001..010 | done | Contracts implemented, validation enforced, tests green |
| BLK-002 | Presentation MVP | REQ-PRES-001..008 | not_started | Deck/slide ops, playback/export, tests green |
| BLK-003 | Editor/Viewer MVP | REQ-EDT-001..020 | done | Open/edit/save/view flows, command-surface baseline, appearance controls, agent reveal/highlight/link-navigation, restore/conflicts, tests green |
| BLK-004 | Diff Review MVP | REQ-DFR-001..010 | not_started | Diff load/render/select/handoff/jump-back flows, tests green (diff-editor handoff edge done in BLK-003) |
| BLK-005 | Comments MVP | REQ-CMT-001..006 | not_started | Durable threads + lifecycle + interop, tests green |
| BLK-006 | Annotation MVP | REQ-ANN-001..005 | not_started | Snapshot annotate/save/send + bridge compatibility, tests green |
| BLK-007 | Voice MVP | REQ-VOI-001..007 | done | Input/output/policy/interruption/streaming core, tests green |
| BLK-008 | Browser Snapshot MVP | REQ-BRP-001..005 | not_started | Clipboard intake + persistence + review launch, tests green |
| BLK-009 | Drawing V2 implementation | Drawing V2 reference + REQ-PLT-001..010 | in_progress | Canonical scene graph + patch pipeline + adapters + tests green |
| BLK-010 | Terminal-as-Pane content package | REQ-002 (REQ-2.2.2 terminal tab content, REQ-2.8.6 terminal surface model) + REQ-PLT-001..006 | not_started | Terminal opens only as pane content, no bottom-panel mode, session/project layout compatibility verified, tests green |
| BLK-011 | Agent-Modality Control (Tier 1) | REQ-PLT-011..017, REQ-AMC-001..014 | in_progress | Agent→Client command channel, pane.* tools, editor.* tools, presentation.open/navigate, hub ACTIVE_MODALITIES fix, unit+e2e tests green |

Completion rule:
- A backlog item can be marked `done` only if all mapped requirements are implemented and the relevant unit/integration/e2e tests from Section 8 pass.

Update protocol:
- Update this table immediately when status changes.
- Keep one primary backlog item `in_progress` at a time; a dependency track already underway may remain `in_progress` when explicitly noted.

Current status note:
- `BLK-001` is complete: platform contract gates and mapped validation checks are satisfied.
- `BLK-007` is complete: voice interface layer implementation merged with QA/CodeReview approval.
- `BLK-009` is in progress because drawing modality implementation has already started.
- `BLK-010` is queued next for terminal-surface consolidation into pane-only modality behavior.
- `BLK-011` is in progress: Agent-Modality Control Tier 1 — command channel, pane/editor/presentation MCP tools.

BLK-001 completion checklist (required before switching primary execution to BLK-002):
- Unified context contract implemented and consumed by runtime + MCP (`REQ-PLT-006`).
- Standard event payload shape emitted for update/apply/failure (`REQ-PLT-005`).
- Patch/operation validation gate enforced for agent mutation paths (`REQ-PLT-002`, `REQ-PLT-003`, `REQ-PLT-004`).
- Path normalization/workspace scoping enforced for all file-affecting platform paths (`REQ-PLT-008`).
- External I/O logging and loop safety baseline in place (`REQ-PLT-009`, `REQ-PLT-010`).
- Platform contract tests passing (unit + integration for the above).

Presentation fast-track rule:
- Once the first three checklist bullets above are complete and tested, `BLK-002` can become `in_progress` while remaining BLK-001 hardening tasks continue as supporting work.

## 12. Explicitly Disallowed Patterns

- Re-introducing per-modality active-context endpoint variants as canonical behavior.
- Re-introducing multiple architecture sources of truth.
- Bypassing validation or version checks for agent mutation paths.
- Silent fallback behavior that hides validation or mutation failures.

## 13. Risks and Mitigations (Multi-Perspective Audit)

| Perspective | Risk | Mitigation Requirement |
|---|---|---|
| User | Agent auto-focus can feel disruptive during active manual navigation. | `REQ-EDT-009` configurable policy and `REQ-EDT-010` Escape override provide immediate control.
| Security | Agent-guided file open/write could target unsafe paths or bypass guardrails. | Enforce `REQ-PLT-008` path normalization and `REQ-EDT-014` patch/operation-only write path.
| SRE/Operations | Frequent reveal/highlight events can create noisy, hard-to-debug interaction traces. | Emit deterministic events under existing `REQ-PLT-005`; include actor/modality/artifact/timestamp for auditability.
| Product Reliability | Dirty-tab agent edits can silently clobber user edits. | `REQ-EDT-012` preview-first non-destructive flow with explicit user choice.
| Accessibility/Usability | Transient highlights may be missed in rapid walkthroughs. | Keep minimum visible dwell for active step and allow jump-back via `REQ-EDT-015`.
