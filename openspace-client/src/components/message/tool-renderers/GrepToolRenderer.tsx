import { Search } from 'lucide-react';
import { BaseToolRenderer } from './BaseToolRenderer';
import { formatToolOutput } from './formatToolOutput';
import { registerToolRenderer, type ToolRendererProps } from './core';

interface GrepToolInput {
  path?: string;
  pattern?: string;
  include?: string;
}

export function GrepToolRenderer({ part, isStep }: ToolRendererProps) {
  if (!part) {
    throw new Error('GrepToolRenderer requires tool part');
  }

  const input = (part.state.input || {}) as GrepToolInput;
  const args: string[] = [];
  if (input.path) args.push(input.path);
  if (input.include) args.push(`include=${input.include}`);
  const subtitle = input.pattern || args.join(' ');
  const output = part.state.status === 'completed' ? part.state.output : null;

  return (
    <BaseToolRenderer
      part={part}
      icon={Search}
      title="Grep"
      subtitle={subtitle}
      isStep={isStep}
    >
      {output ? (
        <pre className="whitespace-pre-wrap text-gray-300">{formatToolOutput(output)}</pre>
      ) : (
        <div className="opacity-40 italic text-center py-2">No output</div>
      )}
    </BaseToolRenderer>
  );
}

registerToolRenderer('grep', GrepToolRenderer);
