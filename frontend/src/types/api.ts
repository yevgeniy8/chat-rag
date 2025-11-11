/**
 * Thesis Context: Centralized API typings formalize the experiment's contract between frontend and backend,
 * supporting replicable interactions and analytical traceability of parameters and outputs.
 */
export interface ChatModeBlock {
  message: string;
  latency: number;
  mode: 'baseline' | 'rag';
  semantic_similarity?: number | null;
}

export interface ChatEvalMetrics {
  baseline_latency: number;
  rag_latency: number;
  semantic_similarity: number;
  created_at: string;
  updated_at: string;
}

export interface ChatSessionMessage {
  prompt: string;
  timestamp: string;
  baseline: ChatModeBlock;
  rag: ChatModeBlock;
}

export interface ChatSession {
  session_id: string;
  created_at: string;
  updated_at: string;
  messages: ChatSessionMessage[];
  metrics: ChatEvalMetrics;
}

export interface ChatRequest {
  message: string;
  session_id?: string;
  top_k?: number;
}

export interface ChatDualResponse {
  session_id: string;
  prompt: string;
  timestamp: string;
  baseline: ChatModeBlock;
  rag: ChatModeBlock;
  metrics: ChatEvalMetrics;
}

export interface CompareRequest {
  query: string;
}

export interface CompareResponse {
  baseline: string;
  rag: string;
  latency: number;
  similarity: number;
}

export interface UploadResponse {
  file_id: string;
}

export interface IngestResponse {
  chunks: number;
}

export interface FileRecord {
  name: string;
  size: number;
  uploaded_at: string;
}

export interface FileRemovalResponse {
  deleted: boolean;
  vectors_removed: number;
}
