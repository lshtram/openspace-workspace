---
id: REVIEW-BLK-007-VOICE-REQUIREMENTS-2026-02-13
author: analyst_{{agent_id}}
status: FINAL
date: 2026-02-13
task_id: BLK-007-voice-options
workflow: PLAN
---

# BLK-007 Voice MVP Requirements Consolidation and Clarity Audit

## 1) Evidence Scope and Canonical Sources

Reviewed repository artifacts:
- `docs/requirements/REQ-MODALITY-PLATFORM-V2.md` (active canonical requirements per `docs/requirements/INDEX.md`)
- `docs/requirements/PLAN-BLK-001-AND-BLK-009-ADOPTION.md` (platform dependency and readiness plan)
- `docs/requirements/INDEX.md` (active requirements policy)
- `.opencode/context/active_tasks/BLK-007-voice-options/contract.md` (task contract)
- `docs/architecture/TECHSPEC-MODALITY-PLATFORM-V2.md` (execution order and verification strategy context)
- `runtime-hub/package.json` and `openspace-client/package.json` (available verification commands)

Non-canonical/inactive requirement artifacts identified but not used as authoritative requirement source:
- `docs/requirements/REQ-002-window-pane-management.md` (DRAFT)
- `docs/requirements/REQ-DRAWING-FIX.md` (legacy/superseded style)

## 2) Consolidated Requirement Inventory (BLK-007)

### 2.1 Functional Requirements (Voice-specific)

Source: `REQ-MODALITY-PLATFORM-V2.md` Section 5.6

| ID | Requirement | Category | Clarity Snapshot |
|---|---|---|---|
| REQ-VOI-001 | Input lifecycle includes start/stop/interrupt plus status model. | Functional | Partial |
| REQ-VOI-002 | Transcript lifecycle includes interim/final/edit-before-send. | Functional | Partial |
| REQ-VOI-003 | Output lifecycle includes speak/enqueue/pause/resume/interrupt. | Functional | Partial |
| REQ-VOI-004 | Output policy modes: off/on-demand/on-completion/on-error/always. | Functional | Partial |
| REQ-VOI-005 | Device/language configuration with fallback behavior. | Functional | Low |
| REQ-VOI-006 | Optional user barge-in and agent interruption with timeline segmentation metadata. | Functional | Low |
| REQ-VOI-007 | Streaming transport for input chunks and incremental TTS playback. | Functional | Partial |

### 2.2 Platform Integration Requirements Required by BLK-007

Source: `REQ-MODALITY-PLATFORM-V2.md` Sections 4 and 6

| ID | Requirement | BLK-007 Relevance |
|---|---|---|
| REQ-PLT-001 | Canonical artifact model first. | Voice artifacts must be canonical source, not UI-only state.
| REQ-PLT-002 | Agent mutations are patch/operation based. | Voice artifact updates must not use blind rewrites.
| REQ-PLT-003 | Schema/semantic/policy validation before apply. | Voice lifecycle events and artifacts require validation gates.
| REQ-PLT-004 | Atomic and versioned apply operations. | Voice transcript/audio metadata updates require deterministic versioning.
| REQ-PLT-005 | Update/apply/failure events with modality/artifact/actor/timestamp. | Voice streaming and lifecycle state transitions require canonical events.
| REQ-PLT-006 | Unified active context contract. | Voice UI/runtime interactions must use canonical context endpoint.
| REQ-PLT-007 | Cross-modality handoff payload contract. | Voice transcript handoff to other modalities must be deterministic.
| REQ-PLT-008 | Path normalization and workspace scoping. | Voice audio/transcript persistence paths must be safe.
| REQ-PLT-009 | External I/O start/success/failure logs with ISO timestamps. | Audio I/O and streaming I/O must be observable.
| REQ-PLT-010 | Shared MIN_INTERVAL for polling/retry loops. | Streaming retry/poll behavior must be bounded and consistent.

### 2.3 Non-Functional Requirements Applicable to BLK-007

Source: `REQ-MODALITY-PLATFORM-V2.md` Section 6

| ID | Requirement | BLK-007 Application |
|---|---|---|
| NFR-PLT-001 | Deterministic behavior for same base version + same ops. | Deterministic transcript/audio metadata mutation results.
| NFR-PLT-002 | Failure transparency with actionable errors. | Voice capture/stream/policy failures must be explicit.
| NFR-PLT-003 | Security and path safety for artifact operations. | Audio/transcript file handling constrained to workspace.
| NFR-PLT-004 | Bounded memory/cache strategy by modality. | Streaming buffers/queues need defined limits.
| NFR-PLT-005 | Unit + integration + e2e coverage for critical path. | Required release gate for Voice MVP.
| NFR-PLT-006 | Cross-modality payload determinism. | Voice handoff payloads must be stable for repeated actions.

### 2.4 Validation and Delivery Gate Requirements

Sources: `REQ-MODALITY-PLATFORM-V2.md` Sections 8 and 11

| Requirement Gate | Evidence in Requirements |
|---|---|
| BLK-007 status and exit criteria | BLK-007 mapped to REQ-VOI-001..007; exit requires core implementation and tests green.
| Completion rule | Backlog item can be `done` only if mapped requirements are implemented and relevant Section 8 tests pass.
| Test shape | Voice included in modality unit/component tests and e2e workflows.

## 3) Requirement-by-Requirement Clarity Assessment (Voice)

Scale:
- High: implementable with low interpretation risk.
- Partial: mostly clear but key behavior still needs explicit decision.
- Low: materially ambiguous; implementation choices can diverge.

| ID | Assessment | Evidence-Based Gap |
|---|---|---|
| REQ-VOI-001 | Partial | Required states/actions are named, but canonical status state machine (exact states/transitions) is unspecified.
| REQ-VOI-002 | Partial | Interim/final/edit-before-send is defined, but finalization trigger and edit constraints are unspecified.
| REQ-VOI-003 | Partial | Lifecycle verbs are listed, but queue ordering/priority and overlap behavior are unspecified.
| REQ-VOI-004 | Partial | Policy modes are enumerated, but default mode and scope (global vs session vs request) are unspecified.
| REQ-VOI-005 | Low | Fallback behavior is required but fallback order/rules are not specified.
| REQ-VOI-006 | Low | Requirement says optional barge-in/interruption, but default enabled state and timeline segmentation contract details are unspecified.
| REQ-VOI-007 | Partial | Streaming is required, but transport/protocol guarantees and retry semantics are unspecified.

## 4) Traceability Matrix (Requirement ID -> Verification Command/Test Type)

Note: matrix maps to repository-visible test categories in requirements/spec docs and available command entrypoints in package scripts.

| Requirement ID | Verification Type | Verification Command (repo artifact) |
|---|---|---|
| REQ-VOI-001 | Unit + component + e2e lifecycle workflow | `cd runtime-hub && npm test`; `cd openspace-client && npm run test:run`; `cd openspace-client && npm run test:e2e:existing`
| REQ-VOI-002 | Unit + component + e2e transcript edit/send workflow | `cd openspace-client && npm run test:run`; `cd openspace-client && npm run test:e2e:existing`
| REQ-VOI-003 | Unit + integration + e2e output queue/control workflow | `cd runtime-hub && npm test`; `cd openspace-client && npm run test:run`; `cd openspace-client && npm run test:e2e:existing`
| REQ-VOI-004 | Unit policy-mode tests + integration policy enforcement tests | `cd runtime-hub && npm test`; `cd openspace-client && npm run test:run`
| REQ-VOI-005 | Unit fallback resolution tests + integration device/lang config path | `cd runtime-hub && npm test`; `cd openspace-client && npm run test:run`
| REQ-VOI-006 | Integration interruption sequencing + e2e barge-in workflow | `cd runtime-hub && npm test`; `cd openspace-client && npm run test:e2e:existing`
| REQ-VOI-007 | Integration streaming transport tests + e2e streaming interaction | `cd runtime-hub && npm test`; `cd openspace-client && npm run test:e2e:existing`
| REQ-PLT-002..004 | Contract tests for patch/validation/version gate | `cd runtime-hub && npm test`
| REQ-PLT-005..007 | Integration tests for event/context/handoff contracts | `cd runtime-hub && npm test`; `cd openspace-client && npm run test:run`
| REQ-PLT-008..010 | Safety/resilience/logging tests | `cd runtime-hub && npm test`
| NFR-PLT-005 | Full modality critical path coverage | `cd runtime-hub && npm test`; `cd openspace-client && npm run test:run`; `cd openspace-client && npm run test:e2e:existing`

## 5) Dependency and Readiness Analysis (Preconditions for Clean BLK-007 Start)

### 5.1 Hard Preconditions from Canonical Requirements/Plans

1. BLK-001 foundations are still `in_progress` and contain required platform contracts (`REQ-PLT-001..010`).
2. BLK-007 depends on those contracts being implemented and test-gated because Voice requirements inherit platform mutation/validation/events/context/path-safety constraints.
3. BLK-007 cannot be marked `done` until REQ-VOI-001..007 are implemented and Section 8 verification levels are green.

### 5.2 Sequencing Readiness

- `TECHSPEC-MODALITY-PLATFORM-V2.md` execution order places Voice at step 7 (after Annotation).
- `REQ-MODALITY-PLATFORM-V2.md` backlog status marks BLK-007 `not_started`; BLK-001 and BLK-009 are currently `in_progress`.

### 5.3 Readiness Conclusion

Readiness is **conditional**. BLK-007 can start cleanly only after platform contract gates needed by Voice are complete and verified (especially patch/validation/version/event/context/path safety). Current backlog evidence indicates those dependencies are not yet marked complete.

## 6) Ambiguities / Open Decisions and Recommended Defaults

Only repository-evidenced ambiguities are listed below.

| Decision ID | Related Requirement | Open Question | Recommended Default |
|---|---|---|---|
| DEC-VOI-000 | REQ-VOI-002 | What transcript send policy modes are supported for MVP? | Support two explicit modes: `edit-before-send` and `automatic-send`, configurable per session (default: `edit-before-send`). |
| DEC-VOI-001 | REQ-VOI-004 | What is default voice output policy mode for MVP? | `on-demand` default; user can change mode at any time.
| DEC-VOI-002 | REQ-VOI-005 | What exact fallback hierarchy is required for device/language selection? | Device: requested -> system default -> fail with actionable error; Language: requested -> app default locale -> `en-US`.
| DEC-VOI-003 | REQ-VOI-006 | Is barge-in enabled by default in MVP? | Enabled by default for active voice sessions; user toggle exposed.
| DEC-VOI-004 | REQ-VOI-006 | What timeline segmentation minimum contract is required? | Segment events include `segmentId`, `startedAt`, `endedAt`, `interruptionCause`, `actor`.
| DEC-VOI-005 | REQ-VOI-007 | What transport/retry semantics define streaming compliance for MVP? | Streaming over current runtime channel with bounded retries honoring `REQ-PLT-010` shared `MIN_INTERVAL`.
| DEC-VOI-006 | REQ-VOI-001/002/003 | What canonical state machine is required across input/transcript/output lifecycle? | Publish explicit finite-state model before implementation (input, transcript, output states + allowed transitions).

### User Clarification Logged (2026-02-13)

- User clarified REQ-VOI-002 should be represented as a policy setting with two explicit modes:
  - `edit-before-send`
  - `automatic-send`
- This clarification resolves transcript send behavior ambiguity at policy level; only default selection remains to be confirmed for final lock.

### Decision Lock (2026-02-13)

- User selected the following final options:
  - `DEC-VOI-000`: both transcript modes with session configurability.
  - `DEC-VOI-001`: default output policy = `on-demand`.
  - `DEC-VOI-002`: fallback chain for device/language.
  - `DEC-VOI-003`: barge-in enabled by default (user-toggleable).
  - `DEC-VOI-004`: structured timeline segmentation baseline.
  - `DEC-VOI-005`: bounded retries with shared `MIN_INTERVAL`.
  - `DEC-VOI-006`: explicit finite-state machine requirement.

### Additional Scope Clarification (2026-02-13)

- Voice output is not strict 1:1 text-to-speech. Output must support modality-aware narration transforms:
  - long text -> summary-first narration,
  - code blocks -> concise descriptor (not full readout by default),
  - diagrams/visuals -> explanatory narration template.
- Voice should support non-lexical human sounds (e.g., laughter and other emotional cues) under explicit policy controls.
- Architecture must define a framework-level abstraction so narration models can evolve independently.

## 7) Final Verdict

`clear_to_build`

Rationale:
- BLK-007 has a clear requirement envelope and canonical IDs.
- Voice decision set is resolved and mapped to explicit policy defaults.
- Remaining work is architecture and implementation execution, not requirement ambiguity closure.
