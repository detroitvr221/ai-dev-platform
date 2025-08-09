export type AgentName = 'planning' | 'frontend' | 'backend' | 'database' | 'testing' | 'devops';

export interface AgentUpdate {
  id: string;
  agent: AgentName;
  status: 'started' | 'progress' | 'completed' | 'error';
  message?: string;
  data?: unknown;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  createdAt: string;
}

export interface ProjectFile {
  path: string;
  content: string;
}

export interface ChatMessage {
  from: 'user' | 'agent';
  agent?: AgentName;
  text: string;
  timestamp: string;
}

