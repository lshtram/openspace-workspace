export interface ITerminal {
  initialize(container: HTMLElement): Promise<void>;
  write(data: string): void;
  resize(cols: number, rows: number): void;
  onData(callback: (data: string) => void): void;
  dispose(): void;
}
