import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { HighlightRange } from '../interfaces/INavigation';

interface HighlightContextType {
  highlights: HighlightRange[];
  applyHighlight: (range: HighlightRange) => void;
  updateHighlight: (range: HighlightRange) => void;
  clearHighlight: (id: string) => void;
  clearAllAgentHighlights: () => void;
}

const HighlightContext = createContext<HighlightContextType | undefined>(undefined);

/**
 * @implements REQ-EDT-008
 * @implements REQ-EDT-010
 * @implements REQ-EDT-013
 */
export function HighlightProvider({ children }: { children: ReactNode }) {
  const [highlights, setHighlights] = useState<HighlightRange[]>([]);

  /**
   * @implements REQ-EDT-008
   */
  const applyHighlight = useCallback((range: HighlightRange) => {
    setHighlights((prev) => {
      const filtered = prev.filter((h) => h.id !== range.id);
      return [...filtered, range];
    });
  }, []);

  /**
   * @implements REQ-EDT-008
   */
  const updateHighlight = useCallback((range: HighlightRange) => {
    setHighlights((prev) =>
      prev.map((h) => (h.id === range.id ? range : h))
    );
  }, []);

  /**
   * @implements REQ-EDT-008
   */
  const clearHighlight = useCallback((id: string) => {
    setHighlights((prev) => prev.filter((h) => h.id !== id));
  }, []);

  /**
   * @implements REQ-EDT-010
   */
  const clearAllAgentHighlights = useCallback(() => {
    setHighlights((prev) => prev.filter((h) => h.actor !== 'agent'));
  }, []);

  return (
    <HighlightContext.Provider
      value={{
        highlights,
        applyHighlight,
        updateHighlight,
        clearHighlight,
        clearAllAgentHighlights,
      }}
    >
      {children}
    </HighlightContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useHighlight() {
  const context = useContext(HighlightContext);
  if (!context) {
    throw new Error('useHighlight must be used within HighlightProvider');
  }
  return context;
}
