# tldraw v2 Arrow & Binding Persistence Research

**Date:** 2026-02-12  
**Context:** Investigating why `editor.getCurrentPageShapes()` returns 0 arrow shapes despite 3 visible arrows, and why store listener doesn't fire for arrow creation.

---

## Executive Summary

**CRITICAL FINDING:** In tldraw v2, **arrows are shapes** but **bindings are separate records**. The issue is likely NOT that arrows aren't being retrieved, but that:

1. Bindings (the connections between arrows and shapes) are stored as **separate record types** with `typeName: 'binding'`
2. Store listeners need to handle **both shape AND binding records** separately
3. `getCurrentPageShapes()` DOES return arrow shapes, but bindings must be queried separately via `store.query.records('binding')`

---

## Key Architecture Concepts

### 1. Arrows ARE Shapes

Arrow shapes are regular shapes with `type: 'arrow'` and `typeName: 'shape'`:

```typescript
const arrowShape: TLArrowShape = {
  id: 'shape:arrow123',
  typeName: 'shape',  // ← Arrow is a SHAPE
  type: 'arrow',
  x: 100,
  y: 200,
  props: {
    start: { x: 0, y: 0 },
    end: { x: 100, y: 100 },
    // ... other props
  }
}
```

**Verification:** Test code confirms arrows ARE returned by `getCurrentPageShapes()`:
```typescript
// From ArrowShapeTool.test.ts line 48
const shapesBefore = editor.getCurrentPageShapes().length
editor.setCurrentTool('arrow').pointerDown(0, 0)
const shapesAfter = editor.getCurrentPageShapes().length
expect(shapesAfter).toBe(shapesBefore + 1)  // ✅ Arrow IS counted
```

### 2. Bindings ARE Separate Records

Bindings are **first-class records** with `typeName: 'binding'` (NOT 'shape'):

```typescript
const arrowBinding: TLArrowBinding = {
  id: 'binding:arrow1',
  typeName: 'binding',  // ← Binding is a BINDING, not a shape
  type: 'arrow',
  fromId: 'shape:arrow1',  // The arrow shape ID
  toId: 'shape:rectangle1',  // The target shape ID
  props: {
    terminal: 'end',  // 'start' or 'end'
    normalizedAnchor: { x: 0.5, y: 0.5 },
    isExact: false,
    isPrecise: false,
  }
}
```

**Key insight:** A bound arrow creates:
- **1 shape record** (the arrow itself)
- **1-2 binding records** (one for start, one for end)

---

## Correct API Usage

### Retrieving Arrow Shapes

```typescript
// ✅ This DOES return arrow shapes
const allShapes = editor.getCurrentPageShapes()
const arrows = allShapes.filter(s => s.type === 'arrow')

// ✅ Alternative using type guard
const arrows = editor.getCurrentPageShapes()
  .filter(shape => editor.isShapeOfType(shape, 'arrow'))
```

### Retrieving Arrow Bindings

```typescript
// ✅ Query bindings separately from shapes
const allBindings = editor.store.query.records('binding').get()

// Filter for arrow-type bindings
const arrowBindings = allBindings.filter(b => b.type === 'arrow') as TLArrowBinding[]

// Get bindings for a specific arrow
import { getArrowBindings } from '@tldraw/tldraw'
const arrow = editor.getShape<TLArrowShape>(arrowId)
const { start, end } = getArrowBindings(editor, arrow)
// start and end are TLArrowBinding | undefined
```

### Helper Function: getArrowBindings

tldraw provides a built-in helper:

```typescript
import { getArrowBindings } from '@tldraw/tldraw'

const arrow = editor.getShape<TLArrowShape>('shape:arrow1')
const bindings = getArrowBindings(editor, arrow)

console.log(bindings.start)  // TLArrowBinding | undefined
console.log(bindings.end)    // TLArrowBinding | undefined

// Access bound shape IDs
if (bindings.start) {
  const startShape = editor.getShape(bindings.start.toId)
}
```

---

## Store Listener Configuration

### Problem: Why Listener Doesn't Fire

Your current listener likely only captures shape changes:

```typescript
// ❌ This only fires for shape record changes
editor.store.listen(handleChange, { 
  source: 'user', 
  scope: 'document' 
})
```

**The issue:** Bindings are separate records! When you create an arrow with bindings, the store sees:
- 1 `shape` record added (the arrow) ← **Your listener captures this**
- 1-2 `binding` records added ← **Your listener ALSO captures this, but you might be filtering it out**

### Solution: Handle Both Record Types

```typescript
editor.store.listen((entry) => {
  const { changes } = entry
  
  // Handle added records
  for (const record of Object.values(changes.added)) {
    if (record.typeName === 'shape' && record.type === 'arrow') {
      console.log('Arrow shape created:', record.id)
    }
    
    if (record.typeName === 'binding' && record.type === 'arrow') {
      console.log('Arrow binding created:', record)
      console.log('  From:', record.fromId, '→ To:', record.toId)
    }
  }
  
  // Handle updated records
  for (const [before, after] of Object.values(changes.updated)) {
    if (after.typeName === 'shape' && after.type === 'arrow') {
      console.log('Arrow shape updated:', after.id)
    }
    
    if (after.typeName === 'binding' && after.type === 'arrow') {
      console.log('Arrow binding updated:', after)
    }
  }
  
  // Handle removed records
  for (const record of Object.values(changes.removed)) {
    if (record.typeName === 'shape' && record.type === 'arrow') {
      console.log('Arrow shape deleted:', record.id)
    }
    
    if (record.typeName === 'binding' && record.type === 'arrow') {
      console.log('Arrow binding deleted:', record.id)
    }
  }
}, { source: 'user', scope: 'document' })
```

### Scope Options

- `scope: 'document'` - Persisted records (shapes, bindings)
- `scope: 'session'` - Per-instance, potentially persisted but not synced
- `scope: 'presence'` - Per-instance, synced but not persisted (cursors)
- `scope: 'all'` - All record types

**Arrows and bindings are BOTH `scope: 'document'`**, so your current scope is correct.

---

## Creating Arrows with Bindings

When creating arrows programmatically, you must create both the shape AND the bindings:

```typescript
import { createShapeId, createBindingId } from 'tldraw'

// Step 1: Create the arrow shape
const arrowId = createShapeId()
editor.createShapes([{
  id: arrowId,
  type: 'arrow',
  x: 100,
  y: 100,
  props: {
    start: { x: 0, y: 0 },
    end: { x: 100, y: 100 },
  }
}])

// Step 2: Create bindings (if connecting to shapes)
editor.createBindings([
  {
    type: 'arrow',
    fromId: arrowId,              // The arrow shape
    toId: startShapeId,           // Target shape for start
    props: {
      terminal: 'start',
      normalizedAnchor: { x: 0.5, y: 0.5 },
      isExact: false,
      isPrecise: false,
    }
  },
  {
    type: 'arrow',
    fromId: arrowId,              // The arrow shape
    toId: endShapeId,             // Target shape for end
    props: {
      terminal: 'end',
      normalizedAnchor: { x: 0.5, y: 0.5 },
      isExact: false,
      isPrecise: false,
    }
  }
])
```

---

## Common Pitfalls

### 1. Not Querying Bindings Separately

❌ **Wrong:**
```typescript
const arrows = editor.getCurrentPageShapes().filter(s => s.type === 'arrow')
// This gives you arrow shapes but NO binding information
```

✅ **Correct:**
```typescript
const arrows = editor.getCurrentPageShapes().filter(s => s.type === 'arrow')
const bindings = editor.store.query.records('binding').get()
  .filter(b => b.type === 'arrow')

// Or use the helper
import { getArrowBindings } from '@tldraw/tldraw'
arrows.forEach(arrow => {
  const { start, end } = getArrowBindings(editor, arrow)
  console.log('Start binding:', start)
  console.log('End binding:', end)
})
```

### 2. Filtering Out Binding Records in Listener

❌ **Wrong:**
```typescript
editor.store.listen((entry) => {
  for (const record of Object.values(entry.changes.added)) {
    if (record.typeName === 'shape') {  // ← Ignores bindings!
      console.log('Shape added:', record)
    }
  }
}, { source: 'user', scope: 'document' })
```

✅ **Correct:**
```typescript
editor.store.listen((entry) => {
  for (const record of Object.values(entry.changes.added)) {
    // Handle shapes
    if (record.typeName === 'shape') {
      console.log('Shape added:', record)
    }
    // ALSO handle bindings
    if (record.typeName === 'binding') {
      console.log('Binding added:', record)
    }
  }
}, { source: 'user', scope: 'document' })
```

### 3. Assuming Arrow Props Contain Binding Info

❌ **Wrong:**
```typescript
const arrow = editor.getShape<TLArrowShape>(arrowId)
console.log(arrow.props.boundToStart)  // ❌ This doesn't exist!
```

✅ **Correct:**
```typescript
import { getArrowBindings } from '@tldraw/tldraw'
const arrow = editor.getShape<TLArrowShape>(arrowId)
const bindings = getArrowBindings(editor, arrow)

if (bindings.start) {
  console.log('Bound to shape:', bindings.start.toId)
  console.log('Anchor point:', bindings.start.props.normalizedAnchor)
}
```

### 4. Not Handling Binding Deletions

When shapes are deleted, their bindings are automatically removed. You need to handle both:

```typescript
editor.store.listen((entry) => {
  for (const record of Object.values(entry.changes.removed)) {
    if (record.typeName === 'shape' && record.type === 'arrow') {
      console.log('Arrow shape deleted')
    }
    
    if (record.typeName === 'binding' && record.type === 'arrow') {
      console.log('Arrow binding deleted (target shape may have been removed)')
    }
  }
}, { source: 'user', scope: 'document' })
```

---

## Persistence Strategy

For complete arrow persistence, save and restore BOTH:

### Saving

```typescript
// Get all shapes (including arrows)
const shapes = editor.getCurrentPageShapes()

// Get all bindings (including arrow bindings)
const bindings = editor.store.query.records('binding').get()

const snapshot = {
  shapes: shapes,
  bindings: bindings,
}

// Save to storage
localStorage.setItem('drawing', JSON.stringify(snapshot))
```

### Loading

```typescript
const snapshot = JSON.parse(localStorage.getItem('drawing'))

// Create shapes first
editor.createShapes(snapshot.shapes)

// Then create bindings
editor.createBindings(snapshot.bindings)
```

**Order matters:** Create shapes before bindings, since bindings reference shape IDs.

---

## Why Your Current Approach Fails

### Hypothesis 1: Filtering Out Arrows in Shape Query
**Unlikely.** Test code confirms `getCurrentPageShapes()` returns arrows.

### Hypothesis 2: Not Querying Bindings ✅ MOST LIKELY
**Very likely.** You're getting arrow shapes but not their binding records.

```typescript
// This gives you arrows but NOT their connections
const arrows = editor.getCurrentPageShapes().filter(s => s.type === 'arrow')
console.log(arrows.length)  // 3 arrows ← You're probably seeing this

// You need to ALSO query bindings
const bindings = editor.store.query.records('binding').get()
  .filter(b => b.type === 'arrow')
console.log(bindings.length)  // Should be 1-6 (1-2 per arrow if bound)
```

### Hypothesis 3: Listener Filtering Out Binding Records ✅ MOST LIKELY
**Very likely.** Your listener fires for shape creation, but you might be ignoring binding records:

```typescript
// Your listener probably does this:
editor.store.listen((entry) => {
  for (const record of Object.values(entry.changes.added)) {
    if (record.typeName === 'shape') {  // ← Bindings have typeName: 'binding'
      console.log('New shape:', record)
    }
    // Binding records are being ignored here!
  }
}, { source: 'user', scope: 'document' })
```

### Hypothesis 4: Scope Mismatch
**Unlikely.** Both arrows and bindings are `scope: 'document'`, so this should work.

---

## Testing Recommendations

### Test 1: Verify Arrow Shapes Are Returned

```typescript
console.log('All shapes:', editor.getCurrentPageShapes())
console.log('Arrow shapes:', editor.getCurrentPageShapes().filter(s => s.type === 'arrow'))
```

**Expected:** You should see your 3 arrows.

### Test 2: Verify Bindings Exist

```typescript
const allBindings = editor.store.query.records('binding').get()
console.log('All bindings:', allBindings)

const arrowBindings = allBindings.filter(b => b.type === 'arrow')
console.log('Arrow bindings:', arrowBindings)
```

**Expected:** You should see 1-6 binding records (depending on whether arrows are bound at one or both ends).

### Test 3: Verify Listener Captures Both

```typescript
editor.store.listen((entry) => {
  console.log('=== Store change ===')
  console.log('Source:', entry.source)
  console.log('Changes:', entry.changes)
  
  for (const record of Object.values(entry.changes.added)) {
    console.log('Added record:', {
      typeName: record.typeName,
      type: record.type,
      id: record.id,
    })
  }
}, { source: 'user', scope: 'document' })

// Now create an arrow with bindings
// Watch console output
```

**Expected:** You should see entries for BOTH the arrow shape AND the binding records.

---

## API Reference

### Shape Methods
- `editor.getCurrentPageShapes()` - Returns ALL shapes including arrows
- `editor.isShapeOfType(shape, 'arrow')` - Type guard for arrows
- `editor.getShape(id)` - Get shape by ID

### Binding Methods
- `editor.store.query.records('binding').get()` - Get all bindings
- `editor.createBindings(bindings)` - Create new bindings
- `editor.getBindingsInvolvingShape(shapeId, 'arrow')` - Get bindings for a shape
- `editor.getBindingsToShape(shapeId, 'arrow')` - Get bindings where shape is target

### Helper Functions
- `getArrowBindings(editor, arrow)` - Get both start/end bindings for an arrow
- `getArrowInfo(editor, arrow)` - Get computed arrow geometry and binding info

### Store Listener Options
```typescript
interface StoreListenerOptions {
  source?: 'user' | 'remote'  // Filter by change source
  scope?: 'document' | 'session' | 'presence' | 'all'  // Filter by record scope
}
```

---

## Related Issues & Discussions

- **GitHub Issue #7563**: "Remove hard-coded references to arrow shapes from the editor" - Documents the separation between editor core and arrow-specific behavior
- **Release v2.2.0**: Introduced the bindings system, making arrows just one use case of a generic binding mechanism

---

## Recommended Solution

Based on this research, here's what you should do:

### 1. Update Your Store Listener

```typescript
editor.store.listen((entry) => {
  const { changes } = entry
  
  // Handle ALL record types, not just shapes
  for (const record of Object.values(changes.added)) {
    if (record.typeName === 'shape') {
      handleShapeAdded(record)
    } else if (record.typeName === 'binding') {
      handleBindingAdded(record)
    }
  }
  
  // Do the same for updated and removed
}, { source: 'user', scope: 'document' })
```

### 2. Query Both Shapes AND Bindings for Persistence

```typescript
function saveDrawing() {
  const shapes = editor.getCurrentPageShapes()
  const bindings = editor.store.query.records('binding').get()
  
  return {
    shapes,
    bindings,
  }
}

function loadDrawing(data) {
  // Create shapes first, then bindings
  editor.createShapes(data.shapes)
  editor.createBindings(data.bindings)
}
```

### 3. Use Helper Functions

```typescript
import { getArrowBindings } from '@tldraw/tldraw'

const arrows = editor.getCurrentPageShapes()
  .filter(s => s.type === 'arrow') as TLArrowShape[]

arrows.forEach(arrow => {
  const bindings = getArrowBindings(editor, arrow)
  console.log(`Arrow ${arrow.id}:`)
  console.log('  Start binding:', bindings.start)
  console.log('  End binding:', bindings.end)
})
```

---

## Conclusion

**The root cause is likely:**
1. You're successfully retrieving arrow **shapes** from `getCurrentPageShapes()`
2. But you're NOT querying the separate **binding records** that store the connection information
3. Your store listener fires for arrow creation but you're filtering out binding records

**Fix:**
- Query `editor.store.query.records('binding')` in addition to `getCurrentPageShapes()`
- Update your listener to handle `record.typeName === 'binding'` in addition to shapes
- Use `getArrowBindings(editor, arrow)` helper to easily access binding info

Arrows ARE shapes, but their connections are stored separately as binding records. Both must be handled for full arrow persistence.
