import { Bot } from 'lucide-react';
import { BaseToolRenderer } from './BaseToolRenderer';
import { registerToolRenderer, type ToolRendererProps } from './core';

interface TaskToolInput {
  subagent_type?: string;
  description?: string;
}

export function TaskToolRenderer({ part, isStep }: ToolRendererProps) {
  if (!part) {
    throw new Error('TaskToolRenderer requires tool part');
  }
  const input = (part.state.input || {}) as TaskToolInput;
  const childSessionId = part.metadata?.sessionId as string;
  const subagentType = input.subagent_type || 'task';

  return (
    <BaseToolRenderer
      part={part}
      icon={Bot}
      title={`Agent: ${subagentType}`}
      subtitle={input.description}
      isStep={isStep}
    >
      <div className="flex flex-col gap-2">
        <div className="text-[11px] uppercase tracking-wider opacity-40 font-bold">
          Sub-session: {childSessionId || 'pending...'}
        </div>
        {/* TODO: Implement recursive message rendering if childSessionId exists */}
        <div className="italic opacity-50">
          Agent is working in a sub-session.
        </div>
      </div>
    </BaseToolRenderer>
  );
}

registerToolRenderer('task', TaskToolRenderer);
