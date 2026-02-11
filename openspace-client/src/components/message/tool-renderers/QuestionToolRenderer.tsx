import { HelpCircle, Check, MessageSquare } from 'lucide-react';
import { BaseToolRenderer } from './BaseToolRenderer';
import { registerToolRenderer, type ToolRendererProps } from './core';

interface QuestionOption {
  label: string;
  description: string;
}

interface QuestionInfo {
  question: string;
  header: string;
  options: QuestionOption[];
  multiple?: boolean;
  custom?: boolean;
}

interface QuestionToolInput {
  questions?: QuestionInfo[];
}

export function QuestionToolRenderer({ part, isStep }: ToolRendererProps) {
  if (!part) {
    throw new Error('QuestionToolRenderer requires tool part');
  }
  const input = (part.state.input || {}) as QuestionToolInput;
  const questions = input.questions || [];
  const answers = (part.metadata?.answers as string[][]) || [];

  return (
    <BaseToolRenderer
      part={part}
      icon={HelpCircle}
      title="Question"
      subtitle={`${questions.length} steps`}
      isStep={isStep}
      defaultExpanded={true}
    >
      <div className="flex flex-col gap-4">
        {questions.map((q) => (
          <div key={q.question} className="flex flex-col gap-2 p-3 rounded-lg bg-white/5 border border-white/5">
            <div className="text-[10px] uppercase font-bold tracking-wider opacity-40">{q.header}</div>
            <div className="text-[14px] font-medium">{q.question}</div>
            
            {answers[questions.indexOf(q)] ? (
              <div className="flex flex-col gap-1 mt-2">
                <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Answer:</div>
                <div className="flex flex-wrap gap-2">
                  {answers[questions.indexOf(q)].map((ans) => (
                    <div key={ans} className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[12px]">
                      <Check size={12} />
                      {ans}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 mt-2">
                {q.options.map((opt) => (
                  <div key={opt.label} className="flex flex-col gap-0.5 p-2 rounded bg-black/20 border border-white/5 opacity-50">
                    <div className="text-[12px] font-bold">{opt.label}</div>
                    <div className="text-[11px] opacity-60">{opt.description}</div>
                  </div>
                ))}
                {q.custom && (
                  <div className="flex items-center gap-2 p-2 rounded bg-black/20 border border-white/5 opacity-50 italic text-[11px]">
                    <MessageSquare size={12} />
                    Custom answer allowed
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </BaseToolRenderer>
  );
}

registerToolRenderer('question', QuestionToolRenderer);
