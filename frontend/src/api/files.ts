import { apiClient } from './client';
import { FilePreviewResponse, FileRecord, FileRemovalResponse } from '../types/api';

export const fetchFiles = async (): Promise<FileRecord[]> => {
  const { data } = await apiClient.get<FileRecord[]>('/files');
  return data;
};

export const removeFile = async (fileId: string): Promise<FileRemovalResponse> => {
  const { data } = await apiClient.delete<FileRemovalResponse>(`/files/${encodeURIComponent(fileId)}`);
  return data;
};

export const fetchFilePreview = async (fileId: string): Promise<FilePreviewResponse> => {
  const { data } = await apiClient.get<FilePreviewResponse>(`/files/preview/${encodeURIComponent(fileId)}`);
  return data;
};

export const buildFileDownloadUrl = (fileId: string): string => {
  const base = apiClient.defaults.baseURL ?? '';
  return `${base}/files/${encodeURIComponent(fileId)}`;
};
