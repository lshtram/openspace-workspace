/* eslint-disable @typescript-eslint/no-explicit-any */
import { createShapeId, createBindingId, toRichText } from '@tldraw/tldraw';
import type { TLArrowShape, TLGeoShape, TLShape, TLRichText, TLBinding } from '@tldraw/tldraw';
import type { IDiagram, IDiagramEdge, IDiagramNode } from '../../interfaces/IDrawing';
import { createLogger } from '../logger';

const log = createLogger('tldrawMapper');

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
 * Maps canonical IDiagram to tldraw shapes and bindings.
 */
export function diagramToTldrawShapes(diagram: IDiagram): { shapes: TLShape[], bindings: TLBinding[] } {
  const shapes: TLShape[] = [];
  const bindings: TLBinding[] = [];

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

    // Check for special tldraw kinds
    if (node.kind && node.kind.startsWith('tldraw.')) {
      const type = node.kind.replace('tldraw.', '');
      const semantics = node.semantics || {};
      
      const commonProps = {
        isLocked: node.layout.locked || false,
        opacity: 1,
        meta,
        index: `a${index}` as any,
        parentId: 'page:page' as any,
        typeName: 'shape',
      };

      if (type === 'draw' || type === 'highlight') {
        shapes.push({
          id: createShapeId(node.id),
          type,
          x: node.layout.x,
          y: node.layout.y,
          rotation: 0,
          ...commonProps,
          props: {
            segments: semantics.segments || [],
            color: semantics.color || 'black',
            fill: semantics.fill || 'none',
            dash: semantics.dash || 'draw',
            size: semantics.size || 'm',
            isComplete: semantics.isComplete ?? true,
            isClosed: semantics.isClosed ?? false,
            isPen: semantics.isPen ?? false,
          },
        } as any);
        return; // Done with this node
      }

      if (type === 'text') {
        shapes.push({
          id: createShapeId(node.id),
          type: 'text',
          x: node.layout.x,
          y: node.layout.y,
          rotation: 0,
          ...commonProps,
          props: {
            // Unexpected property 'text' -> using 'richText'
            richText: toRichText(node.label || ''),
            font: semantics.font || 'draw',
            size: semantics.size || 'm',
            textAlign: semantics.align || 'start',
            color: semantics.color || 'black',
            scale: semantics.scale || 1,
            autoSize: true,
            w: 100,
          },
        } as any);
        return;
      }

      if (type === 'note') {
        shapes.push({
          id: createShapeId(node.id),
          type: 'note',
          x: node.layout.x,
          y: node.layout.y,
          rotation: 0,
          ...commonProps,
          props: {
            // Use richText for Note shapes
            richText: toRichText(node.label || ''),
            font: semantics.font || 'draw',
            size: semantics.size || 'm',
            align: semantics.align || 'middle',
            color: semantics.color || 'black',
            verticalAlign: semantics.verticalAlign || 'middle',
            growY: semantics.growY || 0,
            url: '',
          },
        } as any);
        return;
      }

      if (type === 'image') {
        shapes.push({
          id: createShapeId(node.id),
          type: 'image',
          x: node.layout.x,
          y: node.layout.y,
          rotation: 0,
          ...commonProps,
          props: {
            w: node.layout.w,
            h: node.layout.h,
            assetId: semantics.assetId,
            url: semantics.url || '',
          },
        } as any);
        return;
      }
    }

    // Default: Map to Geo shape
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
    // Find the source and target nodes to compute arrow position
    const fromNode = diagram.nodes.find(n => n.id === edge.from);
    const toNode = diagram.nodes.find(n => n.id === edge.to);
    
    if (!fromNode || !toNode) {
      console.warn(`[tldrawMapper] Skipping edge ${edge.id} - missing nodes (from: ${edge.from}, to: ${edge.to})`);
      return;
    }

    // Calculate center points of the shapes
    const fromCenter = {
      x: fromNode.layout.x + fromNode.layout.w / 2,
      y: fromNode.layout.y + fromNode.layout.h / 2,
    };
    const toCenter = {
      x: toNode.layout.x + toNode.layout.w / 2,
      y: toNode.layout.y + toNode.layout.h / 2,
    };

    // Build meta with only JSON-serializable values
    const meta: Record<string, any> = {};
    if (edge.relation) meta.relation = edge.relation;
    if (edge.styleToken) meta.styleToken = edge.styleToken;

    const arrowId = createShapeId(edge.id);

    // Create arrow shape
    shapes.push({
      id: arrowId,
      type: 'arrow',
      x: fromCenter.x,
      y: fromCenter.y,
      rotation: 0,
      index: `a${diagram.nodes.length + index}` as any,
      parentId: 'page:page' as any,
      isLocked: false,
      opacity: 1,
      meta,
      props: {
        arrowheadStart: 'none',
        arrowheadEnd: 'arrow',
        start: { x: 0, y: 0 },
        end: {
          x: toCenter.x - fromCenter.x,
          y: toCenter.y - fromCenter.y,
        },
        richText: toRichText(edge.label || ''),
        bend: 0,
        color: 'black',
        labelColor: 'black',
        fill: 'none',
        dash: 'draw',
        size: 'm',
        font: 'draw',
        scale: 1,
      },
      typeName: 'shape',
    } as unknown as TLArrowShape);

    // Create bindings
    // Start binding
    bindings.push({
      id: createBindingId(edge.id + '_start'),
      typeName: 'binding',
      type: 'arrow',
      fromId: arrowId,
      toId: createShapeId(fromNode.id),
      meta: {},
      props: {
        isPrecise: false,
        isExact: false,
        normalizedAnchor: { x: 0.5, y: 0.5 },
        terminal: 'start',
      },
    } as unknown as TLBinding);

    // End binding
    bindings.push({
      id: createBindingId(edge.id + '_end'),
      typeName: 'binding',
      type: 'arrow',
      fromId: arrowId,
      toId: createShapeId(toNode.id),
      meta: {},
      props: {
        isPrecise: false,
        isExact: false,
        normalizedAnchor: { x: 0.5, y: 0.5 },
        terminal: 'end',
      },
    } as unknown as TLBinding);
  });

  return { shapes, bindings };
}

/**
 * Maps tldraw shapes back to canonical IDiagram shape data.
 * 
 * In tldraw v2, arrows and their connections are stored separately:
 * - Arrow shapes have the visual properties (position, style, etc.)
 * - Bindings have the connection info (which shapes are connected)
 * 
 * Bindings have:
 * - fromId: the arrow shape ID
 * - toId: the target shape ID
 * - props.terminal: 'start' or 'end' (which end of the arrow)
 */
export function tldrawShapesToDiagram(shapes: TLShape[], bindings: any[] = []): IDiagram {
  const nodes: IDiagramNode[] = [];
  const edges: IDiagramEdge[] = [];

  log.debug('Processing shapes:', shapes.length, 'bindings:', bindings.length);

  // Process nodes (geo, draw, text, note, etc.)
  for (const shape of shapes) {
    if (shape.type === 'geo') {
      const props = shape.props as any;
      const semantics: any = { ...(shape.meta?.semantics as any) };
      if (props.geo) semantics.geoType = props.geo;

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

    if (shape.type === 'draw' || shape.type === 'highlight') {
      const props = shape.props as any;
      nodes.push({
        id: shape.id.replace(/^shape:/, ''),
        kind: `tldraw.${shape.type}`,
        label: '',
        layout: {
          x: shape.x,
          y: shape.y,
          w: props.w || 0, // Draw shapes might not have explicit w/h in some versions
          h: props.h || 0,
          locked: shape.isLocked,
        },
        semantics: {
          segments: props.segments,
          color: props.color,
          fill: props.fill,
          dash: props.dash,
          size: props.size,
          isComplete: props.isComplete,
          isClosed: props.isClosed,
          isPen: props.isPen,
        },
        styleToken: (shape.meta?.styleToken as string) || '',
      });
      continue;
    }

    if (shape.type === 'text') {
      const props = shape.props as any;
      nodes.push({
        id: shape.id.replace(/^shape:/, ''),
        kind: 'tldraw.text',
        label: richTextToPlainText(props.richText), // Use richText helper
        layout: {
          x: shape.x,
          y: shape.y,
          w: props.w || 0,
          h: props.h || 0,
          locked: shape.isLocked,
        },
        semantics: {
          font: props.font,
          size: props.size,
          align: props.textAlign,
          color: props.color,
          scale: props.scale,
        },
        styleToken: (shape.meta?.styleToken as string) || '',
      });
      continue;
    }

    if (shape.type === 'note') {
      const props = shape.props as any;
      nodes.push({
        id: shape.id.replace(/^shape:/, ''),
        kind: 'tldraw.note',
        label: richTextToPlainText(props.richText), // Use richText helper
        layout: {
          x: shape.x,
          y: shape.y,
          w: props.w || 200,
          h: props.h || 200,
          locked: shape.isLocked,
        },
        semantics: {
          font: props.font,
          size: props.size,
          align: props.align,
          color: props.color,
          verticalAlign: props.verticalAlign,
          growY: props.growY,
        },
        styleToken: (shape.meta?.styleToken as string) || '',
      });
      continue;
    }

    if (shape.type === 'image') {
      const props = shape.props as any;
      nodes.push({
        id: shape.id.replace(/^shape:/, ''),
        kind: 'tldraw.image',
        label: '',
        layout: {
          x: shape.x,
          y: shape.y,
          w: props.w,
          h: props.h,
          locked: shape.isLocked,
        },
        semantics: {
          assetId: props.assetId,
          url: props.url,
        },
        styleToken: (shape.meta?.styleToken as string) || '',
      });
      continue;
    }
  }

  // Process edges (arrows with bindings)
  // Group bindings by arrow ID
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
      
      log.debug('Binding:', {
        arrowId,
        targetId,
        terminal,
        connections: bindingsByArrow.get(arrowId)
      });
    }
  }

  // Now process arrow shapes and match them with their bindings
  for (const shape of shapes) {
    if (shape.type === 'arrow') {
      const connections = bindingsByArrow.get(shape.id);
      
      log.debug('Processing arrow:', shape.id, 'connections:', connections);
      
      if (connections?.start && connections?.end) {
        const props = shape.props as any;
        edges.push({
          id: shape.id.replace(/^shape:/, ''),
          from: connections.start.replace(/^shape:/, ''),
          to: connections.end.replace(/^shape:/, ''),
          relation: (shape.meta?.relation as string) || 'association',
          label: richTextToPlainText(props.richText),
          styleToken: (shape.meta?.styleToken as string) || '',
        });
        log.debug('Created edge:', edges[edges.length - 1]);
      } else {
        log.debug('Skipping unbound arrow:', shape.id, 'connections:', connections);
      }
    }
  }

  log.debug('Final result - nodes:', nodes.length, 'edges:', edges.length);

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
