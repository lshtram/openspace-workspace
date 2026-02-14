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

#### Functional Requirements
- `REQ-EDT-001` Text/code/markdown/config files supported for MVP.
- `REQ-EDT-002` Deterministic tab identity via normalized path.
- `REQ-EDT-003` Save path goes through validated mutation pipeline.
- `REQ-EDT-004` Viewer registry supports extensible viewer adapters.
- `REQ-EDT-005` External open hook: `openFileAt(path, selection?)`.
- `REQ-EDT-006` Keyboard save/close/switch shortcuts.

### 5.3 Diff Review

#### User Stories
- `US-DFR-001` Open session review with changed files.
- `US-DFR-002` Toggle unified/split view.
- `US-DFR-003` Select line ranges and create comments.
- `US-DFR-004` Open reviewed file in editor at target location.
- `US-DFR-005` Restore review state when navigating away and back.
- `US-DFR-006` Handle binary diffs safely with previews/placeholders.

#### Functional Requirements
- `REQ-DFR-001` Diff source contract includes status/additions/deletions and before/after content references.
- `REQ-DFR-002` File accordion model with expand/collapse all.
- `REQ-DFR-003` Renderer abstraction supports selection and comment highlighting.
- `REQ-DFR-004` Range model supports normalized start/end and side metadata.
- `REQ-DFR-005` Comment handoff payload includes deterministic range metadata.
- `REQ-DFR-006` Focus/scroll contract opens collapsed target and scrolls to anchor.
- `REQ-DFR-007` Review state persistence for style/open-files/scroll/focus.

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
| BLK-003 | Editor/Viewer MVP | REQ-EDT-001..006 | not_started | Open/edit/save/view flows, restore/conflicts, tests green |
| BLK-004 | Diff Review MVP | REQ-DFR-001..007 | not_started | Diff load/render/select/handoff flows, tests green |
| BLK-005 | Comments MVP | REQ-CMT-001..006 | not_started | Durable threads + lifecycle + interop, tests green |
| BLK-006 | Annotation MVP | REQ-ANN-001..005 | not_started | Snapshot annotate/save/send + bridge compatibility, tests green |
| BLK-007 | Voice MVP | REQ-VOI-001..007 | done | Input/output/policy/interruption/streaming core, tests green |
| BLK-008 | Browser Snapshot MVP | REQ-BRP-001..005 | not_started | Clipboard intake + persistence + review launch, tests green |
| BLK-009 | Drawing V2 implementation | Drawing V2 reference + REQ-PLT-001..010 | in_progress | Canonical scene graph + patch pipeline + adapters + tests green |
| BLK-010 | Terminal-as-Pane content package | REQ-002 (REQ-2.2.2 terminal tab content, REQ-2.8.6 terminal surface model) + REQ-PLT-001..006 | not_started | Terminal opens only as pane content, no bottom-panel mode, session/project layout compatibility verified, tests green |

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
