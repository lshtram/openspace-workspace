/**
 * @implements REQ-DFR-008
 */
export interface DiffEditorHandoff {
  sourceModality: 'diff-review';
  target: { path: string };
  location: EditorLocation;
  side: 'before' | 'after';
  handoffId: string;
}

/**
 * @implements REQ-EDT-007
 */
export interface EditorLocation {
  path: string;
  startLine: number;
  startColumn?: number;
  endLine?: number;
  endColumn?: number;
}

/**
 * Extended history entry that supports diff anchor tracking for jump-back.
 * @implements REQ-DFR-010
 */
export interface NavigationHistoryEntry extends EditorLocation {
  source: 'agent-link' | 'diff-handoff' | 'presentation-link' | 'manual';
  // Diff-specific anchor info for REQ-DFR-010
  diffAnchor?: {
    side: 'before' | 'after';
    handoffId: string;
  };
}

/**
 * @implements REQ-EDT-005
 * @implements REQ-DFR-008
 */
export interface OpenFileAtOptions {
  source?: 'agent-link' | 'diff-handoff' | 'presentation-link' | 'manual';
  focusPolicy?: 'auto-focus' | 'suggest-only' | 'disabled';
  splitMode?: 'side-by-side' | 'reuse-active-pane';
  applyHighlight?: boolean;
  highlightId?: string;
  // REQ-DFR-008: side context for diff handoff
  side?: 'before' | 'after';
}

/**
 * @implements REQ-EDT-008
 */
export interface HighlightRange {
  id: string;
  path: string;
  startLine: number;
  startColumn?: number;
  endLine?: number;
  endColumn?: number;
  actor: 'agent' | 'system';
  reason: 'explanation' | 'diff-handoff' | 'link-follow';
}

/**
 * @implements REQ-EDT-004
 */
export interface IViewerAdapter {
  id: string;
  name: string;
  extensions: string[];
  component: React.ComponentType<{ path: string }>;
}

/**
 * @implements REQ-EDT-004
 */
export interface IViewerRegistry {
  register(adapter: IViewerAdapter): void;
  getViewerForPath(path: string): IViewerAdapter | null;
  listAdapters(): IViewerAdapter[];
}
