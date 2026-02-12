---
id: HANDOFF-DIFF-REVIEW-MODALITY-2026-02-12
author: oracle_9d3a
status: FINAL
date: 2026-02-12
task_id: diff-review-modality-next-session
---

# Next Session Starter - Diff/Review as Multi-Modal Modality

## Objective
Implement Diff/Review as a first-class modality integrated into the existing multi-modal engine (Hub + unified `modality-mcp`), not as a direct one-to-one copy of opencode implementation details.

## Context Snapshot
- Team A parity tasks 202/203/204 are merged to `master`.
- Drawing Modality V2 Phase 0 is complete.
- Largest remaining parity gap is Diff/Review capability.

## Required Direction
1. Keep architectural alignment with Spine Lite / Hub + namespaced MCP approach.
2. Define review artifacts and events as modality-native contracts.
3. Reuse existing UI and state patterns where possible (`useArtifact` and message/tool renderer registry), but do not force opencode-specific internal patterns.

## Suggested First Tasks (Oracle Workflow)
1. Create REQ document for Diff/Review modality under `docs/requirements/`.
2. Create TECHSPEC under `docs/architecture/` with:
   - artifact model,
   - event model,
   - MCP namespace and tool contracts,
   - UI integration points.
3. Gate for approval before Builder implementation.

## Design Constraints
- Interface-first contracts for review artifacts and MCP tools.
- Defensive guards at public entry points.
- Explicit start/success/failure logs on external I/O.
- Retry/poll loops must use shared `MIN_INTERVAL` in success and failure paths.

## Initial Scope Recommendation
- P0: Review panel shell + artifact loading + read-only diff rendering for changed files.
- P1: Inline file/line navigation and session binding.
- P2: Review comments/actions and advanced diff options.
