# TECHSPEC-CLASS-DIAGRAMS: Class Diagram Implementation

## 1. Data Model Extensions (`types.ts`)

To support multi-segment class boxes without breaking existing flowchart/sequence logic, we will introduce "Sections" to `GraphNode`.

```typescript
export interface ClassMember {
  text: string;
  visibility?: '+' | '-' | '#' | '~';
  static?: boolean;
  abstract?: boolean;
}

export interface GraphNode {
  // ... existing fields ...
  /** Sections for Class Diagrams: [Header, Attributes, Methods] */
  sections?: {
    attributes: ClassMember[];
    methods: ClassMember[];
  };
}
```

## 2. Parsing Logic (`mermaid-parser.ts`)

The `parseClassDiagram` function will use a simple regex-based state machine:
1. **Class Block Detection**: `class Name { ... }`
2. **Member Detection**: 
   - Attributes: Identified by absence of `()`
   - Methods: Identified by presence of `()`
3. **Relationship Detection**: Map Mermaid arrows to `GraphEdge` with specific `endArrow` and `style.strokeStyle`.
   - `<|--` -> `endArrow: 'triangle'`, `style.backgroundColor: '#ffffff'` (hollow)

## 3. Layout Strategy (`layout.ts`)

`ClassStrategy` will:
1. Use **Dagre** for the macro-layout (positioning the class boxes).
2. **Section-Aware Sizing**: Calculate node `height` as:
   `HeaderHeight + (AttrCount * LineHeight) + (MethodCount * LineHeight) + Padding`.
3. Default to `rankdir: 'TD'` to show hierarchies clearly.

## 4. Visual Generation (`excalidraw-generator.ts`)

The `generateNodeElements` function will be updated to handle nodes with `sections`:
1. **Group Creation**: Generate a single Excalidraw group for the class.
2. **Separator Lines**: Calculate Y-offsets for two horizontal lines based on text block heights.
3. **Metadata**: Tag the outer container with `customData.type: 'class-container'` and `customData.nodeId`.
4. **Text Elements**: Three distinct `text` elements bound to the container, with specific `y` offsets.

## 5. Bidirectional Sync (`excalidraw-parser.ts`)

The parser must "re-assemble" the class node:
1. **Group Recognition**: When it sees a group containing a 'class-container', it gathers all text elements in that group.
2. **Text Splitting**: The three text elements are mapped back to `label` (header), `attributes`, and `methods`.
3. **Diffing**: The `diffGraphs` logic will treat a change in any section as an `updated` node, triggering a re-sync of the Mermaid code.

## 6. Implementation Plan
1. **Phase 1**: Update `types.ts` and `mermaid-parser.ts`.
2. **Phase 2**: Update `layout.ts` with `ClassStrategy`.
3. **Phase 3**: Implement the "Composite" generator in `excalidraw-generator.ts`.
4. **Phase 4**: Update `excalidraw-parser.ts` to handle composite groups.
