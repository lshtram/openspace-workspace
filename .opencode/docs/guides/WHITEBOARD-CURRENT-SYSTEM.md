# Whiteboard System (Current Implementation)

**Last Updated**: 2026-02-14  
**Status**: Active (Phase 1 Complete, Phase 2 Merged)

## Overview

The OpenSpace whiteboard system allows users and agents to collaborate on visual diagrams using **tldraw** as the rendering engine. All whiteboards are stored as `.diagram.json` files in the `design/` directory.

## Architecture

### File Format: `.diagram.json`

Whiteboards use **tldraw's native JSON format**, which includes:
- **Shapes**: Rectangles, arrows, text, drawings, etc.
- **Bindings**: Connections between shapes (e.g., arrow endpoints)
- **Metadata**: Custom data for agent reasoning

Example structure:
```json
{
  "nodes": [
    {
      "id": "shape:abc123",
      "type": "geo",
      "x": 100,
      "y": 200,
      "props": {
        "geo": "rectangle",
        "text": "Auth Service"
      }
    }
  ],
  "edges": []
}
```

### Component Stack

1. **TldrawWhiteboard** (`openspace-client/src/components/whiteboard/TldrawWhiteboard.tsx`)
   - Main tldraw editor component
   - Uses `useArtifact` hook for file persistence
   - Handles real-time synchronization across windows
   - Supports agent updates via SSE

2. **WhiteboardContent** (`openspace-client/src/components/pane/content/WhiteboardContent.tsx`)
   - Pane system integration
   - Wraps TldrawWhiteboard for display in panes

3. **useArtifact Hook** (`openspace-client/src/hooks/useArtifact.ts`)
   - Handles file I/O via runtime-hub API
   - Auto-creates files on first save (if not exist)
   - Debounced auto-save (1000ms default)
   - BroadcastChannel for multi-window sync
   - SSE for agent updates

### Data Flow

```
User draws → TldrawWhiteboard → useArtifact → runtime-hub → design/*.diagram.json
                                      ↑
                                      └─ SSE updates from agent
```

## Usage

### Creating a Whiteboard

**Via Slash Command:**
```
/whiteboard MyDiagram
```
This creates `design/MyDiagram.diagram.json` and opens it in a pane.

**Via File Tree:**
- Navigate to `design/` directory
- Click on any `.diagram.json` file
- Opens in whiteboard pane

### File Locations

- **Design directory**: `design/` (root of project)
- **Example**: `design/Test1.diagram.json`
- **Deck subdirectory**: `design/deck/` (for presentations)

### Whiteboard Features

✅ **Supported:**
- Shapes: rectangles, ellipses, text, arrows, drawings
- Multi-window sync (BroadcastChannel)
- Agent updates via SSE
- Auto-save (debounced 1s)
- Undo/redo
- Export to image (via tldraw UI)

❌ **Not Supported (Yet):**
- Mermaid diagram import/export
- Excalidraw format compatibility
- Agent-initiated diagram generation (MCP tools pending)

## Agent Integration

### Current Status
- ✅ Agent can **read** whiteboard state via file system
- ✅ Agent updates reflect in UI via SSE
- ⏳ Agent cannot **write** whiteboards yet (MCP tools pending)

### Planned MCP Tools
- `whiteboard_read` - Read diagram structure
- `whiteboard_update` - Update shapes/text
- `whiteboard_create` - Generate new diagrams

## Migration Notes

### Old System (Archived)
The previous whiteboard system used:
- **Format**: `.graph.mmd` (Mermaid) + `.excalidraw` (Excalidraw JSON)
- **Engine**: Excalidraw + Mermaid parser
- **Two-layer sync**: Canonical (Mermaid) + Projection (Excalidraw)

**Why Changed:**
- Complexity of maintaining two formats
- Mermaid limited visual editing capabilities
- Tldraw provides better UI/UX and extensibility

### Archived Documentation
Old system docs moved to: `.opencode/context/_archive/whiteboard-old-system-2026-02-14/`

## Technical Details

### File Creation Flow
1. User types `/whiteboard Test1`
2. AgentConsole handler calls `onOpenContent('design/Test1.diagram.json', 'whiteboard')`
3. Pane system opens WhiteboardContent component
4. TldrawWhiteboard loads via useArtifact hook
5. useArtifact fetches `GET /files/design/Test1.diagram.json`
6. If 404 (not found), starts with `null` data
7. User draws → triggers auto-save
8. useArtifact sends `POST /files/design/Test1.diagram.json` with content
9. runtime-hub creates directory structure and writes file

### Synchronization
- **Same window**: Direct React state updates
- **Multiple windows**: BroadcastChannel API
- **Agent updates**: SSE stream from runtime-hub

## Troubleshooting

### Issue: File not saving to design/ directory
- **Cause**: Directory doesn't exist or permissions issue
- **Fix**: runtime-hub auto-creates directories on first write

### Issue: Agent thinks whiteboards use .graph.mmd format
- **Cause**: Outdated agent memory/context
- **Fix**: Archived old docs, agent should now reference this file

### Issue: Whiteboard doesn't open
- **Check**: File path is correct (`design/*.diagram.json`)
- **Check**: runtime-hub is running (port 3001)
- **Check**: Browser console for errors

## Future Enhancements

1. **Phase 3**: Agent MCP tools for diagram generation
2. **Phase 4**: Export to PNG/SVG from UI
3. **Phase 5**: Templates (flowchart, sequence diagram, etc.)
4. **Phase 6**: Collaborative cursors (multi-user)

## References

- Tldraw docs: https://tldraw.dev
- Component: `openspace-client/src/components/whiteboard/TldrawWhiteboard.tsx`
- Hook: `openspace-client/src/hooks/useArtifact.ts`
- Integration: `openspace-client/src/components/pane/content/WhiteboardContent.tsx`
