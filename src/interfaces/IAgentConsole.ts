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

export interface IAgentConsole {
  initialize(config: { sessionId?: string }): Promise<void>;
  sendMessage(content: string): Promise<void>;
  getHistory(): Promise<IMessage[]>;
  on(event: 'message' | 'stream' | 'error', callback: (data: any) => void): void;
  dispose(): void;
}
