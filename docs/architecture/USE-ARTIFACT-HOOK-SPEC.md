# useArtifact() Hook Specification

**Status:** Phase 0 - Design Complete  
**Date:** 2026-02-11  
**Author:** Oracle (oracle_7a3f)

---

## Overview

The `useArtifact()` hook is a **universal React hook** that provides a consistent interface for loading, editing, and synchronizing artifact files across all modalities (Drawing, Editor, Presentation, Voice, Comments, Browser).

This hook replaces modality-specific implementations and establishes a foundation for multi-window sync, real-time collaboration, and agent interactions.

---

## API Design

### **Signature**

```typescript
function useArtifact<T = string>(
  filePath: string,
  options?: UseArtifactOptions<T>
): UseArtifactResult<T>
```

### **Options**

```typescript
interface UseArtifactOptions<T> {
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
```

### **Result**

```typescript
interface UseArtifactResult<T> {
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
```

---

## Implementation Requirements

### **1. Initial Load**

1. Fetch file content from Hub API (`GET /artifacts/${filePath}`)
2. Parse content using `options.parse`
3. Set initial state
4. Handle 404 gracefully (empty artifact)
5. Notify Hub about active context (`POST /context/active-${modality}`)

### **2. Auto-Save**

1. Debounce `setData()` calls (default 1000ms)
2. Serialize data using `options.serialize`
3. POST to Hub API with actor='user'
4. Update `saving` state
5. Trigger `onSaved` / `onSaveError` callbacks

### **3. Multi-Window Sync (BroadcastChannel)**

1. Create channel: `BroadcastChannel('artifact-${filePath}')`
2. On local change: broadcast `{ type: 'UPDATE', data, timestamp }`
3. On remote message: 
   - If timestamp > local timestamp: apply update
   - If timestamp <= local timestamp: ignore (avoid loops)
4. Clean up channel on unmount

### **4. SSE Subscription**

1. Connect to `${HUB_URL}/events`
2. Listen for `FILE_CHANGED` events matching `filePath`
3. If `actor !== 'user'`: fetch latest content and update state
4. Trigger `onRemoteChange` callback
5. Handle reconnection on disconnect

### **5. Error Handling**

1. Initial load error: set `error` state, provide retry
2. Save error: log, show toast, trigger `onSaveError`
3. SSE disconnect: set `connected = false`, attempt reconnect
4. Parse/serialize error: log, fallback to raw string

---

## Usage Examples

### **Example 1: Whiteboard (JSON)**

```typescript
const { data, setData, loading, error, connected } = useArtifact<ExcalidrawElement[]>(
  'design/system.excalidraw',
  {
    parse: (content) => JSON.parse(content).elements || [],
    serialize: (elements) => JSON.stringify({ elements }, null, 2),
    debounceMs: 1000,
    onRemoteChange: (elements, actor) => {
      if (actor === 'agent') {
        pushToast({ title: 'Whiteboard updated by Agent', tone: 'info' });
      }
    }
  }
);

// Update whiteboard
const handleChange = (newElements) => {
  setData(newElements);
  // Auto-save triggered after 1000ms
};
```

### **Example 2: Text Editor (Plain Text)**

```typescript
const { data, setData, loading, error } = useArtifact<string>(
  'src/components/Button.tsx'
  // Defaults: parse=identity, serialize=String, debounce=1000ms
);

// Update file content
const handleEdit = (newContent) => {
  setData(newContent);
};
```

### **Example 3: Presentation (Markdown)**

```typescript
interface Slide {
  title: string;
  content: string;
}

const { data, setData, save } = useArtifact<Slide[]>(
  'docs/presentation/deck.md',
  {
    parse: (markdown) => parseMarkdownToSlides(markdown),
    serialize: (slides) => serializeSlidesToMarkdown(slides),
    debounceMs: 2000 // Longer debounce for heavy markdown parsing
  }
);
```

### **Example 4: Drawing V2 (Scene Graph)**

```typescript
interface SceneGraph {
  nodes: Node[];
  edges: Edge[];
  metadata: { type: 'flowchart' | 'sequence' | 'class' };
}

const { data, setData, connected, reload } = useArtifact<SceneGraph>(
  'design/auth-flow.diagram.json',
  {
    parse: (content) => {
      const json = JSON.parse(content);
      validateSceneGraph(json); // Throws if invalid
      return json;
    },
    serialize: (graph) => JSON.stringify(graph, null, 2),
    onRemoteChange: (graph, actor) => {
      if (actor === 'agent') {
        // Show diff preview before applying
        showAgentPatchPreview(graph);
      }
    }
  }
);
```

---

## Integration with Hub & MCP

### **Hub Changes (Minimal)**

1. **Rename endpoints** (breaking change):
   - `/artifacts/:path` → `/files/:path` (more universal)
   - Keep `/artifacts` as alias for backward compatibility

2. **Unified context API**:
   ```
   POST /context/active
   Body: { modality: 'drawing', filePath: 'design/system.diagram.json' }
   
   GET /context/active
   Response: { modality: 'drawing', filePath: '...', timestamp: '...' }
   ```

3. **No other changes** (SSE, ArtifactStore work as-is)

### **MCP Changes**

1. **Consolidate into `modality-mcp.ts`**:
   ```typescript
   // Namespace all tools
   {
     name: "drawing.inspect_scene",
     name: "drawing.propose_patch",
     name: "drawing.apply_patch",
     name: "editor.read",
     name: "editor.write",
     name: "presentation.list",
     name: "whiteboard.read", // Legacy support
     name: "whiteboard.update", // Legacy support
   }
   ```

2. **Shared helper functions**:
   ```typescript
   async function getActiveContext(): Promise<{ modality: string; filePath: string } | null>
   async function readFile(filePath: string): Promise<string>
   async function writeFile(filePath: string, content: string, reason: string): Promise<void>
   ```

3. **Tool-specific logic** (separated by namespace)

---

## Migration Strategy

### **Phase 0.1: Extract Hook (1 day)**

1. ✅ Create `src/hooks/useArtifact.ts`
2. ✅ Implement core logic (load, save, SSE, BroadcastChannel)
3. ✅ Add TypeScript types
4. ✅ Write unit tests

### **Phase 0.2: Refactor Whiteboard (1 day)**

1. Replace WhiteboardFrame's custom loading/SSE logic with `useArtifact()`
2. Keep Excalidraw-specific logic (reconciliation, Mermaid conversion)
3. Test that whiteboard still works
4. Document the pattern

### **Phase 0.3: Hub Simplification (1 day)**

1. Add `/files` endpoint (alias to `/artifacts` for now)
2. Add unified `/context/active` endpoint
3. Update Hub documentation
4. No breaking changes yet

### **Phase 0.4: MCP Consolidation (2 days)**

1. Create `modality-mcp.ts` with namespaced tools
2. Migrate whiteboard tools
3. Add shared helper functions
4. Test with existing agents
5. Update MCP config in OpenCode

---

## Testing Strategy

### **Unit Tests**

```typescript
describe('useArtifact', () => {
  it('loads file on mount');
  it('debounces auto-save');
  it('handles 404 gracefully');
  it('syncs across windows via BroadcastChannel');
  it('handles SSE updates');
  it('prevents save loops with isEqual');
  it('calls onRemoteChange callback');
  it('handles parse/serialize errors');
});
```

### **Integration Tests**

1. Two browser windows editing same file (multi-window sync)
2. Agent updates file via MCP (SSE propagation)
3. Network error during save (retry logic)
4. Concurrent edits (last-write-wins)

### **E2E Tests**

1. Full whiteboard workflow (draw → auto-save → agent update → reload)
2. Text editor workflow (edit → save → close → reopen)

---

## Non-Goals (Deferred to P2)

❌ **Operational transforms** (Yjs) - Not needed for MVP  
❌ **Write conflict resolution** (ETags) - Optimistic writes for now  
❌ **Cross-modality references** (TargetRef) - Simple callbacks for now  
❌ **Offline support** (IndexedDB) - Assume online  
❌ **Undo/Redo** (Operation log) - Modality-specific for now

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **BroadcastChannel not supported** (old browsers) | Multi-window sync fails | Feature detection, fallback to polling |
| **SSE connection drops** | Agent updates not received | Auto-reconnect with exponential backoff |
| **Large files (>10MB)** | Slow parse/serialize | Chunked loading (future), warn user |
| **Parse/serialize throws** | Hook crashes | Try-catch, fallback to raw string |
| **Concurrent writes** | Data loss | Accept optimistic writes for MVP, add ETags in P2 |

---

## Success Criteria

✅ Whiteboard refactored to use `useArtifact()` with no functionality loss  
✅ Multi-window sync works (open 2 tabs, edit in one, see update in other)  
✅ Agent updates trigger SSE reload (use MCP to update, see UI update)  
✅ Auto-save works (edit, wait 1s, check file on disk)  
✅ Error states handled gracefully (disconnect network, see error UI)  
✅ TypeScript types enforced (no `any` in hook or consumers)

---

## Next Steps

1. **Implement `useArtifact()` hook** (src/hooks/useArtifact.ts)
2. **Refactor WhiteboardFrame** to use it
3. **Test whiteboard workflow** (no regressions)
4. **Document the pattern** (example code, best practices)
5. **Prepare for Drawing V2** (scene graph will use this hook)

**Estimated time:** 3-4 days (1 week buffer = Phase 0 complete)

---

**Ready to implement?**
