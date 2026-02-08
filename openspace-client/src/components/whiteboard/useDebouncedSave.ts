/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useRef } from 'react';
import { serializeAsJSON, exportToBlob } from '@excalidraw/excalidraw';

const HUB_URL = 'http://localhost:3001';

export function useDebouncedSave(filePath: string) {
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef<any>(null);

  const save = useCallback(async (elements: readonly any[], api: any) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        if (!api) return;

        // 1. Save .excalidraw JSON
        const json = serializeAsJSON(elements as any, api.getAppState(), api.getFiles(), 'local');
        
        await fetch(`${HUB_URL}/artifacts/${filePath}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: json,
            opts: { actor: 'user', reason: 'auto-save' }
          })
        });

        // 2. Generate and save snapshot (.png)
        const snapshotPath = 'design/whiteboard.snapshot.png';
        
        const blob = await exportToBlob({
          elements: elements as any,
          mimeType: 'image/png',
          appState: api.getAppState(),
          files: api.getFiles(),
        });

        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          const base64Content = base64data.split(',')[1];
          
          await fetch(`${HUB_URL}/artifacts/${snapshotPath}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: base64Content,
              encoding: 'base64',
              opts: { actor: 'user', reason: 'snapshot' }
            })
          });
        };

      } catch (error) {
        console.error('Failed to save whiteboard:', error);
      } finally {
        setIsSaving(false);
      }
    }, 1000);
  }, [filePath]);

  return { save, isSaving };
}
