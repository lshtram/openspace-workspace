# Requirements Index

## Canonical

- **`REQ-MODALITY-PLATFORM-V2.md`** - OpenSpace Modality Platform V2 (extensible space system)
  - Status: ACTIVE
  - Cross-references: TECHSPEC-MODALITY-PLATFORM-V2.md, HUB-MCP-ARCHITECTURE.md

## Active Requirements

- **`REQ-001-UI-DESIGN-SYSTEM-OBSIDIAN-HYBRID.md`** - UI/UX Design System
- **`REQ-002-window-pane-management.md`** - Pane System with Floating Agent (includes R7 refinements)
- **`REQ-DRAWING-FIX.md`** - Drawing/Whiteboard fixes
- **`REQ-FILE-BUGS.md`** - File system bug fixes
- **`REQ-PRESENTATION-BUGFIX.md`** - Presentation mode bug fixes
- **`REQ-SLIDE-RENDERING-FIX.md`** - Slide rendering improvements
- **`REQ-TERMINAL-BUGFIX.md`** - Terminal fixes

## Archived

Archived requirements and resolved blocking fixes are located in:
- **`/docs/archive/blocking-fixes-b1-b4/`** - Blocking fixes B1-B4 (resolved in commit 279e395)
  - `REQ-BLOCKING-FIXES-B1-B4.md`
  - `TECHSPEC-BLOCKING-FIXES-B1-B4.md`
  - `VALIDATION-REPORT-BLOCKING-FIXES-B1-B4.md`
  - `CODE-REVIEW-BLOCKING-FIXES-B1-B4.md`

See `/docs/archive/README.md` for archive structure and policies.

## Document Hierarchy

```
REQ-MODALITY-PLATFORM-V2.md (CANONICAL)
├── TECHSPEC-MODALITY-PLATFORM-V2.md (architecture contracts)
└── HUB-MCP-ARCHITECTURE.md (technical implementation)
```

## Maintenance Rules

1. **Single Source of Truth**: Each concern has ONE canonical requirement document
2. **Status Indicators**: Use CANONICAL, ACTIVE, ARCHIVED, DRAFT in frontmatter
3. **Archival**: Resolved requirements moved to `/docs/archive/` with clear reason
4. **Cross-references**: All requirements must link to related architecture docs
5. **Conflicts**: Canonical documents take precedence over drafts/historical docs

For document conflicts or questions, see `/docs/README.md` for complete documentation index and resolution rules.
