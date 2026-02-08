import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RichEditor, type PromptPart } from './RichEditor';
import '@testing-library/jest-dom';

describe('RichEditor', () => {
  const defaultProps = {
    parts: [] as PromptPart[],
    onChange: vi.fn(),
    onSubmit: vi.fn(),
    placeholder: 'Ask anything...',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with placeholder', () => {
    render(<RichEditor {...defaultProps} />);
    // Since we use CSS empty:before, we check for aria-label or just the attribute
    const editor = screen.getByRole('textbox');
    expect(editor).toHaveAttribute('aria-label', 'Ask anything...');
  });

  it('should call onChange when user types', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RichEditor {...defaultProps} onChange={onChange} />);
    const editor = screen.getByRole('textbox');
    
    await user.type(editor, 'Hello');
    
    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
    expect(lastCall[0]).toEqual([{ type: 'text', content: 'Hello' }]);
  });

  it('should call onSubmit when Enter is pressed', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<RichEditor {...defaultProps} onSubmit={onSubmit} />);
    const editor = screen.getByRole('textbox');
    
    await user.type(editor, '{Enter}');
    
    expect(onSubmit).toHaveBeenCalled();
  });

  it('should not call onSubmit when Shift+Enter is pressed', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<RichEditor {...defaultProps} onSubmit={onSubmit} />);
    const editor = screen.getByRole('textbox');
    
    await user.type(editor, '{Shift>}{Enter}{/Shift}');
    
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should render pills for file and agent parts', () => {
    const parts: PromptPart[] = [
      { type: 'text', content: 'Tell me about ' },
      { type: 'file', path: 'src/main.ts', content: '@main.ts' },
      { type: 'text', content: ' and ' },
      { type: 'agent', name: 'coder', content: '@coder' },
    ];
    render(<RichEditor {...defaultProps} parts={parts} />);
    
    expect(screen.getByText('@main.ts')).toBeInTheDocument();
    expect(screen.getByText('@coder')).toBeInTheDocument();
    
    const filePill = screen.getByText('@main.ts');
    expect(filePill).toHaveAttribute('data-type', 'file');
    expect(filePill).toHaveAttribute('data-path', 'src/main.ts');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<RichEditor {...defaultProps} disabled={true} />);
    const editor = screen.getByRole('textbox');
    expect(editor).toHaveAttribute('contenteditable', 'false');
    expect(editor).toHaveClass('opacity-50');
  });
});
