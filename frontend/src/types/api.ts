export interface RetrievedContext {
  file: string;
  snippet: string;
  score: number;
}

export interface ChatRequest {
  message: string;
  top_k?: number;
}

export interface ChatAnalysisResponse {
  baseline_message: string;
  rag_message: string;
  baseline_latency: number;
  rag_latency: number;
  baseline_tokens: number;
  rag_tokens: number;
  cosine_similarity: number;
  bleu: number;
  rouge: number;
  avg_similarity: number;
  retrieved_context: RetrievedContext[];
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

export interface FilePreviewResponse {
  kind: 'html' | 'pdf' | 'text';
  file_name: string;
  preview_url?: string | null;
  html?: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user?: User;
}

export interface RagSourceChunk {
  id?: string;
  score?: number;
  source?: string;
  text: string;
}

export interface RagChatRequest {
  question: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
}

export interface RagAnswerResponse {
  answer: string;
  sources?: RagSourceChunk[];
}

export interface RagQueryResponse extends RagAnswerResponse {
  conversation_id?: string;
}

export interface ComparisonResponse {
  question: string;
  baseline: RagAnswerResponse;
  rag: RagQueryResponse;
  createdAt?: string;
}
