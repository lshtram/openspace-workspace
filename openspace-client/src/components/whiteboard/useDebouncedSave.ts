import { useState, useCallback, useRef } from 'react';
import { serializeAsJSON } from '@excalidraw/excalidraw';

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
        
        console.log(`[Whiteboard] Debounced saving to ${filePath}`, json.substring(0, 100));
        
        // Placeholder for future ArtifactStore API call
        /*
        await fetch(`${openCodeService.baseUrl}/api/v1/write`, {
          method: 'POST',
          body: JSON.stringify({
            path: filePath,
            content: json,
            meta: { actor: 'user', reason: 'auto-save', debounce: true }
          })
        });
        */

      } catch (error) {
        console.error('Failed to save whiteboard:', error);
      } finally {
        setIsSaving(false);
      }
    }, 1000);
  }, [filePath]);

  return { save, isSaving };
}
