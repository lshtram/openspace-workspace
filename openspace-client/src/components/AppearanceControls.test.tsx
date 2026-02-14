import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditorFrame } from './EditorFrame';
import { FileTabsProvider, useFileTabs } from '../context/FileTabsContext';
import { HighlightProvider } from '../context/HighlightContext';
import { LayoutProvider } from '../context/LayoutContext';
import { ViewerRegistryProvider } from '../context/ViewerRegistryContext';
import { MutationProvider } from '../context/MutationContext';
import React from 'react';

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: () => <div data-testid="monaco-editor" />,
  useMonaco: vi.fn().mockReturnValue({
    editor: {
      createModel: vi.fn().mockReturnValue({ dispose: vi.fn() })
    },
    Uri: { file: (p: string) => ({ path: p }) }
  })
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const { openFile } = useFileTabs();
  React.useEffect(() => {
    openFile({ path: 'test.ts', name: 'test.ts', content: 'hello' });
  }, [openFile]);
  return <>{children}</>;
};

const renderWithProviders = (ui: React.ReactNode) => render(
  <LayoutProvider>
    <FileTabsProvider>
      <HighlightProvider>
        <ViewerRegistryProvider>
          <MutationProvider>
            <TestWrapper>
              {ui}
            </TestWrapper>
          </MutationProvider>
        </ViewerRegistryProvider>
      </HighlightProvider>
    </FileTabsProvider>
  </LayoutProvider>
);

describe('Editor Appearance Controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * @verifies REQ-EDT-020
   */
  it('should adjust font size', async () => {
    renderWithProviders(<EditorFrame />);
    
    const increaseBtn = screen.getByTitle(/Increase Font Size/i);
    const fontSizeDisplay = screen.getByTitle(/Reset Appearance/i);
    
    expect(fontSizeDisplay).toHaveTextContent('14px');
    
    fireEvent.click(increaseBtn);
    expect(fontSizeDisplay).toHaveTextContent('15px');
    
    const decreaseBtn = screen.getByTitle(/Decrease Font Size/i);
    fireEvent.click(decreaseBtn);
    expect(fontSizeDisplay).toHaveTextContent('14px');
  });

  /**
   * @verifies REQ-EDT-020
   */
  it('should adjust zoom level', async () => {
    renderWithProviders(<EditorFrame />);
    
    const zoomInBtn = screen.getByTitle(/Zoom In/i);
    
    fireEvent.click(zoomInBtn);
    expect(screen.getByText(/110%/)).toBeInTheDocument();
    
    const zoomOutBtn = screen.getByTitle(/Zoom Out/i);
    fireEvent.click(zoomOutBtn);
    expect(screen.getByText(/100%/)).toBeInTheDocument();
  });
});
