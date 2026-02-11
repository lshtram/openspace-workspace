import { FileCode } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { BaseToolRenderer } from './BaseToolRenderer';
import { registerToolRenderer, type ToolRendererProps } from './core';

interface WriteToolInput {
  filePath?: string;
  path?: string;
  content?: string;
}

export function WriteToolRenderer({ part, isStep }: ToolRendererProps) {
  if (!part) {
    throw new Error('WriteToolRenderer requires tool part');
  }
  const input = (part.state.input || {}) as WriteToolInput;
  const filePath = input.filePath || input.path || 'unknown';
  const content = input.content || '';
  
  const extension = filePath.split('.').pop() || 'text';

  return (
    <BaseToolRenderer
      part={part}
      icon={FileCode}
      title="Write File"
      subtitle={filePath}
      isStep={isStep}
    >
      {content ? (
        <SyntaxHighlighter
          style={oneDark}
          language={extension}
          PreTag="div"
          className="rounded-lg !bg-transparent"
          customStyle={{ fontSize: '12px', padding: '0' }}
        >
          {content}
        </SyntaxHighlighter>
      ) : (
        <div className="opacity-40 italic text-center py-2">No content</div>
      )}
    </BaseToolRenderer>
  );
}

registerToolRenderer('write', WriteToolRenderer);
