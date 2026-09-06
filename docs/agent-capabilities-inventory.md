# OpenSpace Agent Capabilities Inventory

> **Document Type:** Implementation Analysis (NOT Requirements)  
> **Purpose:** Factual inventory of what's implemented vs missing, with code references  
> **For Requirements, See:** [REQ-MODALITY-PLATFORM-V2](requirements/REQ-MODALITY-PLATFORM-V2.md) (Single Source of Truth)  

## Executive Summary

This document provides a **factual inventory** (not requirements) of all functions available to the agent across four modalities: **Pane System**, **Whiteboard**, **Presentation**, and **Editor**. It serves as:
- Implementation audit reference
- Code archaeology guide
- Gap analysis for planning

**Document Status Legend:**
- ✅ **Implemented** - Working in production
- ⚠️ **Partially Implemented** - Exists but has bugs or limitations
- ❌ **Missing** - Not yet implemented
- 🐛 **Bug Identified** - Implementation exists but is broken

---

## 1. PANE SYSTEM

The pane system provides window management and content routing capabilities.

### ✅ Implemented Functions

#### Core Pane Operations
| Function | MCP Tool | Description | Parameters |
|----------|----------|-------------|------------|
| `pane.open` | `pane.open` | Open a new pane or content in existing pane | `type` (SpaceType), `title`, `contentId`, `targetPaneId`, `newPane`, `splitDirection` |
| `pane.close` | `pane.close` | Close a specific pane or tab | `paneId` OR `contentId` |
| `pane.focus` | `pane.focus` | Set focus to a specific pane | `paneId` OR `contentId` |
| `pane.list` | `pane.list` | Query current pane layout state | None - returns full layout tree |

#### Space Types Supported (from `types.ts`)
```typescript
type SpaceType = 
  | "editor"
  | "whiteboard" 
  | "drawing"
  | "presentation"
  | "terminal"
  | "dashboard"
  | "diff"
  | "browser"
  | "media"
```

#### Valid Command Types (from `hub-server.ts`)
```typescript
const VALID_COMMAND_TYPES = [
  'pane.open',
  'pane.close', 
  'pane.focus',
  'editor.open',
  'editor.close',
  'presentation.open',
  'presentation.navigate',
] as const;
```

### ⚠️ Partially Implemented

| Function | Status | Limitation |
|----------|--------|------------|
| Split pane with ratio control | ⚠️ | Can split but cannot specify exact split ratio via agent |
| Pane resize | ⚠️ | User can drag splitters; agent cannot programmatically resize |
| Pane minimize/maximize | ❌ | Not implemented |
| Pane layout save/restore | ⚠️ | Client reports state but no explicit save/load API |

### ❌ Missing Functions

| Function | Priority | Use Case |
|----------|----------|----------|
| `pane.swap` | Medium | Swap positions of two panes |
| `pane.move` | Medium | Move a pane to different position in tree |
| `pane.resize` | Low | Programmatically set pane dimensions |
| `pane.maximize` | Low | Expand pane to full screen temporarily |
| `pane.minimize` | Low | Collapse pane to minimal size |
| `pane.layout.save` | Medium | Save current layout to named preset |
| `pane.layout.load` | Medium | Restore layout from named preset |
| `pane.layout.reset` | Low | Reset to default single-pane layout |

---

## 2. EDITOR MODALITY

The editor modality provides code/text editing capabilities via Monaco Editor.

### ✅ Implemented Functions

#### File Operations
| Function | MCP Tool | Description | Parameters |
|----------|----------|-------------|------------|
| `editor.open` | `editor.open` | Open file in editor | `path` (required), `line`, `endLine`, `highlight`, `mode`, `newPane`, `splitDirection` |
| `editor.close` | `editor.close` | Close file tab | `path` (required) |
| `editor.read_file` | `editor.read_file` | Read file contents | `path` (required), `startLine`, `endLine` |

#### Navigation (Client-Side via Highlights)
| Function | Implementation | Description |
|----------|----------------|-------------|
| Go to line | `revealLineInCenter()` | Scrolls to line and centers it |
| Highlight range | Decorations API | Highlights line range with colored background |
| Set selection | `setSelection()` | Sets cursor/selection to range |
| Jump back | `useNavigation.jumpBack()` | Return to previous location |

### ⚠️ Partially Implemented / 🐛 Bugged

| Function | Status | Limitation |
|----------|--------|------------|
| `line` parameter in `editor.open` | 🐛 **BUG** | Parameter exists in MCP schema but **completely ignored** in `useAgentCommands.ts` implementation. File opens but does NOT scroll to line. |
| `endLine` parameter | 🐛 **BUG** | Same issue - accepted but ignored |
| `highlight` parameter | 🐛 **BUG** | Same issue - accepted but ignored |
| Scroll position tracking | ⚠️ | Interface defines `scrollPosition` but not used for agent commands |
| View state per tab | ✅ | Saved when switching tabs but not exposed to agent |

### ❌ Missing Functions

| Function | Priority | Use Case |
|----------|----------|----------|
| `editor.scroll_to` | **High** | Programmatically scroll to line/column without opening new file |
| `editor.highlight` | **High** | Add/remove highlight decorations programmatically |
| `editor.select` | Medium | Set selection range programmatically |
| `editor.search` | Medium | Search within file, return matches |
| `editor.replace` | Medium | Replace text in file |
| `editor.format` | Low | Trigger code formatting |
| `editor.undo` | Low | Undo last edit |
| `editor.redo` | Low | Redo last undone edit |
| `editor.fold` | Low | Fold code regions |
| `editor.unfold` | Low | Unfold code regions |
| `editor.get_content` | Medium | Get current editor content (for unsaved changes) |
| `editor.is_modified` | Low | Check if file has unsaved changes |
| `editor.save` | Low | Trigger save operation |
| `editor.find_references` | Low | Find symbol references |
| `editor.go_to_definition` | Low | Navigate to symbol definition |
| `editor.show_call_hierarchy` | Low | Show call hierarchy |

### Implementation Gap Analysis

The `editor.open` command in `useAgentCommands.ts` (lines 93-103) currently only handles:
```typescript
case "editor.open": {
  const path = payload.path as string
  if (!path) break
  const filename = path.split("/").filter(Boolean).at(-1) ?? path
  p.openContent({
    type: "editor",
    title: filename,
    contentId: path,
  })
  break
}
```

**Missing**: The `line`, `endLine`, `highlight`, and `mode` parameters are accepted in the MCP schema but **not implemented** in the command handler.

---

## 3. PRESENTATION MODALITY

The presentation modality provides slide deck viewing and navigation via Reveal.js.

### ✅ Implemented Functions

#### File/Content Operations
| Function | MCP Tool | Description | Parameters |
|----------|----------|-------------|------------|
| `presentation.open` | `presentation.open` | Open deck in pane | `name` OR `path`, `newPane` |
| `presentation.read` | `presentation.read` | Read full deck content | `name` (optional, defaults to active) |
| `presentation.update` | `presentation.update` | Update entire deck | `name` (optional), `content` (required) |
| `presentation.read_slide` | `presentation.read_slide` | Read specific slide | `name` (optional), `index` (required, 0-based) |
| `presentation.update_slide` | `presentation.update_slide` | Update/insert/delete slide | `name` (optional), `index` (required), `content`, `operation` ("replace"/"insert"/"delete") |

#### Navigation & State
| Function | MCP Tool | Description | Parameters |
|----------|----------|-------------|------------|
| `presentation.navigate` | `presentation.navigate` | Navigate to slide | `slideIndex` (required, 0-based), `name` (optional) |
| `presentation.current_slide` | `presentation.current_slide` | Get current slide index | None - returns current slide number |
| `presentation.list` | `presentation.list` | List available decks | None - returns all `.deck.md` files |

#### Client-Side Features (Available to User)
| Feature | Implementation |
|---------|----------------|
| Play/Stop autoplay | `usePlayback` hook with configurable interval |
| Next/Previous buttons | UI controls calling `playback.next()` / `playback.previous()` |
| Export PDF | Opens print view in new tab |
| Keyboard navigation | Arrow keys, spacebar |
| Slide counter | Shows "Slide X of Y" |

### ⚠️ Partially Implemented

| Function | Status | Limitation |
|----------|--------|------------|
| Agent navigation | ✅ | `presentation.navigate` works via CustomEvent |
| Slide state reporting | ✅ | Reports to `/presentation/state` endpoint |
| Link resolution | ⚠️ | Links on slides exist but link-to-pane feature not fully implemented |

### ❌ Missing Functions

| Function | Priority | Use Case |
|----------|----------|----------|
| `presentation.first_slide` | Low | Navigate to first slide (can use navigate with 0) |
| `presentation.last_slide` | Low | Navigate to last slide |
| `presentation.next_slide` | Low | Advance one slide (can use navigate with +1) |
| `presentation.previous_slide` | Low | Go back one slide (can use navigate with -1) |
| `presentation.play` | Medium | Start autoplay from agent |
| `presentation.stop` | Medium | Stop autoplay from agent |
| `presentation.get_slide_count` | Low | Get total number of slides |
| `presentation.insert_slide` | Medium | Insert new slide at position |
| `presentation.delete_slide` | Medium | Delete slide at position |
| `presentation.reorder_slides` | Low | Change slide order |
| `presentation.set_transition` | Low | Set transition effect |
| `presentation.set_timing` | Low | Set per-slide timing for autoplay |

---

## 4. WHITEBOARD MODALITY

The whiteboard modality provides diagram editing via tldraw.

### ✅ Implemented Functions

#### File Operations
| Function | MCP Tool | Description | Parameters |
|----------|----------|-------------|------------|
| `whiteboard.list` | `whiteboard.list` | List all whiteboards | None - returns all `.diagram.json` files |
| `whiteboard.read` | `whiteboard.read` | Read whiteboard content | `name` (optional, defaults to active) |
| `whiteboard.update` | `whiteboard.update` | Update entire whiteboard | `name` (optional), `content` (required, tldraw JSON) |
| Active whiteboard resource | `active://whiteboard` | MCP resource for active context | Returns tldraw JSON of active whiteboard |

### ⚠️ Partially Implemented

| Function | Status | Limitation |
|----------|--------|------------|
| Element-level operations | ❌ | Can only read/write entire whiteboard, not individual elements |
| Shape creation | ❌ | Must construct tldraw JSON manually |
| Camera/view control | ❌ | No agent control over pan/zoom |

### ❌ Missing Functions

| Function | Priority | Use Case |
|----------|----------|----------|
| `whiteboard.create` | Medium | Create new whiteboard with name |
| `whiteboard.delete` | Low | Delete whiteboard file |
| `whiteboard.rename` | Low | Rename whiteboard |
| `whiteboard.export` | Low | Export to PNG/SVG/PDF |
| `whiteboard.camera.set` | **High** | Set camera position and zoom |
| `whiteboard.camera.fit` | Medium | Fit camera to specific elements |
| `whiteboard.shape.add` | **High** | Add shape (rectangle, circle, text, arrow) |
| `whiteboard.shape.update` | **High** | Update existing shape properties |
| `whiteboard.shape.delete` | Medium | Delete specific shape by ID |
| `whiteboard.shape.select` | Medium | Select shapes programmatically |
| `whiteboard.shape.get` | Medium | Get specific shape data |
| `whiteboard.shape.list` | Medium | List all shapes with IDs and types |
| `whiteboard.page.add` | Low | Add new page to whiteboard |
| `whiteboard.page.delete` | Low | Delete page |
| `whiteboard.page.navigate` | Low | Switch to different page |
| `whiteboard.undo` | Low | Undo last operation |
| `whiteboard.redo` | Low | Redo last undone operation |

---

## 5. DRAWING MODALITY

The drawing modality provides structured diagram editing with semantic operations.

### ✅ Implemented Functions

#### Scene Inspection
| Function | MCP Tool | Description | Parameters |
|----------|----------|-------------|------------|
| `drawing.inspect_scene` | `drawing.inspect_scene` | Get scene graph summary | None - returns node/edge counts and list |

#### Patch Operations
| Function | MCP Tool | Description | Parameters |
|----------|----------|-------------|------------|
| `drawing.propose_patch` | `drawing.propose_patch` | Stage operations for review | `patch` (array of IOperation), `intent` |
| `drawing.apply_patch` | `drawing.apply_patch` | Apply staged patch | `patchId` (from propose_patch) |

#### Supported Operations (IOperation types)
```typescript
// From modality-mcp.ts line 99
const knownTypes = [
  'addNode', 
  'updateNode', 
  'removeNode', 
  'addEdge', 
  'updateEdge', 
  'removeEdge', 
  'updateNodeLabel', 
  'updateNodeLayout'
];
```

### ⚠️ Partially Implemented

| Function | Status | Limitation |
|----------|--------|------------|
| Scene graph inspection | ✅ | Returns summary but not full details |
| Patch validation | ⚠️ | Basic type checking only |
| Conflict resolution | ⚠️ | Simple retry on version conflict |

### ❌ Missing Functions

| Function | Priority | Use Case |
|----------|----------|----------|
| `drawing.create` | Medium | Create new diagram file |
| `drawing.delete` | Low | Delete diagram file |
| `drawing.list` | Medium | List all diagrams |
| `drawing.read` | **High** | Read full diagram content (like whiteboard.read) |
| `drawing.update` | **High** | Update full diagram content |
| `drawing.node.get` | Medium | Get specific node details |
| `drawing.node.list` | Medium | List all nodes with properties |
| `drawing.edge.get` | Medium | Get specific edge details |
| `drawing.edge.list` | Medium | List all edges |
| `drawing.layout.auto` | Low | Auto-layout diagram |
| `drawing.export.svg` | Low | Export as SVG |
| `drawing.export.png` | Low | Export as PNG |
| `drawing.zoom.fit` | Medium | Fit view to content |
| `drawing.zoom.set` | Low | Set specific zoom level |

---

## Cross-Modality Functions

### ✅ Implemented

| Function | MCP Tool | Description |
|----------|----------|-------------|
| `modality.validate_handoff` | `modality.validate_handoff` | Validate cross-modality navigation payloads |
| Active context | `/context/active` | Get/set currently active modality and file |

### ❌ Missing

| Function | Priority | Use Case |
|----------|----------|----------|
| Cross-modality link | **High** | Click link in presentation → open in editor |
| `modality.handoff` | Medium | Structured handoff between modalities |
| Unified search | Low | Search across all modalities |

---

## Priority Summary

### Critical Bugs (Must Fix Immediately)

1. 🐛 **Editor**: `editor.open` `line` parameter ignored - Schema accepts line number but implementation completely ignores it. File opens but doesn't scroll.

### Critical Missing (Blocking Common Workflows)

2. **Editor**: `editor.scroll_to` - Cannot scroll in already-open file
3. **Editor**: `editor.highlight` - Cannot highlight code sections from agent  
4. **Whiteboard**: `whiteboard.camera.set` - Cannot control whiteboard view
5. **Whiteboard**: `whiteboard.shape.add` - Cannot add shapes programmatically
6. **Whiteboard**: `whiteboard.shape.update` - Cannot modify shapes

### High Priority (Enable richer interactions)

6. **Presentation**: `presentation.play` / `presentation.stop` - Control playback
7. **Drawing**: `drawing.read` / `drawing.update` - Full read/write like whiteboard
8. **Cross-modality**: Link resolution from presentation to editor

### Medium Priority (Quality of life)

9. **Pane**: `pane.swap` / `pane.move` - Better layout control
10. **Pane**: `pane.layout.save` / `pane.layout.load` - Named layouts
11. **All modalities**: List/create/delete operations
12. **Editor**: Search/replace operations

---

## Implementation Architecture

### Command Flow (Agent → Client)
```
MCP Tool → POST /commands → Hub SSE → useAgentCommands → PaneContext
```

### State Reporting (Client → Agent)
```
Client → usePaneStateReporter → POST /panes/state → Hub → GET /panes/state → MCP
```

### Custom Events Used
- `agent:presentation:navigate` - Presentation navigation from agent
- `agent:presentation:play` - NOT IMPLEMENTED
- `agent:editor:scroll` - NOT IMPLEMENTED
- `agent:editor:highlight` - NOT IMPLEMENTED
- `agent:whiteboard:camera` - NOT IMPLEMENTED

---

## Recommendations

### Immediate (Next Sprint)
1. Implement `editor.scroll_to` and `editor.highlight` - extend existing `editor.open` handler
2. Add whiteboard camera control event handler
3. Implement `drawing.read` and `drawing.update` for parity with whiteboard

### Short-term (Next Month)
4. Add basic shape operations to whiteboard (add rectangle, text, arrow)
5. Implement presentation playback control from agent
6. Add cross-modality link resolution

### Long-term
7. Unified element-level API across whiteboard/drawing (get/add/update/delete shapes/nodes)
8. Advanced editor features (search, replace, refactor)
9. Layout management (save/load presets)

---

## Document Version

- **Generated**: 2026-02-16
- **Codebase**: OpenSpace
- **Files Analyzed**:
  - `runtime-hub/src/mcp/modality-mcp.ts`
  - `runtime-hub/src/hub-server.ts`
  - `openspace-client/src/hooks/useAgentCommands.ts`
  - `openspace-client/src/components/pane/types.ts`
  - `openspace-client/src/components/EditorFrame.tsx`
  - `openspace-client/src/components/PresentationFrame.tsx`
  - `openspace-client/src/hooks/usePaneStateReporter.ts`
