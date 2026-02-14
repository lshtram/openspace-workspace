import React, { useEffect, useState, useCallback } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import type { PaneTab } from '../types';
import { storage, type EditorAppearance } from '../../../utils/storage';

const HUB_URL = import.meta.env.VITE_HUB_URL || 'http://localhost:3001';

interface Props {
  tab: PaneTab;
}

/**
 * Editor content component for the pane system.
 * Loads file content from the hub and renders Monaco editor.
 */
export function EditorContent({ tab }: Props) {
  const filePath = tab.contentId ?? '';
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const editorRef = React.useRef<any>(null);
  
  // Appearance settings
  const [appearance, setAppearance] = useState<EditorAppearance>(() => storage.getEditorAppearance());

  // Load file content when path changes
  useEffect(() => {
    if (!filePath) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Load file content from hub API
    fetch(`${HUB_URL}/files/${filePath}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load file: ${response.status} ${response.statusText}`);
        }
        return response.text();
      })
      .then((data) => {
        setContent(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        console.error('Failed to load file:', err);
        setError(err.message || 'Failed to load file');
        setContent('');
        setLoading(false);
      });
  }, [filePath]);

  // Update editor font size when appearance changes
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        fontSize: appearance.fontSize,
      });
    }
  }, [appearance]);

  const handleEditorMount: OnMount = (editorInstance) => {
    editorRef.current = editorInstance;
    
    // Add save action (Ctrl+S / Cmd+S)
    editorInstance.addAction({
      id: 'save-file',
      label: 'Save File',
      // @ts-expect-error - Monaco types
      keybindings: [window.__TAURI__ ? 0 /* Cmd */ | 49 /* S */ : 2048 /* Ctrl */ | 49 /* S */],
      run: () => {
        handleSave();
      }
    });
  };

  const handleSave = useCallback(async () => {
    if (!filePath || saving) return;
    
    setSaving(true);
    try {
      const response = await fetch(`${HUB_URL}/files/${filePath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save: ${response.status}`);
      }
      
      console.log('File saved:', filePath);
    } catch (err) {
      console.error('Failed to save file:', err);
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [filePath, content, saving]);

  // Get file extension for language detection
  const getLanguage = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase() || '';
    const languageMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'json': 'json',
      'md': 'markdown',
      'html': 'html',
      'css': 'css',
      'py': 'python',
      'rs': 'rust',
      'go': 'go',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'h': 'c',
      'hpp': 'cpp',
      'sql': 'sql',
      'sh': 'shell',
      'bash': 'shell',
      'yaml': 'yaml',
      'yml': 'yaml',
      'xml': 'xml',
      'toml': 'toml',
    };
    return languageMap[ext] || 'plaintext';
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[var(--os-bg-0)]">
        <div className="text-sm text-[var(--os-text-1)]">Loading {filePath}...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[var(--os-bg-0)]">
        <div className="text-sm text-red-400">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-[var(--os-bg-0)]">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-2 py-1 border-b border-[var(--os-border)] bg-[var(--os-bg-1)]">
        <span className="text-xs text-[var(--os-text-1)] truncate max-w-[200px]" title={filePath}>
          {tab.title || 'Untitled'}
        </span>
        {saving && <span className="text-xs text-[var(--os-text-1)]">Saving...</span>}
        <div className="flex-1" />
        
        {/* Font size controls */}
        <button 
          type="button"
          onClick={() => {
            const newSize = Math.max(8, appearance.fontSize - 1);
            setAppearance(a => ({ ...a, fontSize: newSize }));
            storage.saveEditorAppearance({ ...appearance, fontSize: newSize });
          }}
          className="px-2 py-0.5 text-xs hover:bg-[var(--os-bg-2)] rounded"
          title="Decrease font size"
        >
          A-
        </button>
        <span className="text-xs text-[var(--os-text-1)]">{appearance.fontSize}px</span>
        <button 
          type="button"
          onClick={() => {
            const newSize = Math.min(24, appearance.fontSize + 1);
            setAppearance(a => ({ ...a, fontSize: newSize }));
            storage.saveEditorAppearance({ ...appearance, fontSize: newSize });
          }}
          className="px-2 py-0.5 text-xs hover:bg-[var(--os-bg-2)] rounded"
          title="Increase font size"
        >
          A+
        </button>
      </div>
      
      {/* Monaco Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          path={filePath || undefined}
          language={getLanguage(filePath)}
          value={content}
          onChange={(value) => setContent(value || '')}
          onMount={handleEditorMount}
          theme="vs"
          loading={<div className="p-4">Loading editor...</div>}
          options={{
            fontSize: appearance.fontSize,
            minimap: { enabled: true },
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            renderLineHighlight: 'all',
            lineNumbers: 'on',
            glyphMargin: true,
            folding: true,
            tabSize: 2,
            insertSpaces: true,
          }}
        />
      </div>
    </div>
  );
}
