import React, { useEffect, useRef, useCallback } from 'react';
import Editor, { useMonaco, type OnMount } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import { useFileTabs } from '../context/FileTabsContext';
import { useHighlight } from '../context/HighlightContext';
import { useNavigation } from '../hooks/useNavigation';
import { useViewerRegistry } from '../context/ViewerRegistryContext';
import { storage } from '../utils/storage';
import { createLogger } from '../lib/logger';

const log = createLogger('EditorFrame');

interface TabState {
  model: monaco.editor.ITextModel;
  viewState: monaco.editor.ICodeEditorViewState | null;
}

/**
 * @implements REQ-EDT-001
 * @implements REQ-EDT-002
 * @implements REQ-EDT-006
 * @implements REQ-EDT-007
 * @implements REQ-EDT-011
 * @implements REQ-EDT-013
 * @implements REQ-EDT-017
 * @implements REQ-EDT-019
 * @implements REQ-EDT-020
 */
export const EditorFrame: React.FC = () => {
  const { activeFilePath, openFiles, closeFile, setActiveFile } = useFileTabs();
  const { highlights, clearAllAgentHighlights } = useHighlight();
  const { saveActiveFile, jumpBack, hasHistory } = useNavigation();
  const { getViewerForPath } = useViewerRegistry();
  const monacoInstance = useMonaco();
  const [editor, setEditor] = React.useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  
  const [viewMode, setViewMode] = React.useState<'source' | 'rendered'>('source');
  
  // REQ-EDT-020: Appearance controls
  const [appearance, setAppearance] = React.useState(storage.getEditorAppearance());

  // Per-tab runtime state: models and view states
  const tabRegistryRef = useRef<Map<string, TabState>>(new Map());
  const activeTabRef = useRef<string | null>(null);

  const activeFile = openFiles.find(f => f.path === activeFilePath);
  const viewer = activeFilePath ? getViewerForPath(activeFilePath) : null;

  // Derive effective view mode
  const effectiveViewMode = viewer ? viewMode : 'source';

  // 1. Manage Models and Tab Switching
  /**
   * @implements REQ-EDT-002
   * @implements REQ-EDT-019
   */
  useEffect(() => {
    if (!monacoInstance || !editor || !activeFilePath) return;

    const registry = tabRegistryRef.current;
    
    // Ensure model exists for active file
    if (activeFile && !registry.has(activeFilePath)) {
      const model = monacoInstance.editor.createModel(
        activeFile.content || '',
        undefined, // Auto-detect language
        monacoInstance.Uri.file(activeFilePath)
      );
      registry.set(activeFilePath, { model, viewState: null });
    }

    const prevPath = activeTabRef.current;
    if (prevPath === activeFilePath) return;

    // Save previous view state
    if (prevPath) {
      const prevState = registry.get(prevPath);
      if (prevState) {
        prevState.viewState = editor.saveViewState();
      }
    }

    // Switch model
    const nextState = registry.get(activeFilePath);
    if (nextState) {
      editor.setModel(nextState.model);
      if (nextState.viewState) {
        editor.restoreViewState(nextState.viewState);
      }
      activeTabRef.current = activeFilePath;
    }
  }, [activeFilePath, activeFile, monacoInstance, editor]);

  // Update editor options when appearance changes
  useEffect(() => {
    if (editor) {
      editor.updateOptions({
        fontSize: appearance.fontSize,
      });
    }
  }, [appearance, editor]);

  // 2. Handle Highlights
  /**
   * @implements REQ-EDT-007
   * @implements REQ-EDT-013
   */
  const decorationIdsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!editor || !activeFilePath) return;

    const relevantHighlights = highlights.filter(h => h.path === activeFilePath);
    
    // Apply decorations
    const newDecorations: monaco.editor.IModelDeltaDecoration[] = relevantHighlights.map(h => ({
      range: {
        startLineNumber: h.startLine,
        startColumn: h.startColumn || 1,
        endLineNumber: h.endLine || h.startLine,
        endColumn: h.endColumn || 1
      },
      options: {
        isWholeLine: !h.startColumn && !h.endColumn,
        className: h.actor === 'agent' ? 'bg-agent-highlight/20 border-l-4 border-agent-highlight' : 'bg-system-highlight/20 border-l-4 border-system-highlight',
        minimap: {
          color: h.actor === 'agent' ? '#3b82f6' : '#94a3b8',
          position: 1 // monaco.editor.MinimapPosition.Inline
        }
      }
    }));

    decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, newDecorations);

    // Reveal the last highlight
    if (relevantHighlights.length > 0) {
      const last = relevantHighlights[relevantHighlights.length - 1];
      editor.revealLineInCenter(last.startLine);
      editor.setSelection({
        startLineNumber: last.startLine,
        startColumn: last.startColumn || 1,
        endLineNumber: last.endLine || last.startLine,
        endColumn: last.endColumn || 1
      });
    }
  }, [highlights, activeFilePath, editor]);

  /**
   * @implements REQ-EDT-017
   */
  const saveActiveFileAs = useCallback(async () => {
    if (!activeFilePath || !editor) return;
    const newPath = window.prompt('Save As - Enter new path:', activeFilePath);
    if (newPath && newPath !== activeFilePath) {
      log.debug('Saving as:', { from: activeFilePath, to: newPath });
      // In a real app, this would create a new file and maybe open it
      // openFile({ path: newPath, name: newPath.split('/').pop()!, content: editor.getValue() });
    }
  }, [activeFilePath, editor]);

  // 3. Keyboard shortcuts
  /**
   * @implements REQ-EDT-006
   * @implements REQ-EDT-010
   * @implements REQ-EDT-017
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to clear highlights
      if (e.key === 'Escape') {
        clearAllAgentHighlights();
      }

      // Mod+S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (editor) {
          if (e.shiftKey) {
            saveActiveFileAs();
          } else {
            saveActiveFile(editor.getValue());
          }
        }
      }

      // Mod+W to close
      if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
        e.preventDefault();
        if (activeFilePath) {
          closeFile(activeFilePath);
        }
      }

      // Switch tabs (Mod+1, Mod+2, ...)
      if ((e.metaKey || e.ctrlKey) && /^[1-9]$/.test(e.key)) {
        const index = parseInt(e.key) - 1;
        if (openFiles[index]) {
          e.preventDefault();
          setActiveFile(openFiles[index].path);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearAllAgentHighlights, activeFilePath, closeFile, openFiles, setActiveFile, saveActiveFile, saveActiveFileAs, editor]);

  const handleEditorMount: OnMount = (editorInstance) => {
    setEditor(editorInstance);
  };

  /**
   * @implements REQ-EDT-020
   */
  const adjustFontSize = (delta: number) => {
    setAppearance(prev => {
      const next = { ...prev, fontSize: Math.max(8, Math.min(72, prev.fontSize + delta)) };
      storage.saveEditorAppearance(next);
      return next;
    });
  };

  /**
   * @implements REQ-EDT-020
   */
  const adjustZoom = (delta: number) => {
    setAppearance(prev => {
      const next = { ...prev, zoomLevel: Math.max(50, Math.min(300, prev.zoomLevel + delta)) };
      storage.saveEditorAppearance(next);
      return next;
    });
  };

  const resetAppearance = () => {
    const next = { fontSize: 14, zoomLevel: 100 };
    setAppearance(next);
    storage.saveEditorAppearance(next);
  };

  if (!activeFilePath || !activeFile) {
    return (
      <div className="flex items-center justify-center h-full text-text-weak">
        No file open
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-bg-surface-primary" style={{ zoom: `${appearance.zoomLevel}%` }}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-os-line bg-os-bg-1 gap-2">
        <div className="flex items-center gap-2">
          {hasHistory && (
            <button
              type="button"
              onClick={() => jumpBack()}
              className="px-2 py-1 text-xs rounded text-text-weak hover:bg-os-bg-2 flex items-center gap-1"
              title="Jump Back (REQ-EDT-015)"
            >
              <span>←</span> Jump Back
            </button>
          )}
          
          <div className="flex items-center gap-1 ml-2 border-l border-os-line pl-2">
            <button
              type="button"
              onClick={() => saveActiveFile(editor?.getValue() || '')}
              className="px-2 py-1 text-xs rounded text-text-weak hover:bg-os-bg-2"
              title="Save (Mod+S)"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => saveActiveFileAs()}
              className="px-2 py-1 text-xs rounded text-text-weak hover:bg-os-bg-2"
              title="Save As (Mod+Shift+S)"
            >
              Save As
            </button>
            <span className="text-[10px] text-text-weak opacity-30 mx-1">|</span>
            {/** REQ-EDT-018: Deferred Commands */}
            <button
              type="button"
              disabled
              className="px-2 py-1 text-xs rounded text-text-weak opacity-30 cursor-not-allowed"
              title="Global Find (Deferred - REQ-EDT-018)"
            >
              Global Find
            </button>
            <button
              type="button"
              disabled
              className="px-2 py-1 text-xs rounded text-text-weak opacity-30 cursor-not-allowed"
              title="Refactor (Deferred - REQ-EDT-018)"
            >
              Refactor
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-os-line rounded overflow-hidden">
            <button
              type="button"
              onClick={() => adjustFontSize(-1)}
              className="px-2 py-1 text-xs text-text-weak hover:bg-os-bg-2"
              title="Decrease Font Size"
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => resetAppearance()}
              className="px-2 py-1 text-xs text-text-weak hover:bg-os-bg-2 border-x border-os-line"
              title="Reset Appearance"
            >
              {appearance.fontSize}px
            </button>
            <button
              type="button"
              onClick={() => adjustFontSize(1)}
              className="px-2 py-1 text-xs text-text-weak hover:bg-os-bg-2"
              title="Increase Font Size"
            >
              A+
            </button>
          </div>

          <div className="flex items-center border border-os-line rounded overflow-hidden ml-2">
            <button
              type="button"
              onClick={() => adjustZoom(-10)}
              className="px-2 py-1 text-xs text-text-weak hover:bg-os-bg-2"
              title="Zoom Out"
            >
              -
            </button>
            <div className="px-2 py-1 text-xs text-text-weak bg-os-bg-1 border-x border-os-line">
              {appearance.zoomLevel}%
            </div>
            <button
              type="button"
              onClick={() => adjustZoom(10)}
              className="px-2 py-1 text-xs text-text-weak hover:bg-os-bg-2"
              title="Zoom In"
            >
              +
            </button>
          </div>

          {viewer && (
            <div className="flex items-center gap-1 ml-4">
              <button
                type="button"
                onClick={() => setViewMode('source')}
                className={`px-3 py-1 text-xs rounded ${effectiveViewMode === 'source' ? 'bg-os-accent text-white' : 'text-text-weak hover:bg-os-bg-2'}`}
              >
                Source
              </button>
              <button
                type="button"
                onClick={() => setViewMode('rendered')}
                className={`px-3 py-1 text-xs rounded ${effectiveViewMode === 'rendered' ? 'bg-os-accent text-white' : 'text-text-weak hover:bg-os-bg-2'}`}
              >
                Rendered
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 relative">
        {effectiveViewMode === 'rendered' && viewer ? (
          <viewer.component path={activeFilePath} />
        ) : (
          <Editor
            height="100%"
            path={activeFilePath}
            onMount={handleEditorMount}
            options={{
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              fontSize: appearance.fontSize,
              automaticLayout: true,
            }}
          />
        )}
      </div>
    </div>
  );
};
