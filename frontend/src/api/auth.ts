import apiRequest from './apiRequest';
import { AuthResponse, User } from '../types/api';

export const registerUser = (payload: { name: string; email: string; password: string }) =>
  apiRequest<AuthResponse>('/auth/register', { method: 'POST', body: payload, auth: false });

export const loginUser = (payload: { email: string; password: string }) =>
  apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: payload, auth: false });

export const fetchCurrentUser = () => apiRequest<User>('/auth/me');
