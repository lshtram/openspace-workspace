---
id: QA-BLK-007-VOICE-2026-02-13
author: janitor_a3f1
status: COMPLETE
date: 2026-02-13
task_id: BLK-007-voice-options
---

# BLK-007 Voice QA Report

Skill selected: verification-gate; trigger: completion claims require fresh evidence.
Skill selected: router; trigger: workflow routing/precedence compliance.

## Checks Executed

1) runtime-hub typecheck/build
- Command: `npm run build`
- Result: PASS

2) runtime-hub voice test suite (targeted)
- Command: `node ./node_modules/vitest/vitest.mjs run src/interfaces/voice-events.test.ts src/interfaces/voice-fsm.test.ts src/interfaces/voice-narration.test.ts src/interfaces/voice-policy.test.ts src/services/voice-provider-selector.test.ts src/services/voice-orchestrator.test.ts src/hub-server.voice-api.test.ts`
- Result: PASS (`7/7` files, `41/41` tests)

3) openspace-client typecheck
- Command: `npm run typecheck`
- Result: PASS

4) openspace-client voice client unit tests
- Command: `npm run test:run -- src/services/voiceRuntimeClient.test.ts`
- Result: PASS (`1/1` file, `6/6` tests)

5) openspace-client lint (voice files only)
- Command: `npx eslint src/services/voiceRuntimeClient.ts src/services/voiceRuntimeClient.test.ts --format json`
- Result: PASS (0 errors, 0 warnings)

6) openspace-client repo-wide lint spot-check
- Command: `npm run lint -- --max-warnings=0 src/services/voiceRuntimeClient.ts src/services/voiceRuntimeClient.test.ts`
- Result: FAIL (unrelated baseline issue in `openspace-client/src/App.tsx`: missing rule `jsx-a11y/no-static-element-interactions`)

## Spec Compliance Findings

### CRITICAL
1) Invalid narration strategy is accepted instead of rejected
- Evidence:
  - `runtime-hub/src/hub-server.ts:245` casts arbitrary `requestedStrategy` string without enum validation.
  - `runtime-hub/src/interfaces/voice-narration.ts:39` returns any provided `requestedStrategy` for text.
  - Probe command returned `{"status":200,"strategy":"bogus"}` for `requestedStrategy: "bogus"`.
- Spec impact:
  - Violates finite contract expectations for narration strategy and validation-order requirements (`schema -> semantic -> policy`) in `docs/architecture/TECHSPEC-BLK-007-VOICE-MVP-2026-02-13.md:332`.

2) Locked decision DEC-VOI-004 timeline segmentation contract is not implemented
- Evidence:
  - No runtime fields for `startedAt`, `endedAt`, `interruptionCause` in voice runtime code (`grep` found none in `runtime-hub/src/*`).
  - `SpeechPlanSegment` only includes `segmentId/text/allowBargeIn/cueHints/priority` in `runtime-hub/src/services/voice-orchestrator.ts:58`.
- Spec impact:
  - Missing locked baseline fields from `docs/requirements/QUESTIONS-BLK-007-VOICE-DECISIONS-2026-02-13.md:19` and `docs/architecture/TECHSPEC-BLK-007-VOICE-MVP-2026-02-13.md:32`.

3) Locked decision DEC-VOI-005 bounded retries + `MIN_INTERVAL` + retry event semantics not implemented for voice path
- Evidence:
  - Voice orchestrator has no retry loop or `MIN_INTERVAL` usage in `runtime-hub/src/services/voice-orchestrator.ts`.
  - `STREAM_RETRY` exists as enum only (`runtime-hub/src/interfaces/voice-events.ts:12`) but is never emitted.
- Spec impact:
  - Conflicts with `docs/requirements/QUESTIONS-BLK-007-VOICE-DECISIONS-2026-02-13.md:19` and `docs/architecture/TECHSPEC-BLK-007-VOICE-MVP-2026-02-13.md:202`.

### HIGH
4) Requirement/spec mismatch on canonical voice artifact posture
- Evidence:
  - Platform techspec states voice canonical artifacts include transcript/audio metadata (`docs/architecture/TECHSPEC-MODALITY-PLATFORM-V2.md:134`).
  - BLK-007 techspec states no voice canonical artifact under `design/*` for MVP (`docs/architecture/TECHSPEC-BLK-007-VOICE-MVP-2026-02-13.md:128`).
- Risk:
  - Conflicting architecture source-of-truth can cause implementation drift and inconsistent acceptance criteria.

### MEDIUM
5) Missing tests for negative-path contract guards
- Missing test coverage observed for:
  - invalid `requestedStrategy` rejection path
  - timeline segmentation metadata emission/validation
  - retry exhaustion path (`STREAM_RETRY` progression before `STREAM_FAILED`)

## Verdict

```yaml
janitor_result:
  spec_compliance:
    verdict: FAIL
    requirements_checked: 7
    requirements_met: 4
    missing:
      - DEC-VOI-004 timeline segmentation metadata fields
      - DEC-VOI-005 retry/min-interval semantics
    incorrect:
      - requestedStrategy accepts out-of-contract values
  typecheck_status: PASS
  lint_status: PARTIAL_PASS
  test_status: PASS  # targeted changed-area suites
  tdd_compliance:
    test_files_exist: true
    coverage_adequate: false
    regression_tests: false
  recommendation: REJECT
  rejection_reasons:
    - Critical contract validation gap on requestedStrategy
    - Locked decision gaps for timeline segmentation and retry semantics
  notes: "Implementation is partially complete and testable, but does not meet approved BLK-007 locked decision set."
```

## Recommendation
- GO/NO-GO: **NO-GO** until CRITICAL findings are remediated and re-verified.
