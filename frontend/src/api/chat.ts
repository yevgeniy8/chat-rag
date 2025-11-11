/**
 * Thesis Context: Chat API bindings expose controlled toggles for RAG vs baseline messaging, supporting
 * reproducible conversational experiments with consistent payload semantics.
 */
import { apiClient } from './client';
import { ChatRequest, ChatResponse, CompareRequest, CompareResponse } from '../types/api';

export const sendMessage = async (payload: ChatRequest): Promise<ChatResponse> => {
  const { data } = await apiClient.post<ChatResponse>('/chat', payload);
  return data;
};

export const compareMessage = async (payload: CompareRequest): Promise<CompareResponse> => {
  const { data } = await apiClient.post<CompareResponse>('/chat/compare', payload);
  return data;
};
