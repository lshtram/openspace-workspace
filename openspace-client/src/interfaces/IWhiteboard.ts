import type { IModality } from './IModality';
import type { IShape, ShapeDelta } from './IGeometry';

export type WhiteboardTool = 'select' | 'draw' | 'shape' | 'eraser' | 'hand' | 'image';

/**
 * Projection mode determines how coordinates are interpreted.
 * 'world': Absolute coordinates (infinite canvas).
 * 'normalized': 0-10000 coordinates (relative to a fixed container/image).
 */
export type ProjectionMode = 'world' | 'normalized';

/**
 * Current state of the whiteboard for session persistence.
 */
export interface IWhiteboardState {
  shapes: IShape[];
  viewport: { x: number; y: number; zoom: number };
  activeTool: WhiteboardTool;
  projectionMode: ProjectionMode;
}

/**
 * Capabilities of the specific whiteboard implementation.
 */
export interface IWhiteboardCapabilities {
  infiniteCanvas: boolean;
  layers: boolean;
  exportFormats: ('svg' | 'png' | 'json')[];
}

export interface IWhiteboard extends IModality<IWhiteboardState, IWhiteboardCapabilities> {
  /** 
   * Active tool selection. 
   */
  setTool(tool: WhiteboardTool): void;
  
  /**
   * Set the coordinate projection mode.
   * Annotation layers typically use 'normalized'.
   * Main whiteboards typically use 'world'.
   */
  setProjectionMode(mode: ProjectionMode): void;

  /** 
   * Get all shapes currently on the whiteboard.
   */
  getShapes(): IShape[];
  
  /**
   * Apply incremental changes.
   */
  applyDeltas(deltas: ShapeDelta[]): void;
  
  /**
   * Zoom and pan controls.
   */
  zoomToFit(): void;
  setViewport(x: number, y: number, zoom: number): void;
  /** Get current viewport bounds in world coordinates */
  getViewport(): { x: number; y: number; width: number; height: number; zoom: number };
  
  /**
   * Export the current view.
   */
  exportToBlob(format: 'svg' | 'png'): Promise<Blob>;

  /**
   * Add an image to the whiteboard.
   */
  addImage(src: string, x: number, y: number): Promise<string>; // Returns shapeId

  /**
   * Semantic Grouping.
   * Treats multiple shapes as a single logical unit (Visual AST Node).
   */
  groupShapes(ids: string[]): string; // Returns groupId
  ungroupShapes(groupId: string): string[]; // Returns childrenIds
}
