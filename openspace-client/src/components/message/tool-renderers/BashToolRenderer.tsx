import { Terminal } from 'lucide-react';
import { BaseToolRenderer } from './BaseToolRenderer';
import { registerToolRenderer, type ToolRendererProps } from './core';
import { stripAnsi } from './stripAnsi';

interface BashToolInput {
  command?: string;
  description?: string;
}

export function BashToolRenderer({ part, isStep }: ToolRendererProps) {
  if (!part) {
    throw new Error('BashToolRenderer requires tool part');
  }
  const input = (part.state.input || {}) as BashToolInput;
  const command = input.command || (part.metadata?.command as string) || '';
  const output = (part.state.status === 'completed' ? part.state.output : '') as string;
  const error = (part.state.status === 'error' ? part.state.error : '') as string;

  return (
    <BaseToolRenderer
      part={part}
      icon={Terminal}
      title="Bash"
      subtitle={input.description || command}
      isStep={isStep}
    >
      <div className="flex flex-col gap-2">
        <div className="text-emerald-400 font-bold">$ {command}</div>
        {output && (
          <pre className="whitespace-pre-wrap text-gray-300">
            {stripAnsi(output)}
          </pre>
        )}
        {error && (
          <pre className="whitespace-pre-wrap text-red-400">
            {stripAnsi(error)}
          </pre>
        )}
      </div>
    </BaseToolRenderer>
  );
}

registerToolRenderer('bash', BashToolRenderer);
registerToolRenderer('pty', BashToolRenderer);
