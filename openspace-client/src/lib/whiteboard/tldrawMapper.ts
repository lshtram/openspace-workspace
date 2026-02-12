import { 
  createShapeId, 
} from '@tldraw/tldraw';
import type { 
  TLShape, 
  TLGeoShape, 
  TLArrowShape,
  // TLShapeId, // Not used explicitly
  IndexKey
} from '@tldraw/tldraw';
import type { IDiagram, IDiagramNode, IDiagramEdge } from '../../interfaces/IDrawing';

/**
 * Maps our canonical IDiagram to tldraw shapes.
 */
export function diagramToTldrawShapes(diagram: IDiagram): TLShape[] {
  const shapes: TLShape[] = [];
  
  // Nodes
  diagram.nodes.forEach((node, i) => {
    shapes.push({
      id: createShapeId(node.id),
      type: 'geo',
      x: node.layout.x,
      y: node.layout.y,
      rotation: 0,
      index: `a${i}` as IndexKey,
      parentId: 'page:page' as any,
      isLocked: node.layout.locked || false,
      opacity: 1,
      meta: {
        kind: node.kind,
        semantics: node.semantics,
        styleToken: node.styleToken
      },
      props: {
        w: node.layout.w,
        h: node.layout.h,
        geo: 'rectangle',
        color: 'black',
        labelColor: 'black',
        fill: 'none',
        dash: 'draw',
        size: 'm',
        font: 'draw',
        text: node.label,
        align: 'middle',
        verticalAlign: 'middle',
        growY: 0,
        url: '',
      },
      typeName: 'shape'
    } as unknown as TLGeoShape);
  });

  // Edges
  diagram.edges.forEach((edge, i) => {
    shapes.push({
      id: createShapeId(edge.id),
      type: 'arrow',
      x: 0,
      y: 0,
      rotation: 0,
      index: `a${diagram.nodes.length + i}` as IndexKey,
      parentId: 'page:page' as any,
      isLocked: false,
      opacity: 1,
      meta: {
        relation: edge.relation,
        styleToken: edge.styleToken
      },
      props: {
        arrowheadStart: 'none',
        arrowheadEnd: 'arrow',
        start: { 
          type: 'binding', 
          boundShapeId: createShapeId(edge.from), 
          normalizedAnchor: { x: 0.5, y: 0.5 }, 
          isExact: false 
        },
        end: { 
          type: 'binding', 
          boundShapeId: createShapeId(edge.to), 
          normalizedAnchor: { x: 0.5, y: 0.5 }, 
          isExact: false 
        },
        text: edge.label || '',
        bend: 0,
        color: 'black',
        labelColor: 'black',
        fill: 'none',
        dash: 'draw',
        size: 'm',
        font: 'draw',
        align: 'middle',
        scale: 1
      },
      typeName: 'shape'
    } as unknown as TLArrowShape);
  });

  return shapes;
}

/**
 * Maps tldraw shapes back to our canonical IDiagram.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function tldrawShapesToDiagram(shapes: TLShape[], _bindings: any[] = []): IDiagram {
  const nodes: IDiagramNode[] = [];
  const edges: IDiagramEdge[] = [];

  for (const shape of shapes) {
    if (shape.type === 'geo') {
      const props = shape.props as any;
      nodes.push({
        id: shape.id.replace(/^shape:/, ''),
        kind: (shape.meta?.kind as string) || 'block',
        label: props.text || '',
        layout: {
          x: shape.x,
          y: shape.y,
          w: props.w,
          h: props.h,
          locked: shape.isLocked,
        },
        semantics: (shape.meta?.semantics as any) || {},
        styleToken: (shape.meta?.styleToken as string) || '',
      });
    } else if (shape.type === 'arrow') {
      const props = shape.props as any;
      // Only include edges that are bound to nodes
      if (props.start?.boundShapeId && props.end?.boundShapeId) {
        edges.push({
          id: shape.id.replace(/^shape:/, ''),
          from: props.start.boundShapeId.replace(/^shape:/, ''),
          to: props.end.boundShapeId.replace(/^shape:/, ''),
          relation: (shape.meta?.relation as string) || 'association',
          label: props.text || '',
          styleToken: (shape.meta?.styleToken as string) || '',
        });
      }
    }
  }

  return {
    schemaVersion: '2.0.0',
    diagramType: 'basic',
    metadata: {
      title: 'Untitled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    style: {
      theme: 'default',
      tokens: {},
    },
    nodes,
    edges,
    groups: [],
    constraints: [],
    sourceRefs: {},
  };
}
