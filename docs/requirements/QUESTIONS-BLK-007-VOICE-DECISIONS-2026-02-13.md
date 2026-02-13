---
id: QUESTIONS-BLK-007-VOICE-DECISIONS-2026-02-13
author: oracle_3f8c
status: FINAL
date: 2026-02-13
task_id: BLK-007-voice-options
workflow: PLAN
---

# BLK-007 Voice MVP Decision Set (Options + Recommendation)

## Final Selections (User Approved)

- Decision 1: **C** (both `edit-before-send` and `automatic-send`, session-configurable)
- Decision 2: **B** (`on-demand` default; user can change at any time)
- Decision 3: **C** (device + language fallback chain)
- Decision 4: **A** (barge-in enabled by default, easy toggle off)
- Decision 5: **B** (structured timeline segmentation baseline)
- Decision 6: **B** (bounded retries + shared `MIN_INTERVAL` + explicit failure events)
- Decision 7: **B** (explicit finite-state machine)

## Decision 1 - Transcript Send Policy (`REQ-VOI-002`)

Question: What send policy modes should be included in MVP, and what should the default be?

Options:
- A) `edit-before-send` only
- B) `automatic-send` only
- C) Both modes (`edit-before-send` and `automatic-send`), session-configurable

Recommendation:
- **C**, with default = `edit-before-send`

Rationale:
- Matches user clarification and preserves safety-first review flow while still enabling fast hands-free sessions.

## Decision 2 - Voice Output Policy Default (`REQ-VOI-004`)

Question: What should be the default output policy mode for MVP?

Options:
- A) `off`
- B) `on-demand`
- C) `on-completion`
- D) `on-error`
- E) `always`

Recommendation:
- **B (`on-demand`)**

Rationale:
- Matches user preference for explicit control while preserving immediate policy switching.

## Decision 3 - Device/Language Fallback Rule (`REQ-VOI-005`)

Question: What fallback hierarchy should be enforced when requested device/language is unavailable?

Options:
- A) Strict fail immediately (no fallback)
- B) Device fallback only, language strict
- C) Device + language fallback chain

Recommendation:
- **C**
  - Device: requested -> system default -> fail with actionable error
  - Language: requested -> app default locale -> `en-US`

Rationale:
- Maximizes success rate while preserving deterministic and observable behavior.

## Decision 4 - Barge-In Default (`REQ-VOI-006`)

Question: Should barge-in be enabled by default for active voice sessions?

Options:
- A) Enabled by default
- B) Disabled by default
- C) Enabled only for specific output policy modes

Recommendation:
- **A**, with per-session toggle

Rationale:
- Better conversational UX; toggle preserves user control.

## Decision 5 - Timeline Segmentation Contract (`REQ-VOI-006`)

Question: What minimum fields are required for interruption/segment metadata?

Options:
- A) Minimal (`segmentId`, `timestamp`)
- B) Structured baseline (`segmentId`, `startedAt`, `endedAt`, `interruptionCause`, `actor`)
- C) Extended telemetry-heavy schema

Recommendation:
- **B**

Rationale:
- Sufficient for debugging, auditability, and deterministic replay without overfitting MVP.

## Decision 6 - Streaming Transport Semantics (`REQ-VOI-007`)

Question: How strict should MVP streaming/retry semantics be?

Options:
- A) Best effort, implementation-defined retries
- B) Bounded retries using shared `MIN_INTERVAL` with explicit failure events
- C) Exactly-once delivery semantics

Recommendation:
- **B**

Rationale:
- Aligns with `REQ-PLT-010` and existing platform reliability constraints; realistic for MVP.

## Decision 7 - Canonical Voice Lifecycle State Machine (`REQ-VOI-001/002/003`)

Question: What lifecycle contract should be required before implementation?

Options:
- A) Informal status flags only
- B) Explicit finite-state machine for input/transcript/output with allowed transitions
- C) Full BPMN/workflow model

Recommendation:
- **B**

Rationale:
- Prevents divergence across runtime/client/tests and provides a stable verification target.

## BLK-001 Dependency Note (Why Voice Still Depends on It)

BLK-007 is orthogonal in feature domain, but not independent from platform contracts. Voice still depends on:
- Patch/validation/version contracts (`REQ-PLT-002..004`)
- Canonical events/context (`REQ-PLT-005..007`)
- Path safety and observability (`REQ-PLT-008..010`)

This is not technical debt framing; it is dependency-gate framing from canonical requirements and backlog rules.
