import React, { useState, useEffect } from 'react';
import { Excalidraw, exportToBlob } from '@excalidraw/excalidraw';
import { reconcileGraph } from '../../lib/whiteboard/reconcile';
import { openCodeService } from '../../services/OpenCodeClient';
import { useDebouncedSave } from './useDebouncedSave';
import { Send } from 'lucide-react';

interface WhiteboardFrameProps {
  filePath: string; // e.g., 'design/system.graph.mmd' or 'design/system.excalidraw'
  sessionId?: string;
}

export const WhiteboardFrame: React.FC<WhiteboardFrameProps> = ({ filePath, sessionId }) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [elements, setElements] = useState<readonly any[]>([]);
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const mmdPath = filePath.endsWith('.excalidraw') 
    ? filePath.replace('.excalidraw', '.graph.mmd')
    : filePath;
  const excalidrawPath = mmdPath.replace('.graph.mmd', '.excalidraw');

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // 1. Try to load .excalidraw first (it has the layout)
        let savedElements: any[] = [];
        try {
          const exResponse = await openCodeService.client.file.read({ path: excalidrawPath });
          if (exResponse.data?.content) {
            const json = JSON.parse(exResponse.data.content);
            savedElements = json.elements || [];
          }
        } catch (e) {
          console.log('No existing .excalidraw found, starting fresh or from .mmd');
        }

        // 2. Load .graph.mmd and reconcile
        const mmdResponse = await openCodeService.client.file.read({ path: mmdPath });
        if (mmdResponse.data?.content) {
          const reconciled = reconcileGraph(mmdResponse.data.content, savedElements);
          setElements(reconciled);
          setInitialData({ elements: reconciled });
        } else {
          setElements(savedElements);
          setInitialData({ elements: savedElements });
        }
      } catch (error) {
        console.error('Failed to load whiteboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [mmdPath, excalidrawPath]);

  // Handle auto-save
  const { save } = useDebouncedSave(excalidrawPath);

  const onChange = (nextElements: readonly any[]) => {
    setElements(nextElements);
    save(nextElements, excalidrawAPI);
  };

  const onUserCommit = async () => {
    if (!excalidrawAPI) return;

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
      }
    };
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center">Loading Whiteboard...</div>;
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
