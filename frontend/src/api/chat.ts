/**
 * Thesis Context: Chat API bindings expose controlled toggles for RAG vs baseline messaging, supporting
 * reproducible conversational experiments with consistent payload semantics.
 */
import { apiClient } from './client';
import type {
  ChatDualResponse,
  ChatRequest,
  ChatSession,
  CompareRequest,
  CompareResponse
} from '../types/api';

export const sendChatMessage = async (payload: ChatRequest): Promise<ChatDualResponse> => {
  const { data } = await apiClient.post<ChatDualResponse>('/chat', payload);
  return data;
};

export const compareMessage = async (payload: CompareRequest): Promise<CompareResponse> => {
  const { data } = await apiClient.post<CompareResponse>('/chat/compare', payload);
  return data;
};

export const getSessions = async (): Promise<ChatSession[]> => {
  const { data } = await apiClient.get<ChatSession[]>('/sessions');
  return data;
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  await apiClient.delete(`/sessions/${sessionId}`);
};

export const deleteAllSessions = async (): Promise<void> => {
  await apiClient.delete('/sessions');
};
