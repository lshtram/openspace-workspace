# REQ-002 Rapid Alignment Check (User-Reported Follow-Ups)

Date: 2026-02-13
Owner: Analyst
Scope: Alignment of newly reported issues and requested behavior changes against REQ-002 and TECHSPEC-002.

## Verdict

BLOCK

Rationale: Items 1-6 are mostly represented in current REQ/TECHSPEC but need tighter acceptance wording for deterministic QA. Items 7-9 introduce new planning and UX contract scope that is not fully specified in canonical requirement/architecture artifacts.

## Coverage Matrix (Rapid)

1. Agent header legibility on black backgrounds: PARTIAL-COVERED (REQ-2.8.1, TECHSPEC 4.6/10) but missing explicit button contrast acceptance.
2. Agent floating corner artifacts: COVERED (REQ-2.8.2, TECHSPEC 9.1/10).
3. Pane separation single clean border line: COVERED (REQ-2.8.5, TECHSPEC 4.7/10).
4. Active pane clarity + header-click activation: COVERED (REQ-2.1.5, REQ-2.7.2, TECHSPEC acceptance).
5. Default active pane invariant + immediate Grab Pane docking in fresh session: PARTIAL-COVERED (REQ-2.8.4 + REQ-2.8.3) but missing explicit fresh-session docking scenario.
6. Multi-pane: select pane #2 header then Grab Pane docks in #2: IMPLIED-COVERED (dock-to-active behavior) but missing explicit scenario.
7. New work package for terminal-as-pane-content (next BLK-xxx): NOT-COVERED in authoritative backlog table.
8. Model selector popup above floating window: NOT-COVERED (no explicit overlay layering contract).
9. Manage models provider grouping + provider title + provider All/None toggles: PARTIAL-COVERED (parity reference exists) but missing explicit UX contract and acceptance checks.

## Required Updates

1. REQ-002: add explicit acceptance criterion for agent header controls (title + window buttons) contrast/readability over dark/black backgrounds.
2. REQ-002: add explicit scenario for fresh session default active pane where `Grab Pane` docks immediately without any prior pane click.
3. REQ-002: add explicit scenario for two-pane flow: activate pane #2 via header click, run `Grab Pane`, confirm docking in pane #2.
4. REQ-002 + TECHSPEC-002: add overlay layering contract for selector popups/dropdowns rendered from model selector so they appear above the floating agent window and remain interactive.
5. REQ-002 + TECHSPEC-002: add Manage Models UX contract: provider-grouped model list, provider heading display, provider-level `All`/`None` toggles, and persistence semantics.
6. REQ-MODALITY-PLATFORM-V2: add next backlog entry `BLK-010` for terminal-as-pane-content migration/follow-through, with mapped requirement IDs and exit criteria.

## Implementation Risks

1. Layering/z-index conflicts between floating agent shell and popup portals can create non-interactive dropdowns if ownership is not centralized.
2. Provider-level `All/None` toggles can drift from per-model state persistence if update semantics are not atomic.
3. Fresh-session active-pane defaults can regress under restore/save race conditions unless the existing restore-phase guard is reused.
4. Terminal-as-pane-content work package can overlap current pane-system scope unless BLK ownership boundaries are explicit.

## Builder Start Recommendation

Do Not Proceed

Proceed after the above REQ/TECHSPEC/backlog updates are merged so implementation and QA can validate against unambiguous acceptance criteria.
