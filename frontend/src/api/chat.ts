/**
 * Thesis Context: Chat API bindings expose controlled toggles for RAG vs baseline messaging, supporting
 * reproducible conversational experiments with consistent payload semantics.
 */
import { apiClient } from './client';
import { ChatRequest, ChatResponse } from '../types/api';

export const sendMessage = async (payload: ChatRequest): Promise<ChatResponse> => {
  const { data } = await apiClient.post<ChatResponse>('/chat', payload);
  return data;
};
