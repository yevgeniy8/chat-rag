import { apiRequest } from './api';
import { AuthResponse, RegisterPayload } from '../types/api';

export const registerUser = async (payload: RegisterPayload): Promise<void> => {
  await apiRequest('/auth/register', 'POST', payload);
};

export const loginUser = async (payload: { email: string; password: string }): Promise<AuthResponse> => {
  return apiRequest('/auth/login', 'POST', payload);
};
