import apiRequest from './apiRequest';
import { IngestResponse, UploadResponse } from '../types/api';

export const uploadFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest<UploadResponse>('/files/upload', { method: 'POST', body: formData });
};

export const ingest = async (fileId: string): Promise<IngestResponse> => {
  return apiRequest<IngestResponse>('/ingest', { method: 'POST', body: { file_id: fileId } });
};
