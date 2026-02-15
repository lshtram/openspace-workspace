import { afterEach, describe, expect, it, vi } from 'vitest';
import { callToolHandler } from './modality-mcp.js';

// ---------------------------------------------------------------------------
// Mock node-fetch so MCP tools that POST/GET to HUB_URL hit our spy instead
// of a real server.  We keep a queue of responses that tests push onto.
// ---------------------------------------------------------------------------
const fetchResponses: Array<{
  ok: boolean;
  status: number;
  statusText: string;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}> = [];

vi.mock('node-fetch', () => ({
  __esModule: true,
  default: vi.fn(async (_url: string, _opts?: unknown) => {
    const next = fetchResponses.shift();
    if (!next) {
      return {
        ok: false,
        status: 500,
        statusText: 'No mock response queued',
        json: async () => ({ error: 'No mock response queued' }),
        text: async () => 'No mock response queued',
      };
    }
    return next;
  }),
}));

function queueHubResponse(body: unknown, status = 200): void {
  fetchResponses.push({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  });
}

// ---------------------------------------------------------------------------
// Existing contract tests (pre-D4)
// ---------------------------------------------------------------------------
describe('modality-mcp contracts', () => {
  afterEach(() => {
    fetchResponses.length = 0;
  });

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

// ---------------------------------------------------------------------------
// D7-mcp: Agent-Modality Control MCP tools (D4 implementation)
// ---------------------------------------------------------------------------
describe('agent-modality-control MCP tools', () => {
  afterEach(() => {
    fetchResponses.length = 0;
  });

  // ---------- pane.open ----------
  describe('pane.open', () => {
    it('POSTs to /commands and returns commandId on success', async () => {
      queueHubResponse({ success: true, commandId: 'cmd-123-abcd' });

      const result = await callToolHandler({
        params: {
          name: 'pane.open',
          arguments: { type: 'editor', title: 'main.ts' },
        },
      });

      expect(result.isError).toBeFalsy();
      const text = result.content[0].text as string;
      expect(text).toContain('cmd-123-abcd');
    });

    it('returns error when Hub rejects the command', async () => {
      queueHubResponse({ error: 'payload.type is required' }, 400);

      const result = await callToolHandler({
        params: {
          name: 'pane.open',
          arguments: {},
        },
      });

      expect(result.isError).toBe(true);
    });
  });

  // ---------- pane.close ----------
  describe('pane.close', () => {
    it('POSTs to /commands with paneId and returns commandId', async () => {
      queueHubResponse({ success: true, commandId: 'cmd-456-efgh' });

      const result = await callToolHandler({
        params: {
          name: 'pane.close',
          arguments: { paneId: 'pane-1' },
        },
      });

      expect(result.isError).toBeFalsy();
      const text = result.content[0].text as string;
      expect(text).toContain('cmd-456-efgh');
    });

    it('POSTs to /commands with contentId', async () => {
      queueHubResponse({ success: true, commandId: 'cmd-789-ijkl' });

      const result = await callToolHandler({
        params: {
          name: 'pane.close',
          arguments: { contentId: 'editor:src/main.ts' },
        },
      });

      expect(result.isError).toBeFalsy();
    });
  });

  // ---------- pane.list ----------
  describe('pane.list', () => {
    it('GETs /panes/state and returns the layout as JSON', async () => {
      const paneLayout = {
        version: '1.0',
        root: { id: 'root', tabs: [{ type: 'editor', title: 'main.ts' }] },
        activePaneId: 'root',
      };
      queueHubResponse(paneLayout);

      const result = await callToolHandler({
        params: {
          name: 'pane.list',
          arguments: {},
        },
      });

      expect(result.isError).toBeFalsy();
      const text = result.content[0].text as string;
      const parsed = JSON.parse(text);
      expect(parsed.activePaneId).toBe('root');
    });

    it('returns helpful message when no pane state exists', async () => {
      queueHubResponse(null);

      const result = await callToolHandler({
        params: {
          name: 'pane.list',
          arguments: {},
        },
      });

      expect(result.isError).toBeFalsy();
      const text = result.content[0].text as string;
      expect(text.toLowerCase()).toContain('no pane');
    });
  });

  // ---------- pane.focus ----------
  describe('pane.focus', () => {
    it('POSTs to /commands with paneId and returns commandId', async () => {
      queueHubResponse({ success: true, commandId: 'cmd-focus-1' });

      const result = await callToolHandler({
        params: {
          name: 'pane.focus',
          arguments: { paneId: 'pane-2' },
        },
      });

      expect(result.isError).toBeFalsy();
      const text = result.content[0].text as string;
      expect(text).toContain('cmd-focus-1');
    });
  });

  // ---------- editor.open ----------
  describe('editor.open', () => {
    it('POSTs to /commands with path and optional line', async () => {
      queueHubResponse({ success: true, commandId: 'cmd-editor-open-1' });

      const result = await callToolHandler({
        params: {
          name: 'editor.open',
          arguments: { path: 'src/app.tsx', line: 42 },
        },
      });

      expect(result.isError).toBeFalsy();
      const text = result.content[0].text as string;
      expect(text).toContain('cmd-editor-open-1');
    });
  });

  // ---------- editor.read_file ----------
  describe('editor.read_file', () => {
    it('GETs file content from Hub and returns it', async () => {
      queueHubResponse('line 1\nline 2\nline 3\nline 4\nline 5\n');

      const result = await callToolHandler({
        params: {
          name: 'editor.read_file',
          arguments: { path: 'src/utils.ts' },
        },
      });

      expect(result.isError).toBeFalsy();
      const text = result.content[0].text as string;
      expect(text).toContain('line 1');
    });

    it('slices lines when startLine and endLine are provided', async () => {
      queueHubResponse('line 1\nline 2\nline 3\nline 4\nline 5');

      const result = await callToolHandler({
        params: {
          name: 'editor.read_file',
          arguments: { path: 'src/utils.ts', startLine: 2, endLine: 4 },
        },
      });

      expect(result.isError).toBeFalsy();
      const text = result.content[0].text as string;
      expect(text).toContain('line 2');
      expect(text).toContain('line 4');
      expect(text).not.toContain('line 5');
    });

    it('returns error when file is not found', async () => {
      queueHubResponse('Not Found', 404);

      const result = await callToolHandler({
        params: {
          name: 'editor.read_file',
          arguments: { path: 'nonexistent.ts' },
        },
      });

      expect(result.isError).toBe(true);
    });
  });

  // ---------- editor.close ----------
  describe('editor.close', () => {
    it('POSTs to /commands with path and returns commandId', async () => {
      queueHubResponse({ success: true, commandId: 'cmd-editor-close-1' });

      const result = await callToolHandler({
        params: {
          name: 'editor.close',
          arguments: { path: 'src/old-file.ts' },
        },
      });

      expect(result.isError).toBeFalsy();
      const text = result.content[0].text as string;
      expect(text).toContain('cmd-editor-close-1');
    });
  });

  // ---------- presentation.open (agent-modality: opens presentation in UI) ----------
  describe('presentation.open', () => {
    it('POSTs to /commands with name to open presentation pane in UI', async () => {
      queueHubResponse({ success: true, commandId: 'cmd-pres-open-1' });

      const result = await callToolHandler({
        params: {
          name: 'presentation.open',
          arguments: { name: 'Overview' },
        },
      });

      expect(result.isError).toBeFalsy();
      const text = result.content[0].text as string;
      expect(text).toContain('cmd-pres-open-1');
    });

    it('POSTs to /commands with path when name is not provided', async () => {
      queueHubResponse({ success: true, commandId: 'cmd-pres-open-2' });

      const result = await callToolHandler({
        params: {
          name: 'presentation.open',
          arguments: { path: 'design/deck/MyDeck.deck.md' },
        },
      });

      expect(result.isError).toBeFalsy();
      const text = result.content[0].text as string;
      expect(text).toContain('cmd-pres-open-2');
    });
  });

  // ---------- presentation.navigate (agent-modality: navigates to slide in UI) ----------
  describe('presentation.navigate', () => {
    it('POSTs to /commands with slideIndex to navigate presentation', async () => {
      queueHubResponse({ success: true, commandId: 'cmd-pres-nav-1' });

      const result = await callToolHandler({
        params: {
          name: 'presentation.navigate',
          arguments: { slideIndex: 5 },
        },
      });

      expect(result.isError).toBeFalsy();
      const text = result.content[0].text as string;
      expect(text).toContain('cmd-pres-nav-1');
    });

    it('includes optional name when provided', async () => {
      queueHubResponse({ success: true, commandId: 'cmd-pres-nav-2' });

      const result = await callToolHandler({
        params: {
          name: 'presentation.navigate',
          arguments: { name: 'Overview', slideIndex: 0 },
        },
      });

      expect(result.isError).toBeFalsy();
    });
  });
});
