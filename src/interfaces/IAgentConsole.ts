import type { IModality } from './IModality';

export interface IMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tools?: IToolCall[];
}

export interface IToolCall {
  id: string;
  name: string;
  args: unknown;
  result?: unknown;
  status: 'pending' | 'running' | 'completed' | 'error';
}

export interface IModel {
  id: string;
  name: string;
  providerID: string;
  providerName: string;
}

export interface IAgentConsoleState {
  sessionId?: string;
  history: IMessage[];
  selectedModelId?: string;
}

export interface IAgentConsole extends IModality<IAgentConsoleState> {
  sendMessage(content: string, model?: IModel): Promise<void>;
  getHistory(): Promise<IMessage[]>;
  getModels(): Promise<IModel[]>;
}
