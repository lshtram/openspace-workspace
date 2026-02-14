# Whiteboard System Architecture Update (2026-02-14)

## CRITICAL: Old Documentation Archived

**Action Date**: 2026-02-14  
**Reason**: Agent confusion about whiteboard file formats

### What Changed

**OLD SYSTEM** (Archived → `.opencode/context/_archive/whiteboard-old-system-2026-02-14/`):
- Format: `.graph.mmd` (Mermaid) + `.excalidraw` (Excalidraw JSON)
- Two-layer sync: Canonical (Mermaid logic) + Projection (visual layout)
- Components: Excalidraw renderer + Mermaid parser

**CURRENT SYSTEM** (Active since Phase 1):
- Format: `.diagram.json` (tldraw native JSON)
- Single-layer: Direct visual editing with semantic metadata
- Components: TldrawWhiteboard + useArtifact hook
- Location: `design/*.diagram.json`

### Agent Memory Update

All references to the old system have been removed from active context:
- ❌ `.opencode/context/active_features/whiteboard/` → ARCHIVED
- ❌ `.opencode/docs/guides/DEMO-WHITEBOARD.md` → ARCHIVED
- ✅ NEW: `.opencode/docs/guides/WHITEBOARD-CURRENT-SYSTEM.md`

### Key Facts for Agents

1. **File Format**: ALL whiteboards are `.diagram.json` files (tldraw format)
2. **No Mermaid**: System does NOT use Mermaid diagrams anymore
3. **No Excalidraw**: System uses tldraw (similar but different)
4. **File Location**: `design/` directory (e.g., `design/Test1.diagram.json`)
5. **Creation**: Files auto-created on first save (useArtifact handles this)
6. **Command**: `/whiteboard <name>` creates `design/<name>.diagram.json`

### Why This Update Was Needed

**User reported**: Agent responded to "can you open an existing diagram?" with:
> "I see there's a diagram file at design/demo.diagram.json. Let me check what whiteboard expects - it looks like the system expects .graph.mmd Mermaid format files..."

This was INCORRECT. Agent was reading archived documentation about old system.

### Migration Path (If Needed)

If old `.graph.mmd` or `.excalidraw` files exist:
- They are NOT compatible with current system
- Manual conversion would be required
- No automated migration tool exists yet

### References

- Current system docs: `.opencode/docs/guides/WHITEBOARD-CURRENT-SYSTEM.md`
- TldrawWhiteboard component: `openspace-client/src/components/whiteboard/TldrawWhiteboard.tsx`
- useArtifact hook: `openspace-client/src/hooks/useArtifact.ts`
- Archive location: `.opencode/context/_archive/whiteboard-old-system-2026-02-14/`
