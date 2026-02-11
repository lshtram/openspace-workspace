import { useEffect, useMemo, useState } from 'react';
import { Check, HelpCircle, Loader2, MessageSquare, X } from 'lucide-react';
import { openCodeService } from '../../../services/OpenCodeClient';
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

type QuestionRequest = {
  id: string;
  sessionID: string;
  questions: QuestionInfo[];
  tool?: {
    messageID: string;
    callID: string;
  };
};

const now = () => new Date().toISOString();
const EMPTY_QUESTIONS: QuestionInfo[] = [];

export function QuestionToolRenderer({ part, isStep }: ToolRendererProps) {
  if (!part) {
    throw new Error('QuestionToolRenderer requires tool part');
  }
  const input = (part.state.input || {}) as QuestionToolInput;
  const questions = input.questions ?? EMPTY_QUESTIONS;
  const answers = (part.metadata?.answers as string[][]) || [];
  const metadataRequestId = (part.metadata as { requestID?: string } | undefined)?.requestID;
  const questionCount = questions.length;

  const [requestId, setRequestId] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestLoading, setRequestLoading] = useState(false);
  const [selected, setSelected] = useState<string[][]>([]);
  const [customInputs, setCustomInputs] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedAnswers, setSubmittedAnswers] = useState<string[][] | null>(null);

  useEffect(() => {
    setSelected(Array.from({ length: questionCount }, () => []));
    setCustomInputs(Array.from({ length: questionCount }, () => ''));
  }, [questionCount]);

  useEffect(() => {
    let isMounted = true;

    const loadRequest = async () => {
      if (!part.sessionID) return;
      setRequestLoading(true);
      setRequestError(null);
      console.log(`[question][${now()}] request:start`, { sessionID: part.sessionID, messageID: part.messageID, callID: part.callID });

      try {
        if (metadataRequestId) {
          if (isMounted) setRequestId(metadataRequestId);
          console.log(`[question][${now()}] request:success`, { requestID: metadataRequestId, source: 'metadata' });
          return;
        }

        const response = await openCodeService.client.question.list({
          directory: openCodeService.directory,
        });
        const pending = Array.isArray(response) ? (response as QuestionRequest[]) : [];
        const byTool = pending.find((req) =>
          req.sessionID === part.sessionID &&
          req.tool?.messageID === part.messageID &&
          req.tool?.callID === part.callID
        );
        const sessionMatches = pending.filter((req) => req.sessionID === part.sessionID);
        const fallback = byTool ?? (sessionMatches.length === 1 ? sessionMatches[0] : undefined) ?? (pending.length === 1 ? pending[0] : undefined);

        if (isMounted) {
          setRequestId(fallback?.id ?? null);
        }

        console.log(`[question][${now()}] request:success`, { requestID: fallback?.id ?? null, pending: pending.length });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load question request';
        if (isMounted) setRequestError(message);
        console.error(`[question][${now()}] request:failure`, error);
      } finally {
        if (isMounted) setRequestLoading(false);
      }
    };

    loadRequest();
    return () => {
      isMounted = false;
    };
  }, [part.sessionID, part.messageID, part.callID, metadataRequestId]);

  const effectiveAnswers = submittedAnswers ?? answers;

  const canSubmit = useMemo(() => {
    if (questions.length === 0) return false;
    return questions.every((q, index) => {
      const selectedItems = selected[index] ?? [];
      const customAllowed = q.custom !== false;
      const customText = customAllowed ? (customInputs[index] ?? '').trim() : '';
      return selectedItems.length > 0 || customText.length > 0;
    });
  }, [questions, selected, customInputs]);

  const toggleOption = (questionIndex: number, label: string, multiple?: boolean) => {
    setSelected((prev) => {
      const next = [...prev];
      const current = new Set(next[questionIndex] ?? []);
      if (multiple) {
        if (current.has(label)) current.delete(label);
        else current.add(label);
        next[questionIndex] = Array.from(current);
      } else {
        next[questionIndex] = [label];
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    const answersPayload = questions.map((q, index) => {
      const selections = selected[index] ?? [];
      const customAllowed = q.custom !== false;
      const customText = customAllowed ? (customInputs[index] ?? '').trim() : '';
      return customText ? [...selections, customText] : selections;
    });

    setIsSubmitting(true);
    try {
      let resolvedRequestId = requestId;
      if (!resolvedRequestId) {
        const response = await openCodeService.client.question.list({
          directory: openCodeService.directory,
        });
        const pending = Array.isArray(response) ? (response as QuestionRequest[]) : [];
        const byTool = pending.find((req) =>
          req.sessionID === part.sessionID &&
          req.tool?.messageID === part.messageID &&
          req.tool?.callID === part.callID
        );
        const sessionMatches = pending.filter((req) => req.sessionID === part.sessionID);
        const fallback = byTool ?? (sessionMatches.length === 1 ? sessionMatches[0] : undefined) ?? (pending.length === 1 ? pending[0] : undefined);
        resolvedRequestId = fallback?.id ?? null;
        if (resolvedRequestId) setRequestId(resolvedRequestId);
      }

      if (!resolvedRequestId) {
        setRequestError('Question request not available yet.');
        return;
      }

      console.log(`[question][${now()}] reply:start`, { requestID: resolvedRequestId });
      await openCodeService.client.question.reply({
        requestID: resolvedRequestId,
        directory: openCodeService.directory,
        answers: answersPayload,
      });
      setSubmittedAnswers(answersPayload);
      console.log(`[question][${now()}] reply:success`, { requestID: resolvedRequestId });
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Failed to submit answers');
      console.error(`[question][${now()}] reply:failure`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      let resolvedRequestId = requestId;
      if (!resolvedRequestId) {
        const response = await openCodeService.client.question.list({
          directory: openCodeService.directory,
        });
        const pending = Array.isArray(response) ? (response as QuestionRequest[]) : [];
        const byTool = pending.find((req) =>
          req.sessionID === part.sessionID &&
          req.tool?.messageID === part.messageID &&
          req.tool?.callID === part.callID
        );
        const sessionMatches = pending.filter((req) => req.sessionID === part.sessionID);
        const fallback = byTool ?? (sessionMatches.length === 1 ? sessionMatches[0] : undefined) ?? (pending.length === 1 ? pending[0] : undefined);
        resolvedRequestId = fallback?.id ?? null;
        if (resolvedRequestId) setRequestId(resolvedRequestId);
      }

      if (!resolvedRequestId) {
        setRequestError('Question request not available yet.');
        return;
      }

      console.log(`[question][${now()}] reject:start`, { requestID: resolvedRequestId });
      await openCodeService.client.question.reject({
        requestID: resolvedRequestId,
        directory: openCodeService.directory,
      });
      console.log(`[question][${now()}] reject:success`, { requestID: resolvedRequestId });
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Failed to reject question');
      console.error(`[question][${now()}] reject:failure`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseToolRenderer
      part={part}
      icon={HelpCircle}
      title="Question"
      subtitle={`${questions.length} steps`}
      isStep={isStep}
      defaultExpanded={true}
      bodyClassName="bg-sky-50/80 border-sky-100 text-black/70 font-sans"
    >
      <div className="flex flex-col gap-4">
        {questions.map((q, index) => (
          <div key={q.question} className="flex flex-col gap-2 rounded-lg border border-sky-100 bg-white/80 p-3 shadow-sm">
            <div className="text-[10px] uppercase font-bold tracking-wider text-black/40">{q.header}</div>
            <div className="text-[14px] font-medium text-black/70">{q.question}</div>
            
            {effectiveAnswers[index] ? (
              <div className="flex flex-col gap-1 mt-2">
                <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Answer:</div>
                <div className="flex flex-wrap gap-2">
                  {effectiveAnswers[index].map((ans) => (
                    <div key={ans} className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[12px]">
                      <Check size={12} />
                      {ans}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 mt-2">
                {q.options.map((opt) => {
                  const isSelected = (selected[index] ?? []).includes(opt.label);
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => toggleOption(index, opt.label, q.multiple)}
                      className={`flex flex-col gap-0.5 rounded border p-2 text-left transition ${
                        isSelected
                          ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-700'
                          : 'border-black/10 bg-white text-black/60 hover:border-black/20'
                      }`}
                    >
                      <div className="text-[12px] font-bold">{opt.label}</div>
                      <div className="text-[11px] opacity-60">{opt.description}</div>
                    </button>
                  );
                })}
                {(q.custom ?? true) && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-[11px] text-black/50">
                      <MessageSquare size={12} />
                      Custom answer
                    </div>
                    <input
                      className="rounded-md border border-black/10 bg-white px-2 py-1 text-[12px] text-black/70 placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                      placeholder="Type your answer"
                      value={customInputs[index] ?? ''}
                      onChange={(event) => {
                        const value = event.target.value;
                        setCustomInputs((prev) => {
                          const next = [...prev];
                          next[index] = value;
                          return next;
                        });
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {!effectiveAnswers.length && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-sky-100 bg-white/70 p-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-[12px] font-semibold transition ${
                canSubmit && !isSubmitting
                  ? 'bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25'
                  : 'bg-black/5 text-black/30'
              }`}
            >
              {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              Submit answers
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={isSubmitting}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-[12px] font-semibold transition ${
                isSubmitting ? 'text-black/30' : 'text-red-500 hover:text-red-600'
              }`}
            >
              <X size={12} />
              Reject
            </button>
            {requestLoading && (
              <div className="flex items-center gap-2 text-[11px] text-black/40">
                <Loader2 size={12} className="animate-spin" />
                Loading request
              </div>
            )}
            {requestError && (
              <div className="text-[11px] text-red-500">{requestError}</div>
            )}
            {!requestLoading && !requestError && !requestId && (
              <div className="text-[11px] text-black/40">Awaiting question request</div>
            )}
            {requestId && (
              <div className="text-[11px] text-black/40">Request ID: {requestId}</div>
            )}
          </div>
        )}
      </div>
    </BaseToolRenderer>
  );
}

registerToolRenderer('question', QuestionToolRenderer);
