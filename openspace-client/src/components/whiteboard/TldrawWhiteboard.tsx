/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useCallback, useRef, useState } from 'react';
import { Tldraw, Editor } from '@tldraw/tldraw';
import type { TLShape } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { useArtifact } from '../../hooks/useArtifact';
import type { IDiagram } from '../../interfaces/IDrawing';
import { diagramToTldrawShapes, tldrawShapesToDiagram } from '../../lib/whiteboard/tldrawMapper';
import { Send, AlertCircle, Loader2 } from 'lucide-react';
import { pushToast } from '../../utils/toastStore';
import { openCodeService } from '../../services/OpenCodeClient';

interface TldrawWhiteboardProps {
  filePath: string;
  sessionId?: string;
}

export const TldrawWhiteboard: React.FC<TldrawWhiteboardProps> = ({ filePath, sessionId }) => {
  const [editor, setEditor] = useState<Editor | null>(null);
  const isRemoteUpdateRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  const unlistenRef = useRef<(() => void) | null>(null);

  const {
    data,
    setData,
    loading,
    error,
    connected,
  } = useArtifact<IDiagram>(filePath, {
    parse: (content) => JSON.parse(content),
    serialize: (next) => JSON.stringify(next, null, 2),
    debounceMs: 1000,
    onRemoteChange: (newData) => {
      if (!editor) {
        console.log('[TldrawWhiteboard] onRemoteChange: No editor available yet');
        return;
      }

      console.log(`[${new Date().toISOString()}] ARTIFACT_REMOTE_CHANGE: ${filePath}`);
      console.log('[TldrawWhiteboard] Remote data nodes:', newData.nodes.length);
      console.log('[TldrawWhiteboard] Current editor shapes:', editor.getCurrentPageShapes().length);
      
      isRemoteUpdateRef.current = true;

      const shapes = diagramToTldrawShapes(newData);
      console.log('[TldrawWhiteboard] Converted to tldraw shapes:', shapes.length);

      editor.run(() => {
        const currentShapeIds = new Set(editor.getCurrentPageShapes().map((s) => s.id));
        const remoteShapeIds = new Set(shapes.map((s) => s.id));

        // Split shapes into new and existing
        const newShapes = shapes.filter((s) => !currentShapeIds.has(s.id));
        const existingShapes = shapes.filter((s) => currentShapeIds.has(s.id));

        // Create new shapes
        if (newShapes.length > 0) {
          console.log('[TldrawWhiteboard] Creating new shapes:', newShapes.map(s => s.id));
          editor.createShapes(newShapes);
        }

        // Update existing shapes
        if (existingShapes.length > 0) {
          editor.updateShapes(existingShapes);
        }

        // Remove shapes that are not in remote data
        const shapesToRemove = editor
          .getCurrentPageShapes()
          .filter((shape) => !remoteShapeIds.has(shape.id))
          .map((shape) => shape.id);

        if (shapesToRemove.length > 0) {
          console.log('[TldrawWhiteboard] Removing shapes:', shapesToRemove);
          editor.deleteShapes(shapesToRemove);
        }
      });

      console.log('[TldrawWhiteboard] After update, editor has shapes:', editor.getCurrentPageShapes().length);

      // Keep the flag true for a bit longer to ensure all tldraw change events are ignored
      setTimeout(() => {
        isRemoteUpdateRef.current = false;
      }, 100);
    },
  });

  const handleChange = useCallback((editorInstance: Editor) => {
    if (isRemoteUpdateRef.current || isInitialLoadRef.current) return;

    const shapes = editorInstance.getCurrentPageShapes() as TLShape[];
    const partialDiagram = tldrawShapesToDiagram(shapes);

    setData((prev) => {
      if (!prev) {
        return {
          schemaVersion: '1.0',
          diagramType: 'generic',
          metadata: {
            title: filePath,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          style: { theme: 'light', tokens: {} },
          nodes: partialDiagram.nodes || [],
          edges: partialDiagram.edges || [],
          groups: [],
          constraints: [],
          sourceRefs: {},
        } as IDiagram;
      }

      if (
        JSON.stringify(prev.nodes) === JSON.stringify(partialDiagram.nodes) &&
        JSON.stringify(prev.edges) === JSON.stringify(partialDiagram.edges)
      ) {
        return prev;
      }

      return {
        ...prev,
        nodes: partialDiagram.nodes || [],
        edges: partialDiagram.edges || [],
        metadata: {
          ...prev.metadata,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  }, [setData, filePath]);

  const handleMount = useCallback((editorInstance: Editor) => {
    setEditor(editorInstance);

    unlistenRef.current = editorInstance.store.listen(() => {
      handleChange(editorInstance);
    }, { source: 'user', scope: 'document' });
  }, [handleChange]);

  useEffect(() => {
    return () => {
      if (unlistenRef.current) {
        unlistenRef.current();
      }
    };
  }, []);

  useEffect(() => {
    if (!editor || !data || !isInitialLoadRef.current) return;

    console.log(`[${new Date().toISOString()}] TLDRAW_INITIAL_LOAD: ${filePath}`);
    isRemoteUpdateRef.current = true;

    try {
      const shapes = diagramToTldrawShapes(data);
      
      editor.run(() => {
        // Delete all existing shapes first
        const existingShapes = editor.getCurrentPageShapes();
        if (existingShapes.length > 0) {
          editor.deleteShapes(existingShapes.map(s => s.id));
        }
        
        // Create new shapes from diagram data
        if (shapes.length > 0) {
          editor.createShapes(shapes);
        }
      });

      console.log(`[${new Date().toISOString()}] TLDRAW_INITIAL_LOAD_SUCCESS: ${filePath} (${shapes.length} shapes)`);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] TLDRAW_INITIAL_LOAD_FAIL: ${filePath}`, err);
    } finally {
      isInitialLoadRef.current = false;
      isRemoteUpdateRef.current = false;
    }
  }, [editor, data, filePath]);

  const onSendToAgent = async () => {
    if (!data) return;

    try {
      console.log(`[${new Date().toISOString()}] SEND_TO_AGENT_START: ${filePath}`);
      if (sessionId) {
        await openCodeService.client.session.prompt({
          sessionID: sessionId,
          directory: openCodeService.directory,
          parts: [
            { type: 'text', text: `I've updated the diagram in ${filePath}.` },
          ],
        });
        pushToast({ title: 'Diagram sent to Agent', tone: 'success' });
        console.log(`[${new Date().toISOString()}] SEND_TO_AGENT_SUCCESS: ${filePath}`);
      }
    } catch (err: any) {
      console.error(`[${new Date().toISOString()}] SEND_TO_AGENT_FAIL: ${filePath}`, err);
      pushToast({ title: 'Failed to send to Agent', description: err.message, tone: 'error' });
    }
  };

  if (loading && !data) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading Diagram...</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center bg-gray-50">
        <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
        <div className="text-lg font-medium text-gray-900">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col border rounded-lg overflow-hidden bg-white shadow-sm">
      <div className="flex items-center justify-between p-2 border-b bg-gray-50">
        <div className="text-sm font-medium px-2 truncate text-gray-700">{filePath}</div>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-500">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} transition-colors`} />
            <span className="hidden sm:inline font-medium">{connected ? 'Live' : 'Offline'}</span>
          </div>
          <button
            type="button"
            onClick={onSendToAgent}
            className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Send className="w-3 h-3" />
            Send to Agent
          </button>
        </div>
      </div>
      <div className="flex-1 relative">
        <Tldraw
          onMount={handleMount}
          autoFocus
        />
      </div>
    </div>
  );
};
