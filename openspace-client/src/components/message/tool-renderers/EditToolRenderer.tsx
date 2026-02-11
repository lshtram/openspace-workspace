import { FileEdit } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { BaseToolRenderer } from './BaseToolRenderer';
import { registerToolRenderer, type ToolRendererProps } from './core';
import { generateSimpleDiff } from '../../../utils/diff';

interface EditToolInput {
  filePath?: string;
  path?: string;
  oldString?: string;
  newString?: string;
}

export function EditToolRenderer({ part, isStep }: ToolRendererProps) {
  if (!part) {
    throw new Error('EditToolRenderer requires tool part');
  }
  const input = (part.state.input || {}) as EditToolInput;
  const filePath = input.filePath || input.path || 'unknown';
  const oldString = input.oldString || '';
  const newString = input.newString || '';
  
  const diff = generateSimpleDiff(oldString, newString);

  return (
    <BaseToolRenderer
      part={part}
      icon={FileEdit}
      title="Edit File"
      subtitle={filePath}
      isStep={isStep}
    >
      <SyntaxHighlighter
        style={oneDark}
        language="diff"
        PreTag="div"
        className="rounded-lg !bg-transparent"
        customStyle={{ fontSize: '12px', padding: '0' }}
      >
        {diff}
      </SyntaxHighlighter>
    </BaseToolRenderer>
  );
}

registerToolRenderer('edit', EditToolRenderer);
