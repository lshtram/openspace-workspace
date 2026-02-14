import { describe, expect, it } from 'vitest';
import { callToolHandler } from './modality-mcp.js';

describe('modality-mcp contracts', () => {
  it('validates and normalizes cross-modality handoff payloads', async () => {
    const result = await callToolHandler({
      params: {
        name: 'modality.validate_handoff',
        arguments: {
          sourceModality: 'diff',
          target: {
            path: '/design/review.diagram.json',
          },
          location: {
            startLine: 4,
            endLine: 5,
          },
        },
      },
    });

    const parsed = JSON.parse(result.content[0].text as string) as {
      sourceModality: string;
      target: { path?: string };
      location?: { startLine: number; endLine: number };
    };

    expect(parsed.sourceModality).toBe('diff');
    expect(parsed.target.path).toBe('design/review.diagram.json');
    expect(parsed.location?.startLine).toBe(4);
  });

  it('rejects invalid handoff payloads', async () => {
    const result = await callToolHandler({
      params: {
        name: 'modality.validate_handoff',
        arguments: {
          sourceModality: 'diff',
          target: {},
        },
      },
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('target.path or target.id must be provided');
  });
});
