/* eslint-disable @typescript-eslint/no-explicit-any */
import { createShapeId, toRichText } from '@tldraw/tldraw';
import type { TLArrowShape, TLGeoShape, TLShape, TLRichText } from '@tldraw/tldraw';
import type { IDiagram, IDiagramEdge, IDiagramNode } from '../../interfaces/IDrawing';

/**
 * Helper to extract plain text from TLRichText.
 */
function richTextToPlainText(richText: TLRichText | undefined): string {
  if (!richText || !richText.content) return '';
  return richText.content
    .map((paragraph: any) => {
      if (!paragraph.content) return '';
      return paragraph.content
        .map((node: any) => node.text || '')
        .join('');
    })
    .join('\n');
}

/**
 * Maps canonical IDiagram to tldraw shapes.
 */
export function diagramToTldrawShapes(diagram: IDiagram): TLShape[] {
  const shapes: TLShape[] = [];

  diagram.nodes.forEach((node, index) => {
    // Build meta with only JSON-serializable values
    const meta: Record<string, any> = {};
    if (node.kind) meta.kind = node.kind;
    if (node.semantics && Object.keys(node.semantics).length > 0) {
      meta.semantics = JSON.parse(JSON.stringify(node.semantics)); // Deep clone to ensure serializable
    }
    if (node.styleToken) meta.styleToken = node.styleToken;

    // Extract geo shape type from semantics (if stored there)
    const geoType = (node.semantics as any)?.geoType || 'rectangle';

    shapes.push({
      id: createShapeId(node.id),
      type: 'geo',
      x: node.layout.x,
      y: node.layout.y,
      rotation: 0,
      index: `a${index}` as any,
      parentId: 'page:page' as any,
      isLocked: node.layout.locked || false,
      opacity: 1,
      meta,
      props: {
        w: node.layout.w,
        h: node.layout.h,
        geo: geoType,
        color: 'black',
        labelColor: 'black',
        fill: 'none',
        dash: 'draw',
        size: 'm',
        font: 'draw',
        richText: toRichText(node.label || ''),
        align: 'middle',
        verticalAlign: 'middle',
        growY: 0,
        url: '',
      },
      typeName: 'shape',
    } as unknown as TLGeoShape);
  });

  diagram.edges.forEach((edge, index) => {
    // Build meta with only JSON-serializable values
    const meta: Record<string, any> = {};
    if (edge.relation) meta.relation = edge.relation;
    if (edge.styleToken) meta.styleToken = edge.styleToken;

    shapes.push({
      id: createShapeId(edge.id),
      type: 'arrow',
      x: 0,
      y: 0,
      rotation: 0,
      index: `a${diagram.nodes.length + index}` as any,
      parentId: 'page:page' as any,
      isLocked: false,
      opacity: 1,
      meta,
      props: {
        arrowheadStart: 'none',
        arrowheadEnd: 'arrow',
        start: {
          type: 'binding',
          boundShapeId: createShapeId(edge.from),
          normalizedAnchor: { x: 0.5, y: 0.5 },
          isExact: false,
        },
        end: {
          type: 'binding',
          boundShapeId: createShapeId(edge.to),
          normalizedAnchor: { x: 0.5, y: 0.5 },
          isExact: false,
        },
        richText: toRichText(edge.label || ''),
        bend: 0,
        color: 'black',
        labelColor: 'black',
        fill: 'none',
        dash: 'draw',
        size: 'm',
        font: 'draw',
        align: 'middle',
        scale: 1,
      },
      typeName: 'shape',
    } as unknown as TLArrowShape);
  });

  return shapes;
}

/**
 * Maps tldraw shapes back to canonical IDiagram shape data.
 */
export function tldrawShapesToDiagram(shapes: TLShape[], _bindings: any[] = []): IDiagram {
  const nodes: IDiagramNode[] = [];
  const edges: IDiagramEdge[] = [];

  for (const shape of shapes) {
    if (shape.type === 'geo') {
      const props = shape.props as any;
      
      // Capture geo shape type in semantics
      const semantics = (shape.meta?.semantics as any) || {};
      if (props.geo) {
        semantics.geoType = props.geo;
      }

      nodes.push({
        id: shape.id.replace(/^shape:/, ''),
        kind: (shape.meta?.kind as string) || 'block',
        label: richTextToPlainText(props.richText),
        layout: {
          x: shape.x,
          y: shape.y,
          w: props.w,
          h: props.h,
          locked: shape.isLocked,
        },
        semantics,
        styleToken: (shape.meta?.styleToken as string) || '',
      });
      continue;
    }

    if (shape.type === 'arrow') {
      const props = shape.props as any;
      if (props.start?.boundShapeId && props.end?.boundShapeId) {
        edges.push({
          id: shape.id.replace(/^shape:/, ''),
          from: props.start.boundShapeId.replace(/^shape:/, ''),
          to: props.end.boundShapeId.replace(/^shape:/, ''),
          relation: (shape.meta?.relation as string) || 'association',
          label: richTextToPlainText(props.richText),
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
