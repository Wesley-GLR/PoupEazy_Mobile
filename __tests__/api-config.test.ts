import {
  DEFAULT_API_BASE_URL,
  DEFAULT_REQUEST_TIMEOUT_MS,
  resolveApiBaseUrl,
} from '@/api/config';

describe('API URL configuration', () => {
  test('uses the published Render API by default', () => {
    expect(resolveApiBaseUrl()).toBe(DEFAULT_API_BASE_URL);
    expect(DEFAULT_API_BASE_URL).toBe('https://poupeazy-backend.onrender.com/api');
    expect(DEFAULT_REQUEST_TIMEOUT_MS).toBe(45_000);
  });

  test('allows a local or alternate URL through the public environment variable', () => {
    expect(resolveApiBaseUrl('http://10.0.2.2:3001/api')).toBe('http://10.0.2.2:3001/api');
  });

  test('trims whitespace and trailing slashes from configured URLs', () => {
    expect(resolveApiBaseUrl('  https://example.com/api///  ')).toBe('https://example.com/api');
  });
});
