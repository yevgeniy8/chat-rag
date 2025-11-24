/**
 * Thesis Context: Chat API bindings expose controlled toggles for RAG vs baseline messaging, supporting
 * reproducible conversational experiments with consistent payload semantics.
 */
import { apiClient } from './client';
import { ChatAnalysisResponse, ChatRequest } from '../types/api';

export const analyzePrompt = async (payload: ChatRequest): Promise<ChatAnalysisResponse> => {
  const { data } = await apiClient.post<ChatAnalysisResponse>('/chat', payload);
  return data;
};
