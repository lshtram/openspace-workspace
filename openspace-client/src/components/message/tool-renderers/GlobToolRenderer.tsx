import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { BaseToolRenderer } from './BaseToolRenderer';
import { formatToolOutput } from './formatToolOutput';
import { registerToolRenderer, type ToolRendererProps } from './core';

interface GlobToolInput {
  path?: string;
  pattern?: string;
}

export function GlobToolRenderer({ part, isStep }: ToolRendererProps) {
  if (!part) {
    throw new Error('GlobToolRenderer requires tool part');
  }

  const input = (part.state.input || {}) as GlobToolInput;
  const subtitle = input.pattern || input.path || '/';
  const output = part.state.status === 'completed' ? part.state.output : null;

  let body: ReactNode = <div className="opacity-40 italic text-center py-2">No output</div>;

  if (Array.isArray(output)) {
    body = (
      <div className="grid grid-cols-1 gap-1">
        {output.map((entry, index) => (
          <div key={`${String(entry)}-${index}`} className="text-gray-300">
            {String(entry)}
          </div>
        ))}
      </div>
    );
  } else if (output) {
    body = <pre className="whitespace-pre-wrap text-gray-300">{formatToolOutput(output)}</pre>;
  }

  return (
    <BaseToolRenderer
      part={part}
      icon={Search}
      title="Glob"
      subtitle={subtitle}
      isStep={isStep}
    >
      {body}
    </BaseToolRenderer>
  );
}

registerToolRenderer('glob', GlobToolRenderer);
