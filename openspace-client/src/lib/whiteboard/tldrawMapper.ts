export interface TldrawShape {
  id: string
  type: string
  x: number
  y: number
  props?: Record<string, unknown>
}

export interface TldrawBinding {
  id: string
  fromId: string
  toId: string
}

export interface DiagramLike {
  nodes?: Array<{
    id: string
    label?: string
    layout?: { x: number; y: number; w: number; h: number }
  }>
  edges?: Array<{ id: string; from: string; to: string; label?: string }>
}

export function diagramToTldrawShapes(diagram: DiagramLike): {
  shapes: TldrawShape[]
  bindings: TldrawBinding[]
} {
  const shapes: TldrawShape[] = (diagram.nodes ?? []).map((node) => ({
    id: node.id,
    type: 'geo',
    x: node.layout?.x ?? 0,
    y: node.layout?.y ?? 0,
    props: {
      text: node.label ?? '',
      w: node.layout?.w ?? 160,
      h: node.layout?.h ?? 72,
    },
  }))

  return { shapes, bindings: [] }
}

export function tldrawShapesToDiagram(
  shapes: TldrawShape[],
  _bindings: TldrawBinding[],
): DiagramLike {
  return {
    nodes: shapes.map((shape) => ({
      id: shape.id,
      label: typeof shape.props?.text === 'string' ? shape.props.text : '',
      layout: {
        x: shape.x,
        y: shape.y,
        w: typeof shape.props?.w === 'number' ? shape.props.w : 160,
        h: typeof shape.props?.h === 'number' ? shape.props.h : 72,
      },
    })),
    edges: [],
  }
}
