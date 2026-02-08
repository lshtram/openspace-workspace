import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  createTextFragment, 
  getNodeLength, 
  getTextLength, 
  getCursorPosition, 
  setCursorPosition,
  createPill
} from './editorDom';

describe('editorDom utilities', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.contentEditable = 'true';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  describe('getNodeLength', () => {
    it('returns length of text node without zero-width spaces', () => {
      const text = document.createTextNode('hello\u200Bworld');
      expect(getNodeLength(text)).toBe(10);
    });

    it('returns 1 for BR elements', () => {
      const br = document.createElement('br');
      expect(getNodeLength(br)).toBe(1);
    });
  });

  describe('getTextLength', () => {
    it('calculates total length of nested nodes', () => {
      container.innerHTML = 'abc<br>def<span>ghi</span>';
      // abc (3) + br (1) + def (3) + ghi (3) = 10
      expect(getTextLength(container)).toBe(10);
    });

    it('ignores zero-width spaces', () => {
      container.innerHTML = 'a\u200Bb';
      expect(getTextLength(container)).toBe(2);
    });
  });

  describe('createTextFragment', () => {
    it('creates a fragment with text and BRs', () => {
      const frag = createTextFragment('line1\nline2');
      const temp = document.createElement('div');
      temp.appendChild(frag);
      expect(temp.innerHTML).toBe('line1<br>line2');
    });

    it('inserts zero-width space for empty lines to maintain height', () => {
      const frag = createTextFragment('line1\n\nline2');
      const temp = document.createElement('div');
      temp.appendChild(frag);
      // line1 + br + \u200B + br + line2
      expect(temp.childNodes[2].textContent).toBe('\u200B');
    });
  });

  describe('getCursorPosition', () => {
    it('returns correct offset in simple text', () => {
      container.textContent = 'hello';
      const range = document.createRange();
      const sel = window.getSelection();
      range.setStart(container.firstChild!, 2);
      range.collapse(true);
      sel?.removeAllRanges();
      sel?.addRange(range);

      expect(getCursorPosition(container)).toBe(2);
    });

    it('returns correct offset across BR tags', () => {
      container.innerHTML = 'abc<br>def';
      const range = document.createRange();
      const sel = window.getSelection();
      // Position after 'd' in 'def'
      // abc (3) + br (1) + d (1) = 5
      range.setStart(container.childNodes[2], 1); 
      range.collapse(true);
      sel?.removeAllRanges();
      sel?.addRange(range);

      expect(getCursorPosition(container)).toBe(5);
    });
  });

  describe('setCursorPosition', () => {
    it('sets cursor in middle of text node', () => {
      container.textContent = 'hello';
      setCursorPosition(container, 3);
      
      const sel = window.getSelection();
      const range = sel?.getRangeAt(0);
      expect(range?.startContainer).toBe(container.firstChild);
      expect(range?.startOffset).toBe(3);
    });

    it('sets cursor after BR tag', () => {
      container.innerHTML = 'abc<br>def';
      setCursorPosition(container, 4); // after BR

      // The implementation details of where it lands might vary but it should be length 4
      expect(getCursorPosition(container)).toBe(4);
    });

    it('sets cursor on pill elements correctly', () => {
        container.innerHTML = 'text<span data-type="file" data-path="test.ts">test.ts</span>more';
        
        setCursorPosition(container, 4); // Start of pill
        expect(getCursorPosition(container)).toBe(4);
        
        setCursorPosition(container, 11); // After pill
        expect(getCursorPosition(container)).toBe(11);
    });
  });

  describe('createPill', () => {
    it('creates a file pill', () => {
      const pill = createPill('file', 'src/index.ts');
      expect(pill.dataset.type).toBe('file');
      expect(pill.dataset.path).toBe('src/index.ts');
      expect(pill.textContent).toBe('@index.ts');
      expect(pill.contentEditable).toBe('false');
    });

    it('creates an agent pill', () => {
      const pill = createPill('agent', 'coder');
      expect(pill.dataset.type).toBe('agent');
      expect(pill.dataset.name).toBe('coder');
      expect(pill.textContent).toBe('@coder');
      expect(pill.contentEditable).toBe('false');
    });
  });
});
