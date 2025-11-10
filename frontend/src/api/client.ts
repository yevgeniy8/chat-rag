/**
 * Thesis Context: Axios instance enforces a uniform communication layer, enabling systematic logging and
 * error handling for RAG vs baseline comparisons under controlled backend endpoints.
 */
import axios from 'axios';

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL ?? 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 20000
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Academic Note: Interceptor funnels transport anomalies into predictable errors, simplifying experiment logs.
    return Promise.reject(error);
  }
);

export default apiClient;
