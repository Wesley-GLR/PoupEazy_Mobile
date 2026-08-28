import { fetch } from 'expo/fetch';

import { clearSessionToken, getSessionToken } from '@/auth/token-storage';

import { API_BASE_URL, DEFAULT_REQUEST_TIMEOUT_MS } from './config';

type ApiErrorPayload = { error?: string; code?: string; details?: unknown };
type UnauthorizedHandler = () => void | Promise<void>;

let unauthorizedHandler: UnauthorizedHandler | undefined;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function setUnauthorizedHandler(handler?: UnauthorizedHandler) {
  unauthorizedHandler = handler;
}

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  auth?: boolean;
  body?: unknown;
  timeoutMs?: number;
};

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { auth = true, body, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS, headers: customHeaders, ...request } = options;
  const headers = new Headers(customHeaders);
  headers.set('Accept', 'application/json');
  if (body !== undefined) headers.set('Content-Type', 'application/json');

  if (auth) {
    const token = await getSessionToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
      ...request,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const payload = await parseBody(response);

    if (!response.ok) {
      const data = typeof payload === 'object' && payload ? (payload as ApiErrorPayload) : undefined;
      if (response.status === 401 && auth) {
        await clearSessionToken();
        await unauthorizedHandler?.();
      }
      throw new ApiError(
        response.status,
        data?.error || `A API respondeu com status ${response.status}.`,
        data?.code,
        data?.details,
      );
    }
    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(408, 'A conexão demorou demais. Verifique a rede e tente novamente.', 'REQUEST_TIMEOUT');
    }
    throw new ApiError(0, 'Não foi possível conectar ao servidor. Confira a rede e o endereço da API.', 'NETWORK_ERROR', error);
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  get: <T>(path: string, options?: ApiRequestOptions) => apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: ApiRequestOptions) => apiRequest<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: ApiRequestOptions) => apiRequest<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T = void>(path: string, options?: ApiRequestOptions) => apiRequest<T>(path, { ...options, method: 'DELETE' }),
};
