import { apiRequest } from './api';
import { FileRecord } from '../types/api';

export const fetchFiles = async (): Promise<FileRecord[]> => {
  return apiRequest('/files');
};

export const removeFile = async (name: string): Promise<void> => {
  await apiRequest(`/files/${encodeURIComponent(name)}`, 'DELETE');
};

export const uploadFile = async (file: File): Promise<void> => {
  const formData = new FormData();
  formData.append('file', file);
  await apiRequest('/files/upload', 'POST', formData);
};
