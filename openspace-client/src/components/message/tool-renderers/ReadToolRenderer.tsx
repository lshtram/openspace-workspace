import { BookOpen } from 'lucide-react';
import { BaseToolRenderer } from './BaseToolRenderer';
import { formatToolOutput } from './formatToolOutput';
import { registerToolRenderer, type ToolRendererProps } from './core';

interface ReadToolInput {
  filePath?: string;
  path?: string;
  offset?: number;
  limit?: number;
}

export function ReadToolRenderer({ part, isStep }: ToolRendererProps) {
  if (!part) {
    throw new Error('ReadToolRenderer requires tool part');
  }

  const input = (part.state.input || {}) as ReadToolInput;
  const filePath = input.filePath || input.path || 'unknown';
  const args: string[] = [];
  if (typeof input.offset === 'number') args.push(`offset=${input.offset}`);
  if (typeof input.limit === 'number') args.push(`limit=${input.limit}`);

  const output = part.state.status === 'completed' ? formatToolOutput(part.state.output) : '';

  return (
    <BaseToolRenderer
      part={part}
      icon={BookOpen}
      title="Read File"
      subtitle={filePath}
      isStep={isStep}
    >
      {args.length > 0 && <div className="mb-2 text-[11px] text-gray-400">{args.join(' ')}</div>}
      {output ? (
        <pre className="whitespace-pre-wrap text-gray-300">{output}</pre>
      ) : (
        <div className="opacity-40 italic text-center py-2">No output</div>
      )}
    </BaseToolRenderer>
  );
}

registerToolRenderer('read', ReadToolRenderer);
