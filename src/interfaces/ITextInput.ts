import type { IModality, IModalityProcessor } from './IModality';

export interface ITextInputState {
  currentBuffer: string;
}

export interface ITextInputCapabilities {
  multiline: boolean;
  autocomplete: boolean;
}

export interface ITextInput extends IModality<ITextInputState, ITextInputCapabilities> {
  /** Explicitly send text (programmatic trigger) */
  send(text: string): Promise<void>;

  /** 
   * Registers a processor to transform text before it is emitted 
   * (e.g., Command parser, Sentiment analysis).
   */
  registerProcessor(processor: IModalityProcessor<string, string>): void;
}
