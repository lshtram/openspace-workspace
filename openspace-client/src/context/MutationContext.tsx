import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useFileTabs } from './FileTabsContext';

export interface FileMutation {
  id: string;
  path: string;
  content: string; // The proposed full content (simplified for MVP)
  diff?: string;    // Optional unified diff
}

interface MutationContextType {
  pendingMutations: FileMutation[];
  proposeMutation: (mutation: FileMutation) => void;
  resolveMutation: (id: string, action: 'apply-buffer' | 'apply-disk' | 'reject') => Promise<void>;
}

const MutationContext = createContext<MutationContextType | undefined>(undefined);

/**
 * @implements REQ-EDT-012
 * @implements REQ-EDT-014
 */
export function MutationProvider({ children }: { children: ReactNode }) {
  const [pendingMutations, setPendingMutations] = useState<FileMutation[]>([]);
  const { updateFileContent } = useFileTabs();

  const proposeMutation = useCallback((mutation: FileMutation) => {
    setPendingMutations(prev => [...prev, mutation]);
  }, []);

  /**
   * @implements REQ-EDT-012
   * @implements REQ-EDT-014
   */
  const resolveMutation = useCallback(async (id: string, action: 'apply-buffer' | 'apply-disk' | 'reject') => {
    const mutation = pendingMutations.find(m => m.id === id);
    if (!mutation) return;

    if (action === 'apply-buffer' || action === 'apply-disk') {
      updateFileContent(mutation.path, mutation.content);
      if (action === 'apply-disk') {
        console.log(`[MutationContext] Writing to disk: ${mutation.path}`);
        // await openCodeService.writeFile(mutation.path, mutation.content);
      }
    }

    setPendingMutations(prev => prev.filter(m => m.id !== id));
  }, [pendingMutations, updateFileContent]);

  return (
    <MutationContext.Provider value={{ pendingMutations, proposeMutation, resolveMutation }}>
      {children}
    </MutationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMutationStore() {
  const context = useContext(MutationContext);
  if (!context) {
    throw new Error('useMutationStore must be used within MutationProvider');
  }
  return context;
}
