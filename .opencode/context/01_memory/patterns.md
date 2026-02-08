# Patterns

## Architectural Patterns
- NSO Hexagon Squad architecture.
- Two-tier documentation (System-wide vs Project-specific).
- Skills should be in global NSO (~/.config/opencode/nso/skills/) not project-specific.
- **Integration Pattern**: When integrating external skills:
  - Merge into existing skills rather than creating duplicates
  - Use clear, descriptive names (not code names like "Prometheus")
  - Update workflow documentation to reflect new skill names
  - Make user-initiated features explicit (not automatic)
- **Automatic Routing Pattern**: Router monitors every user message
  - Confidence threshold ≥20% activates workflow
  - Low confidence (<20%) = normal conversation
  - No explicit `/router` command needed

## Coding Standards
- TDD Mandatory (RED -> GREEN -> REFACTOR).
- Logical logging (LOG FIRST).
- Minimal diffs.

## Frontend/UI Patterns
- **Two-Zone Scrollable Layout**: When components at top and bottom of a container need independent scrolling:
  - Use flex container with `flex-col` on parent
  - Middle zone: `flex-1 min-h-0 overflow-y-auto` (allows shrinking and scrolling)
  - Bottom zone: `max-h-[Npx] overflow-y-auto` (constrained height with internal scroll)
  - Example: SessionSidebar (header fixed, sessions list scrollable, workspace manager constrained)
  - **Why**: Prevents UI overlap when bottom component blocks clickable elements in middle zone

## Testing Standards
- **E2E Tests (Playwright)**: Integration tests use REAL servers (Vite dev + API), not mocks
- **E2E Configuration**: Always run with `-c e2e/playwright.config.ts` flag (use `npm run test:e2e:existing`)
- **E2E Test Projects**: Use real project directories (e.g., `/Users/Shared/dev/dream-news`) instead of temporary workspaces
- **Validation Workflow**: Use `npm run check` (fast) for development, `npm run pre-pr` (comprehensive) before pushing

## Conventions
- Use CamelCase for interfaces.
- Use kebab-case for file names.
- Global NSO system is at ~/.config/opencode/nso/.
- Project-specific context is at ./.opencode/context/.
- **Skill Naming**: Use plain English descriptors (e.g., "requirement-elicitation" not "Prometheus")
- **Router Priority**: DEBUG > REVIEW > PLAN > BUILD (when multiple match)

## Gotchas
- NSO skills were duplicated between high-reliability-framework and global location.
- Migration completed 2026-02-08 to consolidate all NSO skills globally.
- **Integration Tip**: When adding multi-expert patterns, clearly define when to use debate vs. simple checklist.
- **User Control**: Archive/d documentation features should be user-initiated, not automatic.
- **Automatic Router**: If router confidence is borderline (20-30%), may need user confirmation
- **E2E Test Failures**: Running E2E tests without proper config flag (`-c e2e/playwright.config.ts`) causes "Cannot navigate to invalid URL" errors
- **UI Overlap**: Components at bottom of scrollable containers can block interactive elements - use constrained heights with internal scrolling
- **Test Cleanup**: E2E tests may create artifacts (worktrees, workspace dirs) with restrictive permissions requiring manual deletion

## Approved Practices
- Follow NSO instructions.md for all operations.
- When fixing NSO duplication: prefer global location, keep better versions.
- **Traceability Matrix**: Every requirement must have verification method (REQ-ID → test/command).
- **Multi-Expert Review**: Use for complex decisions; skip for straightforward implementations.
- **Conversation Archiving**: User must explicitly request; never automatic.
- **Router Monitoring**: Always run router_monitor.py before responding to user messages.
