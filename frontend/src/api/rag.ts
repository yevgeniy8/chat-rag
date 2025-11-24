import apiRequest from './apiRequest';
import { ComparisonResponse, RagAnswerResponse, RagChatRequest, RagQueryResponse } from '../types/api';

export const runRagQuery = (payload: RagChatRequest) =>
  apiRequest<RagQueryResponse>('/rag/query', { method: 'POST', body: payload });

export const runBaselineQuery = (payload: { question: string }) =>
  apiRequest<RagAnswerResponse>('/baseline/query', { method: 'POST', body: payload });

export const runComparison = async (question: string): Promise<ComparisonResponse> => {
  const [baseline, rag] = await Promise.all([
    runBaselineQuery({ question }),
    runRagQuery({ question })
  ]);
  return { question, baseline, rag };
};
