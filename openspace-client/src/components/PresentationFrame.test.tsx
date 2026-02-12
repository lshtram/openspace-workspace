import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PresentationFrame from './PresentationFrame';

describe('PresentationFrame', () => {
  it('renders without crashing', () => {
    render(<PresentationFrame filePath="test.md" />);
    expect(screen.getByText('Loading presentation...')).toBeInTheDocument();
  });
});