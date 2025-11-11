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
  use_rag: boolean;
  top_k?: number;
  compare?: boolean;
}

export interface ChatResponse {
  message: string;
  mode: 'rag' | 'baseline';
  retrieved_context: RetrievedContext[];
  avg_similarity?: number | null;
}

export interface ModeMetrics {
  latency_ms: number;
  semantic_similarity: number;
}

export interface ModeAnswer {
  message: string;
  retrieved_context: RetrievedContext[];
  metrics: ModeMetrics;
}

export interface ChatCompareResponse {
  baseline: ModeAnswer;
  rag: ModeAnswer;
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
