import { apiClient } from './client';
import { FileRecord, FileRemovalResponse } from '../types/api';

export const fetchFiles = async (): Promise<FileRecord[]> => {
  const { data } = await apiClient.get<FileRecord[]>('/files');
  return data;
};

export const removeFile = async (name: string): Promise<FileRemovalResponse> => {
  const { data } = await apiClient.delete<FileRemovalResponse>(`/files/${encodeURIComponent(name)}`);
  return data;
};

export const buildFilePreviewUrl = (name: string): string => {
  const base = apiClient.defaults.baseURL ?? '';
  return `${base}/files/${encodeURIComponent(name)}`;
};
