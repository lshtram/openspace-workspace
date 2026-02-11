import type { ReactNode } from 'react';
import { List } from 'lucide-react';
import { BaseToolRenderer } from './BaseToolRenderer';
import { formatToolOutput } from './formatToolOutput';
import { registerToolRenderer, type ToolRendererProps } from './core';

interface ListToolInput {
  path?: string;
}

type ListEntry = {
  name?: string;
  type?: string;
  absolute?: string;
};

export function ListToolRenderer({ part, isStep }: ToolRendererProps) {
  if (!part) {
    throw new Error('ListToolRenderer requires tool part');
  }

  const input = (part.state.input || {}) as ListToolInput;
  const target = input.path || '/';
  const output = part.state.status === 'completed' ? part.state.output : null;

  const renderEntries = (entries: ListEntry[]) => (
    <div className="grid grid-cols-1 gap-1">
      {entries.map((entry, index) => (
        <div key={`${entry.absolute ?? entry.name ?? 'entry'}-${index}`} className="flex items-center gap-2 text-gray-300">
          <span className="opacity-40">{entry.type === 'directory' ? '📁' : '📄'}</span>
          <span className="truncate">{entry.name ?? entry.absolute ?? 'unknown'}</span>
        </div>
      ))}
    </div>
  );

  let body: ReactNode = <div className="opacity-40 italic text-center py-2">No output</div>;

  if (Array.isArray(output)) {
    body = renderEntries(output as ListEntry[]);
  } else if (output) {
    body = <pre className="whitespace-pre-wrap text-gray-300">{formatToolOutput(output)}</pre>;
  }

  return (
    <BaseToolRenderer
      part={part}
      icon={List}
      title="List Directory"
      subtitle={target}
      isStep={isStep}
    >
      {body}
    </BaseToolRenderer>
  );
}

registerToolRenderer('list', ListToolRenderer);
