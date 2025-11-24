export interface RetrievedChunk {
  text: string;
  score: number;
  source?: string;
}

export interface ChatHistoryItem {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatQueryRequest {
  question: string;
  chat_history: ChatHistoryItem[];
}

export interface ChatQueryResponse {
  answer: string;
  chat_history?: ChatHistoryItem[];
  retrieved_chunks?: RetrievedChunk[];
}

export interface AuthResponse {
  token: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

export interface FileRecord {
  name: string;
  size: number;
  uploaded_at: string;
}
