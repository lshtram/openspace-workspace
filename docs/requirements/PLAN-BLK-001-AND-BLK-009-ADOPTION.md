---
id: PLAN-BLK-001-AND-BLK-009-ADOPTION
author: oracle_7c4a
status: APPROVED
date: 2026-02-12
---

# Execution Plan: BLK-001 Foundations and BLK-009 Drawing Adoption

## 1) BLK-001 Platform Foundations

Scope: `REQ-PLT-001..010`

### Phase 1: Shared Contract Types (Interface-First)

- Add shared platform interfaces in runtime:
  - `ActiveContext` (unified modality + artifact + optional location)
  - `PlatformEvent` (`ARTIFACT_UPDATED | PATCH_APPLIED | VALIDATION_FAILED`)
  - `PatchRequestEnvelope` (includes `baseVersion`, `actor`, `intent`, `ops`)
  - `ValidationErrorEnvelope` (`code`, `location`, `reason`, `remediation`)
- Refactor drawing/runtime types to consume shared contracts.

Definition of done:
- Runtime and MCP compile using shared contract types.
- No ad hoc context/event payload types remain in modified code paths.

### Phase 2: Unified Context Contract

- Runtime (`runtime-hub/src/hub-server.ts`):
  - Canonical context endpoint: `/context/active`
  - Validate payload strictly and return structured errors.
  - Keep `/context/active-whiteboard` as temporary compatibility alias with deprecation warning only.
- Client (`openspace-client/src/components/whiteboard/WhiteboardFrame.tsx`):
  - Switch active context write from `/context/active-whiteboard` to `/context/active`.

Definition of done:
- Active context set/get works through canonical endpoint.
- Legacy endpoint is optional compatibility only.

### Phase 3: Event Contract Normalization

- Runtime:
  - Emit canonical event envelope fields (`modality`, `artifact`, `actor`, `timestamp`, optional `version`).
  - Keep compatibility mapping for legacy event consumers only during migration.
- Client hook (`openspace-client/src/hooks/useArtifact.ts`):
  - Parse canonical event payloads.
  - Maintain temporary fallback for legacy shape.

Definition of done:
- Remote updates are processed from canonical event shape.
- Event handling tests cover canonical payloads.

### Phase 4: Patch Validation and Version Gate

- Runtime patch paths (`runtime-hub/src/hub-server.ts`, `runtime-hub/src/services/PatchEngine.ts`):
  - Require patch envelope with `baseVersion`.
  - Enforce schema validation before operation apply.
  - Enforce semantic/policy validation before write.
  - Reject with structured validation errors.
  - Increment version on successful apply.

Definition of done:
- Invalid patch requests return actionable validation errors.
- Same `baseVersion` + same ops produce deterministic results.

### Phase 5: Path Safety and Endpoint Consistency

- Use `/files` as canonical read/write endpoint for new code.
- Keep `/artifacts` only as temporary alias with deprecation warning.
- MCP (`runtime-hub/src/mcp/modality-mcp.ts`) updates helper calls to `/files`.
- Ensure workspace path normalization checks are enforced everywhere.

Definition of done:
- No new runtime/MCP writes use deprecated route.
- Path traversal attempts are rejected in tests.

### Phase 6: Observability and Loop Safety Baseline

- Add explicit start/success/failure logs for external I/O in:
  - `runtime-hub/src/hub-server.ts`
  - `runtime-hub/src/mcp/modality-mcp.ts`
  - `runtime-hub/src/services/ArtifactStore.ts`
  - `runtime-hub/src/services/PatchEngine.ts` (where I/O or external calls apply)
- Enforce shared `MIN_INTERVAL` for polling/retry loops.

Definition of done:
- External I/O paths emit timestamped lifecycle logs.
- No retry/poll loop bypasses `MIN_INTERVAL`.

### Phase 7: BLK-001 Test Gate

- Runtime tests:
  - context contract validation
  - canonical event payload checks
  - patch validation/version conflict cases
  - path safety rejection cases
- Client tests:
  - canonical event parsing in `useArtifact`
  - context endpoint migration behavior
- Integration test:
  - patch apply -> event emit -> client refresh path.

Definition of done:
- All BLK-001 mapped tests pass.
- `REQ-PLT-001..010` traceability is satisfied.

## 2) BLK-009 Drawing Adoption After BLK-001

Scope: Drawing implementation alignment to completed platform contracts.

### Adoption A: Drawing MCP Contract Upgrade

- Replace stub-like drawing behavior in `runtime-hub/src/mcp/modality-mcp.ts`:
  - `drawing.inspect_scene` returns canonical envelope (artifact + version + scene summary).
  - `drawing.propose_patch` performs deterministic pre-validation and returns proposal metadata.
  - `drawing.apply_patch` enforces proposal/baseVersion checks and returns apply result envelope.

Definition of done:
- Drawing MCP tools match platform contract style and error envelopes.

### Adoption B: Drawing Client Context and Event Upgrade

- Update drawing client to canonical context endpoint usage.
- Ensure drawing refresh paths rely on canonical events.
- Remove dependency on deprecated whiteboard-specific context path.

Definition of done:
- Drawing updates flow correctly with canonical context/events only.

### Adoption C: Canonical Artifact Completion

- Ensure `design/<name>.diagram.json` is treated as source of truth.
- Keep Mermaid/PlantUML as adapters/projections.
- Existing `.graph.mmd`/`.excalidraw` paths remain only as explicit compatibility import/export modes.

Definition of done:
- Source-of-truth writes target canonical scene graph artifacts.

### Adoption D: Drawing Validation Hardening

- Enforce graph integrity and diagram-family semantic checks.
- Emit `VALIDATION_FAILED` with actionable details.
- Reject unsupported constructs explicitly.

Definition of done:
- Drawing patch failures are explicit, actionable, and deterministic.

### Adoption E: Drawing Test Hardening

- Unit tests for operation engine behavior and validators.
- MCP contract tests for drawing tool payloads.
- Client tests for remote patch refresh and context behavior.
- E2E: user edit and agent patch flows with no manual reload.

Definition of done:
- Drawing adoption test suite passes at unit/integration/e2e levels.

## 3) Transition Rule for Presentation Work

Presentation (`BLK-002`) can become primary `in_progress` when these BLK-001 gates are complete and tested:

- Unified context contract in runtime + MCP
- Canonical event payload support in runtime + client
- Patch validation/version gate for agent mutation paths

Remaining BLK-001 hardening tasks may continue as secondary work after those gates are complete.
