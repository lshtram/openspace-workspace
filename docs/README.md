# OpenSpace Documentation Index

**Last Updated:** 2026-02-11  
**Status:** Drawing Modality V2 - Phase 0 in progress

---

## 📋 Quick Navigation

### 🎯 **Current Work (START HERE)**
- **[Phase 0 Implementation Plan](./plans/PHASE-0-IMPLEMENTATION-PLAN.md)** — Infrastructure prep for Drawing V2 (4 tasks, 5 days)
- **[Phase 0 Progress Summary](./progress/PHASE-0-PROGRESS-SUMMARY.md)** — What we've accomplished, what's next
- **[useArtifact Hook Spec](./architecture/USE-ARTIFACT-HOOK-SPEC.md)** — Universal artifact loading/sync pattern

### 🏗️ **Architecture (Active)**
- **[Modality Architecture Debate](./architecture/MODALITY-ARCHITECTURE-DEBATE.md)** — Why "Spine Lite" architecture won
- **[tldraw vs Excalidraw Comparison](./architecture/TECH-COMPARISON-EXCALIDRAW-TLDRAW.md)** — Why we chose tldraw for Drawing V2
- **[Drawing Modality V2 (Client)](../openspace-client/docs/architecture/drawing-modality-implementation-guide-v2.md)** — Scene graph canonical architecture
- **[Platform Decision Record](./architecture/ADR-PLATFORM-DECISION.md)** — React chosen for OpenSpace client

### 📦 **Feature Parity (Parallel Work)**
- **[Feature Parity Plan](./plans/FEATURE-PARITY-PLAN.md)** — 26 feature gaps, 3 phases, 2.5 weeks (separate team)
- **[Feature Parity Handoff](./handoffs/HANDOFF-FEATURE-PARITY.md)** — Complete handoff for separate team
- **[Session Handoff Summary](./handoffs/SESSION-HANDOFF-SUMMARY.md)** — Quick start instructions

### 📖 **Reference**
- **[Comprehensive Review (2026-02-11)](./reviews/COMPREHENSIVE-REVIEW-2026-02-11.md)** — 121-feature comparison, code review, recommendations
- **[Requirements Index](./requirements/INDEX.md)** — All requirements (REQ-CORE-001 through REQ-CORE-039)
- **[Core PRD](./requirements/REQ-CORE-PRD.md)** — Product requirements document

### 🛠️ **Technical Specs**
- **[Architecture Overview](./tech/ARCHITECTURE.md)** — System architecture
- **[Protocol Documentation](./tech/PROTOCOL.md)** — Communication protocols
- **[Project Directives](./tech/PROJECT_DIRECTIVES.md)** — Development guidelines
- **[Decisions Log](./tech/DECISIONS_LOG.md)** — Architecture decision records

---

## 📂 Directory Structure

```
docs/
├── README.md                          ← YOU ARE HERE
├── architecture/                      ← Active architecture decisions
│   ├── USE-ARTIFACT-HOOK-SPEC.md     ← Universal hook (Phase 0)
│   ├── MODALITY-ARCHITECTURE-DEBATE.md
│   ├── TECH-COMPARISON-EXCALIDRAW-TLDRAW.md
│   └── ADR-PLATFORM-DECISION.md
├── plans/                             ← Implementation plans
│   ├── PHASE-0-IMPLEMENTATION-PLAN.md ← Current work
│   └── FEATURE-PARITY-PLAN.md        ← Parallel work (separate team)
├── progress/                          ← Progress tracking
│   └── PHASE-0-PROGRESS-SUMMARY.md   ← Latest status
├── handoffs/                          ← Session handoffs
│   ├── HANDOFF-FEATURE-PARITY.md
│   └── SESSION-HANDOFF-SUMMARY.md
├── reviews/                           ← Code reviews & analysis
│   └── COMPREHENSIVE-REVIEW-2026-02-11.md
├── examples/                          ← Code examples
│   └── whiteboard-useArtifact-refactor.tsx
├── requirements/                      ← Requirements docs
│   ├── INDEX.md
│   ├── REQ-CORE-PRD.md
│   ├── official/
│   └── conversations/
├── tech/                              ← Technical reference
│   ├── ARCHITECTURE.md
│   ├── PROTOCOL.md
│   ├── PROJECT_DIRECTIVES.md
│   └── DECISIONS_LOG.md
└── archive/                           ← Old/superseded docs
    ├── old-architecture/              ← Deprecated architecture docs
    ├── old-plans/                     ← Superseded plans
    └── old-code-reviews/              ← Historical reviews
```

---

## 🗂️ What's in the Archive?

The `/docs/archive/` directory contains **superseded documentation** that is no longer active but kept for historical reference:

### **old-architecture/** (10 files)
- Drawing Modality V1 (deprecated, replaced by V2 with scene graph)
- Editor, Comment, Annotation, Voice, Browser, Presentation modality guides (future work, not yet started)
- Multi-modal architecture (old version, replaced by Spine Lite)

### **old-plans/** (6 files)
- Initial MVP roadmap
- React port plans (completed)
- Architecture refactor plans (completed)
- Testing roadmap (superseded by Phase 0)

### **old-code-reviews/** (12 files)
- Historical code reviews and feature comparisons
- UI comparison notes
- Test recommendations (integrated into current plans)

**⚠️ Do not use archived documents for current work.** They represent past thinking and may conflict with current architecture.

---

## 🎯 Current Architecture Summary

### **Spine Lite Architecture (Chosen)**

```
Runtime Hub (:3001)               — ONE hub for all modalities
  ├── /files/:path                — Unified read/write (replaces /artifacts)
  ├── /events                     — SSE for all modalities
  └── /context/active             — Unified active context (replaces /context/active-whiteboard)

modality-mcp.ts                   — ONE MCP process
  ├── whiteboard.*                — Legacy whiteboard tools
  ├── drawing.*                   — Drawing V2 tools (inspect_scene, propose_patch, apply_patch)
  ├── editor.*                    — Editor tools (future)
  ├── presentation.*              — Presentation tools (future)
  └── ...                         — All other modalities namespaced

React Client
  └── useArtifact(path, options)  — Universal hook for ALL modalities
```

### **Drawing Modality V2 Architecture (In Progress)**

```
Scene Graph JSON (canonical) + Operation Log
├── diagram.json                  — Source of truth
├── Operation Engine              — Patch-only mutations (addNode, updateNode, deleteNode, etc.)
├── Validation Pipeline           — Schema → Integrity → Semantic → Layout policies
├── Adapters                      — Mermaid/PlantUML as import/export
└── tldraw                        — Visual editor (replaces Excalidraw)
```

**Key change:** Mermaid becomes an import/export adapter, NOT the canonical format.

---

## 📊 Project Status

### **Phase 0: Infrastructure Prep** (Week 1)
- ✅ **Task 1:** Extract useArtifact() hook (COMPLETE)
- ⏳ **Task 2:** Refactor WhiteboardFrame to use useArtifact()
- ⏳ **Task 3:** Hub API simplification (add /files endpoint)
- ⏳ **Task 4:** MCP consolidation (whiteboard-mcp → modality-mcp)

**Progress:** 21% complete (1 of 4 tasks done)

### **Parallel Work: Feature Parity** (Separate Team)
- 26 feature gaps between opencode (SolidJS) and openspace (React)
- 3 phases: Core UX, Advanced UX, Power Features
- 2.5 weeks estimated
- Separate git branches to avoid conflicts

---

## 🚀 Next Session Handoff

If you're starting a new session, read these files **in order**:

1. **[Phase 0 Progress Summary](./progress/PHASE-0-PROGRESS-SUMMARY.md)** — What's been done, what's next
2. **[Phase 0 Implementation Plan](./plans/PHASE-0-IMPLEMENTATION-PLAN.md)** — Detailed task breakdown
3. **[useArtifact Hook Spec](./architecture/USE-ARTIFACT-HOOK-SPEC.md)** — API reference for the universal hook
4. **[Refactor Example](./examples/whiteboard-useArtifact-refactor.tsx)** — How to migrate WhiteboardFrame.tsx

**Key files to modify in Task 2:**
- `openspace-client/src/components/whiteboard/WhiteboardFrame.tsx` (refactor)
- `openspace-client/src/components/whiteboard/useDebouncedSave.ts` (can be deleted)
- `openspace-client/src/hooks/useArtifact.ts` (already implemented)

---

## 📝 Contributing

### **Adding New Documentation**

1. **Architecture decisions** → `docs/architecture/`
2. **Implementation plans** → `docs/plans/`
3. **Progress updates** → `docs/progress/`
4. **Code examples** → `docs/examples/`
5. **Requirements** → `docs/requirements/`

### **Archiving Old Documentation**

When a document becomes outdated:
1. Move to appropriate `/docs/archive/old-*/` directory
2. Add `-deprecated` or `-old` suffix to filename
3. Update this README to remove it from active docs
4. Add note in archived file pointing to replacement

### **Updating This Index**

This `README.md` should be updated whenever:
- A major document is created or archived
- Project status changes (phase completion, milestone)
- Architecture decisions are made
- Directory structure changes

---

## 🔗 External Resources

- **OpenCode Repository:** https://github.com/opencode-ai/opencode (reference implementation)
- **tldraw Documentation:** https://tldraw.dev
- **Excalidraw Documentation:** https://docs.excalidraw.com
- **MCP Protocol Spec:** https://modelcontextprotocol.io

---

**Questions?** Check the [Phase 0 Progress Summary](./progress/PHASE-0-PROGRESS-SUMMARY.md) for FAQs and open questions.
