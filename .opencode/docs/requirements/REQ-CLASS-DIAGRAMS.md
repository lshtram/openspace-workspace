# REQ-CLASS-DIAGRAMS: Class Diagram Support

## 1. Executive Summary
Extend the Polymorphic Whiteboard Modality to support Mermaid Class Diagrams. This allows users and agents to model object-oriented structures, database schemas, and system architectures using standard class diagram notation with full bidirectional synchronization.

## 2. Requirements

### 2.1. Logical Representation (GraphIR)
- **Node Structure**: Extend `GraphNode` to support "sections" (Header, Attributes, Methods).
- **Relationships**: Support standard Mermaid relationship types:
  - Inheritance (`<|--`)
  - Composition (`*--`)
  - Aggregation (`o--`)
  - Association (`-->` or `--`)
  - Dependency (`..>`)
- **Visibility**: Support visibility modifiers: `+` (public), `-` (private), `#` (protected), `~` (package).

### 2.2. Parsing (`mermaid-parser.ts`)
- Implement `parseClassDiagram` to extract class definitions and relationships.
- Support both `class Name { ... }` and individual line declarations like `Name : +String attr`.
- Preserve attribute/method types and visibility.

### 2.3. Layout (`layout.ts`)
- Implement `ClassStrategy` using Dagre as the base engine.
- Default to "Top-Down" (TD) orientation for class hierarchies.
- Ensure sufficient vertical spacing for multi-section class boxes.

### 2.4. Visual Generation (`excalidraw-generator.ts`)
- **Multi-Segment Rendering**: Classes must be rendered as a single group containing:
  - Outer container rectangle.
  - Two horizontal separator lines.
  - Three distinct text areas (Class Name, Attributes, Methods).
- **Relationship Styling**:
  - Inheritance: Solid line with hollow triangle.
  - Composition: Solid line with filled diamond.
  - Aggregation: Solid line with hollow diamond.
  - Dependency: Dashed line with arrow.

### 2.5. Bidirectional Reconciliation (`reconcile.ts` & `excalidraw-parser.ts`)
- Parse "split-box" groups back into single logical Class nodes.
- Maintain stability of attributes even if the user manually resizes the class box.
- Support "Unmanaged" class extensions (e.g., user adding a note or custom shape next to a class).

## 3. Success Criteria
- [ ] Valid Mermaid `classDiagram` code renders as structured class boxes in Excalidraw.
- [ ] Modifying an attribute in Excalidraw (text edit) correctly updates the Mermaid code.
- [ ] Inheritance relationships are rendered with the correct hollow-triangle arrowhead.
- [ ] Round-trip (Excalidraw -> Mermaid -> Excalidraw) preserves all class internal structure.
