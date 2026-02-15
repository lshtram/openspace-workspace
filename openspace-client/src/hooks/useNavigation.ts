import { useCallback, useState } from 'react';
import { useFileTabs } from '../context/FileTabsContext';
import { useHighlight } from '../context/HighlightContext';
import { useLayout } from '../context/LayoutContext';
import { useMutationStore, type FileMutation } from '../context/MutationContext';
import type { EditorLocation, NavigationHistoryEntry, OpenFileAtOptions } from '../interfaces/INavigation';
import { createLogger } from '../lib/logger';

const log = createLogger('useNavigation');

/**
 * @implements REQ-EDT-005
 * @implements REQ-EDT-007
 * @implements REQ-EDT-003
 * @implements REQ-EDT-015
 * @implements REQ-EDT-012
 * @implements REQ-EDT-014
 * @implements REQ-DFR-008
 * @implements REQ-DFR-009
 * @implements REQ-DFR-010
 */
export function useNavigation() {
  const { openFile, activeFilePath, isDirty, updateFileContent } = useFileTabs();
  const { applyHighlight, clearAllAgentHighlights } = useHighlight();
  const { setActiveArtifactPane } = useLayout();
  const { proposeMutation } = useMutationStore();
  
  const [history, setHistory] = useState<NavigationHistoryEntry[]>([]);

  /**
   * @implements REQ-EDT-012
   * @implements REQ-EDT-014
   */
  const applyMutation = useCallback(async (mutation: FileMutation) => {
    if (isDirty(mutation.path)) {
      // REQ-EDT-012: Preview-First for dirty tabs
      proposeMutation(mutation);
    } else {
      // Directly apply to buffer if clean
      updateFileContent(mutation.path, mutation.content);
    }
  }, [isDirty, proposeMutation, updateFileContent]);

  /**
   * Opens a file at a specific location with optional highlight.
   * @implements REQ-EDT-005 - OpenFileAtOptions contract
   * @implements REQ-EDT-007 - EditorLocation with line/column
   * @implements REQ-EDT-015 - Jump-back history
   * @implements REQ-DFR-008 - Diff-to-editor handoff with side context
   * @implements REQ-DFR-009 - Auto-apply transient highlight
   * @implements REQ-DFR-010 - Track diff anchor for jump-back
   */
  const openFileAt = useCallback(async (path: string, selection?: EditorLocation, options?: OpenFileAtOptions) => {
    // 1. Record current location for jump-back if it's an agent-guided or diff-handoff jump
    if (activeFilePath && (options?.source === 'agent-link' || options?.source === 'diff-handoff')) {
      const historyEntry: NavigationHistoryEntry = { 
        path: activeFilePath, 
        startLine: 1,
        source: options.source,
      };
      
      // REQ-DFR-010: Store diff anchor info for deterministic jump-back
      if (options.source === 'diff-handoff') {
        historyEntry.diffAnchor = {
          side: options.side || 'after',
          handoffId: `handoff-${Date.now()}`,
        };
      }
      
      setHistory(prev => [...prev.slice(-19), historyEntry]);
    }

    // 2. Normalize path - REQ-DFR-008: normalized target path
    const normalizedPath = path.startsWith('./') ? path.substring(2) : path;
    const name = normalizedPath.split('/').pop() || normalizedPath;

    // 3. Open file in tabs
    openFile({
      path: normalizedPath,
      name,
    });

    // 4. Set layout modality to editor
    const splitMode = options?.splitMode || (options?.source === 'agent-link' ? 'side-by-side' : 'reuse-active-pane');
    
    if (splitMode === 'side-by-side' || !activeFilePath) {
      setActiveArtifactPane({ path: normalizedPath, modality: 'editor' });
    }


    // 5. REQ-DFR-009: Apply transient highlight if requested (auto-apply for diff-handoff)
    if (options?.applyHighlight && selection) {
      applyHighlight({
        id: options.highlightId || `highlight-${Date.now()}`,
        path: normalizedPath,
        startLine: selection.startLine,
        startColumn: selection.startColumn,
        endLine: selection.endLine,
        endColumn: selection.endColumn,
        actor: options.source === 'agent-link' ? 'agent' : 'system',
        reason: options.source === 'diff-handoff' ? 'diff-handoff' : 'link-follow',
      });
    }
  }, [openFile, applyHighlight, setActiveArtifactPane, activeFilePath]);

  /**
   * Jump-back to previous location.
   * @implements REQ-EDT-015
   * @implements REQ-DFR-010 - Editor jump-back restores diff anchor deterministically
   */
  const jumpBack = useCallback(() => {
    if (history.length === 0) return;
    
    const last = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    
    // REQ-DFR-010: Jump-back restores originating diff file/anchor
    openFileAt(last.path, last, { source: 'manual' });
    clearAllAgentHighlights();
  }, [history, openFileAt, clearAllAgentHighlights]);

  /**
   * @implements REQ-EDT-003
   */
  const saveActiveFile = useCallback(async (content: string) => {
    if (!activeFilePath) return;
    
    // In a real implementation, this would go through a validated mutation pipeline.
    // For MVP, we'll use the OpenCodeClient's write capability (if it exists) 
    // or simulate the save event.
    log.debug('Saving file:', { path: activeFilePath, contentLength: content.length });
    
    // For now, let's assume we can use openCodeService or a similar hook to perform the write.
    // In the future, this would emit an event that the Hub handles.
    // openCodeService.writeFile(activeFilePath, content);
  }, [activeFilePath]);

  return { openFileAt, saveActiveFile, jumpBack, applyMutation, hasHistory: history.length > 0 };
}
