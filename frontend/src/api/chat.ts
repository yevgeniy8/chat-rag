import apiRequest from './apiRequest';
import { ChatAnalysisResponse, ChatRequest } from '../types/api';

export const analyzePrompt = async (payload: ChatRequest): Promise<ChatAnalysisResponse> => {
  return apiRequest<ChatAnalysisResponse>('/chat', { method: 'POST', body: payload });
};
