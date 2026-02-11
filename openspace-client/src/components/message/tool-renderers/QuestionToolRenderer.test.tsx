import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { QuestionToolRenderer } from './QuestionToolRenderer';
import { openCodeService } from '../../../services/OpenCodeClient';
import type { ToolPart } from '../../../lib/opencode/v2/gen/types.gen';

vi.mock('../../../services/OpenCodeClient', () => ({
  openCodeService: {
    directory: '/tmp/project',
    client: {
      question: {
        list: vi.fn(),
        reply: vi.fn(),
        reject: vi.fn(),
      },
    },
  },
}));

const createQuestionPart = (): ToolPart =>
  ({
    id: 'part-question-1',
    sessionID: 'session-1',
    messageID: 'message-1',
    callID: 'call-1',
    type: 'tool',
    tool: 'question',
    state: {
      status: 'pending',
      input: {
        questions: [
          {
            header: 'Confirm',
            question: 'Proceed?',
            options: [{ label: 'Yes', description: 'Continue' }],
          },
        ],
      },
      raw: 'question',
    },
  }) as ToolPart;

describe('QuestionToolRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(openCodeService.client.question.list).mockResolvedValue([] as never);
  });

  it('does not re-run request lookup when rerendered with same tool identity', async () => {
    const part = createQuestionPart();
    const { rerender } = render(<QuestionToolRenderer part={part} isStep={false} />);

    await waitFor(() => {
      expect(openCodeService.client.question.list).toHaveBeenCalledTimes(1);
    });

    const rerenderPart = {
      ...part,
      state: {
        ...part.state,
        input: {
          ...(part.state.input as Record<string, unknown>),
          questions: [
            {
              header: 'Confirm',
              question: 'Proceed?',
              options: [{ label: 'Yes', description: 'Continue' }],
            },
          ],
        },
      },
    } as ToolPart;

    rerender(<QuestionToolRenderer part={rerenderPart} isStep={false} />);

    await waitFor(() => {
      expect(openCodeService.client.question.list).toHaveBeenCalledTimes(1);
    });
  });
});
