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
  args: any;
  result?: any;
  status: 'pending' | 'running' | 'completed' | 'error';
}

export interface IModel {
  id: string;
  name: string;
  providerID: string;
}

export interface IAgentConsole {
  initialize(config: { sessionId?: string }): Promise<void>;
  sendMessage(content: string, model?: IModel): Promise<void>;
  getHistory(): Promise<IMessage[]>;
  getModels(): Promise<IModel[]>;
  on(event: 'message' | 'stream' | 'error', callback: (data: any) => void): void;
  dispose(): void;
}
