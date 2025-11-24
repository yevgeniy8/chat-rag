const API_BASE_URL = process.env.REACT_APP_API_BASE_URL ?? 'http://localhost:8000';

type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiRequestOptions {
  method?: ApiMethod;
  body?: Record<string, unknown> | FormData;
  headers?: Record<string, string>;
  auth?: boolean;
  query?: Record<string, unknown>;
}

interface ApiErrorShape {
  detail?: string | string[];
  message?: string;
}

const isFormData = (value: unknown): value is FormData =>
  typeof FormData !== 'undefined' && value instanceof FormData;

const buildQueryString = (query?: Record<string, unknown>): string => {
  if (!query) return '';
  const searchParams = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    searchParams.append(key, String(value));
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

export const apiRequest = async <T>(path: string, options: ApiRequestOptions = {}): Promise<T> => {
  const { method = 'GET', body, headers = {}, auth = true, query } = options;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const url = `${API_BASE_URL}${path}${buildQueryString(query)}`;

  const finalHeaders: HeadersInit = { ...headers };
  if (!isFormData(body)) {
    finalHeaders['Content-Type'] = 'application/json';
  }
  if (auth && token) {
    finalHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers: finalHeaders,
    body: body ? (isFormData(body) ? body : JSON.stringify(body)) : undefined
  });

  if (!response.ok) {
    let errorMessage = 'Request failed';
    try {
      const errorBody = (await response.json()) as ApiErrorShape;
      if (Array.isArray(errorBody.detail)) {
        errorMessage = errorBody.detail.join(' ');
      } else if (typeof errorBody.detail === 'string') {
        errorMessage = errorBody.detail;
      } else if (errorBody.message) {
        errorMessage = errorBody.message;
      }
    } catch {
      errorMessage = `${response.status} ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

export default apiRequest;
