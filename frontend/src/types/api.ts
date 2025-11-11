/**
 * Thesis Context: Centralized API typings formalize the experiment's contract between frontend and backend,
 * supporting replicable interactions and analytical traceability of parameters and outputs.
 */
export interface RetrievedChunk {
  file: string;
  snippet: string;
  score: number;
}

export interface ChatRequest {
  message: string;
  use_rag: boolean;
  top_k?: number;
}

export interface ChatResponse {
  message: string;
  mode: 'rag' | 'baseline';
  retrieved_context: RetrievedChunk[];
  avg_similarity?: number | null;
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


export interface FilePreviewResponse {
  kind: 'html' | 'pdf' | 'text';
  file_name: string;
  preview_url?: string | null;
  html?: string | null;
}