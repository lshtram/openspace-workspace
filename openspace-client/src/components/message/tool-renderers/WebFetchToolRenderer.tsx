import { Globe } from 'lucide-react';
import { BaseToolRenderer } from './BaseToolRenderer';
import { MarkdownOutput } from './MarkdownOutput';
import { formatToolOutput } from './formatToolOutput';
import { registerToolRenderer, type ToolRendererProps } from './core';

interface WebFetchToolInput {
  url?: string;
  format?: string;
}

export function WebFetchToolRenderer({ part, isStep }: ToolRendererProps) {
  if (!part) {
    throw new Error('WebFetchToolRenderer requires tool part');
  }

  const input = (part.state.input || {}) as WebFetchToolInput;
  const output = part.state.status === 'completed' ? formatToolOutput(part.state.output) : '';
  const formatLabel = input.format ? `format=${input.format}` : '';

  return (
    <BaseToolRenderer
      part={part}
      icon={Globe}
      title="Webfetch"
      subtitle={input.url || formatLabel || 'request'}
      isStep={isStep}
    >
      {formatLabel && <div className="mb-2 text-[11px] text-gray-400">{formatLabel}</div>}
      {output ? (
        <MarkdownOutput content={output} />
      ) : (
        <div className="opacity-40 italic text-center py-2">No output</div>
      )}
    </BaseToolRenderer>
  );
}

registerToolRenderer('webfetch', WebFetchToolRenderer);
