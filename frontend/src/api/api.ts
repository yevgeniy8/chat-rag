export async function apiRequest(path: string, method: string = 'GET', body: any = null) {
  const token = localStorage.getItem('token');
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const response = await fetch(path, {
    method,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      Authorization: `Bearer ${token ?? ''}`
    },
    body: body ? (isFormData ? body : JSON.stringify(body)) : null
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Request failed');
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}
