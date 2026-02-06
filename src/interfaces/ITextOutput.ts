import type { IModality, IModalityProcessor } from './IModality';
import type { IMessage } from './IAgentConsole';

export interface ITextOutputState {
  history: IMessage[];
}

export interface ITextOutputCapabilities {
  markdownRendering: boolean;
  syntaxHighlighting: boolean;
}

export interface ITextOutput extends IModality<ITextOutputState, ITextOutputCapabilities> {
  /** 
   * Implementation of receive() should handle IMessage 
   * but we add a helper for direct text display 
   */
  display(message: IMessage): void;

  /** 
   * Registers a processor to transform output before it is displayed
   * (e.g., Markdown to HTML, code block extraction).
   */
  registerProcessor(processor: IModalityProcessor<IMessage, IMessage>): void;
}
