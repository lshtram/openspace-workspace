/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
}

type DiagramType =
  | 'flowchart'
  | 'sequence'
  | 'class'
  | 'state'
  | 'er'
  | 'gantt'
  | 'mindmap'
  | 'c4';

const detectDiagramType = (mmd: string): DiagramType => {
  if (typeof mmd !== 'string') {
    throw new Error('Expected Mermaid content to be a string');
  }

  const trimmed = mmd.trim();
  if (trimmed.startsWith('sequenceDiagram')) return 'sequence';
  if (trimmed.startsWith('classDiagram')) return 'class';
  if (trimmed.startsWith('stateDiagram')) return 'state';
  if (trimmed.startsWith('erDiagram')) return 'er';
  if (trimmed.startsWith('gantt')) return 'gantt';
  if (trimmed.startsWith('mindmap')) return 'mindmap';
  if (trimmed.startsWith('C4')) return 'c4';
  return 'flowchart';
};

const now = () => new Date().toISOString();
const HUB_URL = import.meta.env.VITE_HUB_URL || 'http://localhost:3001';

const logActiveContext = (status: 'start' | 'success' | 'failure', meta: Record<string, unknown>) => {
  const payload = { ...meta, ts: now() };
  if (status === 'failure') {
    console.error('[Whiteboard] active context failure', payload);
    return;
  }
  console.log(`[Whiteboard] active context ${status}`, payload);
};

const logSnapshotPersistence = (status: 'start' | 'success' | 'failure', meta: Record<string, unknown>) => {
  const payload = { ...meta, ts: now() };
  if (status === 'failure') {
    console.error('[Whiteboard] snapshot persistence failure', payload);
    return;
  }
  console.log(`[Whiteboard] snapshot persistence ${status}`, payload);
};

const toSnapshotPath = (mmdPath: string) => {
  if (mmdPath.endsWith('.graph.mmd')) {
    return mmdPath.replace(/\.graph\.mmd$/, '.png');
  }
  return `${mmdPath}.png`;
};

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Failed to read snapshot blob'));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error('Failed to read snapshot blob'));
    };
    reader.readAsDataURL(blob);
  });

export const WhiteboardFrame: React.FC<WhiteboardFrameProps> = ({ filePath, sessionId }) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [diagramType, setDiagramType] = useState<DiagramType>('flowchart');
  const syncWarningShownRef = useRef(false);
  const hasReconciledInitialLoadRef = useRef(false);
  const lastMmdPathRef = useRef<string | null>(null);
  const isApplyingRemoteSceneRef = useRef(false);

  const handleExcalidrawAPI = useCallback((api: any) => {
    setExcalidrawAPI((prev: any) => (prev === api ? prev : api));
  }, []);

  const applyRemoteScene = useCallback(
    (elements: readonly any[]) => {
      if (!excalidrawAPI) {
        return;
      }

      isApplyingRemoteSceneRef.current = true;
      excalidrawAPI.updateScene({ elements });
    },
    [excalidrawAPI],
  );
  
  const mmdPath = filePath.endsWith('.excalidraw') 
    ? filePath.replace('.excalidraw', '.graph.mmd')
    : filePath;
  const excalidrawPath = mmdPath.replace('.graph.mmd', '.excalidraw');

  if (lastMmdPathRef.current !== mmdPath) {
    lastMmdPathRef.current = mmdPath;
    hasReconciledInitialLoadRef.current = false;
  }

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
    onRemoteChange: (data) => {
      applyRemoteScene(data.elements);
    },
  });

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
      if (actor !== 'agent') return;

      try {
        const detectedType = detectDiagramType(mmd);
        setDiagramType(detectedType);
      } catch (err) {
        console.warn('[Whiteboard] Failed to detect diagram type:', err);
      }

      try {
        const currentElements = excalidrawData?.elements || [];
        const reconciled = reconcileGraph(mmd, currentElements);

        applyRemoteScene(reconciled);
        setExcalidrawData({ elements: reconciled });

        pushToast({ title: 'Whiteboard updated from Agent', tone: 'info' });
      } catch (err) {
        console.error('[Whiteboard] Failed to handle Mermaid update:', err);
      }
    },
  });

  const hasExcalidrawElements = (excalidrawData?.elements?.length ?? 0) > 0;
  const loading = loadingExcalidraw || loadingMermaid;
  const error = errorExcalidraw || (errorMermaid && !hasExcalidrawElements ? errorMermaid : null);
  const connected = connectedExcalidraw && connectedMermaid;

  useEffect(() => {
    if (loadingExcalidraw) return;
    if (excalidrawData !== null) return;
    setExcalidrawData({ elements: [] });
  }, [loadingExcalidraw, excalidrawData, setExcalidrawData]);

  useEffect(() => {
    if (loadingMermaid) return;
    if (mermaidContent !== null) return;
    setMermaidContent('graph TD\n');
  }, [loadingMermaid, mermaidContent, setMermaidContent]);

  useEffect(() => {
    if (loadingExcalidraw || loadingMermaid) return;
    if (!mermaidContent) return;

    if (hasReconciledInitialLoadRef.current) {
      return;
    }

    try {
      const detectedType = detectDiagramType(mermaidContent);
      setDiagramType(detectedType);
    } catch (err) {
      console.warn('[Whiteboard] Failed to detect diagram type on load:', err);
    }

    try {
      const currentElements = excalidrawData?.elements || [];
      const reconciled = reconcileGraph(mermaidContent, currentElements);
      if (JSON.stringify(reconciled) !== JSON.stringify(currentElements)) {
        setExcalidrawData({ elements: reconciled });
      }
      hasReconciledInitialLoadRef.current = true;
    } catch (err) {
      console.warn('[Whiteboard] Failed to reconcile on load:', err);
    }
  }, [loadingExcalidraw, loadingMermaid, mermaidContent, excalidrawData, setExcalidrawData]);

  useEffect(() => {
    if (!errorMermaid) return;
    if (hasExcalidrawElements && !syncWarningShownRef.current) {
      syncWarningShownRef.current = true;
      pushToast({
        title: 'Sync Warning',
        description: 'Could not sync with Mermaid logic. Using last saved whiteboard state.',
        tone: 'info',
      });
    }
  }, [errorMermaid, hasExcalidrawElements]);

  useEffect(() => {
    const notifyActive = async () => {
      try {
        if (!mmdPath) {
          throw new Error('Missing Mermaid file path');
        }
        logActiveContext('start', { filePath: mmdPath });
        await fetch(`${HUB_URL}/context/active`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modality: 'whiteboard',
            data: { path: mmdPath },
          }),
        });
        logActiveContext('success', { filePath: mmdPath });
      } catch (err) {
        logActiveContext('failure', { filePath: mmdPath, error: err instanceof Error ? err.message : String(err) });
      }
    };

    notifyActive();
  }, [mmdPath]);

  const persistSnapshot = useCallback(
    async (base64DataUrl: string) => {
      const snapshotPath = toSnapshotPath(mmdPath);
      const [prefix, base64] = base64DataUrl.split(',', 2);

      if (!prefix || !prefix.startsWith('data:image/png;base64')) {
        throw new Error('Snapshot encoding is invalid');
      }

      if (!base64) {
        throw new Error('Snapshot payload is empty');
      }

      logSnapshotPersistence('start', { snapshotPath });

      try {
        const response = await fetch(`${HUB_URL}/files/${snapshotPath}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-openspace-write-mode': 'user-direct',
          },
          body: JSON.stringify({
            content: base64,
            encoding: 'base64',
            opts: {
              actor: 'user',
              reason: 'whiteboard snapshot send-to-agent',
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to persist snapshot: ${response.status} ${response.statusText}`);
        }

        logSnapshotPersistence('success', { snapshotPath, status: response.status });
      } catch (err) {
        logSnapshotPersistence('failure', {
          snapshotPath,
          error: err instanceof Error ? err.message : String(err),
        });
        throw err;
      }
    },
    [mmdPath],
  );

  const onChange = useCallback((nextElements: readonly any[]) => {
    if (isApplyingRemoteSceneRef.current) {
      isApplyingRemoteSceneRef.current = false;
      return;
    }

    setExcalidrawData({ elements: nextElements });

    try {
      const mermaidCode = excalidrawToMermaid(nextElements, diagramType);
      setMermaidContent(mermaidCode);
    } catch (err) {
      console.warn('[Whiteboard] Failed to generate Mermaid:', err);
    }
  }, [diagramType, setExcalidrawData, setMermaidContent]);

  const onUserCommit = async () => {
    if (!excalidrawAPI || !excalidrawData) return;

    try {
      const mermaidCode = excalidrawToMermaid(excalidrawData.elements, diagramType);
      
      // 2. Take Snapshot
      const blob = await exportToBlob({
        elements: excalidrawData.elements as any,
        mimeType: 'image/png',
        appState: excalidrawAPI.getAppState(),
        files: excalidrawAPI.getFiles(),
      });

      const base64data = await blobToDataUrl(blob);
      await persistSnapshot(base64data);

      if (sessionId) {
        await openCodeService.client.session.prompt({
          sessionID: sessionId,
          directory: openCodeService.directory,
          parts: [
            { type: 'text', text: `I've updated the whiteboard. Here is the latest logic:\n\n\`\`\`mermaid\n${mermaidCode}\n\`\`\`` },
            { type: 'file', mime: 'image/png', filename: 'whiteboard.png', url: base64data }
          ]
        });
        pushToast({ title: 'Whiteboard logic sent to Agent', tone: 'success' });
      }
    } catch (err: any) {
      pushToast({ title: 'Failed to send to Agent', description: err.message, tone: 'error' });
    }
  };

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
          excalidrawAPI={handleExcalidrawAPI}
          initialData={excalidrawData ? { elements: excalidrawData.elements } : undefined}
          onChange={onChange}
        />
      </div>
    </div>
  );
};
