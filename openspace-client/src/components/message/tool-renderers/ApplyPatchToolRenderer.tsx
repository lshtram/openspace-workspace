import { FileDiff } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { BaseToolRenderer } from './BaseToolRenderer';
import { formatToolOutput } from './formatToolOutput';
import { registerToolRenderer, type ToolRendererProps } from './core';

interface ApplyPatchInput {
  patchText?: string;
}

export function ApplyPatchToolRenderer({ part, isStep }: ToolRendererProps) {
  if (!part) {
    throw new Error('ApplyPatchToolRenderer requires tool part');
  }

  const input = (part.state.input || {}) as ApplyPatchInput;
  const patchText = input.patchText || '';
  const output = part.state.status === 'completed' ? formatToolOutput(part.state.output) : '';

  return (
    <BaseToolRenderer
      part={part}
      icon={FileDiff}
      title="Apply Patch"
      subtitle={patchText ? 'patch' : 'no patch'}
      isStep={isStep}
    >
      {patchText ? (
        <SyntaxHighlighter
          style={oneDark}
          language="diff"
          PreTag="div"
          className="rounded-lg !bg-transparent"
          customStyle={{ fontSize: '12px', padding: '0' }}
        >
          {patchText}
        </SyntaxHighlighter>
      ) : (
        <div className="opacity-40 italic text-center py-2">No patch text</div>
      )}
      {output && (
        <pre className="mt-3 whitespace-pre-wrap text-gray-300">{output}</pre>
      )}
    </BaseToolRenderer>
  );
}

registerToolRenderer('apply_patch', ApplyPatchToolRenderer);
