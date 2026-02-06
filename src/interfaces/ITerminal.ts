import type { IModality } from './IModality';

export interface ITerminalState {
  cwd: string;
  history: string[];
  ptyId?: string;
}

export interface ITerminal extends IModality<ITerminalState> {
  write(data: string): void;
  resize(cols: number, rows: number): void;
}
