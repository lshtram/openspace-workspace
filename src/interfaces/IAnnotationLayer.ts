import type { IWhiteboard } from './IWhiteboard';

/**
 * Anchoring logic for pinning annotations to non-spatial content.
 */
export interface IAnchor {
  type: 'spatial' | 'temporal' | 'contextual';
  /**
   * selector examples: 
   * - 'line:15-20' (Code)
   * - 'timestamp:01:24' (Video/Audio)
   * - '#submit-button' (UI)
   */
  selector: string;
}

/**
 * A specialized Whiteboard that acts as a transparent overlay.
 * It maps 'World Coordinates' of a host modality to its own 'Logical Coordinate Space'.
 */
export interface IAnnotationLayer extends IWhiteboard {
  /** The ID of the modality being annotated (e.g., 'monaco-editor-1') */
  readonly targetModalityId: string;
  
  /** 
   * Anchors a shape to a specific element in the underlying modality.
   * If the underlying content moves (e.g., scrolling code), the shape moves with it.
   */
  anchorShape(shapeId: string, anchor: IAnchor): void;
  
  /**
   * Toggles the visibility of the redline layer without destroying the content.
   */
  setVisible(visible: boolean): void;
}
