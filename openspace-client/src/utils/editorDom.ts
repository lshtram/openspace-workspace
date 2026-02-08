/**
 * Utilities for manipulating the DOM of the rich prompt editor.
 * Ported from OpenCode to maintain functional parity.
 */

export function createTextFragment(content: string): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const segments = content.split("\n");
  segments.forEach((segment, index) => {
    if (segment) {
      fragment.appendChild(document.createTextNode(segment));
    } else if (segments.length > 1) {
      fragment.appendChild(document.createTextNode("\u200B"));
    }
    if (index < segments.length - 1) {
      fragment.appendChild(document.createElement("br"));
    }
  });
  return fragment;
}

export function getNodeLength(node: Node): number {
  if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === "BR") return 1;
  return (node.textContent ?? "").replace(/\u200B/g, "").length;
}

export function getTextLength(node: Node): number {
  if (node.nodeType === Node.TEXT_NODE) return (node.textContent ?? "").replace(/\u200B/g, "").length;
  if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === "BR") return 1;
  let length = 0;
  for (const child of Array.from(node.childNodes)) {
    length += getTextLength(child);
  }
  return length;
}

export function getCursorPosition(parent: HTMLElement): number {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return 0;
  const range = selection.getRangeAt(0);
  if (!parent.contains(range.startContainer)) return 0;
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(parent);
  preCaretRange.setEnd(range.startContainer, range.startOffset);
  return getTextLength(preCaretRange.cloneContents());
}

export function setCursorPosition(parent: HTMLElement, position: number): void {
  let remaining = position;
  let node = parent.firstChild;
  while (node) {
    const length = getNodeLength(node);
    const isText = node.nodeType === Node.TEXT_NODE;
    const isPill =
      node.nodeType === Node.ELEMENT_NODE &&
      ((node as HTMLElement).dataset.type === "file" || (node as HTMLElement).dataset.type === "agent");
    const isBreak = node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === "BR";

    if (isText && remaining <= length) {
      const range = document.createRange();
      const selection = window.getSelection();
      range.setStart(node, remaining);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
      return;
    }

    if ((isPill || isBreak) && remaining <= length) {
      const range = document.createRange();
      const selection = window.getSelection();
      if (remaining === 0) {
        range.setStartBefore(node);
      }
      if (remaining > 0 && isPill) {
        range.setStartAfter(node);
      }
      if (remaining > 0 && isBreak) {
        const next = node.nextSibling;
        if (next && next.nodeType === Node.TEXT_NODE) {
          range.setStart(next, 0);
        } else {
          range.setStartAfter(node);
        }
      }
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
      return;
    }

    remaining -= length;
    node = node.nextSibling;
  }

  // Fallback to end
  const fallbackRange = document.createRange();
  const fallbackSelection = window.getSelection();
  const last = parent.lastChild;
  if (last && last.nodeType === Node.TEXT_NODE) {
    const len = last.textContent ? last.textContent.length : 0;
    fallbackRange.setStart(last, len);
  } else {
    fallbackRange.selectNodeContents(parent);
  }
  fallbackRange.collapse(false);
  fallbackSelection?.removeAllRanges();
  fallbackSelection?.addRange(fallbackRange);
}

export function setRangeEdge(parent: HTMLElement, range: Range, edge: "start" | "end", offset: number): void {
  let remaining = offset;
  const nodes = Array.from(parent.childNodes);

  for (const node of nodes) {
    const length = getNodeLength(node);
    const isText = node.nodeType === Node.TEXT_NODE;
    const isPill =
      node.nodeType === Node.ELEMENT_NODE &&
      ((node as HTMLElement).dataset.type === "file" || (node as HTMLElement).dataset.type === "agent");
    const isBreak = node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === "BR";

    if (isText && remaining <= length) {
      if (edge === "start") range.setStart(node, remaining);
      if (edge === "end") range.setEnd(node, remaining);
      return;
    }

    if ((isPill || isBreak) && remaining <= length) {
      if (edge === "start" && remaining === 0) range.setStartBefore(node);
      if (edge === "start" && remaining > 0) range.setStartAfter(node);
      if (edge === "end" && remaining === 0) range.setEndBefore(node);
      if (edge === "end" && remaining > 0) range.setEndAfter(node);
      return;
    }

    remaining -= length;
  }
}

/**
 * Creates a pill element for a mention (file or agent).
 */
export function createPill(type: 'file' | 'agent', value: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.dataset.type = type;
  span.className = 'pill-mention'; // Base class for styling
  if (type === 'file') {
    span.dataset.path = value;
    span.textContent = `@${value.split('/').pop()}`;
  } else {
    span.dataset.name = value;
    span.textContent = `@${value}`;
  }
  span.contentEditable = 'false';
  return span;
}
