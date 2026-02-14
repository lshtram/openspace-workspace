import { useEffect } from 'react';
import { useViewerRegistry } from '../context/ViewerRegistryContext';

/**
 * @implements REQ-EDT-004
 */
export function useViewerSetup() {
  const { register } = useViewerRegistry();

  useEffect(() => {
    // Register Markdown Viewer
    register({
      id: 'markdown-viewer',
      name: 'Markdown',
      extensions: ['md', 'markdown'],
      component: ({ path }: { path: string }) => (
        <div className="p-4 prose prose-invert max-w-none">
          {/* This would be the actual ReactMarkdown component */}
          <h1>Rendered View for {path}</h1>
          <p>Renderer implementation deferred to vertical slice 2.</p>
        </div>
      )
    });

    // Add more viewers as needed
  }, [register]);
}
