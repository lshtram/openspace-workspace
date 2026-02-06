/**
 * Logical Coordinate Space units (0-10000) to remain viewport-agnostic.
 * This ensures that a drawing made on a 4K monitor looks the same on a mobile screen.
 */
export interface IGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // Degrees
  scaleX?: number;
  scaleY?: number;
}

/**
 * Supported shape types for the dual-mode whiteboard.
 */
export type ShapeType = 'path' | 'rect' | 'ellipse' | 'arrow' | 'text' | 'image' | 'group';

/**
 * Image data for the whiteboard.
 */
export interface IImageProps {
  src: string;        // URL or base64
  naturalWidth: number;
  naturalHeight: number;
  alt?: string;
}

/**
 * Style properties for shapes.
 */
export interface IShapeStyle {
  stroke: string;
  fill?: string;
  strokeWidth: number;
  opacity: number;
  dash?: 'solid' | 'dashed' | 'dotted';
}

/**
 * Atomic unit of the whiteboard content.
 */
export interface IShape {
  id: string;
  type: ShapeType;
  geometry: IGeometry;
  data: {
    points?: Array<[x: number, y: number, pressure: number]>; // For 'path'
    text?: string;                                           // For 'text'
    image?: IImageProps;                                     // For 'image'
    style: IShapeStyle;
  };
  parentId?: string; // For grouping
  index: string;     // Fractional index for z-ordering (tldraw style)
  metadata?: Record<string, unknown>;
}

/**
 * Incremental update patterns for state synchronization.
 */
export type ShapeDelta = 
  | { type: 'CREATE'; shape: IShape }
  | { type: 'UPDATE'; id: string; patch: Partial<IShape> }
  | { type: 'DELETE'; id: string };
