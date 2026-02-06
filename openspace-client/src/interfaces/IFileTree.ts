import type { IModality } from './IModality';

export interface IFileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: IFileNode[];
}

export interface IFileTree extends IModality {
  getFiles(path?: string): Promise<IFileNode[]>;
}
