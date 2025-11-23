import { apiClient } from './client';
import { EvaluationResult, EvaluationSaveRequest } from '../types/api';

export const saveEvaluation = async (payload: EvaluationSaveRequest): Promise<EvaluationResult> => {
  const { data } = await apiClient.post<EvaluationResult>('/evaluation/save', payload);
  return data;
};

export const listEvaluations = async (): Promise<EvaluationResult[]> => {
  const { data } = await apiClient.get<EvaluationResult[]>('/evaluation/list');
  return data;
};

export const getEvaluation = async (id: string): Promise<EvaluationResult> => {
  const { data } = await apiClient.get<EvaluationResult>(`/evaluation/${id}`);
  return data;
};
