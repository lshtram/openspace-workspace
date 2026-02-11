import { ListChecks, Clock, CheckCircle2, Circle, Ban } from 'lucide-react';
import { BaseToolRenderer } from './BaseToolRenderer';
import { registerToolRenderer, type ToolRendererProps } from './core';
import { cn } from '../../../lib/utils';

interface Todo {
  content: string;
  status: string;
  priority: string;
  id: string;
}

interface TodoWriteInput {
  todos?: Todo[];
}

export function TodoWriteToolRenderer({ part, isStep }: ToolRendererProps) {
  if (!part) {
    throw new Error('TodoWriteToolRenderer requires tool part');
  }
  const input = (part.state.input || {}) as TodoWriteInput;
  let todos = input.todos || (part.metadata?.todos as Todo[]) || [];
  
  // Ensure todos is an array
  if (!Array.isArray(todos)) {
    try {
      if (typeof todos === 'string') {
        todos = JSON.parse(todos);
      } else {
        todos = [];
      }
    } catch {
      todos = [];
    }
  }

  return (
    <BaseToolRenderer
      part={part}
      icon={ListChecks}
      title="Tasks"
      subtitle={`${Array.isArray(todos) ? todos.length : 0} items`}
      isStep={isStep}
      defaultExpanded={part.state.status !== 'error'}
    >
      {Array.isArray(todos) && todos.length > 0 ? (
        <div className="flex flex-col gap-2">
          {todos.map((todo) => (
            <div key={todo.id} className="flex items-start gap-3 p-2 rounded-lg bg-white/5 border border-white/5">
              <TodoStatusIcon status={todo.status} />
              <div className="flex flex-1 flex-col gap-1">
                <div className={cn(
                  "text-[13px]",
                  todo.status === 'completed' && "line-through opacity-50",
                  todo.status === 'cancelled' && "opacity-30"
                )}>
                  {todo.content}
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider",
                    todo.priority === 'high' ? "bg-red-500/20 text-red-400" :
                    todo.priority === 'medium' ? "bg-amber-500/20 text-amber-400" :
                    "bg-blue-500/20 text-blue-400"
                  )}>
                    {todo.priority}
                  </span>
                  <span className="text-[10px] opacity-40 uppercase font-bold tracking-wider">
                    {typeof todo.status === 'string' ? todo.status.replace('_', ' ') : 'unknown'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : part.state.status !== 'error' ? (
        <div className="py-4 text-center opacity-40 italic">No tasks defined</div>
      ) : (
        <div className="py-2 text-center opacity-40 italic">Failed to parse tasks</div>
      )}
      
      {/* If it's an error and we have raw input, show it for debugging */}
      {part.state.status === 'error' && !Array.isArray(input.todos) && (
        <pre className="mt-2 p-2 bg-black/20 rounded text-[10px] text-white/40 overflow-x-auto">
          Raw input: {JSON.stringify(input, null, 2)}
        </pre>
      )}
    </BaseToolRenderer>
  );
}

function TodoStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />;
    case 'in_progress':
      return <Clock size={16} className="text-blue-400 shrink-0 mt-0.5 animate-pulse" />;
    case 'cancelled':
      return <Ban size={16} className="text-gray-500 shrink-0 mt-0.5" />;
    default:
      return <Circle size={16} className="text-gray-400 shrink-0 mt-0.5" />;
  }
}

registerToolRenderer('todowrite', TodoWriteToolRenderer);
