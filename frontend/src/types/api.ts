/**
 * Thesis Context: Centralized API typings formalize the experiment's contract between frontend and backend,
 * supporting replicable interactions and analytical traceability of parameters and outputs.
 */
export interface RetrievedContext {
  file: string;
  snippet: string;
  score: number;
}

export interface ChatRequest {
  message: string;
  top_k?: number;
  model?: string;
  provider?: string;
  use_rag?: boolean;
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
  answer_semantic_similarity: number;
  retrieved_context: RetrievedContext[];
}

export interface EvaluationMetrics {
  baseline: Record<string, unknown>;
  rag: Record<string, unknown>;
}

export interface EvaluationSaveRequest {
  question: string;
  rag_answer: string;
  baseline_answer: string;
  metrics: EvaluationMetrics;
  retrieved_chunks: unknown[];
  model_baseline: string;
  model_rag: string;
}

export interface EvaluationResult extends EvaluationSaveRequest {
  id: string;
  created_at: string;
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
