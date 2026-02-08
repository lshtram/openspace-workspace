/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import { Excalidraw, exportToBlob } from '@excalidraw/excalidraw';
import { reconcileGraph } from '../../lib/whiteboard/reconcile';
import { openCodeService } from '../../services/OpenCodeClient';
import { useDebouncedSave } from './useDebouncedSave';
import { Send, AlertCircle } from 'lucide-react';
import { pushToast } from '../../utils/toastStore';

interface WhiteboardFrameProps {
  filePath: string; // e.g., 'design/system.graph.mmd' or 'design/system.excalidraw'
  sessionId?: string;
}

export const WhiteboardFrame: React.FC<WhiteboardFrameProps> = ({ filePath, sessionId }) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [elements, setElements] = useState<readonly any[]>([]);
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const mmdPath = filePath.endsWith('.excalidraw') 
    ? filePath.replace('.excalidraw', '.graph.mmd')
    : filePath;
  const excalidrawPath = mmdPath.replace('.graph.mmd', '.excalidraw');

  // Multi-window sync channel
  const channel = useMemo(() => new BroadcastChannel(`whiteboard-${excalidrawPath}`), [excalidrawPath]);

  useEffect(() => {
    channel.onmessage = (event) => {
      if (event.data.type === 'UPDATE_ELEMENTS' && excalidrawAPI) {
        // Only update if elements are different to avoid loops
        if (JSON.stringify(event.data.elements) !== JSON.stringify(elements)) {
          excalidrawAPI.updateScene({ elements: event.data.elements });
          setElements(event.data.elements);
        }
      }
    };
    return () => channel.close();
  }, [channel, excalidrawAPI, elements]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Try to load .excalidraw first (it has the layout)
        let savedElements: any[] = [];
        try {
          const exResponse = await openCodeService.client.file.read({ path: excalidrawPath });
          if (exResponse.data?.content) {
            const json = JSON.parse(exResponse.data.content);
            savedElements = json.elements || [];
          }
        } catch {
          console.log('No existing .excalidraw found, starting fresh or from .mmd');
        }

        // 2. Load .graph.mmd and reconcile
        try {
          const mmdResponse = await openCodeService.client.file.read({ path: mmdPath });
          if (mmdResponse.data?.content) {
            const reconciled = reconcileGraph(mmdResponse.data.content, savedElements);
            setElements(reconciled);
            setInitialData({ elements: reconciled });
          } else {
            setElements(savedElements);
            setInitialData({ elements: savedElements });
          }
        } catch {
          console.warn('Failed to load or reconcile .mmd, using saved elements if any');
          setElements(savedElements);
          setInitialData({ elements: savedElements });
          if (savedElements.length === 0) {
            setError('Could not load whiteboard data. Please check if the file exists and has valid Mermaid syntax.');
          }
        }
      } catch (error: any) {
        console.error('Failed to load whiteboard data:', error);
        setError(`Failed to load whiteboard: ${error.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [mmdPath, excalidrawPath]);

  // Handle auto-save
  const { save } = useDebouncedSave(excalidrawPath);

  const onChange = (nextElements: readonly any[]) => {
    if (JSON.stringify(nextElements) === JSON.stringify(elements)) return;
    
    setElements(nextElements);
    save(nextElements, excalidrawAPI);
    
    // Broadcast to other windows
    channel.postMessage({ type: 'UPDATE_ELEMENTS', elements: nextElements });
  };

  const onUserCommit = async () => {
    if (!excalidrawAPI) return;

    try {
      const mermaidCode = generateMermaidFromElements(elements);
      
      // 2. Take Snapshot
      const blob = await exportToBlob({
        elements: elements as any,
        mimeType: 'image/png',
        appState: excalidrawAPI.getAppState(),
        files: excalidrawAPI.getFiles(),
      });

      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        
        // 3. Send Message to Agent
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
      };
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
        <div className="flex gap-2">
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
          initialData={initialData}
          onChange={onChange}
        />
      </div>
    </div>
  );
};

function generateMermaidFromElements(elements: readonly any[]): string {
  let code = 'graph TD\n';
  const nodes = elements.filter(el => el.type === 'rectangle' && el.customData?.id);
  const arrows = elements.filter(el => el.customData?.type === 'bridge-arrow');

  nodes.forEach(node => {
    code += `  ${node.customData!.id}["${node.text || node.customData!.id}"]\n`;
  });

  arrows.forEach(arrow => {
    if (arrow.customData?.from && arrow.customData?.to) {
      code += `  ${arrow.customData.from} --> ${arrow.customData.to}\n`;
    }
  });

  return code;
}
