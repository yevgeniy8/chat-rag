/**
 * Thesis Context: Ingestion API bindings formalize document preparation steps, ensuring the knowledge base
 * construction is traceable for RAG evaluation within the thesis experiments.
 */
import { apiClient } from './client';
import { IngestResponse, UploadResponse } from '../types/api';

export const uploadFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<UploadResponse>('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
};

export const ingest = async (fileId: string): Promise<IngestResponse> => {
  const { data } = await apiClient.post<IngestResponse>('/ingest', { file_id: fileId });
  return data;
};
