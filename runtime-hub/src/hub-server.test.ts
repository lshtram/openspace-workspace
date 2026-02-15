import { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';

import { createHubApp } from './hub-server.js';

interface TestServerHandle {
  baseUrl: string;
  close: () => Promise<void>;
}

const activeServers: TestServerHandle[] = [];

async function startTestServer(): Promise<TestServerHandle> {
  const { app } = createHubApp({
    projectRoot: process.cwd(),
  });
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  const address = server.address() as AddressInfo;

  const handle: TestServerHandle = {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
  };
  activeServers.push(handle);
  return handle;
}

async function postJson(baseUrl: string, endpoint: string, body: unknown): Promise<Response> {
  return fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

afterEach(async () => {
  while (activeServers.length > 0) {
    const server = activeServers.pop();
    if (server) {
      await server.close();
    }
  }
});

describe('hub-server agent-modality-control', () => {
  describe('ACTIVE_MODALITIES includes presentation', () => {
    it('accepts presentation as a valid modality in /context/active', async () => {
      const server = await startTestServer();
      const res = await postJson(server.baseUrl, '/context/active', {
        modality: 'presentation',
        data: { path: 'design/deck/Overview.deck.md' },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { success: boolean; activeContext: { modality: string } };
      expect(body.success).toBe(true);
      expect(body.activeContext.modality).toBe('presentation');
    });
  });

  describe('POST /commands', () => {
    it('returns commandId for valid pane.open command', async () => {
      const server = await startTestServer();
      const res = await postJson(server.baseUrl, '/commands', {
        type: 'pane.open',
        payload: { type: 'editor', title: 'main.ts' },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { success: boolean; commandId: string };
      expect(body.success).toBe(true);
      expect(body.commandId).toMatch(/^cmd-\d+-[a-z0-9]+$/);
    });

    it('returns 400 for missing type', async () => {
      const server = await startTestServer();
      const res = await postJson(server.baseUrl, '/commands', {
        payload: { type: 'editor' },
      });
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: string };
      expect(body.error).toContain('type');
    });

    it('returns 400 for unknown command type', async () => {
      const server = await startTestServer();
      const res = await postJson(server.baseUrl, '/commands', {
        type: 'pane.unknown',
        payload: {},
      });
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: string };
      expect(body.error).toContain('Unknown command type');
    });

    it('returns 400 for pane.open missing payload.type', async () => {
      const server = await startTestServer();
      const res = await postJson(server.baseUrl, '/commands', {
        type: 'pane.open',
        payload: { title: 'main.ts' },
      });
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: string };
      expect(body.error).toContain('payload.type');
    });

    it('returns 400 for pane.close missing paneId and contentId', async () => {
      const server = await startTestServer();
      const res = await postJson(server.baseUrl, '/commands', {
        type: 'pane.close',
        payload: {},
      });
      expect(res.status).toBe(400);
    });

    it('returns 400 for editor.open missing path', async () => {
      const server = await startTestServer();
      const res = await postJson(server.baseUrl, '/commands', {
        type: 'editor.open',
        payload: {},
      });
      expect(res.status).toBe(400);
    });

    it('returns 400 for presentation.navigate missing slideIndex', async () => {
      const server = await startTestServer();
      const res = await postJson(server.baseUrl, '/commands', {
        type: 'presentation.navigate',
        payload: {},
      });
      expect(res.status).toBe(400);
    });

    it('accepts valid editor.open command', async () => {
      const server = await startTestServer();
      const res = await postJson(server.baseUrl, '/commands', {
        type: 'editor.open',
        payload: { path: 'src/main.ts' },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { success: boolean; commandId: string };
      expect(body.success).toBe(true);
    });

    it('accepts valid presentation.navigate command', async () => {
      const server = await startTestServer();
      const res = await postJson(server.baseUrl, '/commands', {
        type: 'presentation.navigate',
        payload: { slideIndex: 3 },
      });
      expect(res.status).toBe(200);
    });

    it('broadcasts PANE_COMMAND via SSE to connected clients', async () => {
      const server = await startTestServer();

      // Connect an SSE client
      const sseResponse = await fetch(`${server.baseUrl}/events`, {
        headers: { Accept: 'text/event-stream' },
      });
      expect(sseResponse.status).toBe(200);
      const reader = sseResponse.body!.getReader();
      const decoder = new TextDecoder();

      // Send a command
      await postJson(server.baseUrl, '/commands', {
        type: 'pane.open',
        payload: { type: 'editor', title: 'test.ts' },
      });

      // Read SSE data (may include heartbeat/comments, so read until we find PANE_COMMAND)
      let sseData = '';
      const timeout = Date.now() + 5000;
      while (Date.now() < timeout) {
        const { value, done } = await reader.read();
        if (done) break;
        sseData += decoder.decode(value, { stream: true });
        if (sseData.includes('PANE_COMMAND')) break;
      }

      reader.cancel();

      // Parse the SSE data
      const lines = sseData.split('\n');
      const dataLine = lines.find((l) => l.startsWith('data: ') && l.includes('PANE_COMMAND'));
      expect(dataLine).toBeTruthy();

      const event = JSON.parse(dataLine!.replace('data: ', ''));
      expect(event.type).toBe('PANE_COMMAND');
      expect(event.command).toBe('pane.open');
      expect(event.payload.type).toBe('editor');
      expect(event.actor).toBe('agent');
      expect(event.commandId).toMatch(/^cmd-/);
      expect(event.ts).toBeTruthy();
    });
  });

  describe('POST /panes/state', () => {
    it('stores pane state', async () => {
      const server = await startTestServer();
      const statePayload = {
        version: '1.0',
        root: { id: 'pane-root', type: 'pane', tabs: [], activeTabIndex: -1 },
        activePaneId: 'pane-root',
      };

      const postRes = await postJson(server.baseUrl, '/panes/state', statePayload);
      expect(postRes.status).toBe(200);
      const postBody = (await postRes.json()) as { success: boolean };
      expect(postBody.success).toBe(true);
    });
  });

  describe('GET /panes/state', () => {
    it('returns null when no state has been stored', async () => {
      const server = await startTestServer();
      const res = await fetch(`${server.baseUrl}/panes/state`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toBeNull();
    });

    it('returns stored state', async () => {
      const server = await startTestServer();
      const statePayload = {
        version: '1.0',
        root: { id: 'pane-root', type: 'pane', tabs: [{ id: 'tab-1', type: 'editor', title: 'main.ts' }], activeTabIndex: 0 },
        activePaneId: 'pane-root',
      };

      await postJson(server.baseUrl, '/panes/state', statePayload);

      const res = await fetch(`${server.baseUrl}/panes/state`);
      expect(res.status).toBe(200);
      const body = (await res.json()) as typeof statePayload;
      expect(body.version).toBe('1.0');
      expect(body.activePaneId).toBe('pane-root');
      expect(body.root.tabs).toHaveLength(1);
      expect(body.root.tabs[0].title).toBe('main.ts');
    });
  });
});
