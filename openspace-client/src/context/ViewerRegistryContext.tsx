import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { IViewerAdapter, IViewerRegistry } from '../interfaces/INavigation';

const ViewerRegistryContext = createContext<IViewerRegistry | undefined>(undefined);

/**
 * @implements REQ-EDT-004
 */
export function ViewerRegistryProvider({ children }: { children: ReactNode }) {
  const [adapters, setAdapters] = useState<Map<string, IViewerAdapter>>(new Map());

  const register = useCallback((adapter: IViewerAdapter) => {
    setAdapters((prev) => {
      const next = new Map(prev);
      next.set(adapter.id, adapter);
      return next;
    });
  }, []);

  const getViewerForPath = useCallback((path: string) => {
    const extension = path.split('.').pop()?.toLowerCase() || '';
    for (const adapter of Array.from(adapters.values())) {
      if (adapter.extensions.includes(extension)) {
        return adapter;
      }
    }
    return null;
  }, [adapters]);

  const listAdapters = useCallback(() => {
    return Array.from(adapters.values());
  }, [adapters]);

  return (
    <ViewerRegistryContext.Provider value={{ register, getViewerForPath, listAdapters }}>
      {children}
    </ViewerRegistryContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useViewerRegistry() {
  const context = useContext(ViewerRegistryContext);
  if (!context) {
    throw new Error('useViewerRegistry must be used within ViewerRegistryProvider');
  }
  return context;
}
