# OpenSpace Documentation

## Documentation Hierarchy

OpenSpace documentation follows a clear hierarchy to maintain a **single source of truth** for each concern.

### Canonical References (Active)

These documents are the **authoritative sources** for implementation and planning:

#### Architecture
- **[Hub/MCP Architecture](./architecture/HUB-MCP-ARCHITECTURE.md)** ⭐ **CANONICAL TECHNICAL REFERENCE**
  - Purpose: Complete implementation guide for Hub/MCP multi-modal architecture
  - Audience: Developers implementing or extending modalities
  - Status: Active, continuously updated
  - Sections: System topology, Hub server, MCP tools, artifact management, security model

- **[Modality Platform V2 Spec](./architecture/TECHSPEC-MODALITY-PLATFORM-V2.md)** ⭐ **CANONICAL CONTRACTS**
  - Purpose: Architectural contracts (mutation, validation, events, context)
  - Audience: Developers implementing modality features
  - Status: Active, governs all modality implementations
  - Sections: Core contracts, MCP architecture, agent command pipeline, execution order

#### Requirements
- **[Modality Platform V2 Requirements](./requirements/REQ-MODALITY-PLATFORM-V2.md)** ⭐ **CANONICAL REQUIREMENTS & BACKLOG**
  - Purpose: User stories, functional requirements, active backlog (BLK-001 through BLK-011)
  - Audience: Product, engineering, QA teams
  - Status: Active, tracks current work
  - Sections: Platform requirements, modality requirements (Drawing, Presentation, Editor, etc.), backlog status

### Historical References (Archived)

These documents provide valuable context but are **superseded by canonical references**:

- **[Architecture Review](./ARCHITECTURE_REVIEW_OPENSPACE.md)** (2026-02-15)
  - Purpose: Point-in-time comprehensive review with blocking issues, suggestions, and praise
  - Status: Archived (blocking issues B1-B4 resolved in commit 279e395)
  - Use: Understanding design decisions and tradeoffs
  - Superseded by: HUB-MCP-ARCHITECTURE.md (technical details)

### Specialized Documents

#### Blocking Fixes
- **[REQ-BLOCKING-FIXES-B1-B4](./requirements/REQ-BLOCKING-FIXES-B1-B4.md)** - Requirements analysis for blocking fixes
- **[TECHSPEC-BLOCKING-FIXES-B1-B4](./architecture/TECHSPEC-BLOCKING-FIXES-B1-B4.md)** - Technical specification
- **[VALIDATION-REPORT-BLOCKING-FIXES-B1-B4](./validation/VALIDATION-REPORT-BLOCKING-FIXES-B1-B4.md)** - Janitor validation
- **[CODE-REVIEW-BLOCKING-FIXES-B1-B4](./review/CODE-REVIEW-BLOCKING-FIXES-B1-B4.md)** - CodeReviewer audit

#### Research & Investigation
- **[opencode-solidjs-client-architecture](./research/opencode-solidjs-client-architecture.md)** - OpenCode SolidJS client research
- **[tldraw-arrow-binding-persistence](./research/tldraw-arrow-binding-persistence.md)** - Tldraw technical investigation

#### Testing
- **[E2E_TEST_VALIDATION_PROCESS](./E2E_TEST_VALIDATION_PROCESS.md)** - E2E test process documentation

## Document Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                    CANONICAL LAYER                          │
│                                                             │
│  ┌────────────────────┐  ┌────────────────────┐           │
│  │ HUB-MCP-           │  │ TECHSPEC-MODALITY- │           │
│  │ ARCHITECTURE.md    │←→│ PLATFORM-V2.md     │           │
│  │ (Implementation)   │  │ (Contracts)        │           │
│  └─────────┬──────────┘  └──────────┬─────────┘           │
│            │                        │                      │
│            └────────────┬───────────┘                      │
│                         │                                  │
│                         ▼                                  │
│            ┌────────────────────────┐                      │
│            │ REQ-MODALITY-          │                      │
│            │ PLATFORM-V2.md         │                      │
│            │ (Requirements)         │                      │
│            └────────────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ historical context
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    ARCHIVED LAYER                           │
│                                                             │
│  ┌────────────────────────────────────────────┐            │
│  │ ARCHITECTURE_REVIEW_OPENSPACE.md           │            │
│  │ (Point-in-time review, 2026-02-15)         │            │
│  │ Blocking issues resolved: B1-B4 ✅          │            │
│  └────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

## Document Conventions

### Status Values
- **CANONICAL** - Single source of truth, actively maintained
- **ACTIVE** - Current and authoritative
- **ARCHIVED** - Historical, superseded by canonical documents
- **DRAFT** - Work in progress

### Cross-References
All documents include a "Related Documents" section linking to:
- Canonical references (for authoritative details)
- Requirements (for backlog and user stories)
- Historical context (for design rationale)

## Quick Reference

| I want to... | Read this document |
|--------------|-------------------|
| Understand how Hub/MCP works | [Hub/MCP Architecture](./architecture/HUB-MCP-ARCHITECTURE.md) |
| Implement a new modality | [Modality Platform V2 Spec](./architecture/TECHSPEC-MODALITY-PLATFORM-V2.md) |
| Check current backlog status | [Modality Platform V2 Requirements](./requirements/REQ-MODALITY-PLATFORM-V2.md) |
| Understand design decisions | [Architecture Review](./ARCHITECTURE_REVIEW_OPENSPACE.md) (archived) |
| Configure security settings | [Hub/MCP Architecture - Security Model](./architecture/HUB-MCP-ARCHITECTURE.md#10-security-model) |
| Review blocking fixes (B1-B4) | [Architecture Review - Section 15.1](./ARCHITECTURE_REVIEW_OPENSPACE.md#151-blocking-issues-resolved-) |

## Maintenance Protocol

### When to Update Documents

1. **Implementation changes** → Update HUB-MCP-ARCHITECTURE.md
2. **Contract changes** → Update TECHSPEC-MODALITY-PLATFORM-V2.md
3. **Requirement changes** → Update REQ-MODALITY-PLATFORM-V2.md
4. **Backlog changes** → Update REQ-MODALITY-PLATFORM-V2.md (Section 11)

### Conflict Resolution

If documents conflict, the hierarchy is:
1. TECHSPEC-MODALITY-PLATFORM-V2.md (contracts win)
2. HUB-MCP-ARCHITECTURE.md (implementation details)
3. REQ-MODALITY-PLATFORM-V2.md (requirements and backlog)
4. Archived documents (historical context only)

### Deprecation Process

When superseding a document:
1. Update status to `ARCHIVED` in frontmatter
2. Add `superseded_by` field pointing to new canonical document
3. Add note at top explaining archival reason
4. Keep file in repository for historical reference
5. Update cross-references in all related documents

---

**Last Updated:** 2026-02-16  
**Maintained By:** Oracle (NSO)
