import apiRequest from './apiRequest';
import { FilePreviewResponse, FileRecord, FileRemovalResponse } from '../types/api';

export const fetchFiles = async (): Promise<FileRecord[]> => {
  return apiRequest<FileRecord[]>('/files');
};

export const removeFile = async (name: string): Promise<FileRemovalResponse> => {
  return apiRequest<FileRemovalResponse>(`/files/${encodeURIComponent(name)}`, { method: 'DELETE' });
};

export const fetchFilePreview = async (name: string): Promise<FilePreviewResponse> => {
  return apiRequest<FilePreviewResponse>(`/files/preview/${encodeURIComponent(name)}`);
};

export const buildRawFileUrl = (name: string): string => {
  const base = process.env.REACT_APP_API_BASE_URL ?? 'http://localhost:8000';
  return `${base}/files/raw/${encodeURIComponent(name)}`;
};
