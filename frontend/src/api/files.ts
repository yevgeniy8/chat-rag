import { apiClient } from './client';
import { FilePreviewResponse, FileRecord, FileRemovalResponse } from '../types/api';

export const fetchFiles = async (): Promise<FileRecord[]> => {
  const { data } = await apiClient.get<FileRecord[]>('/files');
  return data;
};

export const removeFile = async (name: string): Promise<FileRemovalResponse> => {
  const { data } = await apiClient.delete<FileRemovalResponse>(`/files/${encodeURIComponent(name)}`);
  return data;
};

export const fetchFilePreview = async (name: string): Promise<FilePreviewResponse> => {
  const { data } = await apiClient.get<FilePreviewResponse>(`/files/preview/${encodeURIComponent(name)}`);
  return data;
};

export const buildRawFileUrl = (name: string): string => {
  const base = apiClient.defaults.baseURL ?? '';
  return `${base}/files/raw/${encodeURIComponent(name)}`;
};
