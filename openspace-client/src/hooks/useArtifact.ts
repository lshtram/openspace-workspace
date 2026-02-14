/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from 'react';

const HUB_URL = import.meta.env.VITE_HUB_URL || 'http://localhost:3001';

const now = () => new Date().toISOString();

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const logStart = (action: string, meta: Record<string, unknown>) => {
  console.log(`[useArtifact] ${action} start`, { ...meta, ts: now() });
};

const logSuccess = (action: string, meta: Record<string, unknown>) => {
  console.log(`[useArtifact] ${action} success`, { ...meta, ts: now() });
};

const logFailure = (action: string, meta: Record<string, unknown>) => {
  console.error(`[useArtifact] ${action} failure`, { ...meta, ts: now() });
};

// ============================================================================
// Types
// ============================================================================

export interface UseArtifactOptions<T> {
  /**
   * Parser to transform raw file content into typed data.
   * Defaults to identity function (raw string).
   */
  parse?: (content: string) => T;

  /**
   * Serializer to transform typed data back into file content.
   * Defaults to String(content).
   */
  serialize?: (data: T) => string;

  /**
   * Auto-save debounce delay in milliseconds.
   * Set to 0 to disable auto-save.
   * Default: 1000ms
   */
  debounceMs?: number;

  /**
   * Enable multi-window synchronization via BroadcastChannel.
   * Default: true
   */
  enableSync?: boolean;

  /**
   * Subscribe to SSE updates from agent/other actors.
   * Default: true
   */
  enableSSE?: boolean;

  /**
   * Custom equality check to prevent unnecessary saves.
   * Default: deep JSON comparison
   */
  isEqual?: (a: T, b: T) => boolean;

  /**
   * Callback when remote changes are received.
   */
  onRemoteChange?: (data: T, actor: 'user' | 'agent') => void;

  /**
   * Callback when save completes.
   */
  onSaved?: () => void;

  /**
   * Callback when save fails.
   */
  onSaveError?: (error: Error) => void;
}

export interface UseArtifactResult<T> {
  /**
   * Current artifact data (parsed).
   */
  data: T | null;

  /**
   * Update artifact data (triggers auto-save if enabled).
   */
  setData: (data: T | ((prev: T | null) => T)) => void;

  /**
   * Manually trigger save (bypasses debounce).
   */
  save: () => Promise<void>;

  /**
   * Loading state.
   */
  loading: boolean;

  /**
   * Error state (null if no error).
   */
  error: string | null;

  /**
   * SSE connection status.
   */
  connected: boolean;

  /**
   * Is save in progress?
   */
  saving: boolean;

  /**
   * Reload artifact from disk (discards local changes).
   */
  reload: () => Promise<void>;
}

interface BroadcastMessage<T> {
  type: 'UPDATE';
  data: T;
  timestamp: number;
}

interface LegacyFileChangedEvent {
  type: 'FILE_CHANGED';
  path: string;
  actor: 'user' | 'agent';
}

interface CanonicalArtifactEvent {
  type: 'ARTIFACT_UPDATED' | 'PATCH_APPLIED' | 'VALIDATION_FAILED';
  artifact: string;
  actor: 'user' | 'agent' | 'system';
}

type ArtifactEvent = LegacyFileChangedEvent | CanonicalArtifactEvent;

const isRelevantArtifactEvent = (event: ArtifactEvent, filePath: string): event is LegacyFileChangedEvent | CanonicalArtifactEvent => {
  if (event.type === 'FILE_CHANGED') {
    return event.path === filePath && event.actor === 'agent';
  }

  if (event.type === 'ARTIFACT_UPDATED' || event.type === 'PATCH_APPLIED') {
    return event.artifact === filePath && event.actor === 'agent';
  }

  return false;
};

// ============================================================================
// Default Options
// ============================================================================

const DEFAULT_OPTIONS: Required<Omit<UseArtifactOptions<any>, 'onRemoteChange' | 'onSaved' | 'onSaveError'>> = {
  parse: (content: string) => content as any,
  serialize: (data: any) => String(data),
  debounceMs: 1000,
  enableSync: true,
  enableSSE: true,
  isEqual: (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b),
};

// ============================================================================
// Hook Implementation
// ============================================================================

export function useArtifact<T = string>(
  filePath: string,
  options: UseArtifactOptions<T> = {}
): UseArtifactResult<T> {
  assertCondition(typeof filePath === 'string' && filePath.length > 0, 'filePath must be a non-empty string');
  const debounceMs = options.debounceMs ?? DEFAULT_OPTIONS.debounceMs;
  const enableSync = options.enableSync ?? DEFAULT_OPTIONS.enableSync;
  const enableSSE = options.enableSSE ?? DEFAULT_OPTIONS.enableSSE;

  const parseRef = useRef(options.parse ?? DEFAULT_OPTIONS.parse);
  const serializeRef = useRef(options.serialize ?? DEFAULT_OPTIONS.serialize);
  const isEqualRef = useRef(options.isEqual ?? DEFAULT_OPTIONS.isEqual);
  const onRemoteChangeRef = useRef(options.onRemoteChange);
  const onSavedRef = useRef(options.onSaved);
  const onSaveErrorRef = useRef(options.onSaveError);

  useEffect(() => {
    parseRef.current = options.parse ?? DEFAULT_OPTIONS.parse;
    serializeRef.current = options.serialize ?? DEFAULT_OPTIONS.serialize;
    isEqualRef.current = options.isEqual ?? DEFAULT_OPTIONS.isEqual;
    onRemoteChangeRef.current = options.onRemoteChange;
    onSavedRef.current = options.onSaved;
    onSaveErrorRef.current = options.onSaveError;
  }, [options.parse, options.serialize, options.isEqual, options.onRemoteChange, options.onSaved, options.onSaveError]);

  // State
  const [data, setDataState] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [saving, setSaving] = useState(false);

  // Refs
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const lastSavedRef = useRef<T | null>(null);
  const lastTimestampRef = useRef<number>(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Keep track of latest state for event listeners
  const stateRef = useRef({ data, filePath });
  useEffect(() => {
    stateRef.current = { data, filePath };
  }, [data, filePath]);

  // ============================================================================
  // Load File
  // ============================================================================

  const loadFile = useCallback(async () => {
    assertCondition(typeof filePath === 'string' && filePath.length > 0, 'filePath must be a non-empty string');
    setLoading(true);
    setError(null);

    try {
      logStart('load', { filePath });
      const response = await fetch(`${HUB_URL}/files/${filePath}`);

      if (!response.ok) {
        if (response.status === 404) {
          // File doesn't exist yet - start with empty state
          setDataState(null);
          lastSavedRef.current = null;
          logSuccess('load', { filePath, status: response.status, empty: true });
          return;
        }
        throw new Error(`Failed to load artifact: ${response.statusText}`);
      }

      const content = await response.text();
      let parsed: T;
      try {
        parsed = parseRef.current(content);
      } catch (err) {
        logFailure('parse', { filePath, error: err instanceof Error ? err.message : String(err) });
        parsed = content as unknown as T;
      }

      setDataState(parsed);
      lastSavedRef.current = parsed;
      lastTimestampRef.current = Date.now();
      logSuccess('load', { filePath, status: response.status });
    } catch (err: any) {
      logFailure('load', { filePath, error: err?.message || String(err) });
      setError(err.message || 'Failed to load artifact');
    } finally {
      setLoading(false);
    }
  }, [filePath]);

  // ============================================================================
  // Save File
  // ============================================================================

  const saveFile = useCallback(async (dataToSave: T) => {
    assertCondition(typeof filePath === 'string' && filePath.length > 0, 'filePath must be a non-empty string');
    assertCondition(dataToSave !== undefined, 'dataToSave is required');
    // Skip save if data is null (nothing to save)
    if (dataToSave === null) {
      return;
    }
    // Skip save if data hasn't changed from last saved version
    if (lastSavedRef.current !== null && isEqualRef.current(dataToSave, lastSavedRef.current)) {
      return;
    }

    setSaving(true);

    try {
      logStart('save', { filePath });
      let content: string;
      try {
        content = serializeRef.current(dataToSave);
      } catch (err) {
        logFailure('serialize', { filePath, error: err instanceof Error ? err.message : String(err) });
        onSaveErrorRef.current?.(err as Error);
        return;
      }

      const response = await fetch(`${HUB_URL}/files/${filePath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-openspace-write-mode': 'user-direct',
        },
        body: JSON.stringify({
          content,
          opts: {
            actor: 'user',
            reason: 'auto-save via useArtifact',
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save artifact: ${response.statusText}`);
      }

      lastSavedRef.current = dataToSave;
      lastTimestampRef.current = Date.now();

      onSavedRef.current?.();
      logSuccess('save', { filePath, status: response.status });
    } catch (err: any) {
      logFailure('save', { filePath, error: err?.message || String(err) });

      onSaveErrorRef.current?.(err);
    } finally {
      setSaving(false);
    }
  }, [filePath]);

  // ============================================================================
  // Manual Save (Bypass Debounce)
  // ============================================================================

  const save = useCallback(async () => {
    assertCondition(typeof filePath === 'string' && filePath.length > 0, 'filePath must be a non-empty string');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (data !== null) {
      await saveFile(data);
    }
  }, [data, filePath, saveFile]);

  // ============================================================================
  // Set Data (with Auto-Save)
  // ============================================================================

  const setData = useCallback(
    (newData: T | ((prev: T | null) => T)) => {
      assertCondition(newData !== undefined, 'newData is required');
      setDataState((prev) => {
        const next = typeof newData === 'function' ? (newData as (prev: T | null) => T)(prev) : newData;

        // Clear existing debounce timer
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        // Schedule auto-save
        if (debounceMs > 0) {
          debounceTimerRef.current = setTimeout(() => {
            saveFile(next);
          }, debounceMs);
        }

        // Broadcast to other windows
        if (enableSync && channelRef.current) {
          try {
            const timestamp = Date.now();
            lastTimestampRef.current = timestamp;
            channelRef.current.postMessage({
              type: 'UPDATE',
              data: next,
              timestamp,
            } as BroadcastMessage<T>);
          } catch (e) {
            console.warn('[useArtifact] Failed to broadcast update:', e);
          }
        }

        return next;
      });
    },
    [debounceMs, enableSync, saveFile]
  );

  // ============================================================================
  // Reload (Discard Local Changes)
  // ============================================================================

  const reload = useCallback(async () => {
    assertCondition(typeof filePath === 'string' && filePath.length > 0, 'filePath must be a non-empty string');
    // Cancel pending saves
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    await loadFile();
  }, [filePath, loadFile]);

  // ============================================================================
  // Multi-Window Sync (BroadcastChannel)
  // ============================================================================

  useEffect(() => {
    if (!enableSync) return;

    try {
      const channel = new BroadcastChannel(`artifact-${filePath}`);
      channelRef.current = channel;

      channel.onmessage = (event: MessageEvent<BroadcastMessage<T>>) => {
        const { data: remoteData, timestamp } = event.data;

        // Only apply if remote timestamp is newer (prevents loops)
        if (timestamp > lastTimestampRef.current) {
          setDataState(remoteData);
          lastTimestampRef.current = timestamp;

          onRemoteChangeRef.current?.(remoteData, 'user');
        }
      };

      return () => {
        channel.close();
        channelRef.current = null;
      };
    } catch (e) {
      console.warn('[useArtifact] BroadcastChannel not supported:', e);
      return;
    }
  }, [filePath, enableSync]);

  // ============================================================================
  // SSE Subscription
  // ============================================================================

  useEffect(() => {
    if (!enableSSE) return;

    let isMounted = true;
    logStart('sse-connect', { filePath });
    const eventSource = new EventSource(`${HUB_URL}/events`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      logSuccess('sse-connect', { filePath });
      setConnected(true);
    };

    eventSource.onerror = (err) => {
      logFailure('sse-connect', { filePath, error: err instanceof Event ? err.type : 'unknown' });
      setConnected(false);
    };

    eventSource.onmessage = async (event) => {
      try {
        if (event.data === ': heartbeat') return;

        const update = JSON.parse(event.data) as ArtifactEvent;

        if (isRelevantArtifactEvent(update, stateRef.current.filePath)) {
          logStart('sse-reload', {
            filePath,
            actor: update.actor,
            eventType: update.type,
          });

          // CRITICAL: Cancel any pending debounced saves to prevent overwriting remote changes
          if (debounceTimerRef.current) {
            console.log('[useArtifact] Canceling pending save due to remote change');
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
          }

          // Fetch latest content
          const response = await fetch(`${HUB_URL}/files/${filePath}`);
          if (!response.ok) {
            logFailure('sse-reload', { filePath, status: response.status, error: response.statusText });
            return;
          }

          const content = await response.text();
          let parsed: T;
          try {
            parsed = parseRef.current(content);
          } catch (err) {
            logFailure('parse', { filePath, error: err instanceof Error ? err.message : String(err) });
            parsed = content as unknown as T;
          }

          if (isMounted) {
            setDataState(parsed);
            lastSavedRef.current = parsed;
            lastTimestampRef.current = Date.now();

            onRemoteChangeRef.current?.(parsed, 'agent');
            logSuccess('sse-reload', { filePath, status: response.status });
          }
        }
      } catch (err) {
        logFailure('sse-reload', { filePath, error: err instanceof Error ? err.message : String(err) });
      }
    };

    return () => {
      isMounted = false;
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [filePath, enableSSE]);

  // ============================================================================
  // Initial Load
  // ============================================================================

  useEffect(() => {
    loadFile();
  }, [loadFile]);

  // ============================================================================
  // Cleanup Debounce Timer
  // ============================================================================

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // ============================================================================
  // Return Hook Result
  // ============================================================================

  return {
    data,
    setData,
    save,
    loading,
    error,
    connected,
    saving,
    reload,
  };
}
