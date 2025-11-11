/**
 * Thesis Context: Chat API bindings expose controlled toggles for RAG vs baseline messaging, supporting
 * reproducible conversational experiments with consistent payload semantics.
 */
import { apiClient } from './client';
import { ChatCompareResponse, ChatRequest, ChatResponse } from '../types/api';

export const sendMessage = async (payload: ChatRequest): Promise<ChatResponse> => {
  const { data } = await apiClient.post<ChatResponse>('/chat', payload);
  return data;
};

export const compareMessage = async (message: string, topK?: number): Promise<ChatCompareResponse> => {
  const body: ChatRequest = {
    message,
    use_rag: true,
    top_k: topK,
    compare: true
  };
  const { data } = await apiClient.post<ChatCompareResponse>('/chat', body);
  return data;
};
