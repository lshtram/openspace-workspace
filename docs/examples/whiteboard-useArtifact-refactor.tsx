/**
 * EXAMPLE: WhiteboardFrame Refactored to use useArtifact()
 * 
 * This is a demonstration of how to migrate WhiteboardFrame.tsx
 * to use the universal useArtifact() hook.
 * 
 * Key Changes:
 * 1. Replace custom SSE/BroadcastChannel logic with useArtifact()
 * 2. Remove useDebouncedSave hook (built into useArtifact)
 * 3. Simplify state management
 * 4. Keep Excalidraw-specific logic (reconciliation, Mermaid conversion)
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import { Excalidraw, exportToBlob } from '@excalidraw/excalidraw';
import { reconcileGraph, excalidrawToMermaid } from '../../lib/whiteboard/reconcile';
import { openCodeService } from '../../services/OpenCodeClient';
import { useArtifact } from '../../hooks/useArtifact';
import { Send, AlertCircle } from 'lucide-react';
import { pushToast } from '../../utils/toastStore';

interface WhiteboardFrameProps {
  filePath: string; // e.g., 'design/system.graph.mmd' or 'design/system.excalidraw'
  sessionId?: string;
}

interface ExcalidrawData {
  elements: readonly any[];
  // Add other Excalidraw state if needed
}

export const WhiteboardFrame: React.FC<WhiteboardFrameProps> = ({ filePath, sessionId }) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [diagramType, setDiagramType] = useState<any>('flowchart');
  
  // Derive paths
  const mmdPath = filePath.endsWith('.excalidraw') 
    ? filePath.replace('.excalidraw', '.graph.mmd')
    : filePath;
  const excalidrawPath = mmdPath.replace('.graph.mmd', '.excalidraw');

  // ============================================================================
  // Use useArtifact for .excalidraw file (layout data)
  // ============================================================================

  const {
    data: excalidrawData,
    setData: setExcalidrawData,
    loading: loadingExcalidraw,
    error: errorExcalidraw,
    connected: connectedExcalidraw,
  } = useArtifact<ExcalidrawData>(excalidrawPath, {
    parse: (content) => {
      try {
        const json = JSON.parse(content);
        return { elements: json.elements || [] };
      } catch {
        return { elements: [] };
      }
    },
    serialize: (data) => JSON.stringify(data, null, 2),
    debounceMs: 1000,
    onRemoteChange: (data, actor) => {
      if (actor === 'agent' && excalidrawAPI) {
        // Apply remote changes to Excalidraw
        excalidrawAPI.updateScene({ elements: data.elements });
      }
    },
  });

  // ============================================================================
  // Use useArtifact for .graph.mmd file (logical data)
  // ============================================================================

  const {
    data: mermaidContent,
    setData: setMermaidContent,
    loading: loadingMermaid,
    error: errorMermaid,
    connected: connectedMermaid,
  } = useArtifact<string>(mmdPath, {
    parse: (content) => content,
    serialize: (content) => content,
    debounceMs: 1000,
    onRemoteChange: (mmd, actor) => {
      if (actor === 'agent') {
        console.log('[Whiteboard] Remote Mermaid change detected, reconciling...');
        
        // Detect diagram type
        let detectedType: any = 'flowchart';
        if (mmd.startsWith('sequenceDiagram')) detectedType = 'sequence';
        else if (mmd.startsWith('classDiagram')) detectedType = 'class';
        else if (mmd.startsWith('stateDiagram')) detectedType = 'state';
        else if (mmd.startsWith('erDiagram')) detectedType = 'er';
        else if (mmd.startsWith('gantt')) detectedType = 'gantt';
        else if (mmd.startsWith('mindmap')) detectedType = 'mindmap';
        else if (mmd.startsWith('C4')) detectedType = 'c4';
        setDiagramType(detectedType);

        // Reconcile with current Excalidraw elements
        const currentElements = excalidrawData?.elements || [];
        const reconciled = reconcileGraph(mmd, currentElements);
        
        // Update both Excalidraw and local state
        if (excalidrawAPI) {
          excalidrawAPI.updateScene({ elements: reconciled });
        }
        setExcalidrawData({ elements: reconciled });
        
        pushToast({ title: 'Whiteboard updated from Agent', tone: 'info' });
      }
    },
  });

  // ============================================================================
  // Initial Reconciliation (on first load)
  // ============================================================================

  useEffect(() => {
    if (!loadingExcalidraw && !loadingMermaid && excalidrawData && mermaidContent) {
      // Detect diagram type from Mermaid
      let detectedType: any = 'flowchart';
      const mmd = mermaidContent.trim();
      if (mmd.startsWith('sequenceDiagram')) detectedType = 'sequence';
      else if (mmd.startsWith('classDiagram')) detectedType = 'class';
      else if (mmd.startsWith('stateDiagram')) detectedType = 'state';
      else if (mmd.startsWith('erDiagram')) detectedType = 'er';
      else if (mmd.startsWith('gantt')) detectedType = 'gantt';
      else if (mmd.startsWith('mindmap')) detectedType = 'mindmap';
      else if (mmd.startsWith('C4')) detectedType = 'c4';
      setDiagramType(detectedType);

      // Reconcile Mermaid logic with Excalidraw layout
      try {
        const reconciled = reconcileGraph(mmd, excalidrawData.elements);
        if (JSON.stringify(reconciled) !== JSON.stringify(excalidrawData.elements)) {
          setExcalidrawData({ elements: reconciled });
        }
      } catch (err) {
        console.warn('[Whiteboard] Failed to reconcile on load:', err);
      }
    }
  }, [loadingExcalidraw, loadingMermaid, excalidrawData, mermaidContent, setExcalidrawData]);

  // ============================================================================
  // Handle User Edits (Excalidraw onChange)
  // ============================================================================

  const onChange = useCallback((nextElements: readonly any[]) => {
    // Update Excalidraw data (triggers auto-save via useArtifact)
    setExcalidrawData({ elements: nextElements });

    // Generate Mermaid from current canvas
    try {
      const mermaidCode = excalidrawToMermaid(nextElements, diagramType);
      setMermaidContent(mermaidCode);
    } catch (err) {
      console.warn('[Whiteboard] Failed to generate Mermaid:', err);
      // If Mermaid generation fails, just save the .excalidraw
    }
  }, [diagramType, setExcalidrawData, setMermaidContent]);

  // ============================================================================
  // Send to Agent (User Commits Whiteboard)
  // ============================================================================

  const onUserCommit = async () => {
    if (!excalidrawAPI || !excalidrawData || !mermaidContent) return;

    try {
      // 1. Take Snapshot
      const blob = await exportToBlob({
        elements: excalidrawData.elements as any,
        mimeType: 'image/png',
        appState: excalidrawAPI.getAppState(),
        files: excalidrawAPI.getFiles(),
      });

      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        
        // 2. Send Message to Agent
        if (sessionId) {
          await openCodeService.client.session.prompt({
            sessionID: sessionId,
            directory: openCodeService.directory,
            parts: [
              { type: 'text', text: `I've updated the whiteboard. Here is the latest logic:\n\n\`\`\`mermaid\n${mermaidContent}\n\`\`\`` },
              { type: 'file', mime: 'image/png', filename: 'whiteboard.png', url: base64data }
            ]
          });
          pushToast({ title: 'Whiteboard logic sent to Agent', tone: 'success' });
        }
      };
    } catch (err: any) {
      pushToast({ title: 'Failed to send to Agent', description: err.message, tone: 'error' });
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  const loading = loadingExcalidraw || loadingMermaid;
  const error = errorExcalidraw || errorMermaid;
  const connected = connectedExcalidraw && connectedMermaid;

  if (loading) {
    return <div className="flex h-full items-center justify-center">Loading Whiteboard...</div>;
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
        <div className="text-lg font-medium text-gray-900">{error}</div>
        <button 
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col border rounded-lg overflow-hidden bg-white">
      <div className="flex items-center justify-between p-2 border-b bg-gray-50">
        <div className="text-sm font-medium px-2 truncate">{filePath}</div>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded text-xs text-gray-500" title={connected ? "Connected to Agent" : "Disconnected"}>
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} transition-colors`} />
            <span className="hidden sm:inline">{connected ? 'Live' : 'Offline'}</span>
          </div>
          <button
            type="button"
            onClick={onUserCommit}
            className="flex items-center gap-2 px-3 py-1 bg-black text-white text-xs rounded hover:bg-gray-800 transition-colors"
          >
            <Send className="w-3 h-3" />
            Send to Agent
          </button>
        </div>
      </div>
      <div className="flex-1 relative">
        <Excalidraw
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          initialData={excalidrawData ? { elements: excalidrawData.elements } : undefined}
          onChange={onChange}
        />
      </div>
    </div>
  );
};

/**
 * COMPARISON: What Changed?
 * 
 * BEFORE (WhiteboardFrame.tsx):
 * - ~329 lines with custom SSE/BroadcastChannel logic
 * - Manual EventSource setup and cleanup
 * - Manual BroadcastChannel setup and cleanup
 * - Custom debounce logic (useDebouncedSave)
 * - Manual active context notification
 * - Complex state management (versionRef, stateRef, etc.)
 * 
 * AFTER (This Example):
 * - ~250 lines (22% reduction)
 * - useArtifact() handles SSE/BroadcastChannel automatically
 * - Built-in debouncing
 * - Built-in active context (future)
 * - Simpler state management (just data + API)
 * - More declarative (less imperative)
 * 
 * BENEFITS:
 * 1. Less boilerplate
 * 2. Consistent pattern across all modalities
 * 3. Built-in error handling
 * 4. Built-in reconnection logic
 * 5. Type-safe
 * 6. Testable (mock useArtifact)
 * 
 * TRADEOFFS:
 * - Need to manage two artifacts (.excalidraw + .graph.mmd)
 * - Reconciliation logic still custom (Whiteboard-specific)
 * - Slightly more memory (two hook instances)
 * 
 * NEXT STEPS:
 * 1. Test this refactored version
 * 2. Ensure all features work (draw, save, SSE, multi-window sync)
 * 3. Compare performance (should be similar or better)
 * 4. Replace original WhiteboardFrame.tsx if tests pass
 */
