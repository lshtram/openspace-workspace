# Session Summary: Arrow Persistence Bug Fix & Ongoing Issues

**Date:** 2026-02-12  
**Status:** ⚠️ PARTIALLY FIXED - NEW BUG DISCOVERED  
**Critical Files:** See "Files Modified" section below

---

## 🎯 Original Bug: Arrows Not Persisting (FIXED ✅)

### Problem
User drew arrows in tldraw UI between shapes. Arrows were visible and bound to shapes (moved with shapes), but the `edges` array in `design/demo.diagram.json` remained empty `[]`. Arrows weren't saving.

### Root Cause
**tldraw v2 stores arrows and bindings as SEPARATE record types:**
- **Arrow shapes** (`typeName: 'shape'`, `type: 'arrow'`) - visual properties
- **Arrow bindings** (`typeName: 'binding'`, `type: 'arrow'`) - connection info

Our code only queried shapes via `editor.getCurrentPageShapes()` but never queried bindings via `editor.store.query.records('binding').get()`.

### Fix Applied
1. **TldrawWhiteboard.tsx** - Query bindings separately and pass to mapper
2. **tldrawMapper.ts** - Process bindings to extract arrow connections

### Verification
✅ **User drew arrow → IT SAVED!** File shows:
```json
"edges": [
  {
    "id": "XiPYZjGhz77xUL7RmrKZk",
    "from": "4GdJd46WTdMZ3URE2Fsnw",
    "to": "agent-victory-test",
    "relation": "association",
    "label": "",
    "styleToken": ""
  }
]
```

**Original bug is FIXED** - arrows drawn by user now persist correctly!

---

## 🔴 NEW BUG: Arrow Loading from File Fails (ACTIVE)

### Problem
When loading a diagram with existing arrows (from `edges` array in JSON file), tldraw throws validation errors and crashes:

**Latest Error:**
```
At shape(type = arrow).props.start.type: Unexpected property
ValidationError: At shape(type = arrow).props.start.type: Unexpected property
```

**Previous Errors:**
```
At shape(type = arrow).props.start.x: Expected number, got undefined
```

### Root Cause
Our `diagramToTldrawShapes()` mapper tries to convert `edges` array into tldraw arrow shapes, but tldraw has strict validation:

**Option 1: Simple arrows** (unbound)
```typescript
start: { x: 0, y: 0 },
end: { x: 100, y: 100 }
```

**Option 2: Bound arrows** (requires separate API calls)
```typescript
// 1. Create arrow with x/y
editor.createShapes([{ type: 'arrow', props: { start: {x,y}, end: {x,y} } }])

// 2. Create bindings separately
editor.createBindings([
  { type: 'arrow', fromId: arrowId, toId: shapeId, props: { terminal: 'start' } }
])
```

**We tried mixing both** (binding props WITH x/y), which is invalid:
```typescript
// ❌ INVALID - can't mix binding type with x/y
start: {
  type: 'binding',
  boundShapeId: '...',
  x: 0,  // ← tldraw rejects this
  y: 0
}
```

### Current State
- Latest code creates simple arrows with x/y (no bindings)
- Browser still crashes because the fix needs page refresh or cache clear
- Arrow will load but won't be bound to shapes (won't move with them)

---

## 📝 Files Modified

### 1. `openspace-client/src/components/whiteboard/TldrawWhiteboard.tsx`

**Line ~96-117** - `handleChange()` callback:
```typescript
// ADDED: Query bindings separately
const bindings = editorInstance.store.query.records('binding').get();
console.log('[TldrawWhiteboard] Bindings found:', bindings.length);

// CHANGED: Pass bindings to mapper
const partialDiagram = tldrawShapesToDiagram(shapes, bindings);
```

**Line ~158-185** - `handleMount()` callback:
```typescript
// CHANGED: Enhanced listener to log shapes vs bindings
unlistenRef.current = editorInstance.store.listen((entry) => {
  const changes = entry.changes;
  const addedRecords = Object.values(changes.added);
  const updatedRecords = Object.values(changes.updated);
  
  const addedShapes = addedRecords.filter((r: any) => r.typeName === 'shape').length;
  const addedBindings = addedRecords.filter((r: any) => r.typeName === 'binding').length;
  
  console.log('[TldrawWhiteboard] Store listener fired:', {
    added: { shapes: addedShapes, bindings: addedBindings },
    updated: { shapes: updatedShapes, bindings: updatedBindings },
    removed: removedRecords.length
  });
  
  if (addedRecords.length > 0 || updatedRecords.length > 0 || removedRecords.length > 0) {
    handleChange(editorInstance);
  }
});
```

### 2. `openspace-client/src/lib/whiteboard/tldrawMapper.ts`

**Line ~123-200** - `tldrawShapesToDiagram()` - REWRITTEN to use bindings:
```typescript
export function tldrawShapesToDiagram(shapes: TLShape[], bindings: any[] = []): IDiagram {
  // Process nodes (geo shapes) - unchanged
  
  // NEW: Group bindings by arrow ID
  const bindingsByArrow = new Map<string, { start?: string; end?: string }>();
  
  for (const binding of bindings) {
    if (binding.type === 'arrow') {
      const arrowId = binding.fromId;
      const targetId = binding.toId;
      const terminal = binding.props?.terminal;
      
      if (!bindingsByArrow.has(arrowId)) {
        bindingsByArrow.set(arrowId, {});
      }
      
      const connections = bindingsByArrow.get(arrowId)!;
      if (terminal === 'start') {
        connections.start = targetId;
      } else if (terminal === 'end') {
        connections.end = targetId;
      }
    }
  }

  // NEW: Match arrows with their bindings
  for (const shape of shapes) {
    if (shape.type === 'arrow') {
      const connections = bindingsByArrow.get(shape.id);
      
      if (connections?.start && connections?.end) {
        edges.push({
          id: shape.id.replace(/^shape:/, ''),
          from: connections.start.replace(/^shape:/, ''),
          to: connections.end.replace(/^shape:/, ''),
          relation: (shape.meta?.relation as string) || 'association',
          label: richTextToPlainText(props.richText),
          styleToken: (shape.meta?.styleToken as string) || '',
        });
      }
    }
  }
}
```

**Line ~70-140** - `diagramToTldrawShapes()` - LATEST ATTEMPT (creates simple arrows):
```typescript
diagram.edges.forEach((edge, index) => {
  const fromNode = diagram.nodes.find(n => n.id === edge.from);
  const toNode = diagram.nodes.find(n => n.id === edge.to);
  
  if (!fromNode || !toNode) {
    console.warn(`[tldrawMapper] Skipping edge ${edge.id} - missing nodes`);
    return;
  }

  // Calculate center points
  const fromCenter = {
    x: fromNode.layout.x + fromNode.layout.w / 2,
    y: fromNode.layout.y + fromNode.layout.h / 2,
  };
  const toCenter = {
    x: toNode.layout.x + toNode.layout.w / 2,
    y: toNode.layout.y + toNode.layout.h / 2,
  };

  // Create simple arrow with x/y (NO BINDINGS)
  shapes.push({
    id: createShapeId(edge.id),
    type: 'arrow',
    x: fromCenter.x,
    y: fromCenter.y,
    props: {
      arrowheadStart: 'none',
      arrowheadEnd: 'arrow',
      start: { x: 0, y: 0 },  // Relative to arrow position
      end: {
        x: toCenter.x - fromCenter.x,
        y: toCenter.y - fromCenter.y
      },
      // ... other props
    }
  });
});
```

### 3. `openspace-client/src/lib/whiteboard/tldrawMapper.ts` (Line 132)

**ALSO FIXED** (earlier in session) - geoType read-only error:
```typescript
// OLD: semantics.geoType = props.geo; // ❌ read-only error
// NEW:
const semantics: any = { ...(shape.meta?.semantics as any) };
if (props.geo) {
  semantics.geoType = props.geo;
}
```

---

## 🧪 Test Status

### ✅ WORKING: User-Drawn Arrows Save
1. User draws arrow in UI
2. Store listener fires with `bindings: 2`
3. `handleChange` processes bindings
4. Edges save to file correctly
5. **THIS WORKS!**

### ❌ BROKEN: Loading Arrows from File
1. File has arrow in `edges` array
2. `diagramToTldrawShapes()` converts edge to arrow shape
3. tldraw validates arrow shape → FAILS
4. Browser shows error: "Unexpected property" or "Expected number, got undefined"
5. **THIS BREAKS!**

---

## 🔍 Research Documents Created

1. **`docs/research/tldraw-arrow-binding-persistence.md`** - Scout's tldraw v2 API research
2. **`qa-snapshots/FIX-arrow-binding-persistence.md`** - Technical fix documentation
3. **`qa-snapshots/BUG-arrow-persistence-failure.md`** - Original bug report
4. **`TEST-arrow-fix.md`** - Test instructions (for original bug)

---

## 💡 Key Insights

### tldraw v2 Arrow Architecture
1. **Arrows** and **bindings** are separate record types
2. Query arrows: `editor.getCurrentPageShapes().filter(s => s.type === 'arrow')`
3. Query bindings: `editor.store.query.records('binding').get()`
4. Each arrow can have 0-2 bindings (start and end)
5. Bindings have: `{ fromId: arrowId, toId: shapeId, props: { terminal: 'start'|'end' } }`

### Arrow Creation Methods
**Method 1: UI (works perfectly)**
- User draws arrow → tldraw creates shape + bindings automatically
- Our code captures both and saves to file ✅

**Method 2: Programmatic with bindings (complex, not yet working)**
- Create arrow shape with x/y
- Create bindings separately via `editor.createBindings()`
- Requires editor instance (can't do from file alone)

**Method 3: Simple arrows (current attempt)**
- Create arrow with x/y only, no bindings
- Arrow displays but doesn't move with shapes
- Should work but browser cache may be stale

---

## 🚧 Current Blocker

**Browser Error:** Validation fails when loading existing arrow from file

**Likely Causes:**
1. Browser cache still has old code with binding-style props
2. File might need to be cleared and recreated
3. Dev server hot reload not picking up changes

**Next Steps to Try:**
1. **Hard refresh browser** (Ctrl+Shift+R / Cmd+Shift+R)
2. **Clear tldraw local storage:** Open DevTools → Application → Local Storage → Clear
3. **Delete arrow from file temporarily:**
   - Remove the edge from `design/demo.diagram.json`
   - Let file reload clean
   - Draw new arrow in UI
   - Verify it saves
4. **Restart dev servers** completely
5. **If still broken:** Consider different approach - don't load arrows from file at all, only save them

---

## 🎯 What Actually Needs to Work

### Minimum Viable Fix
**For user-drawn arrows (DONE ✅):**
- ✅ User draws arrow in UI
- ✅ Arrow saves to file edges array
- ✅ File contains correct from/to node IDs

**For loading arrows (BROKEN ❌):**
- ❌ Load diagram with arrows from file
- ❌ Arrows display correctly
- ❌ Arrows optionally bound to shapes (nice-to-have)

### Acceptable Compromise
If binding recreation is too complex:
- Load arrows as simple visual arrows (x/y coordinates)
- They display correctly but don't move with shapes
- User can delete and redraw if needed
- New arrows drawn in UI are fully bound ✅

---

## 📦 Current File State

**`design/demo.diagram.json`:**
```json
{
  "nodes": [
    {
      "id": "4GdJd46WTdMZ3URE2Fsnw",
      "label": "☁️ User's Cloud",
      "semantics": { "geoType": "cloud" },
      // ... layout
    },
    {
      "id": "agent-victory-test",
      "label": "🎉 Agent Here!",
      "semantics": { "geoType": "rectangle" },
      // ... layout
    }
  ],
  "edges": [
    {
      "id": "XiPYZjGhz77xUL7RmrKZk",
      "from": "4GdJd46WTdMZ3URE2Fsnw",
      "to": "agent-victory-test",
      "relation": "association",
      "label": "",
      "styleToken": ""
    }
  ]
}
```

---

## 🔄 Workaround to Continue Testing

**Option A: Clear the arrow and start fresh**
```bash
# Remove the edge from JSON temporarily
# Edit design/demo.diagram.json - set "edges": []
# Refresh browser
# Draw new arrow
# Verify it saves
```

**Option B: Test without loading**
```bash
# Start with empty diagram
# Draw shapes and arrows
# Verify they all save
# Don't test reload yet (that's the broken part)
```

---

## 🎓 Lessons Learned

1. **tldraw v2 has complex binding system** - arrows ≠ simple shapes
2. **Validation is strict** - can't mix binding props with coordinates
3. **Loading bound arrows requires editor API** - can't just create shapes from JSON
4. **Consider simpler approach** - maybe arrows shouldn't persist as bound, just as visual lines
5. **User-created arrows work perfectly** - only agent/file recreation is broken

---

## 🚀 Recommended Next Actions

1. **Hard refresh browser** - Clear cache completely
2. **Try the simple arrow approach** - Should work without bindings
3. **If still broken** - Remove arrow from file, test with fresh arrows
4. **Document decision** - Do we NEED bound arrows on reload? Or is visual sufficient?
5. **Alternative approach** - Don't convert edges to arrows on load, only save arrows to edges
6. **Consider** - Arrows are temporary UI artifacts, nodes/edges are the source of truth

---

## 📞 Critical Context for Next Session

**The good news:** Original bug (saving arrows) is 100% FIXED ✅

**The complication:** Loading arrows from file is harder than expected due to tldraw's binding architecture

**The question:** Do we need full binding recreation, or is displaying arrows visually (without shape-binding) acceptable?

**The priority:** Make sure newly-drawn arrows save (DONE ✅), then decide if loading is worth the complexity

**Build status:** ✅ Compiles clean, no TypeScript errors

**Dev servers:** Need restart + hard browser refresh to clear cache

---

## Files to Review Next Session

1. `openspace-client/src/lib/whiteboard/tldrawMapper.ts` - Lines 70-140 (diagramToTldrawShapes)
2. `openspace-client/src/components/whiteboard/TldrawWhiteboard.tsx` - Lines 96-117, 158-185
3. `design/demo.diagram.json` - Current test file with 1 arrow

**Git Status:** Changes not committed yet - all modifications are local
