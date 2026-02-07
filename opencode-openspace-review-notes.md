# OpenSpace Client Review Notes (Beyond Parity Doc)

**Scope**
Notes collected during review of OpenSpace client parity and Phase 0 readiness, excluding items already captured in `opencode-openspace-feature-parity_v2.md`.

**Parity Doc Corrections**
- `Status (Servers) → Multi-server list + health` is implemented in `/Users/Shared/dev/openspace/openspace-client/src/components/StatusPopover.tsx` and `/Users/Shared/dev/openspace/openspace-client/src/components/DialogManageServers.tsx` and should be marked ✅.
- `Status (Servers) → Default server management` is implemented in `/Users/Shared/dev/openspace/openspace-client/src/context/ServerContext.tsx` and `/Users/Shared/dev/openspace/openspace-client/src/components/DialogManageServers.tsx` and should be marked ✅.

**Code Findings (Review)**
- Project switch keeps old session ID: `handleSelectProject` updates the directory but does not clear or validate `activeSessionId`, which can cause message queries and prompts to run against the wrong directory. File: `/Users/Shared/dev/openspace/openspace-client/src/App.tsx`.
- `removeServer` uses stale state for fallback: active/default server selection can use an outdated `servers`/`defaultUrl` closure, which can select removed servers. File: `/Users/Shared/dev/openspace/openspace-client/src/context/ServerContext.tsx`.
- “Load more” is a dead action: UI renders a button but pagination is not implemented and handler is a no‑op. File: `/Users/Shared/dev/openspace/openspace-client/src/components/sidebar/SessionSidebar.tsx`.

**Phase 0 Test Coverage Status**
- Existing tests already cover core Phase 0 areas:
- Session SSE handling baseline in `/Users/Shared/dev/openspace/openspace-client/src/hooks/useSessionEvents.test.tsx` (subscribe, message.updated, message.removed).
- API connection handling in `/Users/Shared/dev/openspace/openspace-client/src/services/OpenCodeClient.test.ts` (success/failure, error logging, integration check).
- Hooks for sessions, file status, LSP, provider auth, and path in `/Users/Shared/dev/openspace/openspace-client/src/hooks/useAdditionalHooks.test.tsx`.

**Phase 0 Gaps Found**
- SSE reconnect/backoff behavior is not explicitly asserted in tests. The hook implements backoff but there is no test confirming retry timing or behavior after an error.
- Error surfacing via UI toast is not asserted. `pushToastOnce` is used but test coverage does not confirm it triggers on stream errors.
- Session SSE stream drop and reconnect across multiple failures is not simulated in tests.

**Blockers Observed While Attempting to Add Coverage**
- Permission denied when writing to `/Users/Shared/dev/openspace/openspace-client/src/hooks/useSessionEvents.test.tsx` and `/Users/Shared/dev/openspace/openspace-client/src/services/OpenCodeClient.test.ts`. These files are owned by a different user and require ownership/permission change before edits can be made.

**Test Execution Status**
- Tests have not been run in this review. I cannot claim they pass without executing them.

**Suggested Next Steps**
- Update the parity doc to mark the server management items as ✅.
- Adjust file ownership/permissions for the test files above so Phase 0 coverage can be expanded.
- Add tests for SSE retry/backoff and toast behavior in `useSessionEvents` and re-run `npm test` (or `npm run test:run`) to confirm Phase 0 stability.
