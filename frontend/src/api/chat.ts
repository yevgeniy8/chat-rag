import { apiRequest } from './api';
import { ChatHistoryItem, ChatQueryRequest, ChatQueryResponse, RetrievedChunk } from '../types/api';

export const getChatHistory = async (): Promise<ChatHistoryItem[]> => {
  return apiRequest('/chat/history', 'GET');
};

export const runChatQuery = async (payload: ChatQueryRequest): Promise<ChatQueryResponse> => {
  return apiRequest('/rag/query', 'POST', payload);
};

export const fetchDebugInfo = async (): Promise<RetrievedChunk[]> => {
  return apiRequest('/rag/debug', 'GET');
};
