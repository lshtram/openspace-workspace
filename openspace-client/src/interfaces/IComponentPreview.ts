import type { IModality } from './IModality';

export interface IComponentPreviewState {
  code: string;
  language: 'react' | 'vue' | 'html';
  viewportSize: { width: number; height: number };
}

/**
 * A non-production sandbox for rendering AI-generated UI components.
 */
export interface IComponentPreview extends IModality<IComponentPreviewState> {
  /** Render a component from source code */
  render(code: string, language?: string): Promise<void>;
  
  /** Update current view with specific props or state (if supported) */
  update(patch: unknown): void;
  
  /** Take a screenshot of the rendered component for agent verification */
  captureSnapshot(): Promise<string>; // Returns base64 or URL
  
  /** Clear the sandbox */
  reset(): void;
}
