const BASE_URL = import.meta.env.VITE_API_URL || 'https://agrigrade-backend-0g8z.onrender.com/api/v1';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  const token = localStorage.getItem('AGRIGRADE_ACCESS_TOKEN');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);

  if (response.status === 204) {
    return {} as T;
  }

  let data: any;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message =
      typeof data === 'object' && data !== null && data.message
        ? data.message
        : typeof data === 'string' && data.length > 0
        ? data
        : `Request failed with status ${response.status}`;

    if (response.status === 401) {
      localStorage.removeItem('AGRIGRADE_ACCESS_TOKEN');
      localStorage.removeItem('AGRIGRADE_REFRESH_TOKEN');
      localStorage.removeItem('AGRIGRADE_SESSION_USER');
    }

    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

export const apiClient = {
  get<T>(endpoint: string, params?: Record<string, any>, headers?: Record<string, string>): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      const qs = searchParams.toString();
      if (qs) {
        url += (url.includes('?') ? '&' : '?') + qs;
      }
    }
    return request<T>(url, { method: 'GET', headers });
  },

  post<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return request<T>(endpoint, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers,
    });
  },

  put<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return request<T>(endpoint, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers,
    });
  },

  patch<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return request<T>(endpoint, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers,
    });
  },

  delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return request<T>(endpoint, { method: 'DELETE', headers });
  },

  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    const token = localStorage.getItem('AGRIGRADE_ACCESS_TOKEN');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (response.status === 204) {
      return {} as T;
    }

    let data: any;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const message =
        typeof data === 'object' && data !== null && data.message
          ? data.message
          : typeof data === 'string' && data.length > 0
          ? data
          : `Upload failed with status ${response.status}`;
      throw new ApiError(message, response.status, data);
    }

    return data as T;
  },
};
