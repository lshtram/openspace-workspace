/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WhiteboardFrame } from './WhiteboardFrame';

// Mock BroadcastChannel
class MockBroadcastChannel {
  name: string;
  closed: boolean = false;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(name: string) {
    this.name = name;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  postMessage(_data: any) {
    if (this.closed) {
      throw new Error("InvalidStateError: Failed to execute 'postMessage' on 'BroadcastChannel': Channel is closed");
    }
  }

  close() {
    this.closed = true;
  }
}

vi.stubGlobal('BroadcastChannel', MockBroadcastChannel);

// Mock Excalidraw
vi.mock('@excalidraw/excalidraw', () => ({
  Excalidraw: ({ onChange }: any) => {
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
  exportToBlob: vi.fn(),
}));

// Mock OpenCodeService
vi.mock('../../services/OpenCodeClient', () => ({
  openCodeService: {
    client: {
      file: {
        read: vi.fn().mockResolvedValue({ data: { content: '' } }),
      },
      session: {
        prompt: vi.fn(),
      }
    },
    directory: '/tmp',
  }
}));

// Mock useDebouncedSave
vi.mock('./useDebouncedSave', () => ({
  useDebouncedSave: () => ({
    save: vi.fn(),
  }),
}));

// Mock toastStore
vi.mock('../../utils/toastStore', () => ({
  pushToast: vi.fn(),
}));

// Mock reconcileGraph
vi.mock('../../lib/whiteboard/reconcile', () => ({
  reconcileGraph: vi.fn().mockReturnValue([]),
}));

describe('WhiteboardFrame', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not crash when updating elements multiple times', async () => {
    render(<WhiteboardFrame filePath="test.excalidraw" />);

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
});
