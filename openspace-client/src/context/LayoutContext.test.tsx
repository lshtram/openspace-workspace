import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LayoutProvider, useLayout } from './LayoutContext';

// Test component that uses the context
function TestComponent() {
  const { activeArtifactPane, setActiveArtifactPane } = useLayout();
  return (
    <div>
      <div data-testid="active-pane">
        {activeArtifactPane ? `${activeArtifactPane.path}-${activeArtifactPane.modality}` : 'none'}
      </div>
      <button type="button" onClick={() => setActiveArtifactPane({ path: 'test.md', modality: 'presentation' })}>
        Set Presentation
      </button>
    </div>
  );
}

describe('LayoutContext', () => {
  it('provides activeArtifactPane state', () => {
    render(
      <LayoutProvider>
        <TestComponent />
      </LayoutProvider>
    );
    expect(screen.getByTestId('active-pane')).toHaveTextContent('none');
  });
});