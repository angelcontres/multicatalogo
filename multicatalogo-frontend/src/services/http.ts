// src/services/http.ts
// Cliente centralizado de comunicación con la API Go/Fiber

export const API_BASE_URL = "http://localhost:3000/api";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('multicatalogo_jwt');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData = { message: 'Error de servidor', details: null };
    try {
      errorData = await response.json();
    } catch {
      // Fallback si no es JSON válido
    }
    throw new ApiError(response.status, errorData.message || response.statusText, errorData.details);
  }

  return response.json() as Promise<T>;
}
