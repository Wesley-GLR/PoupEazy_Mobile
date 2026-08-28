export const DEFAULT_API_BASE_URL = 'https://poupeazy-backend.onrender.com/api';

export function resolveApiBaseUrl(configuredUrl?: string) {
  return (configuredUrl?.trim() || DEFAULT_API_BASE_URL).replace(/\/+$/, '');
}

export const API_BASE_URL = resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_URL);

// O plano gratuito do Render pode precisar de alguns segundos extras no primeiro
// acesso depois de um periodo de inatividade.
export const DEFAULT_REQUEST_TIMEOUT_MS = 45_000;
