import { useCallback } from 'react';
import { useNavigation } from './useNavigation';

/**
 * @implements REQ-EDT-016
 */
export function useLinkResolver() {
  const { openFileAt } = useNavigation();

  const resolveLink = useCallback((href: string) => {
    // Expected patterns:
    // 1. openspace://file/path/to/file.ts
    // 2. openspace://file/path/to/file.ts#L10
    // 3. openspace://file/path/to/file.ts#L10-L20
    
    if (href.startsWith('openspace://file/')) {
      const parts = href.substring('openspace://file/'.length).split('#');
      const path = parts[0];
      const fragment = parts[1] || '';
      
      let startLine = 1;
      let endLine: number | undefined;

      const lineMatch = fragment.match(/^L(\d+)(-L(\d+))?$/);
      if (lineMatch) {
        startLine = parseInt(lineMatch[1]);
        if (lineMatch[3]) {
          endLine = parseInt(lineMatch[3]);
        }
      }

      openFileAt(path, { path, startLine, endLine }, { source: 'agent-link', applyHighlight: true });
      return true;
    }
    
    // Also handle standard file paths if they are marked with a specific class or data attribute
    // but for now we focus on the openspace:// scheme.
    
    return false;
  }, [openFileAt]);

  return { resolveLink };
}
