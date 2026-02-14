import { render as rtlRender, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PresentationFrame, { parseSlides } from './PresentationFrame';
import { LayoutProvider } from '../context/LayoutContext';
import { FileTabsProvider } from '../context/FileTabsContext';
import { HighlightProvider } from '../context/HighlightContext';
import { ViewerRegistryProvider } from '../context/ViewerRegistryContext';
import { MutationProvider } from '../context/MutationContext';
import React from 'react';

const render = (ui: React.ReactElement) => rtlRender(
  <LayoutProvider>
    <FileTabsProvider>
      <HighlightProvider>
        <ViewerRegistryProvider>
          <MutationProvider>
            {ui}
          </MutationProvider>
        </ViewerRegistryProvider>
      </HighlightProvider>
    </FileTabsProvider>
  </LayoutProvider>
)

describe('PresentationFrame', () => {
  it('renders without crashing', () => {
    render(
      <PresentationFrame filePath="test.md" />
    );
    expect(screen.getByText('Loading presentation...')).toBeInTheDocument();
  });

  describe('parseSlides', () => {
    it('splits slides by --- delimiter', () => {
      const markdown = '# Slide 1\n\n---\n\n# Slide 2';
      const slides = parseSlides(markdown);
      expect(slides).toHaveLength(2);
      expect(slides[0]).toBe('# Slide 1');
      expect(slides[1]).toBe('# Slide 2');
    });

    it('handles YAML frontmatter correctly', () => {
      const markdown = '---\ntitle: My Deck\n---\n# Slide 1\n\n---\n\n# Slide 2';
      const slides = parseSlides(markdown);
      expect(slides).toHaveLength(2);
      expect(slides[0]).toBe('# Slide 1');
      expect(slides[1]).toBe('# Slide 2');
    });

    it('trims whitespace and ignores empty slides', () => {
      const markdown = '\n\n# Slide 1\n\n---\n\n\n---\n# Slide 2\n\n';
      const slides = parseSlides(markdown);
      expect(slides).toHaveLength(2);
      expect(slides[0]).toBe('# Slide 1');
      expect(slides[1]).toBe('# Slide 2');
    });
  });
});