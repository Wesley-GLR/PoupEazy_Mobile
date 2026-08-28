import { fetch } from 'expo/fetch';

import { ApiError, apiRequest, setUnauthorizedHandler } from '@/api/client';
import { DEFAULT_API_BASE_URL } from '@/api/config';
import { clearSessionToken, getSessionToken } from '@/auth/token-storage';

jest.mock('expo/fetch', () => ({
  fetch: jest.fn(),
}));

jest.mock('@/auth/token-storage', () => ({
  getSessionToken: jest.fn(),
  clearSessionToken: jest.fn(),
}));

const fetchMock = fetch as jest.Mock;
const getSessionTokenMock = getSessionToken as jest.Mock;
const clearSessionTokenMock = clearSessionToken as jest.Mock;

function response(status: number, body = '') {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: jest.fn().mockResolvedValue(body),
  };
}

describe('API client contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSessionTokenMock.mockResolvedValue('session-token');
    clearSessionTokenMock.mockResolvedValue(undefined);
    setUnauthorizedHandler(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('sends JSON, standard headers and the bearer token', async () => {
    expect(DEFAULT_API_BASE_URL).toBe('https://poupeazy-backend.onrender.com/api');
    fetchMock.mockResolvedValue(response(200, '{"id":"transaction-1"}'));

    await expect(
      apiRequest('/despesas', {
        method: 'POST',
        body: { valor: 25.9 },
        headers: { 'X-Request-Id': 'request-1' },
      }),
    ).resolves.toEqual({ id: 'transaction-1' });

    const [url, options] = fetchMock.mock.calls[0];
    const headers = options.headers as Headers;
    expect(url).toMatch(/\/api\/despesas$/);
    expect(headers.get('Accept')).toBe('application/json');
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('Authorization')).toBe('Bearer session-token');
    expect(headers.get('X-Request-Id')).toBe('request-1');
    expect(options.body).toBe('{"valor":25.9}');
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  test('does not read or send a token for public requests', async () => {
    fetchMock.mockResolvedValue(response(204));

    await expect(apiRequest('health', { auth: false })).resolves.toBeUndefined();

    const [, options] = fetchMock.mock.calls[0];
    expect(getSessionTokenMock).not.toHaveBeenCalled();
    expect((options.headers as Headers).has('Authorization')).toBe(false);
  });

  test('preserves successful plain-text responses', async () => {
    fetchMock.mockResolvedValue(response(200, 'ok'));

    await expect(apiRequest('/health', { auth: false })).resolves.toBe('ok');
  });

  test('maps structured HTTP failures to ApiError', async () => {
    fetchMock.mockResolvedValue(
      response(422, '{"error":"Valor inválido","code":"VALIDATION_ERROR","details":{"field":"valor"}}'),
    );

    const request = apiRequest('/despesas');

    await expect(request).rejects.toBeInstanceOf(ApiError);
    await expect(request).rejects.toMatchObject({
      status: 422,
      message: 'Valor inválido',
      code: 'VALIDATION_ERROR',
      details: { field: 'valor' },
    });
  });

  test('clears the session and notifies auth state after a protected 401', async () => {
    const unauthorizedHandler = jest.fn().mockResolvedValue(undefined);
    setUnauthorizedHandler(unauthorizedHandler);
    fetchMock.mockResolvedValue(response(401, '{"error":"Sessão expirada"}'));

    await expect(apiRequest('/auth/me')).rejects.toMatchObject({ status: 401 });

    expect(clearSessionTokenMock).toHaveBeenCalledTimes(1);
    expect(unauthorizedHandler).toHaveBeenCalledTimes(1);
  });

  test('maps connectivity failures to a stable network error', async () => {
    const originalError = new Error('offline');
    fetchMock.mockRejectedValue(originalError);

    await expect(apiRequest('/despesas')).rejects.toMatchObject({
      status: 0,
      code: 'NETWORK_ERROR',
      details: originalError,
    });
  });

  test('aborts slow requests and exposes a stable timeout error', async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation((_url: string, options: RequestInit) =>
      new Promise((_resolve, reject) => {
        options.signal?.addEventListener('abort', () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        });
      }),
    );

    const request = apiRequest('/slow', { timeoutMs: 50 });
    const expectation = expect(request).rejects.toMatchObject({
      status: 408,
      code: 'REQUEST_TIMEOUT',
    });
    await jest.advanceTimersByTimeAsync(50);
    await expectation;
  });
});
