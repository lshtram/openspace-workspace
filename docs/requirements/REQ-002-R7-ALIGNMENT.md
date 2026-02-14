# REQ-002 / TECHSPEC-002 R7 Alignment Report

Date: 2026-02-13
Owner: Analyst
Scope: BUILD Phase 1 alignment for new R7 deltas

## Alignment Verdict

BLOCK

R7 introduces behavior and UI-contract changes that are not fully represented in the current REQ/TECHSPEC baseline. Builder implementation should wait until REQ-002 and TECHSPEC-002 are updated to avoid divergent interpretation.

## Required REQ Updates

1. Add explicit agent header legibility requirement: header must preserve readability over any background using blur plus approximately 50% tint (with fallback tokens).
2. Update agent header title requirement: visible title text must be `Agent` with stronger emphasis (larger size and higher weight than current body text).
3. Add floating window visual integrity requirement: no corner/frame layering artifacts in expanded/full states.
4. Add input composer density requirement: reduce top and bottom margins around user input and simplify prompt region layout.
5. Strengthen active-pane invariant: there is always an active pane; default startup and recovery fallback select first leaf pane.
6. Replace terminal-mode requirements: remove top-bar terminal toggle and bottom terminal panel mode; terminal opens only as pane tab content.
7. Add layout preference requirement: user-selectable session layout semantics (`per-session` vs `per-project`) with persistence scope defined.
8. Add pane divider requirement: adjacent panes share one divider line; no double-border/gap visual seam.
9. Add architecture-document policy requirement reference: no addendum split for same feature scope; single canonical TECHSPEC.
10. Constrain agent selector population to top-level agents only; exclude sub-agent variants used for compaction/title/summary.
11. Constrain model selector to active models configured in settings and match OpenCode manage-models behavior (provider connect + model toggles).

## Required TECHSPEC Updates

1. Merge `docs/architecture/TECHSPEC-002-AGENT-PANE-CONTROL-ADDENDUM.md` into `docs/architecture/TECHSPEC-002-PANE-SYSTEM-FLOATING-AGENT.md`, then retire the addendum file.
2. Update App shell architecture to remove bottom terminal panel and related layout flags (`terminalExpanded`, `terminalHeight`) from canonical layout model.
3. Define CSS/token contract for agent header legibility (backdrop blur + tint opacity target, fallback for no-backdrop support).
4. Define header typography spec for `Agent` label (size/weight/line-height tokens) and acceptance checks.
5. Define layering/focus ring/frame composition rules for floating window corners to eliminate border overlap artifacts.
6. Update pane invariants and normalization logic: `activePaneId` required; fallback resolver to first valid leaf on restore/mutation.
7. Extend persistence schema with layout preference mode (`per-session` or `per-project`) plus migration for existing session metadata.
8. Add rendering rules for single divider seams across recursive pane splits (ownership of border drawn by one side only).
9. Specify agent selector filtering algorithm for top-level agents only (source field and exclusion criteria).
10. Specify model selector data source and filtering: only enabled models from settings; include provider-connect and manage-model toggles parity behavior.
11. Update acceptance criteria and test matrix to include all R7 deltas, including negative checks (no terminal bottom panel, no sub-agents in selector).

## Implementation Risks (P0)

1. Schema migration risk for layout preference and active-pane invariant may break restoration for older sessions.
2. Terminal mode removal can regress existing keyboard/toolbar paths and user muscle memory without clear migration UX.
3. Selector-filtering risk: inconsistent metadata may accidentally hide required agents/models or leak internal sub-agents.
4. Visual-composition risk: blur/tint and corner-layer fixes can vary across browsers and require robust fallback styling.
5. Divider ownership in nested splits can regress into double lines during dynamic split/close operations unless enforced centrally.

## Builder Start Recommendation

Do Not Proceed

Proceed only after REQ-002 and TECHSPEC-002 are revised to include R7 and addendum merge policy is recorded in `NSO-IMPROVEMENTS.md`.
