import type { IModality } from './IModality';

export interface ICodeEditorState {
  openFilePath?: string;
  cursorPosition?: { line: number; column: number };
  scrollPosition?: { scrollTop: number; scrollLeft: number };
}

export interface ICodeEditor extends IModality<ICodeEditorState> {
  openFile(path: string): Promise<void>;
  save(): Promise<void>;
}
