/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { WhiteboardFrame } from './WhiteboardFrame';
import { server } from '../../test/mocks/server';

const useArtifactMock = vi.hoisted(() => vi.fn());
const promptMock = vi.hoisted(() => vi.fn());
const exportToBlobMock = vi.hoisted(() => vi.fn());

let latestApi: any = null;

// Mock Excalidraw
vi.mock('@excalidraw/excalidraw', () => ({
  Excalidraw: ({ onChange, excalidrawAPI }: any) => {
    useEffect(() => {
      latestApi = {
        updateScene: vi.fn(({ elements }: { elements: readonly any[] }) => {
          onChange(elements);
        }),
        getAppState: vi.fn(() => ({})),
        getFiles: vi.fn(() => ({})),
      };

      if (typeof excalidrawAPI === 'function') {
        excalidrawAPI(latestApi);
      }
    }, [excalidrawAPI, onChange]);

    return (
      <div data-testid="excalidraw">
        <button 
          type="button"
          data-testid="trigger-change" 
          onClick={() => onChange([{ type: 'rectangle', id: '1', version: 1 }])}
        >
          Change 1
        </button>
        <button 
          type="button"
          data-testid="trigger-change-2" 
          onClick={() => onChange([{ type: 'rectangle', id: '1', version: 2 }])}
        >
          Change 2
        </button>
      </div>
    );
  },
  exportToBlob: exportToBlobMock,
}));

// Mock OpenCodeService
vi.mock('../../services/OpenCodeClient', () => ({
  openCodeService: {
    client: {
      file: {
        read: vi.fn().mockResolvedValue({ data: { content: '' } }),
      },
      session: {
        prompt: promptMock,
      }
    },
    directory: '/tmp',
  }
}));

vi.mock('../../hooks/useArtifact', () => ({
  useArtifact: useArtifactMock,
}));

// Mock toastStore
vi.mock('../../utils/toastStore', () => ({
  pushToast: vi.fn(),
}));

// Mock reconcileGraph
vi.mock('../../lib/whiteboard/reconcile', () => ({
  reconcileGraph: vi.fn().mockReturnValue([]),
  excalidrawToMermaid: vi.fn().mockReturnValue('graph TD\nA-->B'),
}));

describe('WhiteboardFrame', () => {
  let excalidrawSetDataMock: ReturnType<typeof vi.fn>;
  let mermaidSetDataMock: ReturnType<typeof vi.fn>;
  let mermaidRemoteChange: ((mmd: string, actor: 'user' | 'agent') => void) | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    latestApi = null;
    excalidrawSetDataMock = vi.fn();
    mermaidSetDataMock = vi.fn();
    mermaidRemoteChange = undefined;

    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ success: true }), { status: 200 })));

    server.use(
      http.post('http://localhost:3001/context/active-whiteboard', () =>
        HttpResponse.json({ ok: true })
      )
    );
    useArtifactMock.mockImplementation((path: string, options?: { onRemoteChange?: (...args: any[]) => void }) => {
      if (path.endsWith('.excalidraw')) {
        return {
          data: { elements: [] },
          setData: excalidrawSetDataMock,
          loading: false,
          error: null,
          connected: true,
        };
      }

      mermaidRemoteChange = options?.onRemoteChange as typeof mermaidRemoteChange;
      return {
        data: 'graph TD\nA-->B',
        setData: mermaidSetDataMock,
        loading: false,
        error: null,
        connected: true,
      };
    });
  });

  it('does not crash when updating elements multiple times', async () => {
    render(<WhiteboardFrame filePath="design/test.excalidraw" />);

    // Wait for loading to finish (if any)
    await screen.findByTestId('excalidraw');

    const trigger1 = screen.getByTestId('trigger-change');
    const trigger2 = screen.getByTestId('trigger-change-2');

    // First change triggers onChange -> setElements -> re-render
    // This should NOT trigger channel cleanup anymore
    await act(async () => {
      trigger1.click();
    });

    // Second change should succeed
    await act(async () => {
      trigger2.click();
    });
    
    // If we reach here without error, the test passes
    expect(true).toBe(true);
  });

  it('ignores synthetic onChange triggered by agent scene apply', async () => {
    render(<WhiteboardFrame filePath="design/test.graph.mmd" />);

    await screen.findByTestId('excalidraw');

    expect(mermaidRemoteChange).toBeDefined();

    act(() => {
      mermaidRemoteChange?.('graph TD\nA-->B', 'agent');
    });

    expect(latestApi.updateScene).toHaveBeenCalledTimes(1);
    expect(mermaidSetDataMock).not.toHaveBeenCalled();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
    });

    const trigger1 = screen.getByTestId('trigger-change');
    await act(async () => {
      trigger1.click();
    });

    expect(mermaidSetDataMock).toHaveBeenCalledTimes(1);
  });

  it('persists PNG artifact before sending to agent', async () => {
    exportToBlobMock.mockResolvedValue(new Blob(['png-bytes'], { type: 'image/png' }));

    render(<WhiteboardFrame filePath="design/test.graph.mmd" sessionId="session-123" />);

    await screen.findByTestId('excalidraw');

    const sendButton = screen.getByRole('button', { name: 'Send to Agent' });

    await act(async () => {
      sendButton.click();
    });

    await waitFor(() => {
      expect(promptMock).toHaveBeenCalledTimes(1);
    });

    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    const pngPersistCall = fetchMock.mock.calls.find((call: any[]) =>
      String(call[0]).includes('/files/design/test.png'),
    );

    expect(pngPersistCall).toBeDefined();
    const requestInit = pngPersistCall?.[1] as RequestInit;
    const body = JSON.parse(requestInit.body as string) as {
      encoding: string;
      opts: { reason: string };
    };

    expect(body.encoding).toBe('base64');
    expect(body.opts.reason).toBe('whiteboard snapshot send-to-agent');
    expect(promptMock).toHaveBeenCalledTimes(1);
  });

  it('posts canonical active context to /context/active', async () => {
    render(<WhiteboardFrame filePath="design/test.graph.mmd" />);

    await screen.findByTestId('excalidraw');

    await waitFor(() => {
      const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
      const contextCall = fetchMock.mock.calls.find((call: any[]) =>
        String(call[0]).includes('/context/active'),
      );

      expect(contextCall).toBeDefined();
      const requestInit = contextCall?.[1] as RequestInit;
      const body = JSON.parse(requestInit.body as string) as {
        modality: string;
        data: { path: string };
      };

      expect(body.modality).toBe('whiteboard');
      expect(body.data.path).toBe('design/test.graph.mmd');
    });
  });
});
